// @ts-nocheck
import { useState } from "react";
import { Link } from "wouter";
import BookOSShell, { KPI, GoldBtn, OutlineBtn, StatusChip } from "@/referral-app/components/bookos/Shell";
import { LeadsDB, useLeadsStore, leadStats, Workflow as _w } from "@/referral-app/lib/bookos/leads";
import { Workflow, BookingsDB, QuotationsDB, NotificationsDB, ActivityDB } from "@/referral-app/lib/bookos/store";
import { Phone, MessageCircle, ArrowRight, Trash2, CheckCircle2 } from "lucide-react";
import { timeAgo } from "@/referral-app/lib/bookos/format";

const STAGES: any[] = [
  { id: "new", label: "New", color: "border-slate-300 bg-slate-50" },
  { id: "qualified", label: "Qualified", color: "border-blue-300 bg-blue-50" },
  { id: "quoted", label: "Quoted", color: "border-amber-300 bg-amber-50" },
  { id: "visit", label: "Visit", color: "border-violet-300 bg-violet-50" },
  { id: "booked", label: "Booked", color: "border-emerald-300 bg-emerald-50" },
  { id: "lost", label: "Lost", color: "border-rose-300 bg-rose-50" },
];

export default function LeadsPage() {
  const leads = useLeadsStore(() => LeadsDB.all());
  const s = useLeadsStore(() => leadStats());

  const advance = (id: string, stage: any) => LeadsDB.update(id, { stage });
  const convertToBooking = (l: any) => {
    const now = new Date().toISOString();
    const b = BookingsDB.create({
      tenantName: l.name || "Unknown", tenantPhone: l.phone || "", propertyName: l.propertyName || "—",
      roomNumber: l.roomNumber || null, moveInDate: l.moveInDate || null,
      actualRent: 15000, discountedRent: 14000, deposit: 28000,
      maintenanceFee: 1500, maintenanceType: "One-Time",
      tokenAmount: 2000, stayDurationMonths: 11, noticePeriodMonths: 1,
      status: "pending", createdAt: now, updatedAt: now,
    } as any);
    LeadsDB.update(l.id, { stage: "booked" });
    ActivityDB.create({ action: "lead_converted", entity: "lead", entityId: l.id, meta: { bookingId: b.id }, createdAt: now });
    NotificationsDB.create({ title: "Lead → Booking", body: `${l.name} · ${l.propertyName || "—"}`, kind: "success", read: false, createdAt: now, link: `/manager/bookos/bookings/${b.id}` });
  };

  return (
    <BookOSShell eyebrow="PIPELINE" title="Leads from your public site"
      actions={<OutlineBtn onClick={() => { if (confirm("Clear all leads?")) LeadsDB.replace([]); }}><Trash2 className="w-4 h-4"/> Clear</OutlineBtn>}>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <KPI accent label="Total" value={s.total}/>
        <KPI label="New" value={s.new}/>
        <KPI label="Qualified" value={s.qualified}/>
        <KPI label="Quoted" value={s.quoted}/>
        <KPI label="Visit" value={s.visit}/>
        <KPI label="Booked" value={s.booked}/>
      </div>
      <div className="grid lg:grid-cols-6 md:grid-cols-3 sm:grid-cols-2 gap-3">
        {STAGES.map((st) => {
          const items = leads.filter((l: any) => l.stage === st.id);
          return (
            <div key={st.id} className={`rounded-2xl border-2 ${st.color} p-3 min-h-[300px]`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">{st.label}</div>
                <div className="text-[10px] font-bold bg-white border border-slate-200 rounded-full px-2">{items.length}</div>
              </div>
              <div className="space-y-2">
                {items.map((l: any) => (
                  <div key={l.id} className="rounded-xl bg-white border border-slate-200 p-2.5 text-xs">
                    <div className="font-semibold text-slate-900 truncate">{l.name || "Anon"}</div>
                    <div className="text-slate-500 truncate">{l.propertyName || l.area || "—"}{l.roomNumber ? ` · #${l.roomNumber}` : ""}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{timeAgo(l.createdAt)} · score {l.score}</div>
                    <div className="flex gap-1 mt-2">
                      {l.phone && <a href={`tel:${l.phone}`} className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-md bg-slate-100 text-slate-700"><Phone className="w-3 h-3"/></a>}
                      {l.phone && <a href={`https://wa.me/${l.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-md bg-emerald-100 text-emerald-700"><MessageCircle className="w-3 h-3"/></a>}
                      <button onClick={() => convertToBooking(l)} className="flex-1 inline-flex items-center justify-center gap-1 py-1 rounded-md bg-amber-100 text-amber-800"><CheckCircle2 className="w-3 h-3"/></button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {STAGES.filter((x) => x.id !== l.stage).slice(0, 3).map((x) => (
                        <button key={x.id} onClick={() => advance(l.id, x.id)} className="flex-1 text-[9px] py-0.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">{x.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
                {!items.length && <div className="text-[10px] text-slate-400 italic">empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </BookOSShell>
  );
}
