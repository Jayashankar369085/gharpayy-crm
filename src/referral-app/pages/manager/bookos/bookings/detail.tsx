// @ts-nocheck
import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { ChevronLeft, Zap, CheckCircle2, X, MessageCircle, Copy, RefreshCw } from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, Workflow, Settings, Templates, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, countdown, waLink, upiUrl, qrUrl, copyText, fillTemplate } from "@/referral-app/lib/bookos/format";

export default function BookingDetail() {
  const { id } = useParams() as any;
  const b = useStore(() => BookingsDB.get(id));
  const set0 = Settings.get();
  const tpl = Templates.get();
  const [, force] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { Workflow.syncExpiry(); force((x) => x + 1); }, 1000);
    return () => clearInterval(t);
  }, []);

  if (!b) return <BookOSShell title="Booking not found"><Link href="/manager/bookos/bookings" className="text-amber-700">← Back</Link></BookOSShell>;

  const note = `Token for ${b.propertyName} ${b.roomNumber || ""}`;
  const upi = upiUrl(b.upiId || set0.upiId, set0.brand, b.tokenAmount, note);
  const mins = Math.max(0, Math.round((+new Date(b.offerExpiresAt || 0) - Date.now()) / 60000));
  const waMsg = fillTemplate(tpl.offer, { name: b.tenantName, property: b.propertyName, room: b.roomNumber || "", rent: b.actualRent, offer: b.discountedRent, token: b.tokenAmount, mins: mins || set0.offerWindowMins });

  return (
    <BookOSShell eyebrow={`BOOKING · ${b.status.toUpperCase()}`} title={b.tenantName}
      actions={<Link href="/manager/bookos/bookings"><OutlineBtn><ChevronLeft className="w-4 h-4"/> Back</OutlineBtn></Link>}>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <StatusChip status={b.status}/>
                {b.status === "approved" && <span className="text-xs font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{countdown(b.offerExpiresAt)}</span>}
              </div>
              <div className="flex gap-2 flex-wrap">
                {b.status === "pending" && <GoldBtn onClick={() => Workflow.approveBooking(b.id)}><Zap className="w-4 h-4"/> Approve & start timer</GoldBtn>}
                {b.status === "approved" && <GoldBtn onClick={() => Workflow.markPaid(b.id, "UPI-" + Date.now().toString(36))}><CheckCircle2 className="w-4 h-4"/> Mark paid</GoldBtn>}
                {b.status === "expired" && <OutlineBtn onClick={() => Workflow.approveBooking(b.id)}><RefreshCw className="w-4 h-4"/> Reactivate</OutlineBtn>}
                {b.status !== "cancelled" && b.status !== "paid" && <OutlineBtn onClick={() => Workflow.cancelBooking(b.id)}><X className="w-4 h-4"/> Cancel</OutlineBtn>}
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <KPI label="Standard" value={fmt(b.actualRent)}/>
              <KPI accent label="Offer" value={fmt(b.discountedRent)} sub={`Save ${fmt(b.actualRent - b.discountedRent)}`}/>
              <KPI label="Token" value={fmt(b.tokenAmount)} sub={`Dep ${fmt(b.deposit)}`}/>
            </div>
            <div className="grid sm:grid-cols-2 gap-y-1.5 text-sm">
              <div><span className="text-slate-500">Property:</span> <b>{b.propertyName}</b></div>
              <div><span className="text-slate-500">Room:</span> <b>{b.roomNumber || "—"}</b></div>
              <div><span className="text-slate-500">Phone:</span> <b>{b.tenantPhone}</b></div>
              <div><span className="text-slate-500">Move-in:</span> <b>{b.moveInDate || "—"}</b></div>
              <div><span className="text-slate-500">Stay:</span> <b>{b.stayDurationMonths}m</b></div>
              <div><span className="text-slate-500">Notice:</span> <b>{b.noticePeriodMonths}m</b></div>
              <div><span className="text-slate-500">Maintenance:</span> <b>{fmt(b.maintenanceFee)} ({b.maintenanceType})</b></div>
              {b.paidRef && <div><span className="text-slate-500">Paid ref:</span> <b>{b.paidRef}</b></div>}
            </div>
            {b.notes && <div className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5">{b.notes}</div>}
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
            <div className="font-serif text-lg mb-2">WhatsApp offer</div>
            <textarea readOnly value={waMsg} rows={5} className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50"/>
            <div className="flex gap-2 mt-2">
              <a href={waLink(b.tenantPhone, waMsg)} target="_blank" rel="noreferrer"><GoldBtn><MessageCircle className="w-4 h-4"/> Send on WhatsApp</GoldBtn></a>
              <OutlineBtn onClick={() => copyText(waMsg)}><Copy className="w-4 h-4"/> Copy</OutlineBtn>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
          <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">UPI PAY</div>
          <div className="font-serif text-xl text-slate-900 mt-0.5">₹{b.tokenAmount.toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-500 mb-3">{b.upiId || set0.upiId}</div>
          <div className="rounded-xl bg-white border border-amber-200 p-3 flex items-center justify-center">
            <img src={qrUrl(upi)} alt="upi" className="w-44 h-44"/>
          </div>
          <div className="mt-2 flex gap-2">
            <OutlineBtn className="flex-1" onClick={() => copyText(upi)}><Copy className="w-3 h-3"/> Copy UPI</OutlineBtn>
            <a href={upi} className="flex-1"><GoldBtn className="w-full justify-center">Open app</GoldBtn></a>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}