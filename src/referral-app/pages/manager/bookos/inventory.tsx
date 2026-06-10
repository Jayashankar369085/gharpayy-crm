// @ts-nocheck
import { useState } from "react";
import { Link } from "wouter";

import BookOSShell, { KPI, GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { PropertiesDB, useStore } from "@/referral-app/lib/bookos/store";
import {
  FloorsDB, RoomsXDB, BedsDB, useInventoryStore,
  FURNITURE, UTILITIES, AMENITIES, ROOM_STATUS_LABEL, ROOM_STATUS_COLOR,
} from "@/referral-app/lib/bookos/inventory";
import { Plus, Layers, DoorOpen, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const props = useStore(() => PropertiesDB.all());
  const floors = useInventoryStore(() => FloorsDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());
  const [activeProp, setActiveProp] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  const propId = activeProp || props[0]?.id;
  const propFloors = floors.filter((f: any) => f.propertyId === propId).sort((a: any, b: any) => a.number - b.number);
  const floorId = activeFloor || propFloors[0]?.id;
  const propRooms = rooms.filter((r: any) => r.propertyId === propId && (!floorId || r.floorId === floorId));

  const addFloor = () => {
    const n = prompt("Floor number?", String(propFloors.length + 1));
    if (!n) return;
    FloorsDB.create({ propertyId: propId, number: +n, createdAt: new Date().toISOString() } as any);
  };

  return (
    <BookOSShell eyebrow="INVENTORY OS" title="Property · Floor · Room · Bed"
      actions={<GoldBtn onClick={() => setShowRoomForm(true)} disabled={!propId || !floorId}><Plus className="w-4 h-4"/> Add room</GoldBtn>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Properties" value={props.length}/>
        <KPI label="Floors" value={floors.length}/>
        <KPI label="Rooms" value={rooms.length}/>
        <KPI label="Beds" value={rooms.reduce((s: number, r: any) => s + (r.sharing || 0), 0)}/>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        {/* Properties */}
        <div className="lg:col-span-3 rounded-2xl border border-amber-200 bg-white/80 p-3">
          <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-2 mb-1">Property</div>
          {props.map((p: any) => (
            <button key={p.id} onClick={() => { setActiveProp(p.id); setActiveFloor(null); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${propId === p.id ? "bg-amber-100 text-amber-900 font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>
              {p.name}
            </button>
          ))}
        </div>
        {/* Floors */}
        <div className="lg:col-span-3 rounded-2xl border border-amber-200 bg-white/80 p-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Floors</div>
            <button onClick={addFloor} className="text-xs text-amber-700 font-semibold flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button>
          </div>
          {propFloors.map((f: any) => (
            <button key={f.id} onClick={() => setActiveFloor(f.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${floorId === f.id ? "bg-amber-100 text-amber-900 font-semibold" : "text-slate-700 hover:bg-slate-50"}`}>
              <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5"/> Floor {f.number}</span>
              <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete floor + its rooms?")) { rooms.filter((r:any)=>r.floorId===f.id).forEach((r:any)=>RoomsXDB.del(r.id)); FloorsDB.del(f.id); } }} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-3 h-3"/></button>
            </button>
          ))}
          {!propFloors.length && <div className="text-[11px] text-slate-400 px-2 py-3">No floors yet.</div>}
        </div>
        {/* Rooms grid */}
        <div className="lg:col-span-6 rounded-2xl border border-amber-200 bg-white/80 p-4">
          <div className="font-serif text-lg text-slate-900 mb-3 flex items-center gap-2"><DoorOpen className="w-4 h-4 text-amber-600"/> Rooms</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {propRooms.map((r: any) => (
              <Link key={r.id} href={`/manager/bookos/room/${r.id}`} className="block rounded-xl border border-slate-200 bg-white p-3 hover:border-amber-300 hover:shadow-sm transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900">#{r.roomNumber}</div>
                    <div className="text-[10px] text-slate-500">{r.sharing}-share · ₹{r.rent.toLocaleString()}</div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-white ${ROOM_STATUS_COLOR[r.commercialStatus]}`}>{ROOM_STATUS_LABEL[r.commercialStatus]}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(r.utilities || []).slice(0, 3).map((u: string) => <span key={u} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">{u}</span>)}
                  {r.electrical?.usbPorts > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-800 border border-violet-100">{r.electrical.usbPorts}× USB</span>}
                </div>
                <div className="text-[10px] text-amber-700 font-semibold mt-2">Open room →</div>
              </Link>
            ))}
            {!propRooms.length && <div className="col-span-full text-center text-xs text-slate-400 py-10 border-2 border-dashed border-amber-200 rounded-xl">No rooms — click <b>Add room</b>.</div>}

          </div>
        </div>
      </div>

      {showRoomForm && <RoomForm propertyId={propId} floorId={floorId} onClose={() => setShowRoomForm(false)}/>}
    </BookOSShell>
  );
}

function RoomForm({ propertyId, floorId, onClose }: any) {
  const [f, setF] = useState({
    roomNumber: "", sharing: "2", rent: "15000", deposit: "30000",
    type: "Standard", gender: "any", carpetArea: "120", ceilingHeight: "10", windows: "1",
    furniture: ["Bed", "Mattress", "Wardrobe", "Study Table"] as string[],
    utilities: ["Fan", "Geyser"] as string[],
    amenities: ["Attached Bathroom", "Window"] as string[],
    usbPorts: "2", sockets: "4", internetPoints: "1", smartSwitches: false,
    commercialStatus: "available", operationalStatus: "ready", turnaround: "none",
  });
  const toggle = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y: string) => y !== v) : [...x[k], v] }));
  const submit = () => {
    if (!f.roomNumber) return alert("Room number required");
    const now = new Date().toISOString();
    const room = RoomsXDB.create({
      propertyId, floorId,
      roomNumber: f.roomNumber, type: f.type, gender: f.gender as any,
      sharing: +f.sharing, carpetArea: +f.carpetArea, ceilingHeight: +f.ceilingHeight, windows: +f.windows,
      rent: +f.rent, deposit: +f.deposit,
      furniture: f.furniture, utilities: f.utilities, amenities: f.amenities,
      electrical: { usbPorts: +f.usbPorts, sockets: +f.sockets, internetPoints: +f.internetPoints, smartSwitches: f.smartSwitches },
      commercialStatus: f.commercialStatus as any, operationalStatus: f.operationalStatus as any, turnaround: f.turnaround as any,
      createdAt: now, updatedAt: now,
    } as any);
    // auto-create beds
    for (let i = 0; i < +f.sharing; i++) {
      BedsDB.create({ roomId: room.id, label: `Bed ${String.fromCharCode(65 + i)}`, status: "vacant", createdAt: now } as any);
    }
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-amber-200 my-8" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">INVENTORY OS</div>
            <div className="font-serif text-xl text-slate-900">Add room with 100+ fields</div>
          </div>
          <button onClick={onClose} className="text-slate-500 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Section title="Identity">
            <Field><Label>Room number</Label><input value={f.roomNumber} onChange={(e) => setF({ ...f, roomNumber: e.target.value })} className="i"/></Field>
            <Field><Label>Type</Label><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="i">{["Standard","Deluxe","Premium","Suite"].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field><Label>Gender</Label><select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="i"><option value="any">Any</option><option value="male">Male</option><option value="female">Female</option></select></Field>
            <Field><Label>Sharing capacity</Label><input type="number" value={f.sharing} onChange={(e) => setF({ ...f, sharing: e.target.value })} className="i"/></Field>
          </Section>
          <Section title="Dimensions">
            <Field><Label>Carpet area (sqft)</Label><input type="number" value={f.carpetArea} onChange={(e) => setF({ ...f, carpetArea: e.target.value })} className="i"/></Field>
            <Field><Label>Ceiling (ft)</Label><input type="number" value={f.ceilingHeight} onChange={(e) => setF({ ...f, ceilingHeight: e.target.value })} className="i"/></Field>
            <Field><Label>Windows</Label><input type="number" value={f.windows} onChange={(e) => setF({ ...f, windows: e.target.value })} className="i"/></Field>
          </Section>
          <Section title="Commercials">
            <Field><Label>Rent (₹/mo)</Label><input type="number" value={f.rent} onChange={(e) => setF({ ...f, rent: e.target.value })} className="i"/></Field>
            <Field><Label>Deposit</Label><input type="number" value={f.deposit} onChange={(e) => setF({ ...f, deposit: e.target.value })} className="i"/></Field>
          </Section>
          <Section title="Furniture"><Chips items={FURNITURE} selected={f.furniture} onToggle={(v) => toggle("furniture", v)}/></Section>
          <Section title="Utilities"><Chips items={UTILITIES} selected={f.utilities} onToggle={(v) => toggle("utilities", v)}/></Section>
          <Section title="Amenities"><Chips items={AMENITIES} selected={f.amenities} onToggle={(v) => toggle("amenities", v)}/></Section>
          <Section title="Electrical">
            <Field><Label>USB ports</Label><input type="number" value={f.usbPorts} onChange={(e) => setF({ ...f, usbPorts: e.target.value })} className="i"/></Field>
            <Field><Label>Power sockets</Label><input type="number" value={f.sockets} onChange={(e) => setF({ ...f, sockets: e.target.value })} className="i"/></Field>
            <Field><Label>Internet points</Label><input type="number" value={f.internetPoints} onChange={(e) => setF({ ...f, internetPoints: e.target.value })} className="i"/></Field>
            <Field><Label>Smart switches</Label><label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm"><input type="checkbox" checked={f.smartSwitches} onChange={(e) => setF({ ...f, smartSwitches: e.target.checked })}/> Enabled</label></Field>
          </Section>
          <Section title="Status">
            <Field><Label>Commercial</Label><select value={f.commercialStatus} onChange={(e) => setF({ ...f, commercialStatus: e.target.value })} className="i">{["available","reserved","quoted","booked","occupied","notice"].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field><Label>Operational</Label><select value={f.operationalStatus} onChange={(e) => setF({ ...f, operationalStatus: e.target.value })} className="i">{["ready","cleaning","maintenance","inspection_pending","audit_pending"].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field><Label>Turnaround</Label><select value={f.turnaround} onChange={(e) => setF({ ...f, turnaround: e.target.value })} className="i">{["none","checkout_today","checkout_tomorrow","movein_today","movein_scheduled"].map(x=><option key={x}>{x}</option>)}</select></Field>
          </Section>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
          <GoldBtn onClick={submit}>Save room + beds</GoldBtn>
        </div>
        <style>{`.i{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem}`}</style>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700 mb-2">{title.toUpperCase()}</div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">{children}</div>
    </div>
  );
}
function Field({ children }: any) { return <div>{children}</div>; }
function Label({ children }: any) { return <div className="text-[10px] text-slate-500 mb-0.5">{children}</div>; }
function Chips({ items, selected, onToggle }: any) {
  return (
    <div className="col-span-full flex flex-wrap gap-1.5">
      {items.map((it: string) => {
        const on = selected.includes(it);
        return (
          <button key={it} onClick={() => onToggle(it)}
            className={`text-xs px-2.5 py-1 rounded-full border ${on ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>{it}</button>
        );
      })}
    </div>
  );
}
