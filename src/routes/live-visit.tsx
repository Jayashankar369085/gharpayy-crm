import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useMountedNow } from "@/hooks/use-now";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Radio, Plus, Flame, ShieldAlert, Gauge, BookOpen, LayoutGrid } from "lucide-react";
import { LiveVisitCard } from "@/components/visits/live/LiveVisitCard";
import { VisitControlSheet } from "@/components/visits/live/VisitControlSheet";
import { AlertRail } from "@/components/visits/live/AlertRail";
import { MetricsPanel } from "@/components/visits/live/MetricsPanel";
import { PlaybookPanel } from "@/components/visits/live/PlaybookPanel";
import { useLiveVisits } from "@/lib/visits/live-store";
import {
  COLUMN_LABEL,
  PRIMARY_COLUMNS,
  SECONDARY_COLUMNS,
  type BoardColumn,
  type LiveVisit,
} from "@/lib/visits/live-types";
import {
  groupByColumn,
  evaluateAlerts,
  computeMetrics,
  priorityFor,
  bookingProbability,
} from "@/lib/visits/live-engine";

export const Route = createFileRoute("/live-visit")({
  head: () => ({
    meta: [
      { title: "Live Visit War Room — Gharpayy" },
      { name: "description", content: "Real-time conversion control room: every scheduled visit owned, timed and pushed to a booking, quotation or documented next action." },
      { property: "og:title", content: "Live Visit War Room — Gharpayy" },
      { property: "og:description", content: "Every visit owned, timed and closed. Upcoming, en route, arrived, tour live, closing now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <LiveVisitWarRoom />
    </AppShell>
  ),
});

function LiveVisitWarRoom() {
  const { leads, properties, tours, tcms, scheduleTour } = useApp();
  const [now, mounted] = useMountedNow(1000);
  const store = useLiveVisits();
  const { visits, alerts } = store;
  const [openId, setOpenId] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  /* ── Link with tour scheduling: every scheduled tour becomes a live visit ── */
  useEffect(() => {
    if (!mounted) return;
    tours.forEach((t) => {
      const id = `lv-${t.id}`;
      if (visits[id]) return;
      const lead = leads.find((l) => l.id === t.leadId);
      const prop = properties.find((p) => p.id === t.propertyId);
      const tcm = tcms.find((m) => m.id === t.tcmId);
      const owner = tcms.find((m) => m.id === lead?.assignedTcmId) ?? tcm;
      const sched = +new Date(t.scheduledAt);
      store.seed({
        id,
        tourId: t.id,
        leadId: t.leadId,
        customer: lead?.name ?? "Lead",
        phone: lead?.phone ?? "",
        scheduledAt: sched,
        propertyId: t.propertyId,
        propertyName: prop?.name ?? "Property",
        propertyArea: prop?.area ?? "—",
        roomNo: `${(prop?.name ?? "R").slice(0, 1).toUpperCase()}${100 + (sched % 40)}`,
        bedNo: sched % 2 === 0 ? "A" : "B",
        rent: prop?.pricePerBed ?? 0,
        budget: lead?.budget ?? 0,
        checkInDate: lead?.moveInDate ?? new Date().toISOString().slice(0, 10),
        occupation: lead?.source ?? "—",
        decisionMaker: "Self",
        intent: (lead?.intent ?? "warm") as LiveVisit["intent"],
        currentLocation: lead?.preferredArea ?? "—",
        leadOwnerId: owner?.id ?? "",
        leadOwner: owner?.name ?? "Unassigned",
        coordinatorId: tcm?.id ?? "",
        coordinator: tcm?.name ?? "Unassigned",
        stage: t.status === "completed" ? "feedback" : t.status === "cancelled" || t.status === "no-show" ? "lost" : "scheduled",
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours, mounted]);

  /* ── Alert engine tick ── */
  useEffect(() => {
    if (!mounted) return;
    Object.values(visits).forEach((v) => {
      evaluateAlerts(v, now).forEach((c) =>
        store.pushAlert({ visitId: v.id, customer: v.customer, kind: c.kind, severity: c.severity, message: c.message }),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(now / 30_000), mounted]);

  const all = useMemo(() => Object.values(visits), [visits]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((v) => {
      if (ownerFilter !== "all" && v.leadOwnerId !== ownerFilter && v.coordinatorId !== ownerFilter) return false;
      if (!q) return true;
      return [v.customer, v.propertyName, v.roomNo, v.leadOwner, v.coordinator].join(" ").toLowerCase().includes(q);
    });
  }, [all, ownerFilter, query]);

  const columns = useMemo(() => groupByColumn(filtered, now), [filtered, now]);
  const metrics = useMemo(() => computeMetrics(all), [all]);
  const openAlerts = alerts.filter((a) => !a.resolvedAt);

  const closeNow = useMemo(
    () => filtered.filter((v) => priorityFor(v, now).tier === "close-now").sort((a, b) => bookingProbability(b) - bookingProbability(a)),
    [filtered, now],
  );
  const atRisk = useMemo(() => filtered.filter((v) => priorityFor(v, now).tier === "at-risk"), [filtered, now]);
  const followUp = useMemo(() => filtered.filter((v) => priorityFor(v, now).tier === "follow-up"), [filtered, now]);

  const alternatives = useMemo(
    () => properties.map((p) => ({ name: p.name, rent: p.pricePerBed, area: p.area })),
    [properties],
  );
  const coordinators = useMemo(() => tcms.map((t) => ({ id: t.id, name: t.name })), [tcms]);
  const active = openId ? visits[openId] ?? null : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute h-full w-full rounded-full bg-success/60" />
            <span className="relative rounded-full h-2.5 w-2.5 bg-success" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Live Visit War Room</h1>
        </div>
        <p className="text-xs text-muted-foreground max-w-xl">
          Not a calendar. Every active customer is visible, owned, timed and pushed toward a booking, quotation, token or a documented next action.
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input placeholder="Search customer, property, room…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 w-52 text-xs" />
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All owners" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All owners &amp; coordinators</SelectItem>
              {tcms.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <ScheduleVisitDialog onScheduled={() => toast.success("Visit scheduled and pushed into the War Room")} />
        </div>
      </header>

      <LiveTourStrip visits={filtered} now={now} onOpen={setOpenId} />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        <Kpi label="Active visits" value={filtered.filter((v) => !["booked", "lost"].includes(v.stage)).length} />
        <Kpi label="Close now" value={closeNow.length} tone="success" />
        <Kpi label="At risk" value={atRisk.length} tone="destructive" />
        <Kpi label="Follow-up" value={followUp.length} tone="warning" />
        <Kpi label="Open alerts" value={openAlerts.length} tone={openAlerts.length ? "destructive" : "default"} />
        <Kpi label="Quotations today" value={metrics.quotationsSent} />
        <Kpi label="Booked today" value={metrics.booked} tone="success" />
      </div>

      <Tabs defaultValue="board">
        <TabsList className="h-9">
          <TabsTrigger value="board" className="text-xs"><LayoutGrid className="h-3.5 w-3.5 mr-1" />War board</TabsTrigger>
          <TabsTrigger value="priority" className="text-xs"><Flame className="h-3.5 w-3.5 mr-1" />Priority engine</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs"><ShieldAlert className="h-3.5 w-3.5 mr-1" />Alerts ({openAlerts.length})</TabsTrigger>
          <TabsTrigger value="metrics" className="text-xs"><Gauge className="h-3.5 w-3.5 mr-1" />Metrics</TabsTrigger>
          <TabsTrigger value="playbook" className="text-xs"><BookOpen className="h-3.5 w-3.5 mr-1" />Playbook</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="pt-4 space-y-4">
          <BoardRow cols={PRIMARY_COLUMNS} columns={columns} now={now} onOpen={setOpenId} />
          <BoardRow cols={SECONDARY_COLUMNS} columns={columns} now={now} onOpen={setOpenId} compact />
        </TabsContent>

        <TabsContent value="priority" className="pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PriorityLane title="Priority 1 · Close now" hint="Customer inside the property, rated 8+, room selected, one objection left." tone="success" visits={closeNow} now={now} onOpen={setOpenId} />
          <PriorityLane title="Priority 2 · At risk" hint="Late, unconfirmed, room lost, no action for 15+ minutes." tone="destructive" visits={atRisk} now={now} onOpen={setOpenId} />
          <PriorityLane title="Priority 3 · Follow-up required" hint="Tour done, family approval, comparison, token promised but unpaid." tone="warning" visits={followUp} now={now} onOpen={setOpenId} />
        </TabsContent>

        <TabsContent value="alerts" className="pt-4">
          <Card className="p-3"><AlertRail alerts={alerts} onOpen={(id) => setOpenId(id)} /></Card>
        </TabsContent>

        <TabsContent value="metrics" className="pt-4"><MetricsPanel m={metrics} /></TabsContent>
        <TabsContent value="playbook" className="pt-4"><PlaybookPanel /></TabsContent>
      </Tabs>

      <VisitControlSheet
        visit={active}
        now={now}
        alternatives={alternatives}
        coordinators={coordinators}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function Kpi({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "destructive" }) {
  const toneCls =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : tone === "destructive" ? "text-destructive" : "";
  return (
    <Card className="p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-xl font-semibold tabular-nums", toneCls)}>{value}</div>
    </Card>
  );
}

function BoardRow({
  cols, columns, now, onOpen, compact,
}: {
  cols: BoardColumn[];
  columns: Map<string, LiveVisit[]>;
  now: number;
  onOpen: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-3", cols.length === 5 ? "grid-cols-1 md:grid-cols-3 xl:grid-cols-5" : "grid-cols-1 md:grid-cols-3 xl:grid-cols-5")}>
      {cols.map((c) => {
        const list = columns.get(c) ?? [];
        return (
          <div key={c} className="rounded-xl border border-border bg-muted/20 p-2 space-y-2 min-h-[120px]">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10.5px] font-semibold tracking-wide text-muted-foreground">{COLUMN_LABEL[c]}</span>
              <Badge variant="outline" className="text-[9px]">{list.length}</Badge>
            </div>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-0.5">
              {list.length === 0 ? (
                <p className="text-[10.5px] text-muted-foreground px-1 py-2">Empty</p>
              ) : (
                list.map((v) => <LiveVisitCard key={v.id} visit={v} now={now} onOpen={onOpen} compact={compact} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PriorityLane({
  title, hint, tone, visits, now, onOpen,
}: {
  title: string; hint: string; tone: "success" | "destructive" | "warning";
  visits: LiveVisit[]; now: number; onOpen: (id: string) => void;
}) {
  const border = tone === "success" ? "border-success/40" : tone === "destructive" ? "border-destructive/40" : "border-warning/40";
  return (
    <Card className={cn("p-3 space-y-2 border", border)}>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-[10.5px] text-muted-foreground">{hint}</p>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-0.5">
        {visits.length === 0 ? <p className="text-[11px] text-muted-foreground">Nothing here right now.</p>
          : visits.map((v) => <LiveVisitCard key={v.id} visit={v} now={now} onOpen={onOpen} />)}
      </div>
    </Card>
  );
}

/* ───────────── Schedule a visit straight into the War Room ───────────── */

function ScheduleVisitDialog({ onScheduled }: { onScheduled: () => void }) {
  const { leads, properties, tcms, scheduleTour } = useApp();
  const [open, setOpen] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [tcmId, setTcmId] = useState("");
  const [when, setWhen] = useState("");
  const [room, setRoom] = useState("");
  const [bed, setBed] = useState("A");

  const canSave = leadId && propertyId && tcmId && when && room;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" />Schedule visit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-base">Schedule a visit</DialogTitle></DialogHeader>
        <p className="text-[11px] text-muted-foreground -mt-2">
          A visit cannot be scheduled against a property alone — a room or bed preference is mandatory.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1 col-span-2">
            <Label className="text-[11px]">Customer</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select lead" /></SelectTrigger>
              <SelectContent>{leads.slice(0, 60).map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name} · {l.phone}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Property" /></SelectTrigger>
              <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Tour coordinator</Label>
            <Select value={tcmId} onValueChange={setTcmId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Coordinator" /></SelectTrigger>
              <SelectContent>{tcms.map((t) => <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label className="text-[11px]">Room</Label><Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="204" className="h-8 text-xs" /></div>
          <div className="space-y-1"><Label className="text-[11px]">Bed</Label><Input value={bed} onChange={(e) => setBed(e.target.value)} className="h-8 text-xs" /></div>
          <div className="space-y-1 col-span-2"><Label className="text-[11px]">Date &amp; time</Label><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 text-xs" /></div>
        </div>
        <Button
          className="h-8 text-xs mt-2"
          disabled={!canSave}
          onClick={() => {
            const tour = scheduleTour({ leadId, propertyId, tcmId, scheduledAt: new Date(when).toISOString() });
            const id = `lv-${tour.id}`;
            const lead = leads.find((l) => l.id === leadId);
            const prop = properties.find((p) => p.id === propertyId);
            const tcm = tcms.find((t) => t.id === tcmId);
            const owner = tcms.find((t) => t.id === lead?.assignedTcmId) ?? tcm;
            useLiveVisits.getState().seed({
              id, tourId: tour.id, leadId,
              customer: lead?.name ?? "Lead", phone: lead?.phone ?? "",
              scheduledAt: +new Date(when),
              propertyId, propertyName: prop?.name ?? "", propertyArea: prop?.area ?? "",
              roomNo: room, bedNo: bed, rent: prop?.pricePerBed ?? 0,
              budget: lead?.budget ?? 0, checkInDate: lead?.moveInDate ?? "",
              occupation: lead?.source ?? "—", decisionMaker: "Self",
              intent: (lead?.intent ?? "warm") as LiveVisit["intent"],
              currentLocation: lead?.preferredArea ?? "—",
              leadOwnerId: owner?.id ?? "", leadOwner: owner?.name ?? "Unassigned",
              coordinatorId: tcmId, coordinator: tcm?.name ?? "Unassigned",
            });
            useLiveVisits.getState().logComms(id, "Scheduled — property name, location, time, coordinator number and visit expectations sent");
            setOpen(false);
            onScheduled();
          }}
        >
          Schedule &amp; push to War Room
        </Button>
      </DialogContent>
    </Dialog>
  );
}
