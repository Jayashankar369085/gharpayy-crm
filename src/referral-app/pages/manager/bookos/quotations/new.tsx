// @ts-nocheck
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import BookOSShell, { GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { QuotationsDB, ActivityDB } from "@/referral-app/lib/bookos/store";

export default function NewQuotation() {
  const [, setLoc] = useLocation();
  const [f, setF] = useState({ tenantName: "", tenantPhone: "", propertyName: "", roomNumber: "", rent: "", offerRent: "", deposit: "", maintenance: "", tokenAmount: "", notes: "" });
  const upd = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const serial = "Q-" + Date.now().toString().slice(-5);
    const q = QuotationsDB.create({ serial, ...f, rent: +f.rent || 0, offerRent: +f.offerRent || +f.rent || 0, deposit: +f.deposit || 0, maintenance: +f.maintenance || 0, tokenAmount: +f.tokenAmount || 0, status: "draft", createdAt: new Date().toISOString() } as any);
    ActivityDB.create({ action: "created", entity: "quotation", entityId: q.id, createdAt: new Date().toISOString() });
    setLoc(`/manager/bookos/quotations/${q.id}`);
  };

  return (
    <BookOSShell eyebrow="NEW" title="Compose quotation"
      actions={<Link href="/manager/bookos/quotations"><OutlineBtn><ChevronLeft className="w-4 h-4"/> Back</OutlineBtn></Link>}>
      <div className="max-w-3xl rounded-2xl border border-amber-200 bg-white/80 p-6">
        <div className="grid sm:grid-cols-2 gap-3">
          {[["tenantName","Tenant"],["tenantPhone","Phone"],["propertyName","Property"],["roomNumber","Room"],["rent","Standard rent ₹","number"],["offerRent","Offer rent ₹","number"],["deposit","Deposit ₹","number"],["maintenance","Maintenance ₹","number"],["tokenAmount","Token ₹","number"]].map(([k, lbl, type]: any) => (
            <label key={k} className="text-xs text-slate-600">
              <div className="mb-1 font-semibold">{lbl}</div>
              <input type={type || "text"} value={(f as any)[k]} onChange={upd(k)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            </label>
          ))}
        </div>
        <label className="block mt-3 text-xs text-slate-600">
          <div className="mb-1 font-semibold">Notes</div>
          <textarea value={f.notes} onChange={upd("notes") as any} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
        </label>
        <div className="mt-4 flex gap-2 justify-end">
          <Link href="/manager/bookos/quotations"><OutlineBtn>Cancel</OutlineBtn></Link>
          <GoldBtn onClick={submit}>Save quote</GoldBtn>
        </div>
      </div>
    </BookOSShell>
  );
}