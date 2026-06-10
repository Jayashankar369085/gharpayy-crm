// @ts-nocheck
import { useState } from "react";
import { Plus, Download } from "lucide-react";
import BookOSShell, { KPI, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { ExpensesDB, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, fmtShort, csv, downloadFile } from "@/referral-app/lib/bookos/format";

export default function ExpensesPage() {
  const all = useStore(() => ExpensesDB.all());
  const [f, setF] = useState({ category: "", vendor: "", amount: "", propertyName: "", date: "" });
  const total = all.reduce((s: number, x: any) => s + x.amount, 0);
  const add = () => { if (!f.category || !f.amount) return; ExpensesDB.create({ ...f, amount: +f.amount, date: f.date || new Date().toISOString().slice(0,10), createdAt: new Date().toISOString() } as any); setF({ category: "", vendor: "", amount: "", propertyName: "", date: "" }); };
  return (
    <BookOSShell eyebrow="MONEY OUT" title="Expenses"
      actions={<OutlineBtn onClick={() => downloadFile("expenses.csv", csv(all))}><Download className="w-4 h-4"/> CSV</OutlineBtn>}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <KPI accent label="Total" value={fmtShort(total)}/>
        <KPI label="Entries" value={all.length}/>
        <KPI label="Avg" value={fmtShort(all.length ? total / all.length : 0)}/>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          {!all.length ? <EmptyState title="No expenses"/> : (
            <table className="w-full text-sm"><thead className="bg-amber-50 text-[10px] uppercase text-slate-600"><tr><th className="px-3 py-2 text-left">Category</th><th className="text-left hidden md:table-cell">Vendor</th><th className="text-left hidden md:table-cell">Property</th><th>Date</th><th className="text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{all.map((x: any) => (<tr key={x.id}><td className="px-3 py-2.5 font-semibold">{x.category}</td><td className="hidden md:table-cell text-slate-600">{x.vendor || "—"}</td><td className="hidden md:table-cell text-slate-600">{x.propertyName || "—"}</td><td className="text-center text-xs font-mono">{x.date}</td><td className="text-right px-3 font-semibold">{fmt(x.amount)}</td></tr>))}</tbody></table>
          )}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Add expense</div>
          <div className="space-y-2">
            {[["category","Category"],["vendor","Vendor"],["amount","Amount","number"],["propertyName","Property"],["date","Date","date"]].map(([k,lbl,type]: any) => (
              <input key={k} placeholder={lbl} type={type || "text"} value={(f as any)[k]} onChange={(e) => setF({...f, [k]: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            ))}
            <GoldBtn onClick={add} className="w-full justify-center"><Plus className="w-4 h-4"/> Add</GoldBtn>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}