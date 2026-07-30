/**
 * Live Visit War Room — canonical types.
 *
 * A "live visit" is the controlled journey a scheduled tour must travel:
 *   scheduled → customer confirmed → inventory confirmed → en route → arrived
 *   → tour live → feedback captured → quotation sent → negotiation
 *   → token pending → booked / alternative / lost
 *
 * No visit is allowed to disappear between stages, and no visit may close
 * without an outcome + next action + deadline.
 */

export type LiveStage =
  | "scheduled"
  | "customer-confirmed"
  | "inventory-confirmed"
  | "en-route"
  | "arrived"
  | "tour-live"
  | "feedback"
  | "quotation-sent"
  | "negotiation"
  | "token-pending"
  | "booked"
  | "alternative"
  | "lost";

export const LIVE_STAGE_ORDER: LiveStage[] = [
  "scheduled",
  "customer-confirmed",
  "inventory-confirmed",
  "en-route",
  "arrived",
  "tour-live",
  "feedback",
  "quotation-sent",
  "negotiation",
  "token-pending",
  "booked",
];

export const STAGE_LABEL: Record<LiveStage, string> = {
  scheduled: "Scheduled",
  "customer-confirmed": "Customer Confirmed",
  "inventory-confirmed": "Inventory Confirmed",
  "en-route": "En Route",
  arrived: "Arrived",
  "tour-live": "Tour In Progress",
  feedback: "Feedback Captured",
  "quotation-sent": "Quotation Sent",
  negotiation: "Negotiation Active",
  "token-pending": "Token Pending",
  booked: "Booked",
  alternative: "Alternative Tour",
  lost: "Lost",
};

/** SLA per stage in minutes — a visit may never sit longer than this. */
export const STAGE_SLA_MIN: Record<LiveStage, number> = {
  scheduled: 30,
  "customer-confirmed": 60,
  "inventory-confirmed": 120,
  "en-route": 45,
  arrived: 10,
  "tour-live": 30,
  feedback: 10,
  "quotation-sent": 15,
  negotiation: 20,
  "token-pending": 120,
  booked: 0,
  alternative: 240,
  lost: 0,
};

/** Which board column a stage renders in. */
export type BoardColumn =
  | "upcoming"
  | "en-route"
  | "arrived"
  | "tour-live"
  | "closing"
  | "token-pending"
  | "alternative"
  | "follow-up"
  | "booked"
  | "lost";

export const COLUMN_LABEL: Record<BoardColumn, string> = {
  upcoming: "UPCOMING",
  "en-route": "EN ROUTE",
  arrived: "ARRIVED",
  "tour-live": "TOUR LIVE",
  closing: "CLOSING NOW",
  "token-pending": "TOKEN PENDING",
  alternative: "ALTERNATIVE REQUIRED",
  "follow-up": "FOLLOW-UP TODAY",
  booked: "BOOKED",
  lost: "LOST",
};

export const PRIMARY_COLUMNS: BoardColumn[] = [
  "upcoming",
  "en-route",
  "arrived",
  "tour-live",
  "closing",
];
export const SECONDARY_COLUMNS: BoardColumn[] = [
  "token-pending",
  "alternative",
  "follow-up",
  "booked",
  "lost",
];

export type ConfirmationStatus =
  | "pending"
  | "confirmed"
  | "reschedule-requested"
  | "cancelled"
  | "not-responding";

export type MovementStatus =
  | "unknown"
  | "en-route"
  | "leaving-shortly"
  | "running-late"
  | "unable-to-come"
  | "not-responding";

export type IntentLevel = "hot" | "warm" | "cold";

/** T−120 supply checklist. */
export interface InventoryCheck {
  roomVacant: boolean;
  bedAvailable: boolean;
  roomCleaned: boolean;
  managerInformed: boolean;
  priceConfirmed: boolean;
  discountAuthorityClear: boolean;
  backupRoomReady: boolean;
  confirmedAt?: number;
  confirmedBy?: string;
}

export const INVENTORY_CHECK_ITEMS: Array<{ key: keyof InventoryCheck; label: string }> = [
  { key: "roomVacant", label: "Room is vacant" },
  { key: "bedAvailable", label: "Bed is available" },
  { key: "roomCleaned", label: "Room is cleaned" },
  { key: "managerInformed", label: "Property manager informed" },
  { key: "priceConfirmed", label: "Correct price available" },
  { key: "discountAuthorityClear", label: "Discount authority clear" },
  { key: "backupRoomReady", label: "Backup room available" },
];

/** T−10 coordinator readiness. */
export interface ReadinessCheck {
  coordinatorPresent: boolean;
  roomUnlocked: boolean;
  bedAvailable: boolean;
  managerInformed: boolean;
  backupRoomReady: boolean;
  confirmedAt?: number;
}

export const READINESS_ITEMS: Array<{ key: keyof ReadinessCheck; label: string }> = [
  { key: "coordinatorPresent", label: "Coordinator present at property" },
  { key: "roomUnlocked", label: "Room unlocked" },
  { key: "bedAvailable", label: "Selected bed available" },
  { key: "managerInformed", label: "Property manager informed" },
  { key: "backupRoomReady", label: "Backup room ready" },
];

/** T+0 arrival capture. */
export interface ArrivalCapture {
  arrivedAt: number;
  peopleCount: number;
  accompaniedBy: "alone" | "family" | "friend" | "partner";
  entrySuccessful: boolean;
  roomReady: boolean;
  coordinatorPresent: boolean;
  issue?: string;
}

/** Live coordinator reaction taps during the tour. */
export type ReactionTag =
  | "likes-property"
  | "likes-room"
  | "dislikes-room"
  | "price-concern"
  | "distance-concern"
  | "food-concern"
  | "hygiene-concern"
  | "room-size-concern"
  | "family-approval"
  | "comparing-property"
  | "ready-to-book"
  | "alternative-required";

export const REACTION_META: Record<
  ReactionTag,
  { label: string; tone: "positive" | "negative" | "neutral"; objection?: ObjectionKind }
> = {
  "likes-property": { label: "Likes property", tone: "positive" },
  "likes-room": { label: "Likes room", tone: "positive" },
  "dislikes-room": { label: "Dislikes room", tone: "negative", objection: "room" },
  "price-concern": { label: "Price concern", tone: "negative", objection: "price" },
  "distance-concern": { label: "Distance concern", tone: "negative", objection: "distance" },
  "food-concern": { label: "Food concern", tone: "negative", objection: "food" },
  "hygiene-concern": { label: "Hygiene concern", tone: "negative", objection: "hygiene" },
  "room-size-concern": { label: "Room-size concern", tone: "negative", objection: "room" },
  "family-approval": { label: "Family approval required", tone: "neutral", objection: "family" },
  "comparing-property": { label: "Comparing another property", tone: "neutral", objection: "comparison" },
  "ready-to-book": { label: "Ready to book", tone: "positive" },
  "alternative-required": { label: "Alternative required", tone: "negative", objection: "match" },
};

export type ObjectionKind =
  | "price"
  | "distance"
  | "room"
  | "food"
  | "hygiene"
  | "family"
  | "comparison"
  | "match"
  | "timing";

export const OBJECTION_LABEL: Record<ObjectionKind, string> = {
  price: "Price",
  distance: "Distance",
  room: "Room",
  food: "Food",
  hygiene: "Hygiene",
  family: "Family approval",
  comparison: "Comparing options",
  match: "Wrong match",
  timing: "Timing / payment",
};

export interface ReactionEvent {
  id: string;
  ts: number;
  tag: ReactionTag;
  note?: string;
  by: string;
}

/** T+20 preference capture — mandatory before a tour can close. */
export interface FeedbackCapture {
  attended: boolean;
  favouriteProperty: string;
  favouriteRoom: string;
  rating: number; // 0-10
  liked: string;
  disliked: string;
  objection: ObjectionKind | null;
  objectionNote: string;
  decisionMaker: string;
  bookable: boolean;
  blocker: string;
  probability: number; // 0-100
  capturedAt: number;
}

/** T+30 quotation. */
export interface Quotation {
  id: string;
  createdAt: number;
  propertyName: string;
  roomNo: string;
  bedNo: string;
  rent: number;
  deposit: number;
  maintenance: number;
  gharpayyFee: number;
  checkInDate: string;
  lockInMonths: number;
  noticeDays: number;
  tokenAmount: number;
  expiresAt: number;
  sentAt?: number;
  /** the customer said yes to booking after the tour */
  acceptedAt?: number;
}

export type NegotiationTopic =
  | "price"
  | "deposit"
  | "payment-timing"
  | "family-approval"
  | "comparison"
  | "distance"
  | "facilities"
  | "room-availability";

export const NEGOTIATION_TOPICS: Array<{ key: NegotiationTopic; label: string }> = [
  { key: "price", label: "Price" },
  { key: "deposit", label: "Deposit" },
  { key: "payment-timing", label: "Payment timing" },
  { key: "family-approval", label: "Family approval" },
  { key: "comparison", label: "Comparison" },
  { key: "distance", label: "Distance" },
  { key: "facilities", label: "Facility concerns" },
  { key: "room-availability", label: "Room availability" },
];

export type FinalOutcome =
  | "booked"
  | "token-pending"
  | "family-approval-pending"
  | "negotiation-active"
  | "alternative-scheduled"
  | "follow-up-scheduled"
  | "no-show"
  | "rescheduled"
  | "not-looking"
  | "lost";

export const OUTCOME_LABEL: Record<FinalOutcome, string> = {
  booked: "Booked",
  "token-pending": "Token pending",
  "family-approval-pending": "Family approval pending",
  "negotiation-active": "Negotiation active",
  "alternative-scheduled": "Alternative tour scheduled",
  "follow-up-scheduled": "Follow-up scheduled",
  "no-show": "No-show",
  rescheduled: "Rescheduled",
  "not-looking": "Not looking anymore",
  lost: "Lost with reason",
};

export type LostReasonKind =
  | "chose-another-pg"
  | "chose-flat"
  | "budget"
  | "location"
  | "amenities"
  | "family-rejected"
  | "plan-changed"
  | "no-response";

export const LOST_REASON_LABEL: Record<LostReasonKind, string> = {
  "chose-another-pg": "Chose another PG",
  "chose-flat": "Chose a flat",
  budget: "Budget mismatch",
  location: "Location mismatch",
  amenities: "Amenities not suitable",
  "family-rejected": "Family rejected",
  "plan-changed": "Plan changed",
  "no-response": "No response",
};

export interface NextAction {
  text: string;
  owner: string;
  dueAt: number;
}

export interface TimelineEntry {
  id: string;
  ts: number;
  by: string;
  kind:
    | "stage"
    | "confirm"
    | "inventory"
    | "movement"
    | "readiness"
    | "arrival"
    | "reaction"
    | "feedback"
    | "quotation"
    | "negotiation"
    | "token"
    | "outcome"
    | "escalation"
    | "note"
    | "comms";
  text: string;
}

export type AlertKind =
  | "not-confirmed"
  | "no-coordinator"
  | "inventory-unconfirmed"
  | "not-en-route"
  | "customer-late"
  | "tour-not-started"
  | "no-feedback"
  | "quotation-missing"
  | "quotation-no-followup"
  | "token-unpaid"
  | "no-next-action"
  | "stage-stuck"
  | "coordinator-unconfirmed"
  | "bed-unavailable";

export interface LiveAlert {
  id: string;
  ts: number;
  visitId: string;
  customer: string;
  kind: AlertKind;
  severity: "info" | "warn" | "critical";
  message: string;
  resolvedAt?: number;
}

export interface LiveVisit {
  id: string;
  tourId?: string;
  leadId?: string;

  // Customer
  customer: string;
  phone: string;
  currentLocation: string;
  checkInDate: string;
  budget: number;
  occupation: string;
  decisionMaker: string;
  intent: IntentLevel;

  // Visit
  scheduledAt: number;
  stage: LiveStage;
  stageSince: number;
  confirmation: ConfirmationStatus;
  movement: MovementStatus;
  etaAt?: number;
  distanceKm?: number;
  locationShared?: boolean;
  arrival?: ArrivalCapture;
  tourStartedAt?: number;
  completedAt?: number;

  // Property / inventory
  propertyId: string;
  propertyName: string;
  propertyArea: string;
  roomNo: string;
  bedNo: string;
  rent: number;
  inventory: InventoryCheck;
  readiness: ReadinessCheck;
  bedAvailable: boolean;
  alternateProperty?: string;

  // Ownership
  leadOwnerId: string;
  leadOwner: string;
  coordinatorId: string;
  coordinator: string;
  coordinatorConfirmed: boolean;
  controllerNote?: string;

  // Conversion
  reactions: ReactionEvent[];
  feedback?: FeedbackCapture;
  quotation?: Quotation;
  negotiation?: {
    topics: NegotiationTopic[];
    owner: string;
    offeredDiscount: number;
    note: string;
    startedAt: number;
  };
  token?: { amount: number; promisedAt?: number; paidAt?: number; reference?: string };
  outcome?: FinalOutcome;
  lostReason?: LostReasonKind;
  lostNote?: string;
  nextAction?: NextAction;

  timeline: TimelineEntry[];
  createdAt: number;
  updatedAt: number;
  walkIn?: boolean;
}

/* ───────────────────────── helpers ───────────────────────── */

export function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function fmtDur(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}h ${p(m)}m` : `${p(m)}:${p(sec)}`;
}

export function fmtCountdown(ms: number): string {
  const late = ms < 0;
  const s = Math.abs(Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const body = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return late ? `${body} late` : `in ${body}`;
}

export function inventoryConfirmed(inv: InventoryCheck): boolean {
  return INVENTORY_CHECK_ITEMS.every((i) => inv[i.key] === true);
}

export function readinessConfirmed(r: ReadinessCheck): boolean {
  return READINESS_ITEMS.every((i) => r[i.key] === true);
}

export function columnFor(v: LiveVisit): BoardColumn {
  switch (v.stage) {
    case "scheduled":
    case "customer-confirmed":
    case "inventory-confirmed":
      return "upcoming";
    case "en-route":
      return "en-route";
    case "arrived":
      return "arrived";
    case "tour-live":
      return "tour-live";
    case "feedback":
    case "quotation-sent":
    case "negotiation":
      return "closing";
    case "token-pending":
      return "token-pending";
    case "alternative":
      return "alternative";
    case "booked":
      return "booked";
    case "lost":
      return "lost";
    default:
      return "follow-up";
  }
}
