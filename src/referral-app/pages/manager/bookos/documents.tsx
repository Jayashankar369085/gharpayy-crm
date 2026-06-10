// @ts-nocheck
import { useState } from "react";
import { Plus, FolderOpen, ExternalLink } from "lucide-react";
import BookOSShell, { KPI, GoldBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { DocumentsDB, useStore } from "@/referral-app/lib/bookos/store";
import { timeAgo } from "@/referral-app/lib/bookos/format";

export default function DocsPage() {
  const all = useStore(() => DocumentsDB.all());
  const [f, setF] = useState({ title: "", type: "agreement", tenantName: "", propertyName: "", url: "" });
  const add = () => { if (!f.title) return; DocumentsDB.create({ ...f, createdAt: new Date().toISOString() } as any); setF({ title: "", type: "agreement", tenantName: "", propertyName: "", url: "" }); };
  return (
    <BookOSShell eyebrow="VAULT" title="Documents">
      <div className="grid grid-cols-4 gap-3 mb-5">
        <KPI accent label="Total" value={all.length}/>
        {["agreement","id","invoice"].map((t) => <KPI key={t} label={t} value={all.filter((d: any) => d.type === t).length}/>)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {!all.length ? <EmptyState title="No documents"/> : all.map((d: any) => (
            <div key={d.id} className="rounded-xl border border-amber-200 bg-white/80 p-3 flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-amber-600"/>
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{d.title}</div><div className="text-xs text-slate-500">{d.type} · {d.tenantName || d.propertyName || "—"} · {timeAgo(d.createdAt)}</div></div>
              {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-amber-700"><ExternalLink className="w-4 h-4"/></a>}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Add document</div>
          <div className="space-y-2">
            <input placeholder="Title" value={f.title} onChange={(e) => setF({...f, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <select value={f.type} onChange={(e) => setF({...f, type: e.target.value as any})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="agreement">Agreement</option><option value="id">ID</option><option value="invoice">Invoice</option><option value="other">Other</option></select>
            <input placeholder="Tenant" value={f.tenantName} onChange={(e) => setF({...f, tenantName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <input placeholder="Property" value={f.propertyName} onChange={(e) => setF({...f, propertyName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <input placeholder="URL (optional)" value={f.url} onChange={(e) => setF({...f, url: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <GoldBtn onClick={add} className="w-full justify-center"><Plus className="w-4 h-4"/> Add</GoldBtn>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}