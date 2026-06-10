// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Plus, Trash2, Share2, Lock, BedDouble, CalendarDays,
  ShieldCheck, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  Eye, Phone, MessageSquare, Video, MapPin, Sparkles, Activity,
  Flame, Clock, IndianRupee, Users, Zap,
} from "lucide-react";
import { Layout } from "@/referral-app/components/layout";
import { Input } from "@/referral-app/components/ui/input";
import { Button } from "@/referral-app/components/ui/button";
import { Badge } from "@/referral-app/components/ui/badge";
import { useToast } from "@/referral-app/hooks/use-toast";
import { useGetManagerProperties } from "@/referral-app/api";
import { useAppStore } from "@/referral-app/lib/store";

/* ─────────────── Types & constants ─────────────── */

type RoomStatus = "vacant" | "vacating" | "occupied" | "blocked";
type ActionType = "pitch" | "virtual_tour" | "visit_scheduled" | "visit_done" | "prebooked" | "confirm" | "rent_changed";
type VisitStatus = "scheduled" | "done" | "no_show" | "cancelled";

type Room = {
  id: string;
  roomNumber: string;
  beds: number;
  status: RoomStatus;
  vacantDate?: string;
  actualRent: number;          // last achieved rent
  expectedRent: number;        // owner ask
  floorRent?: number;          // owner private floor
  lastConfirmedAt?: string;
  vacantSinceDays?: number;    // computed-ish for risk
  softLockUntil?: string;      // when a visit/prebook locks the room
  demandScore?: number;        // 0-100 (mock)
};

type Visit = {
  id: string;
  roomId: string;
  customerName: string;
  customerPhone?: string;
  scheduledAt: string;
  type: "physical" | "virtual";
  status: VisitStatus;
  notes?: string;
};

type Action = {
  id: string;
  roomId: string;
  type: ActionType;
  at: string;
  by: string;
  note?: string;
};

const STATUS_META: Record<RoomStatus, { label: string; cls: string; dot: string }> = {
  vacant:   { label: "Vacant now",   cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  vacating: { label: "Vacating",     cls: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
  occupied: { label: "Occupied",     cls: "bg-slate-100 text-slate-600 border-slate-200",       dot: "bg-slate-400" },
  blocked:  { label: "Blocked",      cls: "bg-rose-100 text-rose-600 border-rose-200",          dot: "bg-rose-500" },
};

const ACTION_META: Record<ActionType, { label: string; icon: any; cls: string }> = {
  pitch:           { label: "Pitched to lead",  icon: MessageSquare, cls: "text-sky-600 bg-sky-50" },
  virtual_tour:    { label: "Virtual tour",     icon: Video,         cls: "text-violet-600 bg-violet-50" },
  visit_scheduled: { label: "Visit scheduled",  icon: CalendarDays,  cls: "text-amber-600 bg-amber-50" },
  visit_done:      { label: "Visit completed",  icon: CheckCircle2,  cls: "text-emerald-600 bg-emerald-50" },
  prebooked:       { label: "Pre-booked",       icon: ShieldCheck,   cls: "text-primary bg-primary/10" },
  confirm:         { label: "Owner confirmed",  icon: CheckCircle2,  cls: "text-slate-600 bg-slate-50" },
  rent_changed:    { label: "Rent updated",     icon: IndianRupee,   cls: "text-orange-600 bg-orange-50" },
};

/* ─────────────── Storage helpers ─────────────── */

const K = {
  rooms:  (pid: string) => `gp_rooms_${pid}`,
  visits: (pid: string) => `gp_visits_${pid}`,
  acts:   (pid: string) => `gp_actions_${pid}`,
};

function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function save(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)); }

function hoursSince(iso?: string) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}
function isStale(room: Room) { return hoursSince(room.lastConfirmedAt) > 24; }
function isSoftLocked(room: Room) {
  return room.softLockUntil ? new Date(room.softLockUntil).getTime() > Date.now() : false;
}
function fmtINR(n: number) { return `₹${(n || 0).toLocaleString("en-IN")}`; }
function timeAgo(iso: string) {
  const h = hoursSince(iso);
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m ago`;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* ─────────────── Page ─────────────── */

export default function ManagerRoomsPage() {
  const { id } = useParams();
  const pid = String(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { referrer } = useAppStore();

  const { data: properties } = useGetManagerProperties(referrer?.id ?? 0, { query: { enabled: !!referrer } as any });
  const property = useMemo(() => (properties || []).find((p: any) => String(p.id) === pid), [properties, pid]);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [tab, setTab] = useState<"inventory" | "visits" | "ledger" | "pricing">("inventory");
  const [draft, setDraft] = useState<Partial<Room>>({ status: "vacant", beds: 1, actualRent: 0, expectedRent: 0, roomNumber: "" });
  const [visitDraft, setVisitDraft] = useState<Partial<Visit> & { roomId?: string }>({});
  const [showAdd, setShowAdd] = useState(false);

  /* hydrate */
  useEffect(() => {
    if (!pid) return;
    let r = load<Room[]>(K.rooms(pid), []);
    if (r.length === 0) r = seedRooms();   // first visit: seed a few rooms so the screen has signal
    setRooms(r);
    setVisits(load<Visit[]>(K.visits(pid), []));
    setActions(load<Action[]>(K.acts(pid), []));
  }, [pid]);

  /* persist */
  useEffect(() => { if (pid) save(K.rooms(pid), rooms); }, [pid, rooms]);
  useEffect(() => { if (pid) save(K.visits(pid), visits); }, [pid, visits]);
  useEffect(() => { if (pid) save(K.acts(pid), actions); }, [pid, actions]);

  /* ── derived KPIs ── */
  const kpis = useMemo(() => {
    const sellable = rooms.filter((r) => (r.status === "vacant" || r.status === "vacating") && !isStale(r)).length;
    const locked = rooms.filter(isStale).length;
    const occupiedBeds = rooms.filter((r) => r.status === "occupied").reduce((s, r) => s + r.beds, 0);
    const totalBeds = rooms.reduce((s, r) => s + r.beds, 0) || 1;
    const occupancy = Math.round((occupiedBeds / totalBeds) * 100);
    const revenueAtRisk = rooms
      .filter((r) => r.status === "vacant" || r.status === "vacating")
      .reduce((s, r) => s + (r.expectedRent || 0), 0);
    const visitsThisWeek = visits.filter((v) => hoursSince(v.scheduledAt) > -24 * 7 && hoursSince(v.scheduledAt) < 24 * 7).length;
    const compliance = Math.round(((rooms.length - locked) / Math.max(rooms.length, 1)) * 100);
    return { sellable, locked, occupancy, revenueAtRisk, visitsThisWeek, compliance };
  }, [rooms, visits]);

  /* ── mutations ── */
  const logAction = (roomId: string, type: ActionType, note?: string) => {
    setActions((a) => [{ id: crypto.randomUUID(), roomId, type, at: new Date().toISOString(), by: referrer?.name || "Owner", note }, ...a].slice(0, 200));
  };

  const addRoom = () => {
    if (!draft.roomNumber) { toast({ title: "Room number required", variant: "destructive" }); return; }
    const newRoom: Room = {
      id: crypto.randomUUID(),
      roomNumber: String(draft.roomNumber),
      beds: Number(draft.beds || 1),
      status: (draft.status as RoomStatus) || "vacant",
      vacantDate: draft.vacantDate,
      actualRent: Number(draft.actualRent || 0),
      expectedRent: Number(draft.expectedRent || draft.actualRent || 0),
      floorRent: draft.floorRent ? Number(draft.floorRent) : undefined,
      lastConfirmedAt: new Date().toISOString(),
      demandScore: 40 + Math.floor(Math.random() * 50),
    };
    setRooms((r) => [newRoom, ...r]);
    logAction(newRoom.id, "confirm", "Room added");
    setDraft({ status: "vacant", beds: 1, actualRent: 0, expectedRent: 0, roomNumber: "" });
    setShowAdd(false);
    toast({ title: "Room added" });
  };

  const update = (rid: string, patch: Partial<Room>) => {
    setRooms((rs) => rs.map((r) => (r.id === rid ? { ...r, ...patch } : r)));
  };
  const confirmRoom = (rid: string) => {
    update(rid, { lastConfirmedAt: new Date().toISOString() });
    logAction(rid, "confirm");
  };
  const confirmAll = () => {
    const now = new Date().toISOString();
    setRooms((rs) => rs.map((r) => ({ ...r, lastConfirmedAt: now })));
    rooms.forEach((r) => isStale(r) && logAction(r.id, "confirm", "Bulk confirm"));
    toast({ title: "All rooms confirmed for 24h", description: "Inventory is now open for the Gharpayy team." });
  };
  const setStatus = (rid: string, s: RoomStatus) => {
    update(rid, { status: s, lastConfirmedAt: new Date().toISOString() });
    logAction(rid, "confirm", `Status → ${STATUS_META[s].label}`);
  };
  const remove = (rid: string) => {
    setRooms((rs) => rs.filter((r) => r.id !== rid));
    setVisits((vs) => vs.filter((v) => v.roomId !== rid));
  };

  /* ── share / refer (by room) ── */
  const shareRoom = (room: Room) => {
    if (isStale(room)) { toast({ title: "Confirm room first", description: "Stale rooms can't be referred.", variant: "destructive" }); return; }
    const pname = property?.name || "the PG";
    const area = property?.area || "";
    const text = `Hi! Room *${room.roomNumber}* at *${pname}*${area ? ` (${area})` : ""} — ${room.beds} bed, ${STATUS_META[room.status].label}${room.vacantDate ? ` from ${room.vacantDate}` : ""}. Rent ${fmtINR(room.expectedRent)}/mo. Interested? I can schedule a visit.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    logAction(room.id, "pitch", "WhatsApp share");
    update(room.id, { softLockUntil: new Date(Date.now() + 6 * 36e5).toISOString() }); // 6h soft lock
  };

  /* ── visit scheduling ── */
  const scheduleVisit = (roomId: string) => {
    if (!visitDraft.customerName || !visitDraft.scheduledAt) { toast({ title: "Name & time required", variant: "destructive" }); return; }
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    if (isStale(room)) { toast({ title: "Confirm room first" }); return; }
    const v: Visit = {
      id: crypto.randomUUID(),
      roomId,
      customerName: String(visitDraft.customerName),
      customerPhone: visitDraft.customerPhone,
      scheduledAt: String(visitDraft.scheduledAt),
      type: (visitDraft.type as Visit["type"]) || "physical",
      status: "scheduled",
      notes: visitDraft.notes,
    };
    setVisits((vs) => [v, ...vs]);
    update(roomId, { softLockUntil: new Date(new Date(v.scheduledAt).getTime() + 24 * 36e5).toISOString() });
    logAction(roomId, v.type === "virtual" ? "virtual_tour" : "visit_scheduled", `${v.customerName} @ ${new Date(v.scheduledAt).toLocaleString()}`);
    setVisitDraft({});
    toast({ title: "Visit scheduled", description: "Room is soft-locked until visit + 24h." });
  };
  const markVisit = (id: string, status: VisitStatus) => {
    setVisits((vs) => vs.map((v) => (v.id === id ? { ...v, status } : v)));
    const v = visits.find((x) => x.id === id);
    if (v && status === "done") logAction(v.roomId, "visit_done", v.customerName);
  };

  /* ── render ── */

  if (!property) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <button onClick={() => setLocation("/manager/properties")} className="flex items-center gap-2 text-slate-500 text-sm mb-4">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <p className="text-slate-500">Property not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto pb-32">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <button onClick={() => setLocation("/manager/properties")} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium mb-2">
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Properties
            </button>
            <h1 className="text-2xl md:text-3xl font-black font-display text-slate-900 flex items-center gap-2">
              <BedDouble className="w-7 h-7 text-primary" /> {property.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {property.area} · Inventory OS
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Add room
          </Button>
        </div>

        {/* Daily ritual banner */}
        <DailyRitual locked={kpis.locked} total={rooms.length} compliance={kpis.compliance} onConfirmAll={confirmAll} />

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <Kpi label="Occupancy" value={`${kpis.occupancy}%`} icon={Users} tone="slate" />
          <Kpi label="Sellable now" value={kpis.sellable} icon={Zap} tone="emerald" />
          <Kpi label="Auto-locked" value={kpis.locked} icon={Lock} tone="rose" />
          <Kpi label="Revenue at risk" value={fmtINR(kpis.revenueAtRisk)} icon={TrendingDown} tone="amber" small />
          <Kpi label="Visits this wk" value={kpis.visitsThisWeek} icon={CalendarDays} tone="violet" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200">
          {(["inventory", "visits", "ledger", "pricing"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-bold capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {t === "ledger" ? "Effort ledger" : t}
            </button>
          ))}
        </div>

        {/* Add room sheet */}
        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Add a room</h2>
                <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-700 text-sm">Cancel</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Room number *"><Input placeholder="201" value={draft.roomNumber || ""} onChange={(e) => setDraft({ ...draft, roomNumber: e.target.value })} /></Field>
                <Field label="Beds"><Input type="number" min={1} value={draft.beds || 1} onChange={(e) => setDraft({ ...draft, beds: Number(e.target.value) })} /></Field>
                <Field label="Status">
                  <select value={draft.status as string} onChange={(e) => setDraft({ ...draft, status: e.target.value as RoomStatus })}
                    className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm">
                    {(Object.keys(STATUS_META) as RoomStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                  </select>
                </Field>
                <Field label="Actual rent (₹)"><Input type="number" value={draft.actualRent || ""} onChange={(e) => setDraft({ ...draft, actualRent: Number(e.target.value) })} /></Field>
                <Field label="Expected rent (₹)"><Input type="number" value={draft.expectedRent || ""} onChange={(e) => setDraft({ ...draft, expectedRent: Number(e.target.value) })} /></Field>
                <Field label="Floor rent (private)"><Input type="number" value={draft.floorRent || ""} onChange={(e) => setDraft({ ...draft, floorRent: Number(e.target.value) })} /></Field>
                <Field label="Vacant from"><Input type="date" value={draft.vacantDate || ""} onChange={(e) => setDraft({ ...draft, vacantDate: e.target.value })} /></Field>
              </div>
              <Button onClick={addRoom}><Plus className="w-4 h-4 mr-1" /> Add room</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab content */}
        {tab === "inventory" && (
          <InventoryTab
            rooms={rooms}
            visits={visits}
            onConfirm={confirmRoom}
            onStatus={setStatus}
            onShare={shareRoom}
            onRemove={remove}
            onScheduleVisit={scheduleVisit}
            visitDraft={visitDraft}
            setVisitDraft={setVisitDraft}
          />
        )}
        {tab === "visits" && <VisitsTab visits={visits} rooms={rooms} onMark={markVisit} />}
        {tab === "ledger" && <LedgerTab actions={actions} rooms={rooms} />}
        {tab === "pricing" && <PricingTab rooms={rooms} onApply={(rid, rent) => { update(rid, { expectedRent: rent }); logAction(rid, "rent_changed", `→ ${fmtINR(rent)}`); }} />}
      </div>
    </Layout>
  );
}

/* ─────────────── Sub-components ─────────────── */

function Field({ label, children }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function DailyRitual({ locked, total, compliance, onConfirmAll }: any) {
  if (total === 0) return null;
  const hasLocked = locked > 0;
  return (
    <div className={`rounded-2xl p-4 border ${hasLocked ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          {hasLocked ? <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" /> : <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />}
          <div>
            <p className={`font-bold text-sm ${hasLocked ? "text-amber-900" : "text-emerald-900"}`}>
              {hasLocked ? `${locked} of ${total} rooms need today's confirmation` : "All rooms confirmed today"}
            </p>
            <p className={`text-xs mt-0.5 ${hasLocked ? "text-amber-700" : "text-emerald-700"}`}>
              Compliance score · {compliance}%. Unconfirmed rooms are auto-locked from referrals to prevent ghost selling.
            </p>
          </div>
        </div>
        {hasLocked && (
          <Button size="sm" variant="outline" onClick={onConfirmAll} className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100">
            Confirm all unchanged
          </Button>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tone, small }: any) {
  const tones: Record<string, string> = {
    slate:   "bg-white border-slate-100 text-slate-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    rose:    "bg-rose-50 border-rose-100 text-rose-700",
    amber:   "bg-amber-50 border-amber-100 text-amber-700",
    violet:  "bg-violet-50 border-violet-100 text-violet-700",
  };
  return (
    <div className={`border rounded-xl p-3 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wide font-bold opacity-70">{label}</p>
        <Icon className="w-3.5 h-3.5 opacity-60" />
      </div>
      <p className={`font-black mt-1 ${small ? "text-base" : "text-xl"}`}>{value}</p>
    </div>
  );
}

function InventoryTab({ rooms, visits, onConfirm, onStatus, onShare, onRemove, onScheduleVisit, visitDraft, setVisitDraft }: any) {
  const [openVisitFor, setOpenVisitFor] = useState<string | null>(null);

  if (rooms.length === 0) {
    return (
      <div className="text-center py-14 bg-white border border-dashed border-slate-200 rounded-2xl">
        <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-sm">No rooms yet. Add your first room to start tracking.</p>
      </div>
    );
  }

  const grouped: Record<RoomStatus, Room[]> = { vacant: [], vacating: [], occupied: [], blocked: [] };
  rooms.forEach((r: Room) => grouped[r.status].push(r));
  const order: RoomStatus[] = ["vacant", "vacating", "occupied", "blocked"];

  return (
    <div className="space-y-5">
      {order.map((s) => grouped[s].length > 0 && (
        <div key={s}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{STATUS_META[s].label} · {grouped[s].length}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped[s].map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                visits={visits.filter((v: Visit) => v.roomId === room.id && v.status === "scheduled")}
                onConfirm={() => onConfirm(room.id)}
                onStatus={(s: RoomStatus) => onStatus(room.id, s)}
                onShare={() => onShare(room)}
                onRemove={() => onRemove(room.id)}
                openVisit={openVisitFor === room.id}
                setOpenVisit={(b: boolean) => setOpenVisitFor(b ? room.id : null)}
                onScheduleVisit={() => { onScheduleVisit(room.id); setOpenVisitFor(null); }}
                visitDraft={visitDraft}
                setVisitDraft={setVisitDraft}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoomCard({ room, visits, onConfirm, onStatus, onShare, onRemove, openVisit, setOpenVisit, onScheduleVisit, visitDraft, setVisitDraft }: any) {
  const stale = isStale(room);
  const locked = isSoftLocked(room);
  const rentDelta = room.expectedRent - room.actualRent;
  const trendUp = rentDelta > 0;
  const demand = room.demandScore ?? 50;

  return (
    <motion.div layout className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-slate-900 text-lg">Room {room.roomNumber}</h3>
            <Badge variant="outline" className={`text-[10px] ${STATUS_META[room.status].cls}`}>{STATUS_META[room.status].label}</Badge>
            {stale && <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-600 border-rose-200"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>}
            {locked && !stale && <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200"><Clock className="w-3 h-3 mr-1" /> Soft-lock</Badge>}
            {demand > 75 && <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200"><Flame className="w-3 h-3 mr-1" /> Hot</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{room.beds} bed</span>
            {room.vacantDate && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {room.vacantDate}</span>}
            <span className="flex items-center gap-1">
              <IndianRupee className="w-3 h-3" />
              {fmtINR(room.expectedRent).replace("₹", "")}/mo
              {rentDelta !== 0 && (
                <span className={`ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
                  {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trendUp ? "+" : ""}{fmtINR(rentDelta)}
                </span>
              )}
            </span>
          </p>
        </div>
        <button onClick={onRemove} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
      </div>

      {/* Demand bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
          <span>Demand index</span><span>{demand}/100</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${demand > 75 ? "bg-orange-500" : demand > 50 ? "bg-amber-400" : "bg-slate-300"}`} style={{ width: `${demand}%` }} />
        </div>
      </div>

      {/* Upcoming visits */}
      {visits.length > 0 && (
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
          <p className="text-[10px] font-bold uppercase text-amber-700 mb-1">Upcoming visits</p>
          {visits.slice(0, 2).map((v: Visit) => (
            <div key={v.id} className="text-xs text-amber-900 flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> {v.customerName} · {new Date(v.scheduledAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
              <Badge variant="outline" className="text-[9px] bg-white border-amber-200 ml-auto">{v.type}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <select
          value={room.status}
          onChange={(e) => onStatus(e.target.value as RoomStatus)}
          className="h-8 px-2 border border-slate-200 rounded-md bg-white text-xs font-medium">
          {(Object.keys(STATUS_META) as RoomStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={onConfirm} className="h-8 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpenVisit(!openVisit)} disabled={stale || room.status === "occupied" || room.status === "blocked"} className="h-8 text-xs">
          <CalendarDays className="w-3.5 h-3.5 mr-1" /> Visit
        </Button>
        <Button size="sm" onClick={onShare} disabled={stale || room.status === "occupied" || room.status === "blocked"} className="h-8 text-xs">
          <Share2 className="w-3.5 h-3.5 mr-1" /> Refer
        </Button>
      </div>

      {/* Inline visit scheduler */}
      <AnimatePresence>
        {openVisit && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-bold text-slate-700">Schedule a visit · Room {room.roomNumber}</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Customer name" value={visitDraft.customerName || ""} onChange={(e: any) => setVisitDraft({ ...visitDraft, customerName: e.target.value })} className="h-9 text-xs" />
                <Input placeholder="Phone (optional)" value={visitDraft.customerPhone || ""} onChange={(e: any) => setVisitDraft({ ...visitDraft, customerPhone: e.target.value })} className="h-9 text-xs" />
                <Input type="datetime-local" value={visitDraft.scheduledAt || ""} onChange={(e: any) => setVisitDraft({ ...visitDraft, scheduledAt: e.target.value })} className="h-9 text-xs" />
                <select value={visitDraft.type || "physical"} onChange={(e) => setVisitDraft({ ...visitDraft, type: e.target.value })}
                  className="h-9 px-2 border border-slate-200 rounded-md bg-white text-xs">
                  <option value="physical">Physical visit</option>
                  <option value="virtual">Virtual tour</option>
                </select>
              </div>
              <Button size="sm" onClick={onScheduleVisit} className="w-full h-8 text-xs">Lock room & schedule</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VisitsTab({ visits, rooms, onMark }: any) {
  if (visits.length === 0) {
    return <Empty icon={CalendarDays} text="No visits yet. Schedule one from any room." />;
  }
  const sorted = [...visits].sort((a: Visit, b: Visit) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  return (
    <div className="space-y-2">
      {sorted.map((v: Visit) => {
        const room = rooms.find((r: Room) => r.id === v.roomId);
        return (
          <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-900 text-sm">{v.customerName}</p>
                <Badge variant="outline" className="text-[10px]">{v.type}</Badge>
                <Badge variant="outline" className={`text-[10px] ${
                  v.status === "scheduled" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  v.status === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  v.status === "no_show" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}>{v.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Room {room?.roomNumber || "?"} · {new Date(v.scheduledAt).toLocaleString()} {v.customerPhone && `· ${v.customerPhone}`}
              </p>
            </div>
            {v.status === "scheduled" && (
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => onMark(v.id, "done")} className="h-8 text-xs">Mark done</Button>
                <Button size="sm" variant="outline" onClick={() => onMark(v.id, "no_show")} className="h-8 text-xs">No-show</Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LedgerTab({ actions, rooms }: any) {
  if (actions.length === 0) {
    return <Empty icon={Activity} text="Effort ledger is empty. Every pitch, tour, visit and confirmation will appear here." />;
  }
  const counts = actions.reduce((acc: Record<string, number>, a: Action) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc; }, {});
  return (
    <div className="space-y-4">
      {/* Effort summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {(Object.keys(ACTION_META) as ActionType[]).slice(0, 4).map((t) => {
          const M = ACTION_META[t];
          return (
            <div key={t} className="bg-white border border-slate-100 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg grid place-items-center ${M.cls}`}><M.icon className="w-3.5 h-3.5" /></div>
                <p className="text-[10px] font-bold uppercase text-slate-500">{M.label}</p>
              </div>
              <p className="font-black text-lg text-slate-900 mt-1">{counts[t] || 0}</p>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
        {actions.slice(0, 50).map((a: Action) => {
          const M = ACTION_META[a.type];
          const room = rooms.find((r: Room) => r.id === a.roomId);
          return (
            <div key={a.id} className="p-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${M.cls}`}><M.icon className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900"><span className="font-bold">{M.label}</span> {room && <span className="text-slate-500">· Room {room.roomNumber}</span>}</p>
                {a.note && <p className="text-xs text-slate-500 mt-0.5">{a.note}</p>}
              </div>
              <p className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.at)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PricingTab({ rooms, onApply }: any) {
  const open = rooms.filter((r: Room) => r.status === "vacant" || r.status === "vacating");
  if (open.length === 0) return <Empty icon={Sparkles} text="No vacant/vacating rooms. Pricing assistant activates when rooms open up." />;

  return (
    <div className="space-y-3">
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-600 mt-0.5" />
        <div>
          <p className="font-bold text-violet-900 text-sm">Dynamic pricing suggestions</p>
          <p className="text-xs text-violet-700 mt-0.5">Based on demand index, vacancy days and your floor rent. One click applies.</p>
        </div>
      </div>
      {open.map((r: Room) => {
        const demand = r.demandScore ?? 50;
        // suggest: high demand → push +5%, low demand → drop 5-8%
        const factor = demand > 75 ? 1.05 : demand > 50 ? 1.0 : demand > 35 ? 0.95 : 0.92;
        let suggest = Math.round((r.expectedRent || r.actualRent) * factor / 100) * 100;
        if (r.floorRent && suggest < r.floorRent) suggest = r.floorRent;
        const diff = suggest - r.expectedRent;
        const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
        return (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-slate-900 text-sm">Room {r.roomNumber}</p>
              <p className="text-xs text-slate-500">Current ask {fmtINR(r.expectedRent)} · demand {demand}/100{r.floorRent ? ` · floor ${fmtINR(r.floorRent)}` : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs font-bold flex items-center gap-1 ${dir === "up" ? "text-emerald-600" : dir === "down" ? "text-rose-600" : "text-slate-500"}`}>
                {dir === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : dir === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                Suggest {fmtINR(suggest)}
              </div>
              <Button size="sm" variant="outline" disabled={diff === 0} onClick={() => onApply(r.id, suggest)} className="h-8 text-xs">
                Apply
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Empty({ icon: Icon, text }: any) {
  return (
    <div className="text-center py-14 bg-white border border-dashed border-slate-200 rounded-2xl">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

/* ─────────────── Seed (first-visit demo data) ─────────────── */

function seedRooms(): Room[] {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  return [
    { id: crypto.randomUUID(), roomNumber: "101", beds: 1, status: "vacant",   actualRent: 12000, expectedRent: 13500, floorRent: 11000, vacantDate: iso(now).slice(0,10), lastConfirmedAt: iso(now), demandScore: 82 },
    { id: crypto.randomUUID(), roomNumber: "102", beds: 2, status: "vacating", actualRent: 15000, expectedRent: 16000, vacantDate: iso(new Date(now.getTime()+5*86400000)).slice(0,10), lastConfirmedAt: iso(new Date(now.getTime()-30*36e5)), demandScore: 64 },
    { id: crypto.randomUUID(), roomNumber: "201", beds: 1, status: "occupied", actualRent: 11500, expectedRent: 12500, lastConfirmedAt: iso(now), demandScore: 48 },
    { id: crypto.randomUUID(), roomNumber: "202", beds: 1, status: "vacant",   actualRent: 9500,  expectedRent: 10500, floorRent: 9000, vacantDate: iso(now).slice(0,10), lastConfirmedAt: iso(now), demandScore: 33 },
    { id: crypto.randomUUID(), roomNumber: "301", beds: 3, status: "blocked",  actualRent: 22000, expectedRent: 24000, lastConfirmedAt: iso(now), demandScore: 55 },
  ];
}
