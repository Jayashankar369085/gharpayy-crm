// @ts-nocheck
import { useState } from "react";
import { Plus, Download } from "lucide-react";
import BookOSShell, { KPI, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { PaymentsDB, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, fmtShort, timeAgo, csv, downloadFile } from "@/referral-app/lib/bookos/format";

export default function PaymentsPage() {
  const all = useStore(() => PaymentsDB.all());
  const [f, setF] = useState({ tenantName: "", amount: "", method: "UPI", type: "rent", ref: "" });
  const total = all.reduce((s: number, p: any) => s + p.amount, 0);
  const byType = (t: string) => all.filter((p: any) => p.type === t).reduce((s: number, p: any) => s + p.amount, 0);
  const add = () => {
    if (!f.tenantName || !f.amount) return;
    PaymentsDB.create({ tenantName: f.tenantName, amount: +f.amount, method: f.method as any, type: f.type as any, ref: f.ref, createdAt: new Date().toISOString() });
    setF({ tenantName: "", amount: "", method: "UPI", type: "rent", ref: "" });
  };
  return (
    <BookOSShell eyebrow="MONEY IN" title="Payments"
      actions={<OutlineBtn onClick={() => downloadFile("payments.csv", csv(all))}><Download className="w-4 h-4"/> CSV</OutlineBtn>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Total" value={fmtShort(total)}/>
        <KPI label="Tokens" value={fmtShort(byType("token"))}/>
        <KPI label="Rent" value={fmtShort(byType("rent"))}/>
        <KPI label="Deposit" value={fmtShort(byType("deposit"))}/>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          {!all.length ? <EmptyState title="No payments recorded"/> : (
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-[10px] uppercase text-slate-600"><tr><th className="px-3 py-2 text-left">Tenant</th><th>Type</th><th>Method</th><th className="text-right">Amount</th><th className="hidden md:table-cell text-left">Ref</th><th>When</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{all.map((p: any) => (
                <tr key={p.id}><td className="px-3 py-2.5 font-semibold">{p.tenantName}</td><td className="text-center text-xs">{p.type}</td><td className="text-center text-xs">{p.method}</td><td className="text-right px-3 font-semibold">{fmt(p.amount)}</td><td className="hidden md:table-cell text-xs text-slate-500">{p.ref || "—"}</td><td className="text-xs text-slate-500 px-3">{timeAgo(p.createdAt)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Record payment</div>
          <div className="space-y-2">
            <input placeholder="Tenant" value={f.tenantName} onChange={(e) => setF({...f, tenantName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <input placeholder="Amount" type="number" value={f.amount} onChange={(e) => setF({...f, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <div className="grid grid-cols-2 gap-2">
              <select value={f.type} onChange={(e) => setF({...f, type: e.target.value as any})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="rent">Rent</option><option value="token">Token</option><option value="deposit">Deposit</option><option value="other">Other</option>
              </select>
              <select value={f.method} onChange={(e) => setF({...f, method: e.target.value as any})} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option>UPI</option><option>Cash</option><option>Bank</option><option>Card</option>
              </select>
            </div>
            <input placeholder="Reference (optional)" value={f.ref} onChange={(e) => setF({...f, ref: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <GoldBtn onClick={add} className="w-full justify-center"><Plus className="w-4 h-4"/> Record</GoldBtn>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}