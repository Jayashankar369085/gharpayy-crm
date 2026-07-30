import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Phone, MessageCircle, MapPin, Clock, AlertTriangle, Building2, User, Timer,
} from "lucide-react";
import {
  type LiveVisit,
  STAGE_LABEL,
  OBJECTION_LABEL,
  fmtDur,
  fmtCountdown,
  inr,
} from "@/lib/visits/live-types";
import { priorityFor, bookingProbability, primaryObjection, TIER_LABEL } from "@/lib/visits/live-engine";
import { useLiveVisits } from "@/lib/visits/live-store";

const TIER_TONE: Record<string, string> = {
  "close-now": "border-success/50 bg-success/5",
  "at-risk": "border-destructive/50 bg-destructive/5",
  "follow-up": "border-warning/50 bg-warning/5",
  normal: "border-border bg-card",
  done: "border-border bg-muted/30",
};

const TIER_CHIP: Record<string, string> = {
  "close-now": "bg-success/15 text-success border-success/40",
  "at-risk": "bg-destructive/15 text-destructive border-destructive/40",
  "follow-up": "bg-warning/15 text-warning-foreground border-warning/40",
  normal: "bg-muted text-muted-foreground border-border",
  done: "bg-muted text-muted-foreground border-border",
};

function probTone(p: number) {
  if (p >= 70) return "text-success";
  if (p >= 40) return "text-warning-foreground";
  return "text-destructive";
}

export const LiveVisitCard = memo(function LiveVisitCard({
  visit: v,
  now,
  onOpen,
  compact,
}: {
  visit: LiveVisit;
  now: number;
  onOpen: (id: string) => void;
  compact?: boolean;
}) {
  const { logComms, shareLocation, setMovement, startTour } = useLiveVisits();
  const prio = priorityFor(v, now);
  const prob = bookingProbability(v);
  const objection = primaryObjection(v);

  const timerLabel = (() => {
    if (v.stage === "tour-live" && v.tourStartedAt) return `Tour live ${fmtDur(now - v.tourStartedAt)}`;
    if (v.stage === "arrived" && v.arrival) return `Arrived ${Math.max(0, Math.round((now - v.arrival.arrivedAt) / 60_000))} min ago`;
    if (v.stage === "booked" || v.stage === "lost") return STAGE_LABEL[v.stage];
    if (v.scheduledAt > now || !v.arrival) return `Visit ${fmtCountdown(v.scheduledAt - now)}`;
    return `${STAGE_LABEL[v.stage]} · ${fmtDur(now - v.stageSince)}`;
  })();

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-left transition-colors hover:bg-accent/5 cursor-pointer space-y-2",
        TIER_TONE[prio.tier],
      )}
      onClick={() => onOpen(v.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(v.id); }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm truncate">{v.customer}</span>
            {v.walkIn && <Badge variant="outline" className="text-[9px] px-1">WALK-IN</Badge>}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {v.propertyName} · {v.roomNo || "room TBD"}{v.bedNo ? `/${v.bedNo}` : ""}
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[9px] shrink-0", TIER_CHIP[prio.tier])}>
          {TIER_LABEL[prio.tier].split("·").pop()?.trim()}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Timer className="h-3 w-3" /> {timerLabel}
        </span>
        <span className={cn("ml-auto font-semibold tabular-nums", probTone(prob))}>{prob}%</span>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 truncate"><User className="h-3 w-3" />{v.leadOwner}</span>
          <span className="inline-flex items-center gap-1 truncate"><Building2 className="h-3 w-3" />{v.coordinator}</span>
          {v.feedback && <span className="truncate">Rating {v.feedback.rating}/10</span>}
          <span className="truncate">{inr(v.rent)} · budget {inr(v.budget)}</span>
        </div>
      )}

      {objection && (
        <div className="flex items-center gap-1 text-[10.5px] text-warning-foreground">
          <AlertTriangle className="h-3 w-3" />
          Objection: {OBJECTION_LABEL[objection]}
          {objection === "price" && v.rent > v.budget && ` · gap ${inr(v.rent - v.budget)}`}
        </div>
      )}

      <div className="text-[10.5px] text-muted-foreground line-clamp-1">
        {v.nextAction ? `Next: ${v.nextAction.text} (${v.nextAction.owner})` : prio.reasons[0]}
      </div>

      <div className="flex flex-wrap gap-1 pt-0.5" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" asChild>
          <a href={`tel:${v.phone}`} onClick={() => logComms(v.id, `Called ${v.customer}`)}>
            <Phone className="h-3 w-3 mr-1" />Call
          </a>
        </Button>
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" asChild>
          <a
            href={`https://wa.me/${v.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => logComms(v.id, `WhatsApp sent to ${v.customer}`)}
          >
            <MessageCircle className="h-3 w-3 mr-1" />WA
          </a>
        </Button>
        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => shareLocation(v.id)}>
          <MapPin className="h-3 w-3 mr-1" />Location
        </Button>
        {v.stage === "scheduled" || v.stage === "customer-confirmed" || v.stage === "inventory-confirmed" ? (
          <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => setMovement(v.id, "en-route")}>
            <Clock className="h-3 w-3 mr-1" />En route
          </Button>
        ) : null}
        {v.stage === "arrived" && (
          <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => startTour(v.id)}>
            Start tour
          </Button>
        )}
        <Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]" onClick={() => onOpen(v.id)}>
          Open
        </Button>
      </div>
    </div>
  );
});
