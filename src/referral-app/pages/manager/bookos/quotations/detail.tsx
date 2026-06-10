// @ts-nocheck
import { useParams, Link } from "wouter";
import { ChevronLeft, MessageCircle, ArrowRight, Printer } from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { QuotationsDB, Workflow, Settings, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, waLink } from "@/referral-app/lib/bookos/format";

export default function QuotationDetail() {
  const { id } = useParams() as any;
  const q = useStore(() => QuotationsDB.get(id));
  const set0 = Settings.get();
  if (!q) return <BookOSShell title="Quote not found"><Link href="/manager/bookos/quotations" className="text-amber-700">← Back</Link></BookOSShell>;

  const msg = "Hi " + q.tenantName + "! Quote for " + q.propertyName + " " + (q.roomNumber || "") + ": Rent ₹" + (q.offerRent || q.rent) + "/mo · Deposit ₹" + q.deposit + " · Token ₹" + q.tokenAmount + " to lock. — " + set0.brand;

  return (
    <BookOSShell eyebrow={"QUOTE · " + q.serial} title={q.tenantName}
      actions={<Link href="/manager/bookos/quotations"><OutlineBtn><ChevronLeft className="w-4 h-4"/> Back</OutlineBtn></Link>}>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <StatusChip status={q.status}/>
            <div className="flex gap-2">
              {q.status === "draft" && <OutlineBtn onClick={() => QuotationsDB.update(q.id, { status: "sent", sentAt: new Date().toISOString() })}>Mark sent</OutlineBtn>}
              {q.status !== "converted" && <GoldBtn onClick={() => { const b = Workflow.convertQuoteToBooking(q.id); if (b) window.location.assign("/app/manager/bookos/bookings/" + b.id); }}>Convert <ArrowRight className="w-4 h-4"/></GoldBtn>}
              <OutlineBtn onClick={() => window.print()}><Printer className="w-4 h-4"/> Print</OutlineBtn>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <KPI label="Standard" value={fmt(q.rent)}/>
            <KPI accent label="Offer" value={fmt(q.offerRent || q.rent)}/>
            <KPI label="Token" value={fmt(q.tokenAmount)} sub={"Dep " + fmt(q.deposit)}/>
          </div>
          <div className="text-sm space-y-1">
            <div><span className="text-slate-500">Property:</span> <b>{q.propertyName}</b> · room {q.roomNumber || "—"}</div>
            <div><span className="text-slate-500">Phone:</span> <b>{q.tenantPhone}</b></div>
            <div><span className="text-slate-500">Maintenance:</span> <b>{fmt(q.maintenance)}</b></div>
          </div>
          {q.notes && <div className="mt-3 bg-slate-50 p-2.5 rounded text-sm text-slate-700">{q.notes}</div>}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-2">Share</div>
          <textarea readOnly value={msg} rows={6} className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-50"/>
          <a href={waLink(q.tenantPhone, msg)} target="_blank" rel="noreferrer" className="block mt-2"><GoldBtn className="w-full justify-center"><MessageCircle className="w-4 h-4"/> WhatsApp</GoldBtn></a>
        </div>
      </div>
    </BookOSShell>
  );
}