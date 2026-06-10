// @ts-nocheck
import { useMemo, useState } from "react";
import { Link } from "wouter";
import BookOSShell, { KPI, GoldBtn, OutlineBtn, StatusChip } from "@/referral-app/components/bookos/Shell";
import { VisitsDB, Ops, useOps } from "@/referral-app/lib/bookos/ops";
import { RoomsXDB, FloorsDB } from "@/referral-app/lib/bookos/inventory";
import { PropertiesDB, StaffDB, useStore } from "@/referral-app/lib/bookos/store";
import { waLink, timeAgo } from "@/referral-app/lib/bookos/format";
import { Calendar, Plus, Phone, MessageCircle, CheckCircle2, X, MapPin } from "lucide-react";

const STATUSES = ["scheduled", "confirmed", "in_progress", "completed", "no_show", "cancelled", "converted"];
const STATUS_COLOR: any = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-violet-100 text-violet-800 border-violet-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  no_show: "bg-rose-100 text-rose-800 border-rose-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  converted: "bg-amber-200 text-amber-900 border-amber-300",
};

export default function VisitsWarRoom() {
  const visits = useOps(() => VisitsDB.all());
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const todays = visits.filter((v: any) => v.date === today);
  const tmrws = visits.filter((v: any) => v.date === tomorrow);
  const live = visits.filter((v: any) => ["in_progress", "confirmed"].includes(v.status));
  const conv = visits.filter((v: any) => v.status === "converted").length;
  const probability = visits.length ? Math.round(visits.reduce((s: number, v: any) => s + (v.probability || 0), 0) / visits.length) : 0;

  const filtered = filter === "all" ? visits : visits.filter((v: any) => v.status === filter);

  return (
    <BookOSShell eyebrow="VISIT WAR ROOM" title="Schedule & manage every property visit"
      actions={<GoldBtn onClick={() => setShowForm(true)}><Plus className="w-4 h-4"/> Schedule visit</GoldBtn>}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KPI accent label="Today" value={todays.length} sub="visits"/>
        <KPI label="Tomorrow" value={tmrws.length}/>
        <KPI label="Live now" value={live.length}/>
        <KPI label="Converted" value={conv}/>
        <KPI label="Avg probability" value={probability + "%"}/>
      </div>

      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        <Pill on={filter === "all"} onClick={() => setFilter("all")}>All ({visits.length})</Pill>
        {STATUSES.map((s) => (
          <Pill key={s} on={filter === s} onClick={() => setFilter(s)}>{s.replace("_", " ")} ({visits.filter((v: any) => v.status === s).length})</Pill>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
        <div className="grid grid-cols-12 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-4 py-2 border-b border-slate-100 bg-slate-50">
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Property · Room</div>
          <div className="col-span-2">When</div>
          <div className="col-span-2">Owner / Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {filtered.map((v: any) => (
          <div key={v.id} className="grid grid-cols-12 px-4 py-3 border-b border-slate-100 hover:bg-amber-50/30 items-center text-sm">
            <div className="col-span-3">
              <div className="font-semibold text-slate-900">{v.customerName}</div>
              <div className="text-xs text-slate-500">{v.customerPhone}</div>
            </div>
            <div className="col-span-3">
              <div className="font-medium">{v.propertyName}</div>
              <div className="text-xs text-slate-500">Room {v.roomNumber || "—"} {v.bedId ? "· " + v.bedId : ""}</div>
            </div>
            <div className="col-span-2">
              <div className="font-mono text-sm">{v.date}</div>
              <div className="text-xs text-slate-500">{v.time}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs">{v.coordinatorName || "—"}</div>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${STATUS_COLOR[v.status]}`}>{v.status.replace("_", " ")}</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1 flex-wrap">
              <a href={`tel:${v.customerPhone}`} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"><Phone className="w-3.5 h-3.5 text-slate-600"/></a>
              <a href={waLink(v.customerPhone, `Hi ${v.customerName}, confirming your visit to ${v.propertyName} room ${v.roomNumber} on ${v.date} at ${v.time}.`)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50"><MessageCircle className="w-3.5 h-3.5 text-emerald-600"/></a>
              <select value={v.status} onChange={(e) => Ops.updateVisit(v.id, { status: e.target.value as any })} className="text-xs border border-slate-200 rounded px-1.5 py-1">
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              {v.roomId && <Link href={`/manager/bookos/room/${v.roomId}`} className="text-xs text-amber-700 font-semibold">Room →</Link>}
            </div>
          </div>
        ))}
        {!filtered.length && <div className="p-10 text-center text-sm text-slate-400">No visits in this view.</div>}
      </div>

      {showForm && <VisitForm onClose={() => setShowForm(false)}/>}
    </BookOSShell>
  );
}

function Pill({ on, children, ...p }: any) {
  return <button {...p} className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${on ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>{children}</button>;
}

function VisitForm({ onClose, prefill = {} as any }: any) {
  const props = PropertiesDB.all();
  const rooms = RoomsXDB.all();
  const floors = FloorsDB.all();
  const staff = StaffDB.all();
  const [f, setF] = useState({
    propertyId: prefill.propertyId || props[0]?.id || "",
    floorId: prefill.floorId || "",
    roomId: prefill.roomId || "",
    customerName: prefill.customerName || "",
    customerPhone: prefill.customerPhone || "",
    customerEmail: "",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: "18:00",
    coordinatorName: staff[0]?.name || "",
    managerName: staff[1]?.name || "",
    managerPhone: staff[1]?.phone || "",
    notes: "",
  });
  const propFloors = floors.filter((x: any) => x.propertyId === f.propertyId);
  const propRooms = rooms.filter((x: any) => x.propertyId === f.propertyId && (!f.floorId || x.floorId === f.floorId));
  const submit = () => {
    if (!f.customerName || !f.customerPhone || !f.propertyId) return alert("Customer + Property required");
    const prop = props.find((p: any) => p.id === f.propertyId);
    const room = rooms.find((r: any) => r.id === f.roomId);
    Ops.scheduleVisit({
      propertyId: f.propertyId, propertyName: prop?.name || "",
      floorId: f.floorId || undefined, roomId: f.roomId || undefined,
      roomNumber: room?.roomNumber,
      customerName: f.customerName, customerPhone: f.customerPhone, customerEmail: f.customerEmail || undefined,
      date: f.date, time: f.time,
      coordinatorName: f.coordinatorName, managerName: f.managerName, managerPhone: f.managerPhone,
      notes: f.notes || undefined,
    });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-amber-200 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">VISIT WAR ROOM</div>
            <div className="font-serif text-xl">Schedule a room-level visit</div>
          </div>
          <button onClick={onClose} className="text-slate-500 text-xl">×</button>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
          <Field label="Customer name"><input className="i" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })}/></Field>
          <Field label="Phone"><input className="i" value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })}/></Field>
          <Field label="Email (optional)"><input className="i" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })}/></Field>
          <Field label="Property"><select className="i" value={f.propertyId} onChange={(e) => setF({ ...f, propertyId: e.target.value, floorId: "", roomId: "" })}>{props.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Floor"><select className="i" value={f.floorId} onChange={(e) => setF({ ...f, floorId: e.target.value, roomId: "" })}><option value="">Any</option>{propFloors.map((x: any) => <option key={x.id} value={x.id}>Floor {x.number}</option>)}</select></Field>
          <Field label="Room"><select className="i" value={f.roomId} onChange={(e) => setF({ ...f, roomId: e.target.value })}><option value="">Any</option>{propRooms.map((r: any) => <option key={r.id} value={r.id}>#{r.roomNumber} · {r.sharing}-share · ₹{r.rent}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="i" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}/></Field>
          <Field label="Time"><input type="time" className="i" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })}/></Field>
          <Field label="Coordinator"><select className="i" value={f.coordinatorName} onChange={(e) => setF({ ...f, coordinatorName: e.target.value })}>{staff.map((s: any) => <option key={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Property manager"><select className="i" value={f.managerName} onChange={(e) => setF({ ...f, managerName: e.target.value, managerPhone: staff.find((s:any)=>s.name===e.target.value)?.phone || "" })}>{staff.map((s: any) => <option key={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Notes" full><textarea rows={2} className="i" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })}/></Field>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
          <GoldBtn onClick={submit}><Calendar className="w-4 h-4"/> Schedule</GoldBtn>
        </div>
        <style>{`.i{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem}`}</style>
      </div>
    </div>
  );
}
function Field({ label, children, full }: any) {
  return <div className={full ? "sm:col-span-2" : ""}><div className="text-[10px] text-slate-500 mb-0.5">{label}</div>{children}</div>;
}
export { VisitForm };
