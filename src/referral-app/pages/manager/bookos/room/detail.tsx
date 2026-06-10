// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import BookOSShell, { KPI, GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { RoomsXDB, FloorsDB, BedsDB, readinessScore, ROOM_STATUS_LABEL, ROOM_STATUS_COLOR, useInventoryStore } from "@/referral-app/lib/bookos/inventory";
import { PropertiesDB, useStore } from "@/referral-app/lib/bookos/store";
import { Ops, VisitsDB, RoomEventsDB, RoomBookingsDB, USP, READINESS_REASONS, computeSuggestedPrice, generateMoveInPack, useOps } from "@/referral-app/lib/bookos/ops";
import { fmt, timeAgo, waLink, copyText } from "@/referral-app/lib/bookos/format";
import { VisitForm } from "../visits";
import { ChevronLeft, Sparkles, Zap, Calendar, MessageCircle, Copy, CheckCircle2, MapPin } from "lucide-react";

export default function RoomDetail() {
  const { id } = useParams() as any;
  const room = useInventoryStore(() => RoomsXDB.get(id));
  const events = useOps(() => RoomEventsDB.where((e: any) => e.roomId === id).sort((a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt)));
  const visits = useOps(() => VisitsDB.where((v: any) => v.roomId === id));
  const rbs = useOps(() => RoomBookingsDB.where((rb: any) => rb.roomId === id));
  const beds = useInventoryStore(() => BedsDB.where((b: any) => b.roomId === id));
  const floors = useInventoryStore(() => FloorsDB.all());
  const props = useStore(() => PropertiesDB.all());
  const [showVisit, setShowVisit] = useState(false);
  const [showBook, setShowBook] = useState(false);

  if (!room) return <BookOSShell title="Room not found"><Link href="/manager/bookos/inventory" className="text-amber-700">← Inventory</Link></BookOSShell>;
  const property = props.find((p: any) => p.id === room.propertyId);
  const floor = floors.find((f: any) => f.id === room.floorId);

  const score = readinessScore(room);
  const usp = (room as any).usp || {};
  const pricing = computeSuggestedPrice({ base: 8500, floor: floor?.number || 1, sharing: room.sharing, usp });
  const pack = generateMoveInPack({ room, property });

  return (
    <BookOSShell eyebrow={`ROOM · ${property?.name || ""} · Floor ${floor?.number || "—"}`} title={`Room #${room.roomNumber}`}
      actions={<Link href="/manager/bookos/inventory"><OutlineBtn><ChevronLeft className="w-4 h-4"/> Inventory</OutlineBtn></Link>}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KPI accent label="Readiness" value={score + "%"}/>
        <KPI label="Status" value={ROOM_STATUS_LABEL[room.commercialStatus]}/>
        <KPI label="Sharing" value={`${room.sharing}-share`}/>
        <KPI label="Rent" value={fmt(room.rent)} sub="current"/>
        <KPI label="Suggested" value={fmt(pricing.suggested)} sub="engine"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Readiness panel */}
        <div className="lg:col-span-2 space-y-4">
          <ReadinessCard room={room}/>
          <USPCard room={room} usp={usp}/>
          <PricingCard room={room} floor={floor} usp={usp}/>
          <BedsCard room={room} beds={beds}/>
          <Timeline events={events}/>
        </div>

        {/* Side panel: actions */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
            <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">QUICK ACTIONS</div>
            <div className="font-serif text-lg text-slate-900 mb-3">Sell this room</div>
            <div className="space-y-2">
              <GoldBtn className="w-full justify-center" onClick={() => setShowVisit(true)}><Calendar className="w-4 h-4"/> Schedule a visit</GoldBtn>
              <GoldBtn className="w-full justify-center" onClick={() => setShowBook(true)}><Zap className="w-4 h-4"/> Create booking</GoldBtn>
              <a href={pack.waUrl} target="_blank" rel="noreferrer" className="block"><OutlineBtn className="w-full justify-center"><MessageCircle className="w-4 h-4"/> Send move-in pack</OutlineBtn></a>
              <OutlineBtn className="w-full justify-center" onClick={() => copyText(pack.text)}><Copy className="w-4 h-4"/> Copy confirmation</OutlineBtn>
              <a href={pack.maps} target="_blank" rel="noreferrer" className="block"><OutlineBtn className="w-full justify-center"><MapPin className="w-4 h-4"/> Maps link</OutlineBtn></a>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-4">
            <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700 mb-2">VISITS ({visits.length})</div>
            {visits.slice(0, 4).map((v: any) => (
              <div key={v.id} className="text-xs py-1.5 border-b last:border-0 border-slate-100">
                <div className="font-semibold">{v.customerName} · {v.date} {v.time}</div>
                <div className="text-slate-500">{v.status}</div>
              </div>
            ))}
            {!visits.length && <div className="text-xs text-slate-400">No visits yet.</div>}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-4">
            <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700 mb-2">BOOKINGS ({rbs.length})</div>
            {rbs.map((rb: any) => (
              <Link key={rb.id} href={`/manager/bookos/movein`} className="block text-xs py-1.5 border-b last:border-0 border-slate-100 hover:bg-amber-50/40">
                <div className="font-semibold">{rb.customerName} · {fmt(rb.rent)}</div>
                <div className="text-slate-500">{rb.status.replace("_", " ")}</div>
              </Link>
            ))}
            {!rbs.length && <div className="text-xs text-slate-400">No bookings yet.</div>}
          </div>
        </div>
      </div>

      {showVisit && <VisitForm onClose={() => setShowVisit(false)} prefill={{ propertyId: room.propertyId, floorId: room.floorId, roomId: room.id }}/>}
      {showBook && <BookingForm room={room} onClose={() => setShowBook(false)}/>}
    </BookOSShell>
  );
}

function ReadinessCard({ room }: any) {
  const [r, setR] = useState({
    commercialStatus: room.commercialStatus,
    operationalStatus: room.operationalStatus,
    turnaround: room.turnaround,
    readyDate: room.readyDate || "",
    reason: (room as any).reason || "",
  });
  const reasons = READINESS_REASONS[r.operationalStatus as keyof typeof READINESS_REASONS] || READINESS_REASONS[r.commercialStatus as keyof typeof READINESS_REASONS] || [];
  const save = () => Ops.setReadiness(room.id, { ...r, readyDate: r.readyDate || null });
  return (
    <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif text-lg flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-600"/> Readiness</div>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${ROOM_STATUS_COLOR[room.commercialStatus]}`}>{ROOM_STATUS_LABEL[room.commercialStatus]}</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        <Sel label="Commercial" value={r.commercialStatus} options={["available","reserved","quoted","booked","occupied","notice"]} onChange={(v) => setR({ ...r, commercialStatus: v })}/>
        <Sel label="Operational" value={r.operationalStatus} options={["ready","cleaning","maintenance","inspection_pending","audit_pending"]} onChange={(v) => setR({ ...r, operationalStatus: v })}/>
        <Sel label="Turnaround" value={r.turnaround} options={["none","checkout_today","checkout_tomorrow","movein_today","movein_scheduled"]} onChange={(v) => setR({ ...r, turnaround: v })}/>
        <Sel label="Reason" value={r.reason} options={["", ...reasons]} onChange={(v) => setR({ ...r, reason: v })}/>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Available from</div>
          <input type="date" value={r.readyDate || ""} onChange={(e) => setR({ ...r, readyDate: e.target.value })} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"/>
        </div>
        <div className="flex items-end"><GoldBtn className="w-full justify-center" onClick={save}><CheckCircle2 className="w-4 h-4"/> Update</GoldBtn></div>
      </div>
    </div>
  );
}

function USPCard({ room, usp }: any) {
  const [u, setU] = useState({ ...usp });
  const save = () => Ops.updateUSP(room.id, u);
  return (
    <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif text-lg">USP & selling points</div>
        <GoldBtn onClick={save}>Save USP</GoldBtn>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        {Object.entries(USP).map(([k, opts]) => (
          <Sel key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={u[k] || ""} options={["", ...(opts as string[])]} onChange={(v) => setU({ ...u, [k]: v })}/>
        ))}
      </div>
    </div>
  );
}

function PricingCard({ room, floor, usp }: any) {
  const [base, setBase] = useState(8500);
  const [demand, setDemand] = useState(0);
  const p = computeSuggestedPrice({ base, floor: floor?.number || 1, sharing: room.sharing, usp, demand });
  return (
    <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif text-lg">Floor-aware pricing engine</div>
        <GoldBtn onClick={() => Ops.updatePricing(room.id, p.suggested, p.breakdown)}>Apply ₹{p.suggested.toLocaleString("en-IN")}</GoldBtn>
      </div>
      <div className="grid sm:grid-cols-4 gap-2 mb-3">
        <Field label="Base rent"><input type="number" value={base} onChange={(e) => setBase(+e.target.value)} className="i"/></Field>
        <Field label="Floor"><input value={`Floor ${floor?.number || 1}`} disabled className="i bg-slate-50"/></Field>
        <Field label="Sharing"><input value={`${room.sharing}-share`} disabled className="i bg-slate-50"/></Field>
        <Field label="Demand (×base 5%)"><input type="number" value={demand} onChange={(e) => setDemand(+e.target.value)} className="i"/></Field>
      </div>
      <div className="text-xs space-y-1 bg-slate-50 rounded-lg p-3">
        {Object.entries(p.breakdown).map(([k, v]: any) => (
          <div key={k} className="flex justify-between"><span className="capitalize text-slate-500">{k.replace(/([A-Z])/g, " $1")}</span><span className={v < 0 ? "text-rose-600 font-mono" : "text-slate-700 font-mono"}>{(v as number) >= 0 ? "+" : ""}₹{(v as number).toLocaleString("en-IN")}</span></div>
        ))}
        <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-amber-800"><span>Suggested rent</span><span>₹{p.suggested.toLocaleString("en-IN")}</span></div>
      </div>
      <style>{`.i{width:100%;padding:.4rem .6rem;border:1px solid #e2e8f0;border-radius:.4rem;font-size:.85rem}`}</style>
    </div>
  );
}

function BedsCard({ room, beds }: any) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
      <div className="font-serif text-lg mb-3">Beds ({beds.length})</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {beds.map((b: any) => (
          <div key={b.id} className="rounded-lg border border-slate-200 p-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{b.label}</span>
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${b.status === "vacant" ? "bg-emerald-100 text-emerald-800" : b.status === "occupied" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{b.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Timeline({ events }: any) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
      <div className="font-serif text-lg mb-3">Room timeline</div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events.map((e: any) => (
          <div key={e.id} className="flex gap-3 items-start text-sm border-b border-slate-100 pb-2 last:border-0">
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${kindColor(e.kind)}`}>{e.kind}</span>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{e.title}</div>
              {e.detail && <div className="text-xs text-slate-500">{e.detail}</div>}
            </div>
            <div className="text-[10px] text-slate-400">{timeAgo(e.createdAt)}</div>
          </div>
        ))}
        {!events.length && <div className="text-xs text-slate-400">No events yet.</div>}
      </div>
    </div>
  );
}
function kindColor(k: string) {
  return ({
    status: "bg-blue-100 text-blue-800", readiness: "bg-amber-100 text-amber-800",
    visit: "bg-violet-100 text-violet-800", quote: "bg-blue-100 text-blue-800",
    booking: "bg-emerald-100 text-emerald-800", payment: "bg-emerald-200 text-emerald-900",
    movein: "bg-amber-200 text-amber-900", note: "bg-slate-100 text-slate-700",
    usp: "bg-pink-100 text-pink-800", price: "bg-indigo-100 text-indigo-800",
  } as any)[k] || "bg-slate-100 text-slate-700";
}

function Sel({ label, value, options, onChange }: any) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm">
        {options.map((o: string) => <option key={o} value={o}>{o || "—"}</option>)}
      </select>
    </div>
  );
}
function Field({ label, children }: any) {
  return <div><div className="text-[10px] text-slate-500 mb-0.5">{label}</div>{children}</div>;
}

function BookingForm({ room, onClose }: any) {
  const [f, setF] = useState({
    customerName: "", customerPhone: "",
    rent: room.rent, deposit: room.deposit || room.rent * 2, token: 2000,
    moveInDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });
  const submit = () => {
    if (!f.customerName || !f.customerPhone) return alert("Customer details required");
    const r = Ops.createRoomBooking({ roomId: room.id, ...f });
    onClose();
    window.location.href = "/app/manager/bookos/movein";
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-amber-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700">CREATE BOOKING</div>
          <div className="font-serif text-xl">Room #{room.roomNumber}</div>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <Field label="Customer"><input className="i" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })}/></Field>
          <Field label="Phone"><input className="i" value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })}/></Field>
          <Field label="Rent/mo"><input type="number" className="i" value={f.rent} onChange={(e) => setF({ ...f, rent: +e.target.value })}/></Field>
          <Field label="Deposit"><input type="number" className="i" value={f.deposit} onChange={(e) => setF({ ...f, deposit: +e.target.value })}/></Field>
          <Field label="Token"><input type="number" className="i" value={f.token} onChange={(e) => setF({ ...f, token: +e.target.value })}/></Field>
          <Field label="Move-in"><input type="date" className="i" value={f.moveInDate} onChange={(e) => setF({ ...f, moveInDate: e.target.value })}/></Field>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          <OutlineBtn onClick={onClose}>Cancel</OutlineBtn>
          <GoldBtn onClick={submit}>Create booking</GoldBtn>
        </div>
        <style>{`.i{width:100%;padding:.5rem .75rem;border:1px solid #e2e8f0;border-radius:.5rem;font-size:.875rem}`}</style>
      </div>
    </div>
  );
}
