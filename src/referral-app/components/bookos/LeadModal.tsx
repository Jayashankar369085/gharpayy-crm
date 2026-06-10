// @ts-nocheck
import { useState } from "react";
import { X, Check } from "lucide-react";
import { track, LeadsDB } from "@/referral-app/lib/bookos/leads";
import { BookingsDB, QuotationsDB, NotificationsDB, ActivityDB } from "@/referral-app/lib/bookos/store";

type Mode = "booking" | "quote" | "visit";

export default function LeadModal({
  open, onClose, mode, propertyName, propertyId, area, roomNumber, rent = 15000,
}: {
  open: boolean; onClose: () => void; mode: Mode;
  propertyName?: string; propertyId?: string | number; area?: string; roomNumber?: string; rent?: number;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  if (!open) return null;

  const labels: any = {
    booking: { title: "Request booking", cta: "Send booking request", action: "booking_request" },
    quote: { title: "Get quotation", cta: "Request quotation", action: "quote_request" },
    visit: { title: "Schedule visit", cta: "Book a visit", action: "visit_request" },
  };
  const l = labels[mode];

  const submit = () => {
    if (!name || !phone) return;
    const meta = { name, phone, moveInDate, notes, source: "detail" as const, propertyId, propertyName, area, roomNumber };
    track(l.action, meta);
    const now = new Date().toISOString();
    if (mode === "booking") {
      const b = BookingsDB.create({
        tenantName: name, tenantPhone: phone, propertyName: propertyName || "—",
        roomNumber: roomNumber || null, moveInDate: moveInDate || null,
        actualRent: rent, discountedRent: rent, deposit: rent * 2,
        maintenanceFee: 1500, maintenanceType: "One-Time",
        tokenAmount: 2000, stayDurationMonths: 11, noticePeriodMonths: 1,
        status: "pending", notes, createdAt: now, updatedAt: now,
      } as any);
      ActivityDB.create({ action: "lead_to_booking", entity: "booking", entityId: b.id, createdAt: now });
    } else if (mode === "quote") {
      const q = QuotationsDB.create({
        serial: "Q-" + Date.now().toString().slice(-5),
        tenantName: name, tenantPhone: phone,
        propertyName: propertyName || "—", roomNumber: roomNumber || "",
        rent, deposit: rent * 2, maintenance: 1500,
        tokenAmount: 2000, offerRent: rent,
        notes, status: "draft", createdAt: now,
      } as any);
      ActivityDB.create({ action: "lead_to_quote", entity: "quotation", entityId: q.id, createdAt: now });
    }
    NotificationsDB.create({
      title: `New ${mode} request — ${name}`,
      body: `${propertyName || "—"} ${roomNumber ? "· Room " + roomNumber : ""} · ${phone}`,
      kind: "info", read: false, createdAt: now,
      link: mode === "booking" ? "/manager/bookos/bookings" : mode === "quote" ? "/manager/bookos/quotations" : "/manager/bookos/leads",
    });
    setDone(true);
    setTimeout(() => { onClose(); setDone(false); setName(""); setPhone(""); setMoveInDate(""); setNotes(""); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-amber-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">GHARPAYY</div>
            <div className="font-serif text-xl text-slate-900">{l.title}</div>
            {propertyName && <div className="text-xs text-slate-500 mt-0.5">{propertyName}{roomNumber ? ` · Room ${roomNumber}` : ""}</div>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100"><X className="w-4 h-4 text-slate-500"/></button>
        </div>
        {done ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3"><Check className="w-7 h-7 text-emerald-600"/></div>
            <div className="font-serif text-lg text-slate-900">Got it!</div>
            <div className="text-sm text-slate-500 mt-1">Our manager will reach out shortly.</div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"/>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (WhatsApp)" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"/>
            <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} placeholder="Preferred move-in" className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm"/>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know?" rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <button onClick={submit} disabled={!name || !phone}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold text-sm disabled:opacity-50">
              {l.cta}
            </button>
            <div className="text-[11px] text-slate-400 text-center">Goes straight to the manager dashboard</div>
          </div>
        )}
      </div>
    </div>
  );
}
