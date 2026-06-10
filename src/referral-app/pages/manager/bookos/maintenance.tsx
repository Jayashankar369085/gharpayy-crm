// @ts-nocheck
import { useState } from "react";
import { Plus } from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { MaintenanceDB, useStore } from "@/referral-app/lib/bookos/store";
import { timeAgo } from "@/referral-app/lib/bookos/format";

export default function MaintenancePage() {
  const all = useStore(() => MaintenanceDB.all());
  const [f, setF] = useState({ title: "", propertyName: "", roomNumber: "", priority: "med", assignee: "" });
  const k = (s: string) => all.filter((m: any) => m.status === s).length;
  const add = () => { if (!f.title || !f.propertyName) return; MaintenanceDB.create({ ...f, status: "open", createdAt: new Date().toISOString() } as any); setF({ title: "", propertyName: "", roomNumber: "", priority: "med", assignee: "" }); };
  return (
    <BookOSShell eyebrow="OPS" title="Maintenance">
      <div className="grid grid-cols-4 gap-3 mb-5"><KPI label="Total" value={all.length}/><KPI accent label="Open" value={k("open")}/><KPI label="In progress" value={k("in_progress")}/><KPI label="Done" value={k("done")}/></div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2">
          {!all.length ? <EmptyState title="No tickets"/> : all.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-amber-200 bg-white/80 p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{m.title}</div>
                <div className="text-xs text-slate-500">{m.propertyName} {m.roomNumber && ("· " + m.roomNumber)} · {m.assignee || "unassigned"} · {timeAgo(m.createdAt)}</div>
              </div>
              <StatusChip status={m.priority}/><StatusChip status={m.status}/>
              <select value={m.status} onChange={(e) => MaintenanceDB.update(m.id, { status: e.target.value as any })} className="text-xs px-2 py-1 border border-slate-200 rounded"><option value="open">open</option><option value="in_progress">in_progress</option><option value="done">done</option></select>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">New ticket</div>
          <div className="space-y-2">
            <input placeholder="Title" value={f.title} onChange={(e) => setF({...f, title: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <input placeholder="Property" value={f.propertyName} onChange={(e) => setF({...f, propertyName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <input placeholder="Room" value={f.roomNumber} onChange={(e) => setF({...f, roomNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <select value={f.priority} onChange={(e) => setF({...f, priority: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="low">low</option><option value="med">med</option><option value="high">high</option></select>
            <input placeholder="Assignee" value={f.assignee} onChange={(e) => setF({...f, assignee: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
            <GoldBtn onClick={add} className="w-full justify-center"><Plus className="w-4 h-4"/> Add</GoldBtn>
          </div>
        </div>
      </div>
    </BookOSShell>
  );
}