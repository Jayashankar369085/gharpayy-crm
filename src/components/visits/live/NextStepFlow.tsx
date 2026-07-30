import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, ArrowRight, MessageCircle, Copy, Timer, Radio, Sparkle,
} from "lucide-react";
import {
  type LiveVisit,
  type ReactionTag,
  type ObjectionKind,
  type FinalOutcome,
  REACTION_META,
  OBJECTION_LABEL,
  OUTCOME_LABEL,
  INVENTORY_CHECK_ITEMS,
  inr,
  fmtDur,
} from "@/lib/visits/live-types";
import { draftQuotation, buildIntervention, bookingProbability } from "@/lib/visits/live-engine";
import { useLiveVisits } from "@/lib/visits/live-store";
import { flowFor, isFlowClosed, type FlowStepId } from "@/lib/visits/flow";
import { glueBus } from "@/owner/event-bus";

const REACTION_TAGS = Object.keys(REACTION_META) as ReactionTag[];

export function NextStepFlow({
  visit: v,
  now,
  alternatives,
}: {
  visit: LiveVisit;
  now: number;
  alternatives: Array<{ name: string; rent: number; area: string }>;
}) {
  const store = useLiveVisits();
  const flow = useMemo(() => flowFor(v), [v]);
  const closed = isFlowClosed(v);
  const step = flow.current;

  /* auto-advance feedback: when the current step changes, celebrate + surface CX message */
  const prevStep = useRef<FlowStepId | null>(step?.id ?? null);
  const [cxDraft, setCxDraft] = useState<string>("");

  useEffect(() => {
    const id = step?.id ?? null;
    if (prevStep.current && id !== prevStep.current) {
      const finished = flow.steps.find((s) => s.id === prevStep.current);
      if (finished?.status === "done") {
        toast.success(`${finished.title} done`, { description: step ? `Next: ${step.title}` : "Flow complete" });
        if (finished.cx) setCxDraft(finished.cx(v));
      }
    }
    prevStep.current = id;
  }, [step?.id, flow.steps, v]);

  const message = cxDraft || (step?.cx ? step.cx(v) : "");

  const sendCx = () => {
    if (!message.trim()) return;
    store.logComms(v.id, `WhatsApp sent to customer: ${message.slice(0, 90)}…`);
    window.open(`https://wa.me/${v.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success("Message opened in WhatsApp");
  };

  return (
    <div className="space-y-4">
      {/* progress rail */}
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkle className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Guided flow</span>
          <Badge variant="outline" className="text-[10px]">{flow.doneCount}/{flow.total} done</Badge>
          <Badge variant="outline" className="text-[10px] ml-auto">{bookingProbability(v)}% likely</Badge>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${flow.progress}%` }} />
        </div>
        <div className="mt-3 grid gap-1">
          {flow.steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-2 text-[11px] rounded-md px-2 py-1",
                s.status === "current" && "bg-primary/10 font-semibold",
                s.status === "pending" && "opacity-55",
              )}
            >
              {s.status === "done"
                ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                : <Circle className={cn("h-3.5 w-3.5 shrink-0", s.status === "current" && "text-primary")} />}
              <span className="flex-1 truncate">{s.title}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{s.owner}</span>
              {s.status !== "done" && now > s.dueAt && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1">late</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* live tour timer */}
      {v.tourStartedAt && !v.completedAt && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-3 flex items-center gap-2">
          <Radio className="h-4 w-4 text-success animate-pulse" />
          <span className="text-xs font-semibold">Visit happening now — admin is watching live</span>
          <span className="ml-auto font-mono text-sm tabular-nums">{fmtDur(now - v.tourStartedAt)}</span>
        </div>
      )}

      {/* current step card */}
      {closed || !step ? (
        <div className="rounded-xl border bg-card p-4 text-center space-y-1">
          <CheckCircle2 className="h-6 w-6 text-success mx-auto" />
          <p className="text-sm font-semibold">Flow complete</p>
          <p className="text-xs text-muted-foreground">
            Outcome: {v.outcome ? OUTCOME_LABEL[v.outcome] : "—"}
            {v.nextAction ? ` · Next: ${v.nextAction.text}` : ""}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shrink-0">
              {flow.doneCount + 1}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.why}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Owner: {step.owner} · Due {new Date(step.dueAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Timer className={cn("h-4 w-4 ml-auto shrink-0", now > step.dueAt ? "text-destructive" : "text-muted-foreground")} />
          </div>

          <StepAction visit={v} stepId={step.id} alternatives={alternatives} />
        </div>
      )}

      {/* CX message */}
      {message && (
        <div className="rounded-xl border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Message to send the customer</span>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] ml-auto"
              onClick={() => { navigator.clipboard?.writeText(message); toast.success("Copied"); }}>
              <Copy className="h-3 w-3 mr-1" />Copy
            </Button>
          </div>
          <Textarea value={message} onChange={(e) => setCxDraft(e.target.value)} className="text-xs min-h-24" />
          <Button size="sm" className="h-8 text-xs w-full" onClick={sendCx}>
            <MessageCircle className="h-3.5 w-3.5 mr-1" />Send on WhatsApp <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ───────────────── step-specific inline actions ───────────────── */

function StepAction({
  visit: v,
  stepId,
  alternatives,
}: {
  visit: LiveVisit;
  stepId: FlowStepId;
  alternatives: Array<{ name: string; rent: number; area: string }>;
}) {
  const store = useLiveVisits();
  const [people, setPeople] = useState(1);
  const [accompanied, setAccompanied] = useState<"alone" | "family" | "friend" | "partner">("alone");
  const [rating, setRating] = useState(7);
  const [objection, setObjection] = useState<ObjectionKind | "none">("none");
  const [liked, setLiked] = useState("");
  const [ref, setRef] = useState("");
  const [outcome, setOutcome] = useState<FinalOutcome>("token-pending");
  const [action, setAction] = useState("Follow up call");
  const intervention = buildIntervention(v, alternatives);

  const btn = "h-8 text-xs";

  switch (stepId) {
    case "confirm-customer":
      return (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" className={btn} onClick={() => store.setConfirmation(v.id, "confirmed")}>Customer confirmed</Button>
          <Button size="sm" variant="outline" className={btn} onClick={() => store.setConfirmation(v.id, "not-responding")}>Not responding</Button>
          <Button size="sm" variant="outline" className={btn} onClick={() => store.setConfirmation(v.id, "reschedule-requested")}>Wants reschedule</Button>
        </div>
      );

    case "inventory":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {INVENTORY_CHECK_ITEMS.map((i) => (
              <label key={String(i.key)} className="flex items-center gap-2 text-[11px]">
                <Checkbox checked={!!v.inventory[i.key]} onCheckedChange={() => store.toggleInventory(v.id, i.key)} />
                {i.label}
              </label>
            ))}
          </div>
          <Button size="sm" className={btn} onClick={() => store.confirmAllInventory(v.id)}>Confirm all — bed is sellable</Button>
        </div>
      );

    case "coordinator":
      return <Button size="sm" className={btn} onClick={() => store.confirmCoordinator(v.id)}>{v.coordinator} confirmed for this visit</Button>;

    case "location":
      return <Button size="sm" className={btn} onClick={() => store.shareLocation(v.id)}>Mark location pack shared</Button>;

    case "movement":
      return (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" className={btn} onClick={() => store.setMovement(v.id, "en-route", Date.now() + 25 * 60_000)}>Customer en-route</Button>
          <Button size="sm" variant="outline" className={btn} onClick={() => store.setMovement(v.id, "leaving-shortly")}>Leaving shortly</Button>
          <Button size="sm" variant="outline" className={btn} onClick={() => store.setMovement(v.id, "running-late")}>Running late</Button>
          <Button size="sm" variant="destructive" className={btn} onClick={() => store.setMovement(v.id, "unable-to-come")}>Cannot come</Button>
        </div>
      );

    case "arrival":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} className="h-8 text-xs" />
            <Select value={accompanied} onValueChange={(x) => setAccompanied(x as typeof accompanied)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["alone", "family", "friend", "partner"].map((x) => <SelectItem key={x} value={x} className="text-xs">{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className={btn}
            onClick={() => store.markArrived(v.id, {
              peopleCount: people, accompaniedBy: accompanied,
              entrySuccessful: true, roomReady: true, coordinatorPresent: true,
            })}>
            Customer has arrived
          </Button>
        </div>
      );

    case "start-tour":
      return (
        <Button size="sm" className={btn} onClick={() => {
          store.startTour(v.id);
          glueBus.publish({ type: "team.visit.started", tourId: v.tourId ?? v.id, leadId: v.leadId ?? v.id });
          toast.success("Tour timer started — admin notified");
        }}>
          Start tour timer (notifies admin)
        </Button>
      );

    case "reaction":
      return (
        <div className="space-y-2">
          {intervention && (
            <div className="rounded-lg border bg-background p-2 text-[11px]">
              <p className="font-semibold">{intervention.headline}</p>
              <p className="text-muted-foreground">{intervention.recommendation}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {REACTION_TAGS.map((t) => (
              <Button key={t} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => store.addReaction(v.id, t)}>
                {REACTION_META[t].label}
              </Button>
            ))}
          </div>
        </div>
      );

    case "feedback":
      return (
        <div className="space-y-2">
          <div className="text-[11px] flex items-center gap-2">
            <span className="w-16">Rating</span>
            <Slider value={[rating]} min={0} max={10} step={1} onValueChange={([x]) => setRating(x)} className="flex-1" />
            <span className="font-mono w-8 text-right">{rating}/10</span>
          </div>
          <Select value={objection} onValueChange={(x) => setObjection(x as ObjectionKind | "none")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Objection" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">No objection</SelectItem>
              {(Object.keys(OBJECTION_LABEL) as ObjectionKind[]).map((o) => (
                <SelectItem key={o} value={o} className="text-xs">{OBJECTION_LABEL[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="What they liked" value={liked} onChange={(e) => setLiked(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" className={btn} onClick={() => {
            store.captureFeedback(v.id, {
              attended: true, favouriteProperty: v.propertyName, favouriteRoom: v.roomNo,
              rating, liked, disliked: "", objection: objection === "none" ? null : objection,
              objectionNote: "", decisionMaker: v.decisionMaker, bookable: rating >= 6,
              blocker: objection === "none" ? "" : OBJECTION_LABEL[objection as ObjectionKind],
              probability: rating * 10,
            });
            glueBus.publish({ type: "team.visit.ended", tourId: v.tourId ?? v.id, leadId: v.leadId ?? v.id });
          }}>
            Close tour with feedback
          </Button>
        </div>
      );

    case "quotation":
      return (
        <Button size="sm" className={btn} onClick={() => { store.sendQuotation(v.id, draftQuotation(v)); toast.success("Quotation generated"); }}>
          Generate + send quotation ({inr(v.rent)})
        </Button>
      );

    case "token":
      return (
        <div className="space-y-2">
          {!v.token?.promisedAt && (
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" className={btn} onClick={() => store.acceptQuotation(v.id)}>Customer willing to book</Button>
              <Button size="sm" variant="outline" className={btn} onClick={() => store.startNegotiation(v.id, ["price"], v.leadOwner, 0, "Negotiation opened from flow")}>
                Open negotiation
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input placeholder="Payment reference" value={ref} onChange={(e) => setRef(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" className={btn} disabled={!ref.trim()} onClick={() => store.collectToken(v.id, ref.trim())}>Token received</Button>
          </div>
        </div>
      );

    case "outcome":
      return (
        <div className="space-y-2">
          <Select value={outcome} onValueChange={(x) => setOutcome(x as FinalOutcome)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(OUTCOME_LABEL) as FinalOutcome[]).map((o) => (
                <SelectItem key={o} value={o} className="text-xs">{OUTCOME_LABEL[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={action} onChange={(e) => setAction(e.target.value)} className="h-8 text-xs" placeholder="Next action" />
          <Button size="sm" className={btn} onClick={() => {
            store.setOutcome(v.id, outcome);
            store.setNextAction(v.id, { text: action, owner: v.leadOwner, dueAt: Date.now() + 2 * 3600_000 });
            toast.success("Visit documented");
          }}>
            Lock outcome + next action
          </Button>
        </div>
      );

    default:
      return null;
  }
}
