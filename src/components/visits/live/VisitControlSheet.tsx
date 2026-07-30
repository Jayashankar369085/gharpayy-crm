import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Phone, MessageCircle, MapPin, CheckCircle2, AlertTriangle, FileText, Handshake,
  Wallet, Flag, Shield, Clock,
} from "lucide-react";
import {
  type LiveVisit,
  type ReactionTag,
  type ObjectionKind,
  type NegotiationTopic,
  type FinalOutcome,
  type LostReasonKind,
  INVENTORY_CHECK_ITEMS,
  READINESS_ITEMS,
  REACTION_META,
  OBJECTION_LABEL,
  NEGOTIATION_TOPICS,
  OUTCOME_LABEL,
  LOST_REASON_LABEL,
  STAGE_LABEL,
  inr,
  fmtDur,
} from "@/lib/visits/live-types";
import {
  buildIntervention,
  checkpointsFor,
  auditRules,
  draftQuotation,
  bookingProbability,
  priorityFor,
  TIER_LABEL,
} from "@/lib/visits/live-engine";
import { useLiveVisits } from "@/lib/visits/live-store";

const REACTION_TAGS = Object.keys(REACTION_META) as ReactionTag[];

export function VisitControlSheet({
  visit: v,
  now,
  alternatives,
  coordinators,
  onClose,
}: {
  visit: LiveVisit | null;
  now: number;
  alternatives: Array<{ name: string; rent: number; area: string }>;
  coordinators: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const store = useLiveVisits();
  if (!v) return null;

  return (
    <Sheet open={!!v} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 text-base">
            {v.customer}
            <Badge variant="outline" className="text-[10px]">{STAGE_LABEL[v.stage]}</Badge>
            <Badge variant="outline" className="text-[10px]">{bookingProbability(v)}% likely</Badge>
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {v.propertyName} · {v.propertyArea} · Room {v.roomNo || "TBD"}{v.bedNo ? `/${v.bedNo}` : ""} · {inr(v.rent)} ·
            budget {inr(v.budget)} · owner {v.leadOwner} · coordinator {v.coordinator}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {TIER_LABEL[priorityFor(v, now).tier]} — {priorityFor(v, now).reasons.join(" · ")}
          </p>
        </SheetHeader>

        <div className="flex flex-wrap gap-1.5 py-3">
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <a href={`tel:${v.phone}`}><Phone className="h-3 w-3 mr-1" />Call customer</a>
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <a href={`https://wa.me/${v.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-3 w-3 mr-1" />WhatsApp
            </a>
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { store.shareLocation(v.id); toast.success("Location pack sent"); }}>
            <MapPin className="h-3 w-3 mr-1" />Send location
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => store.logComms(v.id, `Coordinator ${v.coordinator} called`)}>
            Call coordinator
          </Button>
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid grid-cols-6 h-8">
            <TabsTrigger value="live" className="text-[11px]">Live</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[11px]">T-60</TabsTrigger>
            <TabsTrigger value="tour" className="text-[11px]">Tour</TabsTrigger>
            <TabsTrigger value="close" className="text-[11px]">Close</TabsTrigger>
            <TabsTrigger value="rules" className="text-[11px]">Rules</TabsTrigger>
            <TabsTrigger value="log" className="text-[11px]">Log</TabsTrigger>
          </TabsList>

          {/* ─────────── LIVE ─────────── */}
          <TabsContent value="live" className="space-y-4 pt-3">
            <Section title="Confirmation & movement">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Customer confirmation">
                  <Select value={v.confirmation} onValueChange={(x) => store.setConfirmation(v.id, x as LiveVisit["confirmation"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["pending", "confirmed", "reschedule-requested", "cancelled", "not-responding"].map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s.replace(/-/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Movement (T−30)">
                  <Select value={v.movement} onValueChange={(x) => store.setMovement(v.id, x as LiveVisit["movement"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["unknown", "en-route", "leaving-shortly", "running-late", "unable-to-come", "not-responding"].map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s.replace(/-/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={v.coordinatorConfirmed ? "secondary" : "outline"} className="h-7 text-xs" onClick={() => store.confirmCoordinator(v.id)}>
                  {v.coordinatorConfirmed ? "Coordinator confirmed" : "Confirm coordinator"}
                </Button>
                <Select onValueChange={(id) => {
                  const c = coordinators.find((x) => x.id === id);
                  if (c) { store.reassignCoordinator(v.id, c.id, c.name); toast.success(`Backup coordinator ${c.name} assigned`); }
                }}>
                  <SelectTrigger className="h-7 text-xs w-44"><SelectValue placeholder="Change coordinator" /></SelectTrigger>
                  <SelectContent>
                    {coordinators.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant={v.bedAvailable ? "outline" : "destructive"} className="h-7 text-xs" onClick={() => store.setBedAvailable(v.id, !v.bedAvailable)}>
                  {v.bedAvailable ? "Flag bed unavailable" : "Restore bed availability"}
                </Button>
              </div>
            </Section>

            <Section title="T−120 inventory confirmation (Supply Controller)">
              <div className="grid grid-cols-2 gap-1">
                {INVENTORY_CHECK_ITEMS.map((item) => (
                  <label key={String(item.key)} className="flex items-center gap-2 text-xs py-0.5">
                    <Checkbox checked={!!v.inventory[item.key]} onCheckedChange={() => store.toggleInventory(v.id, item.key)} />
                    {item.label}
                  </label>
                ))}
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { store.confirmAllInventory(v.id); toast.success("Inventory confirmed"); }}>
                <CheckCircle2 className="h-3 w-3 mr-1" />Confirm all
              </Button>
            </Section>

            <Section title="T−10 property readiness (Tour Coordinator)">
              <div className="grid grid-cols-2 gap-1">
                {READINESS_ITEMS.map((item) => (
                  <label key={String(item.key)} className="flex items-center gap-2 text-xs py-0.5">
                    <Checkbox checked={!!v.readiness[item.key]} onCheckedChange={() => store.toggleReadiness(v.id, item.key)} />
                    {item.label}
                  </label>
                ))}
              </div>
            </Section>

            <ArrivalBlock visit={v} />
            <SchedulingBlock visit={v} />
          </TabsContent>

          {/* ─────────── TIMELINE ─────────── */}
          <TabsContent value="timeline" className="space-y-2 pt-3">
            {checkpointsFor(v, now).map((c) => (
              <div key={c.key} className={cn("rounded-lg border p-2.5", c.done ? "border-success/40 bg-success/5" : "border-border")}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{c.label}</span>
                  <Badge variant="outline" className={cn("text-[9px]", c.done ? "text-success border-success/40" : "text-muted-foreground")}>
                    {c.done ? "DONE" : "PENDING"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{c.detail}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Owner: {c.owner}</p>
              </div>
            ))}
          </TabsContent>

          {/* ─────────── TOUR ─────────── */}
          <TabsContent value="tour" className="space-y-4 pt-3">
            <Section title="Live reactions (tap as it happens)">
              <div className="flex flex-wrap gap-1.5">
                {REACTION_TAGS.map((tag) => {
                  const meta = REACTION_META[tag];
                  return (
                    <Button
                      key={tag}
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-7 text-[11px]",
                        meta.tone === "positive" && "border-success/40 text-success",
                        meta.tone === "negative" && "border-destructive/40 text-destructive",
                      )}
                      onClick={() => { store.addReaction(v.id, tag); toast.info(`Logged: ${meta.label}`); }}
                    >
                      {meta.label}
                    </Button>
                  );
                })}
              </div>
              {v.tourStartedAt && (
                <p className="text-[11px] text-muted-foreground">Tour running {fmtDur(now - v.tourStartedAt)} · {v.reactions.length} reactions logged</p>
              )}
              <div className="space-y-1">
                {v.reactions.slice(0, 6).map((r) => (
                  <div key={r.id} className="text-[11px] text-muted-foreground">
                    · {REACTION_META[r.tag].label} — {new Date(r.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                ))}
              </div>
            </Section>

            <InterventionBlock visit={v} alternatives={alternatives} />
            <FeedbackBlock visit={v} />
          </TabsContent>

          {/* ─────────── CLOSE ─────────── */}
          <TabsContent value="close" className="space-y-4 pt-3">
            <QuotationBlock visit={v} />
            <NegotiationBlock visit={v} />
            <TokenBlock visit={v} />
            <OutcomeBlock visit={v} />
          </TabsContent>

          {/* ─────────── RULES ─────────── */}
          <TabsContent value="rules" className="space-y-2 pt-3">
            {auditRules(v, now).length === 0 ? (
              <div className="rounded-lg border border-success/40 bg-success/5 p-3 text-xs text-success flex items-center gap-2">
                <Shield className="h-4 w-4" /> All non-negotiable visit rules satisfied.
              </div>
            ) : (
              auditRules(v, now).map((r, i) => (
                <div key={i} className="rounded-lg border border-destructive/40 bg-destructive/5 p-2.5">
                  <div className="text-xs font-medium text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />{r.rule}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{r.detail}</p>
                </div>
              ))
            )}
          </TabsContent>

          {/* ─────────── LOG ─────────── */}
          <TabsContent value="log" className="space-y-2 pt-3">
            <NoteComposer visit={v} />
            <Separator />
            {v.timeline.map((t) => (
              <div key={t.id} className="text-[11px] flex gap-2">
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {new Date(t.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-muted-foreground shrink-0">{t.by}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────────────── sub-blocks ───────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10.5px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ArrivalBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [people, setPeople] = useState(1);
  const [withWhom, setWithWhom] = useState<"alone" | "family" | "friend" | "partner">("alone");
  const [issue, setIssue] = useState("");
  if (v.arrival) {
    return (
      <Section title="Arrival">
        <div className="rounded-lg border border-success/40 bg-success/5 p-2.5 text-xs">
          Arrived {new Date(v.arrival.arrivedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ·
          {" "}{v.arrival.peopleCount} people · {v.arrival.accompaniedBy}
          {v.arrival.issue ? ` · issue: ${v.arrival.issue}` : ""}
        </div>
        {!v.tourStartedAt && (
          <Button size="sm" className="h-7 text-xs" onClick={() => store.startTour(v.id)}>Start tour (T+10)</Button>
        )}
      </Section>
    );
  }
  return (
    <Section title="T+0 arrival capture">
      <div className="grid grid-cols-2 gap-2">
        <Field label="People visiting">
          <Input type="number" min={1} value={people} onChange={(e) => setPeople(Number(e.target.value))} className="h-8 text-xs" />
        </Field>
        <Field label="Accompanied by">
          <Select value={withWhom} onValueChange={(x) => setWithWhom(x as typeof withWhom)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["alone", "family", "friend", "partner"].map((x) => <SelectItem key={x} value={x} className="text-xs">{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Input placeholder="Any immediate issue?" value={issue} onChange={(e) => setIssue(e.target.value)} className="h-8 text-xs" />
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            store.markArrived(v.id, {
              peopleCount: people, accompaniedBy: withWhom, entrySuccessful: true,
              roomReady: v.readiness.roomUnlocked, coordinatorPresent: v.readiness.coordinatorPresent,
              issue: issue || undefined,
            });
            toast.success(`Lead owner ${v.leadOwner} notified: customer arrived at ${v.propertyName}`);
          }}
        >
          Mark arrived
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => store.setOutcome(v.id, "no-show", { note: "Customer did not show" })}>
          Mark no-show
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { store.shareLocation(v.id); store.logComms(v.id, "Location assistance provided — coordinator calling"); }}>
          Location assistance
        </Button>
      </div>
    </Section>
  );
}

function SchedulingBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [when, setWhen] = useState("");
  const [reason, setReason] = useState("");
  return (
    <Section title="Reschedule / cancel">
      <div className="grid grid-cols-2 gap-2">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-8 text-xs" />
        <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="flex gap-1.5">
        <Button
          size="sm" variant="outline" className="h-7 text-xs"
          disabled={!when || !reason}
          onClick={() => { store.reschedule(v.id, +new Date(when), reason); toast.success("Visit rescheduled"); }}
        >
          Reschedule
        </Button>
        <Button
          size="sm" variant="outline" className="h-7 text-xs text-destructive"
          disabled={!reason}
          onClick={() => { store.cancelVisit(v.id, reason); toast.error("Visit cancelled with reason"); }}
        >
          Cancel visit
        </Button>
      </div>
    </Section>
  );
}

function InterventionBlock({ visit: v, alternatives }: { visit: LiveVisit; alternatives: Array<{ name: string; rent: number; area: string }> }) {
  const store = useLiveVisits();
  const iv = useMemo(() => buildIntervention(v, alternatives), [v, alternatives]);
  if (!iv) return null;
  return (
    <div className="rounded-xl border border-warning/50 bg-warning/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-warning-foreground">
        <AlertTriangle className="h-4 w-4" />{iv.headline} — live closing intervention
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
        {iv.lines.map((l) => (
          <div key={l.label} className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">{l.label}</span>
            <span className="font-medium">{l.value}</span>
          </div>
        ))}
      </div>
      <div className="text-[11px] font-medium">Recommended action: {iv.recommendation}</div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" className="h-7 text-xs" asChild>
          <a href={`tel:${v.phone}`}><Phone className="h-3 w-3 mr-1" />Call customer</a>
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
          const d = draftQuotation(v);
          store.sendQuotation(v.id, { ...d, rent: Math.max(v.budget, d.rent - iv.availableDiscount) });
          toast.success("Revised quotation sent");
        }}>
          <FileText className="h-3 w-3 mr-1" />Send revised quotation
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
          store.setAlternateProperty(v.id, iv.alternative ?? "Alternative to be sourced");
          store.setOutcome(v.id, "alternative-scheduled", { note: iv.alternative });
          toast.info("Alternative offered");
        }}>
          Offer alternative
        </Button>
      </div>
    </div>
  );
}

function FeedbackBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [rating, setRating] = useState(v.feedback?.rating ?? 7);
  const [fav, setFav] = useState(v.feedback?.favouriteProperty ?? v.propertyName);
  const [room, setRoom] = useState(v.feedback?.favouriteRoom ?? v.roomNo);
  const [liked, setLiked] = useState(v.feedback?.liked ?? "");
  const [disliked, setDisliked] = useState(v.feedback?.disliked ?? "");
  const [objection, setObjection] = useState<ObjectionKind | "none">(v.feedback?.objection ?? "none");
  const [note, setNote] = useState(v.feedback?.objectionNote ?? "");
  const [dm, setDm] = useState(v.feedback?.decisionMaker ?? v.decisionMaker);
  const [blocker, setBlocker] = useState(v.feedback?.blocker ?? "");

  const ratingBand =
    rating >= 9 ? "9–10 · Booking ready — send quotation + payment link, call within 10 minutes"
    : rating >= 7 ? "7–8 · Negotiation ready — resolve the single objection"
    : rating >= 5 ? "5–6 · Alternative required — stop selling this property"
    : "0–4 · Incorrect match — audit location, budget, date, inventory qualification";

  return (
    <Section title="T+20 preference capture (mandatory)">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Favourite property"><Input value={fav} onChange={(e) => setFav(e.target.value)} className="h-8 text-xs" /></Field>
        <Field label="Favourite room / bed"><Input value={room} onChange={(e) => setRoom(e.target.value)} className="h-8 text-xs" /></Field>
      </div>
      <Field label={`Customer rating: ${rating}/10`}>
        <Slider value={[rating]} min={0} max={10} step={1} onValueChange={([x]) => setRating(x)} />
      </Field>
      <p className="text-[11px] text-muted-foreground">{ratingBand}</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="What they liked"><Input value={liked} onChange={(e) => setLiked(e.target.value)} className="h-8 text-xs" /></Field>
        <Field label="What they disliked"><Input value={disliked} onChange={(e) => setDisliked(e.target.value)} className="h-8 text-xs" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Main objection">
          <Select value={objection} onValueChange={(x) => setObjection(x as ObjectionKind | "none")}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {(Object.keys(OBJECTION_LABEL) as ObjectionKind[]).map((o) => (
                <SelectItem key={o} value={o} className="text-xs">{OBJECTION_LABEL[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Final decision-maker"><Input value={dm} onChange={(e) => setDm(e.target.value)} className="h-8 text-xs" /></Field>
      </div>
      <Field label="What is stopping the booking?"><Input value={blocker} onChange={(e) => setBlocker(e.target.value)} className="h-8 text-xs" /></Field>
      <Textarea placeholder="Objection detail / customer's exact words" value={note} onChange={(e) => setNote(e.target.value)} className="text-xs min-h-[60px]" />
      <Button
        size="sm" className="h-7 text-xs"
        disabled={!fav || !room || !blocker}
        onClick={() => {
          store.captureFeedback(v.id, {
            attended: true, favouriteProperty: fav, favouriteRoom: room, rating,
            liked, disliked, objection: objection === "none" ? null : objection,
            objectionNote: note, decisionMaker: dm, bookable: rating >= 7,
            blocker, probability: rating * 10,
          });
          toast.success(rating >= 7 ? "Feedback captured — quotation now mandatory" : "Feedback captured — alternative required");
        }}
      >
        Capture feedback
      </Button>
    </Section>
  );
}

function QuotationBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [q, setQ] = useState(() => draftQuotation(v));
  const total = q.rent + q.maintenance + q.gharpayyFee;

  if (v.quotation?.sentAt) {
    return (
      <Section title="Quotation">
        <div className="rounded-lg border border-info/40 bg-info/5 p-3 text-xs space-y-1">
          <div className="font-medium">{v.quotation.propertyName} · Room {v.quotation.roomNo}/{v.quotation.bedNo}</div>
          <Row label="Rent" value={inr(v.quotation.rent)} />
          <Row label="Deposit" value={inr(v.quotation.deposit)} />
          <Row label="Maintenance" value={inr(v.quotation.maintenance)} />
          <Row label="Gharpayy fee" value={inr(v.quotation.gharpayyFee)} />
          <Row label="Check-in" value={v.quotation.checkInDate} />
          <Row label="Lock-in / notice" value={`${v.quotation.lockInMonths} months / ${v.quotation.noticeDays} days`} />
          <Row label="Token" value={inr(v.quotation.tokenAmount)} />
          <Row label="Offer expires" value={new Date(v.quotation.expiresAt).toLocaleString("en-IN")} />
        </div>
        {!v.quotation.acceptedAt ? (
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" onClick={() => { store.acceptQuotation(v.id); toast.success("Customer willing to book — token pending"); }}>
              Customer willing to book
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => store.setStage(v.id, "negotiation")}>
              Move to negotiation
            </Button>
          </div>
        ) : (
          <p className="text-[11px] text-success">Accepted — token conversation started.</p>
        )}
      </Section>
    );
  }

  return (
    <Section title="T+30 quotation">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Room"><Input value={q.roomNo} onChange={(e) => setQ({ ...q, roomNo: e.target.value })} className="h-8 text-xs" /></Field>
        <Field label="Bed"><Input value={q.bedNo} onChange={(e) => setQ({ ...q, bedNo: e.target.value })} className="h-8 text-xs" /></Field>
        <Field label="Rent"><Input type="number" value={q.rent} onChange={(e) => setQ({ ...q, rent: Number(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label="Deposit"><Input type="number" value={q.deposit} onChange={(e) => setQ({ ...q, deposit: Number(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label="Maintenance"><Input type="number" value={q.maintenance} onChange={(e) => setQ({ ...q, maintenance: Number(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label="Gharpayy fee"><Input type="number" value={q.gharpayyFee} onChange={(e) => setQ({ ...q, gharpayyFee: Number(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label="Check-in date"><Input type="date" value={q.checkInDate?.slice(0, 10)} onChange={(e) => setQ({ ...q, checkInDate: e.target.value })} className="h-8 text-xs" /></Field>
        <Field label="Token amount"><Input type="number" value={q.tokenAmount} onChange={(e) => setQ({ ...q, tokenAmount: Number(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label="Lock-in (months)"><Input type="number" value={q.lockInMonths} onChange={(e) => setQ({ ...q, lockInMonths: Number(e.target.value) })} className="h-8 text-xs" /></Field>
        <Field label="Notice (days)"><Input type="number" value={q.noticeDays} onChange={(e) => setQ({ ...q, noticeDays: Number(e.target.value) })} className="h-8 text-xs" /></Field>
      </div>
      <p className="text-[11px] text-muted-foreground">Move-in total: {inr(total + q.deposit)} · monthly {inr(q.rent + q.maintenance)}</p>
      <Button size="sm" className="h-7 text-xs" onClick={() => { store.sendQuotation(v.id, q); toast.success("Quotation sent"); }}>
        <FileText className="h-3 w-3 mr-1" />Send quotation
      </Button>
    </Section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function NegotiationBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [topics, setTopics] = useState<NegotiationTopic[]>(v.negotiation?.topics ?? []);
  const [discount, setDiscount] = useState(v.negotiation?.offeredDiscount ?? 0);
  const [note, setNote] = useState(v.negotiation?.note ?? "");
  return (
    <Section title="T+45 negotiation (Lead Owner)">
      <div className="flex flex-wrap gap-1">
        {NEGOTIATION_TOPICS.map((t) => (
          <Button
            key={t.key} size="sm" variant={topics.includes(t.key) ? "secondary" : "outline"} className="h-6 text-[10.5px]"
            onClick={() => setTopics((s) => (s.includes(t.key) ? s.filter((x) => x !== t.key) : [...s, t.key]))}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Discount offered (₹)"><Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-8 text-xs" /></Field>
        <Field label="Owner"><Input value={v.leadOwner} readOnly className="h-8 text-xs" /></Field>
      </div>
      <Textarea placeholder="Negotiation note" value={note} onChange={(e) => setNote(e.target.value)} className="text-xs min-h-[56px]" />
      <Button size="sm" className="h-7 text-xs" disabled={!topics.length} onClick={() => { store.startNegotiation(v.id, topics, v.leadOwner, discount, note); toast.success("Negotiation logged"); }}>
        <Handshake className="h-3 w-3 mr-1" />Log negotiation
      </Button>
    </Section>
  );
}

function TokenBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [ref, setRef] = useState("");
  const [amount, setAmount] = useState(v.token?.amount ?? v.quotation?.tokenAmount ?? 2000);
  return (
    <Section title="Token">
      {v.token?.paidAt ? (
        <div className="rounded-lg border border-success/40 bg-success/5 p-2.5 text-xs text-success">
          Token {inr(v.token.amount)} received · ref {v.token.reference} · booking confirmed
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Token amount"><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-8 text-xs" /></Field>
            <Field label="Payment reference"><Input value={ref} onChange={(e) => setRef(e.target.value)} className="h-8 text-xs" /></Field>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { store.promiseToken(v.id, amount); toast.info("Token promised — hold timer running"); }}>
              <Clock className="h-3 w-3 mr-1" />Mark token promised
            </Button>
            <Button size="sm" className="h-7 text-xs" disabled={!ref} onClick={() => { store.collectToken(v.id, ref); toast.success("Token collected — BOOKED"); }}>
              <Wallet className="h-3 w-3 mr-1" />Collect token & book
            </Button>
          </div>
        </>
      )}
    </Section>
  );
}

function OutcomeBlock({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [outcome, setOutcome] = useState<FinalOutcome>(v.outcome ?? "follow-up-scheduled");
  const [lostReason, setLostReason] = useState<LostReasonKind>("budget");
  const [note, setNote] = useState(v.lostNote ?? "");
  const [action, setAction] = useState(v.nextAction?.text ?? "");
  const [owner, setOwner] = useState(v.nextAction?.owner ?? v.leadOwner);
  const [due, setDue] = useState("");
  return (
    <Section title="T+60 final outcome + next action (mandatory)">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Outcome">
          <Select value={outcome} onValueChange={(x) => setOutcome(x as FinalOutcome)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(OUTCOME_LABEL) as FinalOutcome[]).map((o) => (
                <SelectItem key={o} value={o} className="text-xs">{OUTCOME_LABEL[o]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {(outcome === "lost" || outcome === "not-looking") && (
          <Field label="Lost reason">
            <Select value={lostReason} onValueChange={(x) => setLostReason(x as LostReasonKind)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LOST_REASON_LABEL) as LostReasonKind[]).map((o) => (
                  <SelectItem key={o} value={o} className="text-xs">{LOST_REASON_LABEL[o]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>
      <Input placeholder="Reason / context (required for loss)" value={note} onChange={(e) => setNote(e.target.value)} className="h-8 text-xs" />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Next action"><Input value={action} onChange={(e) => setAction(e.target.value)} className="h-8 text-xs" /></Field>
        <Field label="Owner"><Input value={owner} onChange={(e) => setOwner(e.target.value)} className="h-8 text-xs" /></Field>
        <Field label="Deadline"><Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-8 text-xs" /></Field>
      </div>
      <Button
        size="sm" className="h-7 text-xs"
        disabled={!action || !due || ((outcome === "lost" || outcome === "not-looking") && !note)}
        onClick={() => {
          store.setNextAction(v.id, { text: action, owner, dueAt: +new Date(due) });
          store.setOutcome(v.id, outcome, { lostReason: outcome === "lost" || outcome === "not-looking" ? lostReason : undefined, note });
          toast.success(`Outcome recorded: ${OUTCOME_LABEL[outcome]}`);
        }}
      >
        <Flag className="h-3 w-3 mr-1" />Close out visit
      </Button>
    </Section>
  );
}

function NoteComposer({ visit: v }: { visit: LiveVisit }) {
  const store = useLiveVisits();
  const [text, setText] = useState("");
  return (
    <div className="flex gap-1.5">
      <Input placeholder="Controller note…" value={text} onChange={(e) => setText(e.target.value)} className="h-8 text-xs" />
      <Button size="sm" className="h-8 text-xs" disabled={!text} onClick={() => { store.addNote(v.id, text); setText(""); }}>Add</Button>
    </div>
  );
}
