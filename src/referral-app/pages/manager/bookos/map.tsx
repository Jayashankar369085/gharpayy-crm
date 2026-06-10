// @ts-nocheck
import { useState } from "react";
import BookOSShell, { KPI } from "@/referral-app/components/bookos/Shell";
import { PropertiesDB, useStore } from "@/referral-app/lib/bookos/store";
import {
  RoomsXDB, FloorsDB, useInventoryStore,
  ROOM_STATUS_COLOR, ROOM_STATUS_LABEL, readinessScore, readyToSell,
} from "@/referral-app/lib/bookos/inventory";

const COMM: any[] = ["available", "reserved", "quoted", "booked", "occupied", "notice"];
const OPS: any[] = ["ready", "cleaning", "maintenance", "inspection_pending", "audit_pending"];
const TURN: any[] = ["none", "checkout_today", "checkout_tomorrow", "movein_today", "movein_scheduled"];

export default function MapPage() {
  const props = useStore(() => PropertiesDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());
  const floors = useInventoryStore(() => FloorsDB.all());
  const [selectedProp, setSelectedProp] = useState<string | null>(null);
  const [open, setOpen] = useState<any>(null);

  const activeProp = selectedProp || props[0]?.id;
  const propRooms = rooms.filter((r: any) => r.propertyId === activeProp);
  const propFloors = floors.filter((f: any) => f.propertyId === activeProp).sort((a: any, b: any) => a.number - b.number);

  const stats = {
    total: propRooms.length,
    occupied: propRooms.filter((r: any) => r.commercialStatus === "occupied").length,
    vacant: propRooms.filter((r: any) => r.commercialStatus === "available").length,
    ready: propRooms.filter((r: any) => readyToSell(r)).length,
  };

  return (
    <BookOSShell eyebrow="LIVE MAP" title="Occupancy & readiness map">
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
        {props.map((p: any) => (
          <button key={p.id} onClick={() => setSelectedProp(p.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${activeProp === p.id ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-white border-slate-200 text-slate-600"}`}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Total rooms" value={stats.total}/>
        <KPI label="Occupied" value={stats.occupied}/>
        <KPI label="Vacant" value={stats.vacant}/>
        <KPI label="Sellable now" value={stats.ready}/>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-[11px]">
        {COMM.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${ROOM_STATUS_COLOR[c]}`}/>{ROOM_STATUS_LABEL[c]}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {propFloors.length === 0 && <div className="rounded-2xl border-2 border-dashed border-amber-200 p-10 text-center text-sm text-slate-500">No floors yet. Add some from <a className="text-amber-700 underline" href="/app/manager/bookos/inventory">Inventory</a>.</div>}
        {propFloors.map((f: any) => {
          const fr = propRooms.filter((r: any) => r.floorId === f.id);
          return (
            <div key={f.id} className="rounded-2xl border border-amber-200 bg-white/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-serif text-lg text-slate-900">Floor {f.number}{f.name ? ` · ${f.name}` : ""}</div>
                <div className="text-xs text-slate-500">{fr.length} rooms</div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {fr.map((r: any) => (
                  <button key={r.id} onClick={() => setOpen(r)}
                    className={`group relative aspect-square rounded-lg ${ROOM_STATUS_COLOR[r.commercialStatus]} text-white text-[11px] font-bold flex flex-col items-center justify-center hover:scale-105 transition`}>
                    <span>{r.roomNumber}</span>
                    <span className="text-[9px] opacity-80">{r.sharing}p</span>
                  </button>
                ))}
                {!fr.length && <div className="col-span-full text-[11px] text-slate-400 italic">no rooms on this floor</div>}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-amber-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">ROOM</div>
                <div className="font-serif text-2xl text-slate-900">#{open.roomNumber}</div>
              </div>
              <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full text-white ${ROOM_STATUS_COLOR[open.commercialStatus]}`}>{ROOM_STATUS_LABEL[open.commercialStatus]}</div>
            </div>
            <div className="text-xs text-slate-500 mb-3">Sharing {open.sharing} · ₹{open.rent.toLocaleString()}/mo · Readiness {readinessScore(open)}/100</div>
            <div className="space-y-2 text-sm">
              <Select label="Commercial" value={open.commercialStatus} options={COMM} onChange={(v) => { RoomsXDB.update(open.id, { commercialStatus: v, updatedAt: new Date().toISOString() }); setOpen({ ...open, commercialStatus: v }); }}/>
              <Select label="Operational" value={open.operationalStatus} options={OPS} onChange={(v) => { RoomsXDB.update(open.id, { operationalStatus: v, updatedAt: new Date().toISOString() }); setOpen({ ...open, operationalStatus: v }); }}/>
              <Select label="Turnaround" value={open.turnaround} options={TURN} onChange={(v) => { RoomsXDB.update(open.id, { turnaround: v, updatedAt: new Date().toISOString() }); setOpen({ ...open, turnaround: v }); }}/>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => { RoomsXDB.update(open.id, { operationalStatus: "ready", readyDate: new Date().toISOString() }); setOpen({ ...open, operationalStatus: "ready" }); }} className="py-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">Ready today</button>
              <button onClick={() => { RoomsXDB.update(open.id, { turnaround: "checkout_today" }); setOpen({ ...open, turnaround: "checkout_today" }); }} className="py-2 rounded-lg bg-orange-100 text-orange-800 text-xs font-semibold">Checkout today</button>
              <button onClick={() => { RoomsXDB.update(open.id, { operationalStatus: "cleaning" }); setOpen({ ...open, operationalStatus: "cleaning" }); }} className="py-2 rounded-lg bg-blue-100 text-blue-800 text-xs font-semibold">Send to cleaning</button>
              <button onClick={() => { RoomsXDB.update(open.id, { operationalStatus: "maintenance" }); setOpen({ ...open, operationalStatus: "maintenance" }); }} className="py-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-semibold">Block: maintenance</button>
            </div>
          </div>
        </div>
      )}
    </BookOSShell>
  );
}

function Select({ label, value, options, onChange }: any) {
  return (
    <label className="block">
      <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-0.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
        {options.map((o: string) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </label>
  );
}
