import {
  type LiveVisit,
  type LiveAlert,
  type AlertKind,
  type ObjectionKind,
  type Quotation,
  STAGE_SLA_MIN,
  STAGE_LABEL,
  REACTION_META,
  OBJECTION_LABEL,
  inventoryConfirmed,
  readinessConfirmed,
  columnFor,
  inr,
} from "./live-types";

/* ────────────────────── Booking probability ────────────────────── */

export function bookingProbability(v: LiveVisit): number {
  if (v.stage === "booked") return 100;
  if (v.stage === "lost") return 0;
  let p = 20;
  if (v.confirmation === "confirmed") p += 5;
  if (v.stage === "en-route") p += 5;
  if (v.stage === "arrived") p += 10;
  if (v.stage === "tour-live") p += 15;
  const pos = v.reactions.filter((r) => REACTION_META[r.tag].tone === "positive").length;
  const neg = v.reactions.filter((r) => REACTION_META[r.tag].tone === "negative").length;
  p += Math.min(20, pos * 7) - Math.min(25, neg * 6);
  if (v.feedback) p = Math.round(p * 0.35 + v.feedback.rating * 10 * 0.65);
  if (v.quotation?.sentAt) p += 8;
  if (v.quotation?.acceptedAt) p += 15;
  if (v.token?.promisedAt) p += 10;
  if (v.outcome === "family-approval-pending") p -= 5;
  return Math.max(2, Math.min(98, Math.round(p)));
}

/* ────────────────────── SLA / stuck detection ────────────────────── */

export function stageAgeMs(v: LiveVisit, now: number): number {
  return Math.max(0, now - v.stageSince);
}

export function isStageBreached(v: LiveVisit, now: number): boolean {
  const sla = STAGE_SLA_MIN[v.stage];
  if (!sla) return false;
  return stageAgeMs(v, now) > sla * 60_000;
}

export function minutesLate(v: LiveVisit, now: number): number {
  if (v.arrival) return 0;
  return Math.floor((now - v.scheduledAt) / 60_000);
}

/* ────────────────────── Priority engine ────────────────────── */

export type PriorityTier = "close-now" | "at-risk" | "follow-up" | "normal" | "done";

export interface Priority {
  tier: PriorityTier;
  score: number;
  reasons: string[];
}

export const TIER_LABEL: Record<PriorityTier, string> = {
  "close-now": "PRIORITY 1 · CLOSE NOW",
  "at-risk": "PRIORITY 2 · AT RISK",
  "follow-up": "PRIORITY 3 · FOLLOW-UP",
  normal: "ON TRACK",
  done: "CLOSED",
};

export function priorityFor(v: LiveVisit, now: number): Priority {
  const reasons: string[] = [];
  if (v.stage === "booked" || v.stage === "lost") {
    return { tier: "done", score: 0, reasons: [v.outcome ? `Outcome: ${v.outcome}` : "Closed"] };
  }

  // ── Priority 1: Close now
  const insideProperty = v.stage === "arrived" || v.stage === "tour-live";
  const rating = v.feedback?.rating ?? 0;
  const unresolvedObjections = countObjections(v);
  const closeNow =
    (insideProperty && rating >= 8) ||
    (insideProperty && v.reactions.some((r) => r.tag === "ready-to-book")) ||
    (rating >= 8 && unresolvedObjections <= 1 && v.bedAvailable);
  if (closeNow) {
    if (insideProperty) reasons.push("Customer is inside the property");
    if (rating >= 8) reasons.push(`Rated ${rating}/10`);
    if (v.feedback?.favouriteRoom) reasons.push(`Selected room ${v.feedback.favouriteRoom}`);
    if (unresolvedObjections <= 1) reasons.push(`${unresolvedObjections} objection remaining`);
    if (v.bedAvailable) reasons.push("Room currently available");
    return { tier: "close-now", score: 1000 + rating * 10 + bookingProbability(v), reasons };
  }

  // ── Priority 2: At risk
  const late = minutesLate(v, now);
  const preTour = ["scheduled", "customer-confirmed", "inventory-confirmed", "en-route"].includes(v.stage);
  if (preTour && late > 15) reasons.push(`Customer ${late} min late`);
  if (!v.coordinatorConfirmed && v.scheduledAt - now < 60 * 60_000 && preTour) reasons.push("Coordinator not confirmed");
  if (!v.bedAvailable) reasons.push("Selected room became unavailable");
  if (v.movement === "not-responding" || v.confirmation === "not-responding") reasons.push("Customer not responding");
  if (v.reactions.some((r) => r.tag === "alternative-required")) reasons.push("Customer needs an alternative");
  if (v.stage === "feedback" && !v.quotation) reasons.push("Quotation not sent after positive tour");
  if (now - v.updatedAt > 15 * 60_000 && v.stage !== "scheduled") reasons.push("No action for 15+ minutes");
  if (isStageBreached(v, now)) reasons.push(`Stuck in ${STAGE_LABEL[v.stage]} beyond SLA`);
  if (reasons.length) {
    return { tier: "at-risk", score: 600 + reasons.length * 20 + Math.max(0, late), reasons };
  }

  // ── Priority 3: Follow-up required
  if (
    v.completedAt ||
    v.outcome === "family-approval-pending" ||
    v.outcome === "follow-up-scheduled" ||
    v.stage === "token-pending" ||
    v.stage === "alternative"
  ) {
    if (v.outcome === "family-approval-pending") reasons.push("Family approval pending");
    if (v.stage === "token-pending" && !v.token?.paidAt) reasons.push("Token promised but unpaid");
    if (v.reactions.some((r) => r.tag === "comparing-property")) reasons.push("Comparing other options");
    if (!v.nextAction) reasons.push("No next action assigned");
    return { tier: "follow-up", score: 300 + (v.nextAction ? 0 : 50), reasons: reasons.length ? reasons : ["Tour completed — needs next step"] };
  }

  const mins = Math.round((v.scheduledAt - now) / 60_000);
  return {
    tier: "normal",
    score: 100 - Math.min(99, Math.abs(mins)),
    reasons: [mins >= 0 ? `Visit in ${mins} min` : `Started ${Math.abs(mins)} min ago`],
  };
}

export function countObjections(v: LiveVisit): number {
  const set = new Set<ObjectionKind>();
  v.reactions.forEach((r) => {
    const o = REACTION_META[r.tag].objection;
    if (o) set.add(o);
  });
  if (v.feedback?.objection) set.add(v.feedback.objection);
  return set.size;
}

export function primaryObjection(v: LiveVisit): ObjectionKind | null {
  if (v.feedback?.objection) return v.feedback.objection;
  const last = v.reactions.find((r) => REACTION_META[r.tag].objection);
  return last ? REACTION_META[last.tag].objection! : null;
}

/* ────────────────────── Live closing intervention ────────────────────── */

export interface Intervention {
  objection: ObjectionKind;
  headline: string;
  lines: Array<{ label: string; value: string }>;
  recommendation: string;
  alternative?: string;
  availableDiscount: number;
  gap: number;
}

export function buildIntervention(
  v: LiveVisit,
  alternatives: Array<{ name: string; rent: number; area: string }>,
): Intervention | null {
  const objection = primaryObjection(v);
  if (!objection) return null;
  const gap = Math.max(0, v.rent - v.budget);
  const availableDiscount = Math.min(gap, Math.round(v.rent * 0.05 / 100) * 100 || 500);
  const cheaper = alternatives
    .filter((a) => a.name !== v.propertyName && a.rent <= v.budget + 500)
    .sort((a, b) => Math.abs(a.rent - v.budget) - Math.abs(b.rent - v.budget))[0];

  const base: Intervention = {
    objection,
    headline: `Objection: ${OBJECTION_LABEL[objection]}`,
    lines: [],
    recommendation: "Call customer now",
    alternative: cheaper ? `${cheaper.name} at ${inr(cheaper.rent)}` : undefined,
    availableDiscount,
    gap,
  };

  switch (objection) {
    case "price":
      base.lines = [
        { label: "Customer budget", value: inr(v.budget) },
        { label: "Property price", value: inr(v.rent) },
        { label: "Gap", value: inr(gap) },
        { label: "Available discount", value: inr(availableDiscount) },
        { label: "Alternative option", value: base.alternative ?? "None within budget" },
      ];
      base.recommendation = gap <= availableDiscount ? "Approve discount and close on the spot" : "Call customer now — offer structure + alternative";
      break;
    case "distance":
      base.lines = [
        { label: "Property area", value: v.propertyArea },
        { label: "Customer location", value: v.currentLocation },
        { label: "Proof to send", value: "Commute time screenshot + transport options" },
        { label: "Alternative option", value: base.alternative ?? "Closer option to be sourced" },
      ];
      base.recommendation = "Send commute proof, then call";
      break;
    case "family":
      base.lines = [
        { label: "Decision maker", value: v.decisionMaker },
        { label: "Pack to send", value: "Room video, photos, safety, food, pricing, rules, location, payment terms" },
        { label: "Deadline rule", value: "Family approval cannot exist without a decision-call time" },
      ];
      base.recommendation = "Send family decision pack and lock the decision call";
      break;
    case "room":
      base.lines = [
        { label: "Shown room", value: v.roomNo || "—" },
        { label: "Action", value: "Show another room in the same property first" },
        { label: "Alternative option", value: base.alternative ?? "One alternate property" },
      ];
      base.recommendation = "Show backup room before offering another property";
      break;
    case "comparison":
      base.lines = [
        { label: "Rule", value: "Show only one highly relevant alternative" },
        { label: "Capture", value: "What exactly is missing here?" },
        { label: "Alternative option", value: base.alternative ?? "Pending supply match" },
      ];
      base.recommendation = "Capture the missing attribute and schedule ONE alternative";
      break;
    default:
      base.lines = [
        { label: "Objection", value: OBJECTION_LABEL[objection] },
        { label: "Rent", value: inr(v.rent) },
        { label: "Budget", value: inr(v.budget) },
        { label: "Alternative option", value: base.alternative ?? "None yet" },
      ];
  }
  return base;
}

/* ────────────────────── 60-minute closing timeline ────────────────────── */

export interface Checkpoint {
  key: string;
  label: string;
  offsetMin: number; // negative = before scheduled time
  owner: string;
  done: boolean;
  detail: string;
}

export function checkpointsFor(v: LiveVisit, now: number): Checkpoint[] {
  const start = v.tourStartedAt ?? v.scheduledAt;
  return [
    {
      key: "t-120",
      label: "T−120 · Inventory confirmation",
      offsetMin: -120,
      owner: "Supply Controller",
      done: inventoryConfirmed(v.inventory),
      detail: "Room vacant, bed available, cleaned, manager informed, price + discount authority, backup room",
    },
    {
      key: "t-60",
      label: "T−60 · Customer confirmation",
      offsetMin: -60,
      owner: "Lead Owner",
      done: v.confirmation === "confirmed",
      detail: "Time, location, landmark, coordinator, room type, rent range, travel reminder shared",
    },
    {
      key: "t-30",
      label: "T−30 · Movement check",
      offsetMin: -30,
      owner: "Visit Controller",
      done: v.movement !== "unknown",
      detail: "En route / leaving shortly / running late / unable to come / not responding",
    },
    {
      key: "t-10",
      label: "T−10 · Property readiness",
      offsetMin: -10,
      owner: "Tour Coordinator",
      done: readinessConfirmed(v.readiness),
      detail: "Coordinator present, room unlocked, bed available, manager informed, backup ready",
    },
    { key: "t0", label: "T+0 · Arrival", offsetMin: 0, owner: "Tour Coordinator", done: !!v.arrival, detail: "Arrived / delayed / no-show / location assistance" },
    { key: "t10", label: "T+10 · Tour started", offsetMin: 10, owner: "Tour Coordinator", done: !!v.tourStartedAt, detail: "Live visit timer begins" },
    { key: "t20", label: "T+20 · Preference capture", offsetMin: 20, owner: "Tour Coordinator", done: !!v.feedback, detail: "Favourite property/room, rating, objection, booking probability" },
    { key: "t30", label: "T+30 · Quotation", offsetMin: 30, owner: "Lead Owner", done: !!v.quotation?.sentAt, detail: "Rent, deposit, maintenance, fee, check-in, lock-in, notice, token, expiry" },
    { key: "t45", label: "T+45 · Negotiation", offsetMin: 45, owner: "Lead Owner", done: !!v.negotiation || !!v.token?.paidAt, detail: "Price, deposit, timing, family, comparison, distance, facilities, availability" },
    { key: "t60", label: "T+60 · Final outcome", offsetMin: 60, owner: "Visit Controller", done: !!v.outcome, detail: "Booked / token / family / negotiation / alternative / follow-up / lost" },
  ].map((c) => ({ ...c, overdue: false, at: start + c.offsetMin * 60_000 })) as Checkpoint[];
}

/* ────────────────────── Alert rules ────────────────────── */

export interface AlertCandidate {
  kind: AlertKind;
  severity: LiveAlert["severity"];
  message: string;
}

export function evaluateAlerts(v: LiveVisit, now: number): AlertCandidate[] {
  const out: AlertCandidate[] = [];
  const minsToVisit = (v.scheduledAt - now) / 60_000;
  const preTour = ["scheduled", "customer-confirmed", "inventory-confirmed", "en-route"].includes(v.stage);
  const closed = v.stage === "booked" || v.stage === "lost";
  if (closed) return out;

  if (preTour && minsToVisit <= 60 && minsToVisit > -5 && v.confirmation !== "confirmed") {
    out.push({ kind: "not-confirmed", severity: "warn", message: `Visit within 60 min but ${v.customer} has not confirmed` });
  }
  if (!v.coordinatorId) out.push({ kind: "no-coordinator", severity: "critical", message: `No coordinator assigned for ${v.customer}` });
  if (preTour && minsToVisit <= 60 && !v.coordinatorConfirmed) {
    out.push({ kind: "coordinator-unconfirmed", severity: "warn", message: `Coordinator ${v.coordinator} has not confirmed availability` });
  }
  if (preTour && minsToVisit <= 120 && !inventoryConfirmed(v.inventory)) {
    out.push({ kind: "inventory-unconfirmed", severity: "critical", message: `Inventory not confirmed for ${v.propertyName} ${v.roomNo}` });
  }
  if (preTour && minsToVisit <= 30 && minsToVisit > -5 && v.movement === "unknown") {
    out.push({ kind: "not-en-route", severity: "warn", message: `${v.customer} has not started travelling (T−30)` });
  }
  if (preTour && minutesLate(v, now) > 15) {
    out.push({ kind: "customer-late", severity: "critical", message: `${v.customer} is ${minutesLate(v, now)} min late` });
  }
  if (!v.bedAvailable) {
    out.push({ kind: "bed-unavailable", severity: "critical", message: `Bed ${v.bedNo || v.roomNo} at ${v.propertyName} is no longer available` });
  }
  if (v.stage === "arrived" && v.arrival && now - v.arrival.arrivedAt > 10 * 60_000 && !v.tourStartedAt) {
    out.push({ kind: "tour-not-started", severity: "warn", message: `Tour not started 10 min after arrival · ${v.customer}` });
  }
  if (v.stage === "tour-live" && v.tourStartedAt && now - v.tourStartedAt > 30 * 60_000 && !v.feedback) {
    out.push({ kind: "no-feedback", severity: "critical", message: `Tour running 30+ min without feedback · ${v.customer}` });
  }
  if (v.feedback && v.feedback.rating >= 8 && !v.quotation?.sentAt) {
    out.push({ kind: "quotation-missing", severity: "critical", message: `Rated ${v.feedback.rating}/10 but no quotation sent · ${v.customer}` });
  }
  if (v.quotation?.sentAt && !v.nextAction && !v.token?.paidAt) {
    out.push({ kind: "quotation-no-followup", severity: "warn", message: `Quotation sent but no follow-up started · ${v.customer}` });
  }
  if (v.token?.promisedAt && !v.token.paidAt && now - v.token.promisedAt > 60 * 60_000) {
    out.push({ kind: "token-unpaid", severity: "critical", message: `Token promised 60+ min ago, still unpaid · ${v.customer}` });
  }
  if (v.completedAt && !v.nextAction && !["booked", "lost"].includes(v.stage)) {
    out.push({ kind: "no-next-action", severity: "warn", message: `Completed visit without next action · ${v.customer}` });
  }
  if (isStageBreached(v, now)) {
    out.push({ kind: "stage-stuck", severity: "warn", message: `Stuck in ${STAGE_LABEL[v.stage]} for ${Math.round(stageAgeMs(v, now) / 60_000)} min · ${v.customer}` });
  }
  return out;
}

/* ────────────────────── Non-negotiable rule audit ────────────────────── */

export interface RuleViolation {
  rule: string;
  detail: string;
}

export function auditRules(v: LiveVisit, now: number): RuleViolation[] {
  const out: RuleViolation[] = [];
  if (!v.leadOwnerId) out.push({ rule: "No visit without a lead owner", detail: "Assign a lead owner" });
  if (!v.coordinatorId) out.push({ rule: "No visit without a coordinator", detail: "Assign a tour coordinator" });
  if (!inventoryConfirmed(v.inventory) && v.stage !== "lost")
    out.push({ rule: "No visit without confirmed room inventory", detail: "Complete the T−120 supply checklist" });
  if (!v.roomNo && !v.bedNo) out.push({ rule: "Visit must carry a room/bed preference", detail: "Property-only visits are not allowed" });
  if (isStageBreached(v, now)) out.push({ rule: "No stage beyond its SLA", detail: `${STAGE_LABEL[v.stage]} exceeded ${STAGE_SLA_MIN[v.stage]} min` });
  if (v.completedAt && !v.feedback) out.push({ rule: "No completed tour without feedback", detail: "Capture rating + objection" });
  if (v.feedback && v.feedback.rating >= 7 && !v.quotation) out.push({ rule: "No positive visit without a quotation", detail: "Send quotation now" });
  if (v.quotation && !v.nextAction) out.push({ rule: "No quotation without a follow-up deadline", detail: "Set next action + deadline" });
  if ((v.stage === "booked" || v.stage === "lost") && !v.outcome)
    out.push({ rule: "No visit complete without a final outcome", detail: "Record the outcome" });
  if (v.outcome === "family-approval-pending" && !v.nextAction)
    out.push({ rule: "No 'thinking' status without reason and deadline", detail: "Set the family decision-call time" });
  if (!v.bedAvailable && v.stage !== "lost") out.push({ rule: "No room promised without supply confirmation", detail: "Re-confirm or switch room" });
  return out;
}

/* ────────────────────── Quotation defaults ────────────────────── */

export function draftQuotation(v: LiveVisit): Omit<Quotation, "id" | "createdAt" | "sentAt"> {
  const rent = v.feedback ? v.rent : v.rent;
  return {
    propertyName: v.feedback?.favouriteProperty || v.propertyName,
    roomNo: v.feedback?.favouriteRoom || v.roomNo || "—",
    bedNo: v.bedNo || "A",
    rent,
    deposit: rent,
    maintenance: 1000,
    gharpayyFee: Math.round(rent * 0.25),
    checkInDate: v.checkInDate,
    lockInMonths: 6,
    noticeDays: 30,
    tokenAmount: 2000,
    expiresAt: Date.now() + 24 * 3600_000,
  };
}

/* ────────────────────── Daily success metrics ────────────────────── */

export interface DailyMetrics {
  scheduled: number;
  confirmed: number;
  enRoute: number;
  completed: number;
  noShows: number;
  rescheduled: number;
  quotationsSent: number;
  avgQuotationTurnaroundMin: number;
  booked: number;
  sameDayBookingPct: number;
  avgArrivalToQuotationMin: number;
  avgQuotationToTokenMin: number;
  stuckWithoutNextAction: number;
  lostReasons: Array<[string, number]>;
  coordinatorRows: Array<{ name: string; visits: number; completed: number; booked: number; conv: number }>;
  ownerRows: Array<{ name: string; visits: number; booked: number; conv: number }>;
  propertyRows: Array<{ name: string; visits: number; booked: number; conv: number }>;
  roomDemand: Array<{ room: string; count: number }>;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function computeMetrics(visits: LiveVisit[]): DailyMetrics {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const today = visits.filter((v) => v.scheduledAt >= +dayStart);
  const scope = today.length ? today : visits;

  const completed = scope.filter((v) => v.completedAt);
  const booked = scope.filter((v) => v.stage === "booked");
  const quoted = scope.filter((v) => v.quotation?.sentAt);

  const turnaround = quoted
    .filter((v) => v.completedAt)
    .map((v) => Math.round((v.quotation!.sentAt! - v.completedAt!) / 60_000));
  const arrivalToQuote = quoted
    .filter((v) => v.arrival)
    .map((v) => Math.round((v.quotation!.sentAt! - v.arrival!.arrivedAt) / 60_000));
  const quoteToToken = scope
    .filter((v) => v.quotation?.sentAt && v.token?.paidAt)
    .map((v) => Math.round((v.token!.paidAt! - v.quotation!.sentAt!) / 60_000));

  const group = <T extends string>(rows: LiveVisit[], key: (v: LiveVisit) => T) => {
    const m = new Map<T, { visits: number; completed: number; booked: number }>();
    rows.forEach((v) => {
      const k = key(v);
      const cur = m.get(k) ?? { visits: 0, completed: 0, booked: 0 };
      cur.visits += 1;
      if (v.completedAt) cur.completed += 1;
      if (v.stage === "booked") cur.booked += 1;
      m.set(k, cur);
    });
    return m;
  };

  const coord = group(scope, (v) => v.coordinator);
  const owner = group(scope, (v) => v.leadOwner);
  const prop = group(scope, (v) => v.propertyName);

  const roomCount = new Map<string, number>();
  scope.forEach((v) => {
    const r = v.feedback?.favouriteRoom || v.roomNo;
    if (!r) return;
    roomCount.set(r, (roomCount.get(r) ?? 0) + 1);
  });

  const lost = new Map<string, number>();
  scope.forEach((v) => {
    if (v.stage === "lost") {
      const k = v.lostReason ?? v.outcome ?? "unspecified";
      lost.set(k, (lost.get(k) ?? 0) + 1);
    }
  });

  return {
    scheduled: scope.length,
    confirmed: scope.filter((v) => v.confirmation === "confirmed").length,
    enRoute: scope.filter((v) => v.movement === "en-route" || v.stage === "en-route").length,
    completed: completed.length,
    noShows: scope.filter((v) => v.outcome === "no-show").length,
    rescheduled: scope.filter((v) => v.outcome === "rescheduled").length,
    quotationsSent: quoted.length,
    avgQuotationTurnaroundMin: avg(turnaround),
    booked: booked.length,
    sameDayBookingPct: scope.length ? Math.round((booked.length / scope.length) * 100) : 0,
    avgArrivalToQuotationMin: avg(arrivalToQuote),
    avgQuotationToTokenMin: avg(quoteToToken),
    stuckWithoutNextAction: scope.filter((v) => v.completedAt && !v.nextAction && v.stage !== "booked").length,
    lostReasons: Array.from(lost.entries()).sort((a, b) => b[1] - a[1]),
    coordinatorRows: Array.from(coord.entries())
      .map(([name, r]) => ({ name, ...r, conv: r.completed ? Math.round((r.booked / r.completed) * 100) : 0 }))
      .sort((a, b) => b.visits - a.visits),
    ownerRows: Array.from(owner.entries())
      .map(([name, r]) => ({ name, visits: r.visits, booked: r.booked, conv: r.visits ? Math.round((r.booked / r.visits) * 100) : 0 }))
      .sort((a, b) => b.visits - a.visits),
    propertyRows: Array.from(prop.entries())
      .map(([name, r]) => ({ name, visits: r.visits, booked: r.booked, conv: r.visits ? Math.round((r.booked / r.visits) * 100) : 0 }))
      .sort((a, b) => b.visits - a.visits),
    roomDemand: Array.from(roomCount.entries()).map(([room, count]) => ({ room, count })).sort((a, b) => b.count - a.count).slice(0, 8),
  };
}

/* ────────────────────── Board grouping ────────────────────── */

export function groupByColumn(visits: LiveVisit[], now: number) {
  const map = new Map<string, LiveVisit[]>();
  visits.forEach((v) => {
    let col: string = columnFor(v);
    if (
      (v.outcome === "follow-up-scheduled" || v.outcome === "family-approval-pending") &&
      v.stage !== "booked" &&
      v.stage !== "lost"
    ) {
      col = "follow-up";
    }
    if (!map.has(col)) map.set(col, []);
    map.get(col)!.push(v);
  });
  map.forEach((list) => list.sort((a, b) => priorityFor(b, now).score - priorityFor(a, now).score));
  return map;
}
