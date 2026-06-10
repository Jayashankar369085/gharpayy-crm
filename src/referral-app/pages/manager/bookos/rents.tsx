// @ts-nocheck
import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import BookOSShell, { KPI, StatusChip, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { RentsDB, rentStats, useStore, Workflow, NotificationsDB } from "@/referral-app/lib/bookos/store";
import { fmt, fmtShort, csv, downloadFile, waLink } from "@/referral-app/lib/bookos/format";

export default function RentsPage() {
  const all = useStore(() => RentsDB.all());
  const s = useStore(() => rentStats());
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? all : all.filter((r: any) => r.status === filter);

  const markPaid = (id: string) => {
    const r = RentsDB.update(id, { status: "paid", paidAt: new Date().toISOString() });
    if (r) NotificationsDB.create({ title: "Rent received", body: r.tenantName + " · " + fmt(r.amount), kind: "success", read: false, createdAt: new Date().toISOString() });
  };

  return (
    <BookOSShell eyebrow="COLLECTION" title="Rents"
      actions={<OutlineBtn onClick={() => downloadFile("rents.csv", csv(all))}><Download className="w-4 h-4"/> CSV</OutlineBtn>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Collected" value={fmtShort(s.collected)}/>
        <KPI label="Pending" value={fmtShort(s.pending)}/>
        <KPI label="Overdue" value={fmtShort(s.overdue)}/>
        <KPI label="Projected MRR" value={fmtShort(s.mrr)}/>
      </div>
      <div className="flex gap-1.5 mb-3">
        {["all","pending","paid","overdue"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={"text-xs px-3 py-1.5 rounded-full border " + (filter === f ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600")}>{f}</button>
        ))}
      </div>
      {!filtered.length ? <EmptyState title="No rent records"/> : (
        <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-[10px] uppercase text-slate-600"><tr><th className="px-3 py-2 text-left">Tenant</th><th className="text-left hidden md:table-cell">Property</th><th>Month</th><th className="text-right">Amount</th><th>Status</th><th></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{filtered.map((r: any) => (
              <tr key={r.id}><td className="px-3 py-2.5 font-semibold">{r.tenantName}</td><td className="hidden md:table-cell text-slate-600">{r.propertyName}</td><td className="text-center font-mono text-xs">{r.month}</td><td className="text-right px-3 font-semibold">{fmt(r.amount)}</td><td className="text-center"><StatusChip status={r.status}/></td><td className="px-3 text-right">
                {r.status !== "paid" && <button onClick={() => markPaid(r.id)} className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Paid</button>}
              </td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </BookOSShell>
  );
}