/**
 * Guided visit flow — the "self next step" engine.
 *
 * The war room is not a set of tabs you navigate. It is a single ordered
 * pipeline: finish a step, the flow auto-advances to the next one and hands
 * you the exact message to send the customer.
 */
import { type LiveVisit, inr, inventoryConfirmed } from "./live-types";

export type FlowStepId =
  | "confirm-customer"
  | "inventory"
  | "coordinator"
  | "location"
  | "movement"
  | "arrival"
  | "start-tour"
  | "reaction"
  | "feedback"
  | "quotation"
  | "token"
  | "outcome";

export interface FlowStep {
  id: FlowStepId;
  title: string;
  why: string;
  owner: string;
  /** minutes relative to scheduled time — negative = before visit */
  slaMin: number;
  done: (v: LiveVisit) => boolean;
  /** message to send the customer once this step is completed */
  cx?: (v: LiveVisit) => string;
  cxLabel?: string;
}

const time = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export const FLOW_STEPS: FlowStep[] = [
  {
    id: "confirm-customer",
    title: "Confirm the customer",
    why: "No visit is real until the customer says yes on call/WhatsApp.",
    owner: "Lead Owner",
    slaMin: -1440,
    done: (v) => v.confirmation === "confirmed",
    cxLabel: "Send confirmation",
    cx: (v) =>
      `Hi ${v.customer}, your Gharpayy visit is confirmed for ${time(v.scheduledAt)} at ${v.propertyName}, ${v.propertyArea}.\n` +
      `Room ${v.roomNo || "TBD"}${v.bedNo ? ` / Bed ${v.bedNo}` : ""} · Rent ${inr(v.rent)}\n` +
      `Your host will be ${v.coordinator}. Reply YES to lock this slot.`,
  },
  {
    id: "inventory",
    title: "T−120 inventory confirmation",
    why: "Never show a bed you cannot sell. Room, price and discount authority must be locked.",
    owner: "Supply Controller",
    slaMin: -120,
    done: (v) => inventoryConfirmed(v.inventory),
  },
  {
    id: "coordinator",
    title: "Lock the tour coordinator",
    why: "A visit without a confirmed human at the property is a cancelled visit.",
    owner: "Visit Controller",
    slaMin: -90,
    done: (v) => v.coordinatorConfirmed,
    cxLabel: "Share host details",
    cx: (v) =>
      `${v.customer}, ${v.coordinator} will receive you today at ${v.propertyName} at ${time(v.scheduledAt)}. ` +
      `Please save this number and call directly on arrival.`,
  },
  {
    id: "location",
    title: "Send location pack",
    why: "Maps link + landmark + coordinator number removes 80% of no-shows.",
    owner: "Visit Controller",
    slaMin: -60,
    done: (v) => !!v.locationShared,
    cxLabel: "Send location pack",
    cx: (v) =>
      `Location for your ${time(v.scheduledAt)} visit:\n${v.propertyName}, ${v.propertyArea}\n` +
      `Maps: https://maps.google.com/?q=${encodeURIComponent(`${v.propertyName} ${v.propertyArea}`)}\n` +
      `Host: ${v.coordinator}. See you soon!`,
  },
  {
    id: "movement",
    title: "T−30 movement check",
    why: "Know if they left. A silent customer at T−30 is a lost customer.",
    owner: "Lead Owner",
    slaMin: -30,
    done: (v) => ["en-route", "leaving-shortly"].includes(v.movement) || !!v.arrival,
    cxLabel: "Nudge for ETA",
    cx: (v) => `${v.customer}, have you started for ${v.propertyName}? Share your ETA so ${v.coordinator} keeps the room ready.`,
  },
  {
    id: "arrival",
    title: "Mark arrival",
    why: "Arrival starts the conversion clock and tells the admin the visit is real.",
    owner: "Tour Coordinator",
    slaMin: 0,
    done: (v) => !!v.arrival,
  },
  {
    id: "start-tour",
    title: "Start the tour timer",
    why: "Live timer broadcasts to admin + owner that a tour is happening right now.",
    owner: "Tour Coordinator",
    slaMin: 5,
    done: (v) => !!v.tourStartedAt,
  },
  {
    id: "reaction",
    title: "Log live reactions",
    why: "Reactions drive the intervention script while the customer is still standing there.",
    owner: "Tour Coordinator",
    slaMin: 20,
    done: (v) => v.reactions.length > 0,
  },
  {
    id: "feedback",
    title: "Capture feedback + objection",
    why: "Tour ends only when rating and objection are documented.",
    owner: "Tour Coordinator",
    slaMin: 35,
    done: (v) => !!v.feedback,
    cxLabel: "Thank-you + intent ask",
    cx: (v) =>
      `Thanks for visiting ${v.propertyName}, ${v.customer}! How did you like the room? ` +
      `If it works, I'll send you the quotation right away and hold the bed for you.`,
  },
  {
    id: "quotation",
    title: "Send quotation",
    why: "Every completed tour gets a quotation within 30 minutes. No exceptions.",
    owner: "Lead Owner",
    slaMin: 45,
    done: (v) => !!v.quotation,
    cxLabel: "Send quotation",
    cx: (v) => {
      const q = v.quotation;
      if (!q) return "";
      return (
        `Quotation — ${v.propertyName} (Room ${v.roomNo || "TBD"}${v.bedNo ? `/${v.bedNo}` : ""})\n` +
        `Rent: ${inr(q.rent)}/mo\nDeposit: ${inr(q.deposit)}\n` +
        (q.discount ? `Discount: ${inr(q.discount)}\n` : "") +
        `Token to block the bed: ${inr(q.tokenAmount)}\nMove-in: ${v.checkInDate}\n` +
        `Valid till ${new Date(q.validTill ?? Date.now() + 864e5).toLocaleDateString("en-IN")}. Shall I block it?`
      );
    },
  },
  {
    id: "token",
    title: "Close the token",
    why: "Bed is blocked only on token. Promised-but-unpaid tokens expire fast.",
    owner: "Lead Owner",
    slaMin: 90,
    done: (v) => !!v.token?.paidAt,
    cxLabel: "Send payment ask",
    cx: (v) =>
      `${v.customer}, to block Room ${v.roomNo || ""}${v.bedNo ? `/${v.bedNo}` : ""} at ${v.propertyName} ` +
      `please pay the token of ${inr(v.token?.amount ?? v.quotation?.tokenAmount ?? 5000)}. ` +
      `Once paid, the bed is locked in your name and no one else can take it.`,
  },
  {
    id: "outcome",
    title: "Document outcome + next action",
    why: "No visit closes without an outcome and a dated next action.",
    owner: "Visit Controller",
    slaMin: 120,
    done: (v) => !!v.outcome && !!v.nextAction,
  },
];

export interface FlowState {
  steps: Array<FlowStep & { status: "done" | "current" | "pending"; dueAt: number }>;
  current: (FlowStep & { dueAt: number }) | null;
  doneCount: number;
  total: number;
  progress: number;
}

export function flowFor(v: LiveVisit): FlowState {
  let currentFound = false;
  const steps = FLOW_STEPS.map((s) => {
    const isDone = s.done(v);
    let status: "done" | "current" | "pending" = "pending";
    if (isDone) status = "done";
    else if (!currentFound) {
      status = "current";
      currentFound = true;
    }
    return { ...s, status, dueAt: v.scheduledAt + s.slaMin * 60_000 };
  });
  const doneCount = steps.filter((s) => s.status === "done").length;
  const cur = steps.find((s) => s.status === "current") ?? null;
  return {
    steps,
    current: cur,
    doneCount,
    total: steps.length,
    progress: Math.round((doneCount / steps.length) * 100),
  };
}

/** Terminal visits have no next step to push. */
export function isFlowClosed(v: LiveVisit): boolean {
  return v.stage === "booked" || v.stage === "lost";
}
