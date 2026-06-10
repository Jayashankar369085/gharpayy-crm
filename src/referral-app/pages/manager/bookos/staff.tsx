// @ts-nocheck
import { useState } from "react";
import { Plus } from "lucide-react";
import BookOSShell, { KPI, GoldBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { StaffDB, useStore } from "@/referral-app/lib/bookos/store";

export default function StaffPage() {
  const all = useStore(() => StaffDB.all());
  const [f, setF] = useState({ name: "", phone: "", role: "Sales" });
  const add = () => { if (!f.name) return; StaffDB.create({ ...f, active: true, createdAt: new Date().toISOString() } as any); setF({ name: "", phone: "", role: "Sales" }); };
  return (
    <BookOSShell eyebrow="TEAM" title="Staff">
      <div className="grid grid-cols-3 gap-3 mb-5"><KPI accent label="Total" value={all.length}/><KPI label="Active" value={all.filter((s: any) => s.active).length}/><KPI label="Inactive" value={all.filter((s: any) => !s.active).length}/></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">{!all.length ? <EmptyState title="No staff"/> : all.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-amber-200 bg-white/80 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center font-bold text-amber-700">{s.name[0]}</div>
            <div className="flex-1"><div className="font-semibold text-sm">{s.name}</div><div className="text-xs text-slate-500">{s.role} · {s.phone}</div></div>
            <button onClick={() => StaffDB.update(s.id, { active: !s.active })} className={"text-xs px-2 py-1 rounded " + (s.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{s.active ? "Active" : "Inactive"}</button>
          </div>))}</div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Add member</div>
          <div className="space-y-2">
            <input placeholder="Name" value={f.name} onChange={(e) => setF({...f, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <input placeholder="Phone" value={f.phone} onChange={(e) => setF({...f, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <select value={f.role} onChange={(e) => setF({...f, role: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"><option>Sales</option><option>Operations</option><option>Maintenance</option><option>Admin</option></select>
            <GoldBtn onClick={add} className="w-full justify-center"><Plus className="w-4 h-4"/> Add</GoldBtn>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}