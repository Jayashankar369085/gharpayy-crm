// @ts-nocheck
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import BookOSShell, { GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, Settings, ActivityDB } from "@/referral-app/lib/bookos/store";

export default function NewBookingPage() {
  const [, setLoc] = useLocation();
  const set0 = Settings.get();
  const [err, setErr] = useState("");
  const [f, setF] = useState({
    tenantName: "", tenantPhone: "", propertyName: "", roomNumber: "",
    moveInDate: "", actualRent: "", discountedRent: "", deposit: "",
    maintenanceFee: "", maintenanceType: "One-Time",
    tokenAmount: "", stayDurationMonths: "11", noticePeriodMonths: "1",
    upiId: set0.upiId, adminPhone: set0.adminPhone, notes: "",
  });
  const upd = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const actual = +f.actualRent || 0; const offer = +f.discountedRent || 0;
    if (!f.tenantName || !f.tenantPhone || !f.propertyName || !actual || !offer || !f.deposit || !f.tokenAmount) { setErr("Please fill all required (*) fields."); return; }
    if (offer > actual) { setErr("Offer rent cannot exceed standard rent."); return; }
    const now = new Date().toISOString();
    const b = BookingsDB.create({ ...f, actualRent: actual, discountedRent: offer, deposit: +f.deposit, maintenanceFee: +f.maintenanceFee || 0, tokenAmount: +f.tokenAmount, stayDurationMonths: +f.stayDurationMonths, noticePeriodMonths: +f.noticePeriodMonths, status: "pending", offerExpiresAt: null, createdAt: now, updatedAt: now } as any);
    ActivityDB.create({ action: "created", entity: "booking", entityId: b.id, createdAt: now });
    setLoc(`/manager/bookos/bookings/${b.id}`);
  };

  return (
    <BookOSShell eyebrow="NEW" title="Create booking"
      actions={<Link href="/manager/bookos/bookings"><OutlineBtn><ChevronLeft className="w-4 h-4"/> Back</OutlineBtn></Link>}>
      <div className="max-w-3xl rounded-2xl border border-amber-200 bg-white/80 p-6">
        {err && <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">{err}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ["tenantName","Tenant name *"], ["tenantPhone","Phone *"],
            ["propertyName","Property *"], ["roomNumber","Room number"],
            ["moveInDate","Move-in date","date"],
            ["actualRent","Standard rent ₹ *","number"], ["discountedRent","Offer rent ₹ *","number"],
            ["deposit","Deposit ₹ *","number"], ["maintenanceFee","Maintenance ₹","number"],
            ["tokenAmount","Token ₹ *","number"],
            ["stayDurationMonths","Stay (months)","number"], ["noticePeriodMonths","Notice (months)","number"],
            ["upiId","UPI ID"], ["adminPhone","Admin phone"],
          ].map(([k, lbl, type]: any) => (
            <label key={k} className="text-xs text-slate-600">
              <div className="mb-1 font-semibold">{lbl}</div>
              <input type={type || "text"} value={(f as any)[k]} onChange={upd(k)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-amber-400 outline-none"/>
            </label>
          ))}
          <label className="text-xs text-slate-600">
            <div className="mb-1 font-semibold">Maintenance type</div>
            <select value={f.maintenanceType} onChange={upd("maintenanceType")} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option>One-Time</option><option>Monthly</option>
            </select>
          </label>
        </div>
        <label className="block mt-3 text-xs text-slate-600">
          <div className="mb-1 font-semibold">Notes</div>
          <textarea value={f.notes} onChange={upd("notes") as any} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
        </label>
        <div className="mt-4 flex gap-2 justify-end">
          <Link href="/manager/bookos/bookings"><OutlineBtn>Cancel</OutlineBtn></Link>
          <GoldBtn onClick={submit}>Create booking</GoldBtn>
        </div>
      </div>
    </BookOSShell>
  );
}