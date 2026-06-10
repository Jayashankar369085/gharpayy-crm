// Owner Home — the 10x hotel-style owner desk. Single screen, registry-driven
// (live across both property hubs), with tabs for Inventory · Tours · Block
// requests · Activity. Owners can bulk-add up to 12 rooms per property, hold
// rooms for Gharpayy in one tap, and watch every team action land here in
// real time.

import { useEffect, useMemo, useState } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import {
  getRegistry,
  patchRoom,
  verifyRoomToday,
  holdForGharpayy,
  closeDeal,
  addRooms as addRoomsToRegistry,
  removeAddedRoom,
  addedRoomCountFor,
  maxAddedRoomsPerPG,
  dailyTruthPhase,
  subscribeRegistry,
  type RegistryOwner,
  type OwnerRoom,
  type RoomStatus,
  type RoomType,
  type TruthPhase,
} from "@/owner/lib/owner-registry";
import { useOwnerEffort } from "@/owner/lib/effort-ledger";
import { glueBus, type GlueEvent } from "@/owner/event-bus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Building2,
  Phone,
  MessageCircle,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Activity,
  Copy,
  Plus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  CalendarDays,
  Inbox,
  TrendingUp,
  Hotel,
  X,
  Bell,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ============================== data hooks ============================== */

function useRegistry() {
  const [data, setData] = useState<RegistryOwner[]>(() => getRegistry());
  useEffect(() => subscribeRegistry(() => setData(getRegistry())), []);
  return data;
}

function useGlueRecent(): GlueEvent[] {
  const [events, setEvents] = useState<GlueEvent[]>(() => glueBus.recent(undefined, 200));
  useEffect(() => {
    const refresh = () => setEvents(glueBus.recent(undefined, 200));
    refresh();
    return glueBus.subscribe(refresh);
  }, []);
  return events;
}

/* ============================== constants =============================== */

const STATUS_TONE: Record<RoomStatus, string> = {
  vacant: "bg-success/15 text-success border-success/30",
  vacating: "bg-warning/15 text-warning-foreground border-warning/30",
  occupied: "bg-muted text-muted-foreground border-border",
  blocked: "bg-destructive/10 text-destructive border-destructive/30",
  held: "bg-accent/15 text-accent-foreground border-accent/30",
  booked: "bg-info/10 text-info border-info/30",
};

const PHASE_COPY: Record<TruthPhase, { label: string; tone: string }> = {
  idle: { label: "Update window opens 9:30 AM", tone: "bg-muted text-muted-foreground border-border" },
  open: { label: "OPEN — confirm rooms for today", tone: "bg-info/10 text-info border-info/30" },
  warn1: { label: "Reminder 1 of 3 — please confirm rooms", tone: "bg-warning/15 text-warning-foreground border-warning/30" },
  warn2: { label: "Reminder 2 of 3 — confirm before 7 PM", tone: "bg-warning/15 text-warning-foreground border-warning/30" },
  warn3: { label: "Final reminder — confirm before 10 PM", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  locked: { label: "LOCKED — unconfirmed rooms removed", tone: "bg-destructive/10 text-destructive border-destructive/30" },
};

const TABS = [
  { id: "inventory", label: "Inventory", icon: Hotel },
  { id: "tours", label: "Tours", icon: CalendarDays },
  { id: "blocks", label: "Block requests", icon: Inbox },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ============================== main page =============================== */

export function OwnerHome() {
  const owners = useRegistry();
  const search = useSearch({ strict: false }) as { id?: string; tab?: string };
  const navigate = useNavigate();

  const [q, setQ] = useState("");

  const selectedId = search.id ?? owners[0]?.id;
  const owner = useMemo(
    () => owners.find((o) => o.id === selectedId) ?? owners[0],
    [owners, selectedId],
  );
  const tab: TabId = (TABS.find((t) => t.id === search.tab)?.id ?? "inventory") as TabId;

  const phase = dailyTruthPhase();
  const effort = useOwnerEffort(owner?.id ?? null);
  const glueEvents = useGlueRecent();

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return owners.slice(0, 8);
    return owners
      .filter(
        (o) =>
          o.id.toLowerCase().includes(term) ||
          o.name.toLowerCase().includes(term) ||
          (o.phone || "").includes(term),
      )
      .slice(0, 8);
  }, [owners, q]);

  if (!owner) {
    return <div className="p-6 text-sm text-muted-foreground">No owners in registry yet.</div>;
  }

  const allRooms = owner.properties.flatMap((p) => p.rooms);
  const today = new Date().toISOString().slice(0, 10);

  // hotel-style KPIs
  const available = allRooms.filter(
    (r) => !r.lockedUnsellable && (r.status === "vacant" || r.status === "vacating"),
  ).length;
  const held = allRooms.filter((r) => r.status === "held").length;
  const bookedToday = allRooms.filter((r) => r.status === "booked" && r.updatedAt.startsWith(today)).length;
  const vacatingSoon = allRooms.filter((r) => r.status === "vacating").length;
  const monthlyRevenue = allRooms
    .filter((r) => r.status === "occupied" || r.status === "booked")
    .reduce((s, r) => s + r.rent * Math.max(1, r.beds), 0);

  // owner-scoped tours from glueBus
  const ownerRoomIds = new Set(allRooms.map((r) => r.id));
  const tours = useMemo(() => {
    return glueEvents
      .filter((e) => e.type === "team.visit.scheduled" || e.type === "team.visit.started" || e.type === "team.visit.ended")
      .map((e) => e as Extract<GlueEvent, { type: "team.visit.scheduled" | "team.visit.started" | "team.visit.ended" }>)
      .filter((e) => {
        const rid = (e as { roomId?: string }).roomId;
        if (rid && ownerRoomIds.has(rid)) return true;
        const oid = (e as { ownerId?: string }).ownerId;
        return oid === owner.id;
      })
      .slice(0, 25);
  }, [glueEvents, ownerRoomIds, owner.id]);

  const toursScheduledCount = tours.filter((t) => t.type === "team.visit.scheduled").length;

  const selectOwner = (id: string) =>
    navigate({ to: "/owner", search: (prev: Record<string, unknown>) => ({ ...prev, id }) });
  const selectTab = (id: TabId) =>
    navigate({ to: "/owner", search: (prev: Record<string, unknown>) => ({ ...prev, tab: id }) });

  const verifyAllUnchanged = () => {
    allRooms.forEach((r) => verifyRoomToday(r.id));
    toast({ title: "All rooms confirmed", description: `${allRooms.length} rooms verified for today.` });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Identity strip */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
            Owner ID · {owner.id}
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{owner.name}</h1>
          <p className="text-sm text-muted-foreground">
            {owner.properties.length} propert{owner.properties.length === 1 ? "y" : "ies"} ·{" "}
            {new Set(owner.properties.map((p) => p.hub)).size} hub
            {new Set(owner.properties.map((p) => p.hub)).size === 1 ? "" : "s"} ·{" "}
            {owner.totalBeds} beds
          </p>
        </div>
        <div className={cn("text-[11px] font-mono inline-flex items-center gap-2 rounded-md border px-2 py-1", PHASE_COPY[phase].tone)}>
          {phase === "locked" ? <Lock className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
          {PHASE_COPY[phase].label}
        </div>
      </header>

      {/* Owner switcher + actions */}
      <section className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Switch owner — search ID, name, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm h-8 text-xs"
          />
          <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs">
            {owner.phone && (
              <>
                <a className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 hover:bg-muted" href={`tel:${owner.phone}`}>
                  <Phone className="h-3 w-3" /> Call
                </a>
                <a className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 hover:bg-muted" target="_blank" rel="noreferrer" href={`https://wa.me/${owner.phone.replace(/\D/g, "")}`}>
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              </>
            )}
            <button
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 hover:bg-muted"
              onClick={() => {
                navigator.clipboard?.writeText(owner.id);
                toast({ title: "Owner ID copied", description: owner.id });
              }}
            >
              <Copy className="h-3 w-3" /> Copy ID
            </button>
            <Button size="sm" className="h-7" onClick={verifyAllUnchanged}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm all unchanged
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {matches.map((o) => (
            <button
              key={o.id}
              onClick={() => selectOwner(o.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors",
                o.id === owner.id
                  ? "border-accent/50 bg-accent/10 text-accent-foreground"
                  : "border-border bg-card hover:bg-muted text-muted-foreground",
              )}
            >
              <span className="font-mono text-[10px] opacity-70">{o.id}</span>
              {o.name}
            </button>
          ))}
          <Link to="/owner/registry" className="text-[11px] text-accent underline ml-auto self-center">
            Full directory →
          </Link>
        </div>
      </section>

      {/* Hotel front-desk KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi label="Available" value={available} tone="success" icon={Hotel} />
        <Kpi label="Held for Gharpayy" value={held} tone="accent" icon={ShieldCheck} />
        <Kpi label="Booked today" value={bookedToday} tone="info" icon={CheckCircle2} />
        <Kpi label="Tours" value={toursScheduledCount} tone="muted" icon={CalendarDays} />
        <Kpi label="Vacating soon" value={vacatingSoon} tone="warning" icon={TrendingUp} />
        <Kpi label="Monthly ₹" value={`₹${(monthlyRevenue / 1000).toFixed(0)}k`} tone="muted" icon={Building2} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = t.id === tab;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-accent text-accent-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "inventory" && <InventoryTab owner={owner} />}
      {tab === "tours" && <ToursTab tours={tours} allRooms={allRooms} />}
      {tab === "blocks" && <BlocksTab ownerId={owner.id} events={glueEvents} ownerRoomIds={ownerRoomIds} />}
      {tab === "activity" && <ActivityTab effort={effort} />}
    </div>
  );
}

/* ============================== inventory =============================== */

function InventoryTab({ owner }: { owner: RegistryOwner }) {
  const bulkHold = (propRooms: OwnerRoom[]) => {
    const targets = propRooms.filter((r) => r.status === "vacant" || r.status === "vacating");
    targets.forEach((r) => holdForGharpayy(r.id, true));
    toast({
      title: `Held ${targets.length} rooms`,
      description: "Now exclusive for Gharpayy deals.",
    });
  };

  return (
    <div className="space-y-3">
      {owner.properties.map((p) => {
        const addedCount = addedRoomCountFor(p.pgId);
        const max = maxAddedRoomsPerPG();
        return (
          <div key={p.pgId} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 p-3 bg-muted/30 border-b border-border flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-accent/10 grid place-items-center">
                  <Building2 className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {p.pgName} <span className="text-muted-foreground font-normal">· {p.area}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {p.pgId} · hub:{p.hub} · {p.rooms.length} rooms · {addedCount}/{max} added
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => bulkHold(p.rooms)}>
                  <ShieldCheck className="h-3 w-3 mr-1" /> Hold all vacant
                </Button>
                <AddRoomsSheet pgId={p.pgId} pgName={p.pgName} addedCount={addedCount} max={max} />
              </div>
            </div>
            {p.rooms.length === 0 ? (
              <div className="p-3 text-[11px] text-muted-foreground">No rooms configured yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-2">
                {p.rooms.map((r) => (
                  <RoomCard key={r.id} room={r} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoomCard({ room }: { room: OwnerRoom }) {
  const [status, setStatus] = useState<RoomStatus>(room.status);
  const [rent, setRent] = useState(String(room.rent));
  const [vacating, setVacating] = useState(room.vacatingDate ?? "");

  useEffect(() => {
    setStatus(room.status);
    setRent(String(room.rent));
    setVacating(room.vacatingDate ?? "");
  }, [room.status, room.rent, room.vacatingDate]);

  const dirty =
    status !== room.status ||
    Number(rent) !== room.rent ||
    (vacating || "") !== (room.vacatingDate ?? "");

  const save = () => {
    patchRoom(room.id, {
      status,
      rent: Number(rent) || 0,
      vacatingDate: status === "vacating" ? vacating || undefined : undefined,
      verifiedOn: new Date().toISOString().slice(0, 10),
    });
    toast({ title: "Room confirmed", description: room.id });
  };

  const toggleHold = () => {
    const on = room.status !== "held";
    holdForGharpayy(room.id, on);
    toast({
      title: on ? "Held for Gharpayy" : "Released hold",
      description: room.id,
    });
  };

  const remove = () => {
    if (!room.ownerAdded) return;
    if (removeAddedRoom(room.id)) {
      toast({ title: "Room removed", description: room.id });
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-2.5 space-y-2",
        room.lockedUnsellable
          ? "border-destructive/40"
          : room.status === "held"
            ? "border-accent/40"
            : room.verifiedToday
              ? "border-success/30"
              : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[10px] text-muted-foreground truncate">{room.id}</div>
          <div className="text-sm font-semibold capitalize flex items-center gap-1.5">
            {room.type}
            {room.ownerAdded && (
              <Badge variant="outline" className="text-[9px] h-4 px-1">
                added
              </Badge>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", STATUS_TONE[room.status])}>
          {room.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Rent ₹</label>
          <Input
            value={rent}
            onChange={(e) => setRent(e.target.value.replace(/\D/g, ""))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as RoomStatus)}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="vacating">Vacating</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="held">Held for Gharpayy</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {status === "vacating" && (
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono">Vacating date</label>
          <Input type="date" value={vacating} onChange={(e) => setVacating(e.target.value)} className="h-7 text-xs" />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button size="sm" variant={room.status === "held" ? "default" : "outline"} className="h-7 text-[11px] flex-1" onClick={toggleHold}>
          <ShieldCheck className="h-3 w-3 mr-1" />
          {room.status === "held" ? "Release hold" : "Hold for Gharpayy"}
        </Button>
        <Button size="sm" className="h-7 text-[11px]" onClick={save} disabled={!dirty}>
          Save
        </Button>
        {room.ownerAdded && (
          <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={remove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ============================== add sheet =============================== */

interface DraftRow {
  type: RoomType;
  beds: number;
  rent: number;
}

function AddRoomsSheet({
  pgId,
  pgName,
  addedCount,
  max,
}: {
  pgId: string;
  pgName: string;
  addedCount: number;
  max: number;
}) {
  const remaining = Math.max(0, max - addedCount);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>(() => [{ type: "single", beds: 1, rent: 10000 }]);

  const update = (i: number, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => {
    if (rows.length >= remaining) return;
    setRows((prev) => [...prev, { type: "single", beds: 1, rent: 10000 }]);
  };
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const save = () => {
    const valid = rows.filter((r) => r.beds > 0 && r.rent > 0);
    if (valid.length === 0) {
      toast({ title: "Nothing to add", description: "Set beds and rent for at least one row." });
      return;
    }
    const res = addRoomsToRegistry(pgId, valid);
    toast({
      title: `${res.added} room${res.added === 1 ? "" : "s"} added`,
      description: res.skipped > 0
        ? `${res.skipped} skipped — limit of ${max} per property.`
        : `Live in Sales Inventory Truth.`,
    });
    setOpen(false);
    setRows([{ type: "single", beds: 1, rent: 10000 }]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="h-7 text-[11px]" disabled={remaining === 0}>
          <Plus className="h-3 w-3 mr-1" /> Add rooms
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add rooms to {pgName}</SheetTitle>
        </SheetHeader>
        <p className="text-xs text-muted-foreground mt-1">
          Add up to {remaining} more rooms (limit {max} per property). Hotel rules: one rent,
          one bed count per row. Rooms go live for sales immediately.
        </p>

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[1fr,80px,1fr,32px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            <div>Type</div>
            <div className="text-right">Beds</div>
            <div className="text-right">Rent ₹</div>
            <div />
          </div>
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr,80px,1fr,32px] gap-2 items-center">
              <Select value={row.type} onValueChange={(v) => update(i, { type: v as RoomType })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="triple">Triple</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={row.beds}
                onChange={(e) => update(i, { beds: Number(e.target.value) || 0 })}
                className="h-8 text-xs text-right"
              />
              <Input
                type="number"
                min={0}
                value={row.rent}
                onChange={(e) => update(i, { rent: Number(e.target.value) || 0 })}
                className="h-8 text-xs text-right"
              />
              <button
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="h-8 w-8 grid place-items-center rounded-md border border-border text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs w-full"
            onClick={addRow}
            disabled={rows.length >= remaining}
          >
            <Plus className="h-3 w-3 mr-1" /> Add row ({rows.length}/{remaining})
          </Button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={save}>
            Save {rows.length} room{rows.length === 1 ? "" : "s"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================== tours tab =============================== */

function ToursTab({ tours, allRooms }: { tours: GlueEvent[]; allRooms: OwnerRoom[] }) {
  if (tours.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <CalendarDays className="h-6 w-6 mx-auto mb-2 opacity-50" />
        No tours scheduled yet. When sales schedules a visit on any of your rooms it will
        appear here in real time.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
      {tours.map((t, i) => {
        const rid = (t as { roomId?: string }).roomId;
        const room = rid ? allRooms.find((r) => r.id === rid) : undefined;
        const kind =
          t.type === "team.visit.scheduled"
            ? "Scheduled"
            : t.type === "team.visit.started"
              ? "In progress"
              : "Completed";
        const tone =
          t.type === "team.visit.scheduled"
            ? "text-info"
            : t.type === "team.visit.started"
              ? "text-warning-foreground"
              : "text-success";
        return (
          <div key={i} className="flex items-center gap-3 p-3 text-xs">
            <CalendarDays className={cn("h-4 w-4", tone)} />
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                {room ? `${room.pgName} · ${room.type}` : "Tour event"}
              </div>
              {rid && <div className="font-mono text-[10px] text-muted-foreground truncate">{rid}</div>}
            </div>
            <Badge variant="outline" className={cn("text-[10px]", tone)}>
              {kind}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

/* =========================== block requests tab ========================== */

function BlocksTab({
  ownerId,
  events,
  ownerRoomIds,
}: {
  ownerId: string;
  events: GlueEvent[];
  ownerRoomIds: Set<string>;
}) {
  const requests = events
    .filter((e) => e.type === "team.block.requested")
    .map((e) => e as Extract<GlueEvent, { type: "team.block.requested" }>)
    .filter((e) => e.ownerId === ownerId || ownerRoomIds.has(e.roomId))
    .slice(0, 20);

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <Inbox className="h-6 w-6 mx-auto mb-2 opacity-50" />
        Inbox zero. Block requests from the team land here.
      </div>
    );
  }

  const approve = (req: { blockId: string; roomId: string; leadId: string }) => {
    glueBus.publish({
      type: "owner.block.approved",
      blockId: req.blockId,
      roomId: req.roomId,
      leadId: req.leadId,
    });
    holdForGharpayy(req.roomId, true);
    toast({ title: "Block approved", description: req.roomId });
  };
  const reject = (req: { blockId: string; roomId: string; leadId: string }) => {
    glueBus.publish({
      type: "owner.block.rejected",
      blockId: req.blockId,
      roomId: req.roomId,
      leadId: req.leadId,
    });
    toast({ title: "Block rejected", description: req.roomId });
  };

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <div key={r.blockId} className="rounded-xl border border-warning/30 bg-card p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[180px]">
            <div className="text-sm font-semibold">Lead {r.leadId}</div>
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{r.roomId}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => reject(r)}>
              Reject
            </Button>
            <Button size="sm" onClick={() => approve(r)}>
              Approve & hold
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================== activity tab ============================ */

function ActivityTab({ effort }: { effort: ReturnType<typeof useOwnerEffort> }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Activity className="h-4 w-4 text-accent" />
        <h2 className="font-display text-base font-semibold">What Gharpayy did for you</h2>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">live · last 200 events</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3">
        <Mini label="Leads pitched" value={effort.pitches} />
        <Mini label="Visits scheduled" value={effort.visitsScheduled} />
        <Mini label="Visits completed" value={effort.visitsCompleted} />
        <Mini label="Tours / outreach" value={effort.tours} />
        <Mini label="Blocks requested" value={effort.blocksRequested} />
        <Mini label="Blocks approved" value={effort.blocksApproved} tone="success" />
        <Mini label="Blocks rejected" value={effort.blocksRejected} tone="warning" />
        <Mini label="Last activity" value={effort.lastEventAt ? "live" : "—"} small />
      </div>
      {effort.recent.length > 0 ? (
        <div className="border-t border-border divide-y divide-border text-[11px]">
          {effort.recent.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <Sparkles className="h-3 w-3 text-accent" />
              <span className="font-medium">{r.kind}</span>
              {r.roomId && <span className="font-mono text-muted-foreground">· {r.roomId}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-[11px] text-muted-foreground text-center">
          No team activity yet today.
        </div>
      )}
    </div>
  );
}

/* ============================== primitives ============================== */

function Kpi({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  tone: "success" | "info" | "warning" | "muted" | "accent";
  icon: typeof Hotel;
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "info"
        ? "text-info"
        : tone === "warning"
          ? "text-warning-foreground"
          : tone === "accent"
            ? "text-accent-foreground"
            : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-3 flex items-start gap-2">
      <Icon className={cn("h-4 w-4 mt-0.5", toneClass)} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</div>
        <div className={cn("font-display text-xl font-semibold tabular-nums truncate", toneClass)}>{value}</div>
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "warning";
  small?: boolean;
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : "";
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</div>
      <div className={cn("font-display font-semibold tabular-nums", small ? "text-xs" : "text-lg", toneClass)}>
        {value}
      </div>
    </div>
  );
}

export { OwnerHome as default };
