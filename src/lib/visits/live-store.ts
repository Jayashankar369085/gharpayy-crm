import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type LiveVisit,
  type LiveStage,
  type LiveAlert,
  type AlertKind,
  type ReactionTag,
  type FeedbackCapture,
  type Quotation,
  type NegotiationTopic,
  type FinalOutcome,
  type LostReasonKind,
  type NextAction,
  type ConfirmationStatus,
  type MovementStatus,
  type InventoryCheck,
  type ReadinessCheck,
  type ArrivalCapture,
  type TimelineEntry,
  STAGE_LABEL,
  REACTION_META,
  inventoryConfirmed,
} from "./live-types";

/**
 * Live Visit War Room store.
 *
 * Every mutation writes a timeline entry, so a visit can always answer
 * "who did what, when" — and no visit can silently skip a stage.
 */

const EMPTY_INVENTORY: InventoryCheck = {
  roomVacant: false,
  bedAvailable: false,
  roomCleaned: false,
  managerInformed: false,
  priceConfirmed: false,
  discountAuthorityClear: false,
  backupRoomReady: false,
};

const EMPTY_READINESS: ReadinessCheck = {
  coordinatorPresent: false,
  roomUnlocked: false,
  bedAvailable: false,
  managerInformed: false,
  backupRoomReady: false,
};

export interface SeedInput {
  id: string;
  tourId?: string;
  leadId?: string;
  customer: string;
  phone: string;
  scheduledAt: number;
  propertyId: string;
  propertyName: string;
  propertyArea: string;
  roomNo?: string;
  bedNo?: string;
  rent: number;
  budget: number;
  checkInDate: string;
  occupation?: string;
  decisionMaker?: string;
  intent?: LiveVisit["intent"];
  currentLocation?: string;
  leadOwnerId: string;
  leadOwner: string;
  coordinatorId: string;
  coordinator: string;
  stage?: LiveStage;
  walkIn?: boolean;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function entry(kind: TimelineEntry["kind"], text: string, by = "System"): TimelineEntry {
  return { id: uid("tl"), ts: Date.now(), kind, text, by };
}

interface State {
  visits: Record<string, LiveVisit>;
  alerts: LiveAlert[];
  alertsSeenAt: number;
  seededTourIds: string[];
}

interface Actions {
  seed: (input: SeedInput) => LiveVisit;
  patch: (id: string, p: Partial<LiveVisit>, note?: { kind: TimelineEntry["kind"]; text: string; by?: string }) => void;
  setStage: (id: string, stage: LiveStage, by?: string) => void;
  setConfirmation: (id: string, status: ConfirmationStatus, by?: string) => void;
  setMovement: (id: string, m: MovementStatus, etaAt?: number, by?: string) => void;
  toggleInventory: (id: string, key: keyof InventoryCheck, by?: string) => void;
  confirmAllInventory: (id: string, by?: string) => void;
  toggleReadiness: (id: string, key: keyof ReadinessCheck, by?: string) => void;
  confirmCoordinator: (id: string, by?: string) => void;
  reassignCoordinator: (id: string, coordinatorId: string, coordinator: string, by?: string) => void;
  shareLocation: (id: string, by?: string) => void;
  markArrived: (id: string, capture: Omit<ArrivalCapture, "arrivedAt">, by?: string) => void;
  startTour: (id: string, by?: string) => void;
  addReaction: (id: string, tag: ReactionTag, note?: string, by?: string) => void;
  captureFeedback: (id: string, f: Omit<FeedbackCapture, "capturedAt">, by?: string) => void;
  sendQuotation: (id: string, q: Omit<Quotation, "id" | "createdAt" | "sentAt">, by?: string) => void;
  acceptQuotation: (id: string, by?: string) => void;
  startNegotiation: (id: string, topics: NegotiationTopic[], owner: string, discount: number, note: string) => void;
  promiseToken: (id: string, amount: number, by?: string) => void;
  collectToken: (id: string, reference: string, by?: string) => void;
  setOutcome: (id: string, outcome: FinalOutcome, opts?: { lostReason?: LostReasonKind; note?: string; by?: string }) => void;
  setNextAction: (id: string, action: NextAction, by?: string) => void;
  setBedAvailable: (id: string, available: boolean, by?: string) => void;
  setAlternateProperty: (id: string, name: string, by?: string) => void;
  logComms: (id: string, text: string, by?: string) => void;
  addNote: (id: string, text: string, by?: string) => void;
  reschedule: (id: string, at: number, reason: string, by?: string) => void;
  cancelVisit: (id: string, reason: string, by?: string) => void;
  pushAlert: (a: Omit<LiveAlert, "id" | "ts">) => void;
  resolveAlert: (id: string) => void;
  markAlertsSeen: () => void;
  removeVisit: (id: string) => void;
  resetAll: () => void;
}

export const useLiveVisits = create<State & Actions>()(
  persist(
    (set, get) => {
      const mut = (
        id: string,
        fn: (v: LiveVisit) => LiveVisit,
      ) =>
        set((s) => {
          const cur = s.visits[id];
          if (!cur) return s;
          return { visits: { ...s.visits, [id]: { ...fn(cur), updatedAt: Date.now() } } };
        });

      const log = (v: LiveVisit, e: TimelineEntry): LiveVisit => ({
        ...v,
        timeline: [e, ...v.timeline].slice(0, 120),
      });

      const advance = (v: LiveVisit, stage: LiveStage, by = "System"): LiveVisit => {
        if (v.stage === stage) return v;
        return log(
          { ...v, stage, stageSince: Date.now() },
          entry("stage", `Stage → ${STAGE_LABEL[stage]}`, by),
        );
      };

      return {
        visits: {},
        alerts: [],
        alertsSeenAt: 0,
        seededTourIds: [],

        seed: (input) => {
          const now = Date.now();
          const v: LiveVisit = {
            id: input.id,
            tourId: input.tourId,
            leadId: input.leadId,
            customer: input.customer,
            phone: input.phone,
            currentLocation: input.currentLocation ?? "—",
            checkInDate: input.checkInDate,
            budget: input.budget,
            occupation: input.occupation ?? "—",
            decisionMaker: input.decisionMaker ?? "Self",
            intent: input.intent ?? "warm",
            scheduledAt: input.scheduledAt,
            stage: input.stage ?? "scheduled",
            stageSince: now,
            confirmation: "pending",
            movement: "unknown",
            propertyId: input.propertyId,
            propertyName: input.propertyName,
            propertyArea: input.propertyArea,
            roomNo: input.roomNo ?? "",
            bedNo: input.bedNo ?? "",
            rent: input.rent,
            inventory: { ...EMPTY_INVENTORY },
            readiness: { ...EMPTY_READINESS },
            bedAvailable: true,
            leadOwnerId: input.leadOwnerId,
            leadOwner: input.leadOwner,
            coordinatorId: input.coordinatorId,
            coordinator: input.coordinator,
            coordinatorConfirmed: false,
            reactions: [],
            timeline: [entry("stage", "Visit created in War Room", "System")],
            createdAt: now,
            updatedAt: now,
            walkIn: input.walkIn,
          };
          set((s) => ({
            visits: { ...s.visits, [v.id]: v },
            seededTourIds: input.tourId
              ? Array.from(new Set([...s.seededTourIds, input.tourId]))
              : s.seededTourIds,
          }));
          return v;
        },

        patch: (id, p, note) =>
          mut(id, (v) => (note ? log({ ...v, ...p }, entry(note.kind, note.text, note.by)) : { ...v, ...p })),

        setStage: (id, stage, by) => mut(id, (v) => advance(v, stage, by)),

        setConfirmation: (id, status, by = "Visit Controller") =>
          mut(id, (v) => {
            let next = log({ ...v, confirmation: status }, entry("confirm", `Customer confirmation: ${status}`, by));
            if (status === "confirmed" && v.stage === "scheduled") next = advance(next, "customer-confirmed", by);
            if (status === "cancelled") next = advance(next, "lost", by);
            return next;
          }),

        setMovement: (id, m, etaAt, by = "Visit Controller") =>
          mut(id, (v) => {
            let next = log(
              { ...v, movement: m, etaAt: etaAt ?? v.etaAt },
              entry("movement", `Movement: ${m.replace(/-/g, " ")}${etaAt ? ` · ETA ${new Date(etaAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}`, by),
            );
            if (m === "en-route") next = advance(next, "en-route", by);
            return next;
          }),

        toggleInventory: (id, key, by = "Supply Controller") =>
          mut(id, (v) => {
            const inv = { ...v.inventory, [key]: !v.inventory[key] } as InventoryCheck;
            const done = inventoryConfirmed(inv);
            if (done) {
              inv.confirmedAt = Date.now();
              inv.confirmedBy = by;
            }
            let next = log({ ...v, inventory: inv }, entry("inventory", `Inventory item ${String(key)} → ${inv[key] ? "yes" : "no"}`, by));
            if (done && (v.stage === "scheduled" || v.stage === "customer-confirmed")) {
              next = advance(next, "inventory-confirmed", by);
            }
            return next;
          }),

        confirmAllInventory: (id, by = "Supply Controller") =>
          mut(id, (v) => {
            const inv: InventoryCheck = {
              roomVacant: true,
              bedAvailable: true,
              roomCleaned: true,
              managerInformed: true,
              priceConfirmed: true,
              discountAuthorityClear: true,
              backupRoomReady: true,
              confirmedAt: Date.now(),
              confirmedBy: by,
            };
            let next = log({ ...v, inventory: inv, bedAvailable: true }, entry("inventory", "Full inventory confirmed (T−120)", by));
            if (v.stage === "scheduled" || v.stage === "customer-confirmed") next = advance(next, "inventory-confirmed", by);
            return next;
          }),

        toggleReadiness: (id, key, by = "Tour Coordinator") =>
          mut(id, (v) => {
            const r = { ...v.readiness, [key]: !v.readiness[key] } as ReadinessCheck;
            r.confirmedAt = Date.now();
            return log({ ...v, readiness: r }, entry("readiness", `Readiness ${String(key)} → ${r[key] ? "yes" : "no"}`, by));
          }),

        confirmCoordinator: (id, by = "Visit Controller") =>
          mut(id, (v) => log({ ...v, coordinatorConfirmed: true }, entry("readiness", `${v.coordinator} confirmed availability`, by))),

        reassignCoordinator: (id, coordinatorId, coordinator, by = "Visit Controller") =>
          mut(id, (v) =>
            log(
              { ...v, coordinatorId, coordinator, coordinatorConfirmed: false },
              entry("escalation", `Coordinator reassigned: ${v.coordinator} → ${coordinator}`, by),
            ),
          ),

        shareLocation: (id, by = "Visit Controller") =>
          mut(id, (v) =>
            log({ ...v, locationShared: true }, entry("comms", "Live location, maps link, landmark + coordinator number shared", by)),
          ),

        markArrived: (id, capture, by = "Tour Coordinator") =>
          mut(id, (v) => {
            const arrival: ArrivalCapture = { ...capture, arrivedAt: Date.now() };
            const next = log({ ...v, arrival }, entry("arrival", `Customer arrived · ${capture.peopleCount} people · ${capture.accompaniedBy}`, by));
            return advance(next, "arrived", by);
          }),

        startTour: (id, by = "Tour Coordinator") =>
          mut(id, (v) => {
            const next = log({ ...v, tourStartedAt: Date.now() }, entry("stage", "Tour started — live timer running", by));
            return advance(next, "tour-live", by);
          }),

        addReaction: (id, tag, note, by = "Tour Coordinator") =>
          mut(id, (v) =>
            log(
              { ...v, reactions: [{ id: uid("rx"), ts: Date.now(), tag, note, by }, ...v.reactions] },
              entry("reaction", `${REACTION_META[tag].label}${note ? ` — ${note}` : ""}`, by),
            ),
          ),

        captureFeedback: (id, f, by = "Tour Coordinator") =>
          mut(id, (v) => {
            const next = log(
              { ...v, feedback: { ...f, capturedAt: Date.now() }, completedAt: Date.now() },
              entry("feedback", `Feedback captured · rating ${f.rating}/10 · objection ${f.objection ?? "none"}`, by),
            );
            return advance(next, "feedback", by);
          }),

        sendQuotation: (id, q, by = "Lead Owner") =>
          mut(id, (v) => {
            const quotation: Quotation = { ...q, id: uid("qt"), createdAt: Date.now(), sentAt: Date.now() };
            const next = log({ ...v, quotation }, entry("quotation", `Quotation sent · rent ₹${q.rent} · token ₹${q.tokenAmount}`, by));
            return advance(next, "quotation-sent", by);
          }),

        acceptQuotation: (id, by = "Lead Owner") =>
          mut(id, (v) => {
            if (!v.quotation) return v;
            const next = log(
              { ...v, quotation: { ...v.quotation, acceptedAt: Date.now() }, token: { amount: v.quotation.tokenAmount, promisedAt: Date.now() } },
              entry("token", "Customer willing to book — token promised", by),
            );
            return advance(next, "token-pending", by);
          }),

        startNegotiation: (id, topics, owner, discount, note) =>
          mut(id, (v) => {
            const next = log(
              { ...v, negotiation: { topics, owner, offeredDiscount: discount, note, startedAt: Date.now() } },
              entry("negotiation", `Negotiation opened by ${owner} · ${topics.join(", ")} · discount ₹${discount}`, owner),
            );
            return advance(next, "negotiation", owner);
          }),

        promiseToken: (id, amount, by = "Lead Owner") =>
          mut(id, (v) => {
            const next = log({ ...v, token: { ...(v.token ?? {}), amount, promisedAt: Date.now() } }, entry("token", `Token ₹${amount} promised`, by));
            return advance(next, "token-pending", by);
          }),

        collectToken: (id, reference, by = "Lead Owner") =>
          mut(id, (v) => {
            const next = log(
              { ...v, token: { amount: v.token?.amount ?? v.quotation?.tokenAmount ?? 0, promisedAt: v.token?.promisedAt, paidAt: Date.now(), reference } },
              entry("token", `Token received · ref ${reference}`, by),
            );
            return advance({ ...next, outcome: "booked" }, "booked", by);
          }),

        setOutcome: (id, outcome, opts) =>
          mut(id, (v) => {
            const by = opts?.by ?? "Visit Controller";
            let stage: LiveStage = v.stage;
            if (outcome === "booked") stage = "booked";
            else if (outcome === "lost" || outcome === "not-looking" || outcome === "no-show") stage = "lost";
            else if (outcome === "alternative-scheduled") stage = "alternative";
            else if (outcome === "token-pending") stage = "token-pending";
            else if (outcome === "negotiation-active") stage = "negotiation";
            const next = log(
              { ...v, outcome, lostReason: opts?.lostReason, lostNote: opts?.note },
              entry("outcome", `Outcome: ${outcome}${opts?.lostReason ? ` · ${opts.lostReason}` : ""}${opts?.note ? ` — ${opts.note}` : ""}`, by),
            );
            return advance(next, stage, by);
          }),

        setNextAction: (id, action, by = "Visit Controller") =>
          mut(id, (v) =>
            log({ ...v, nextAction: action }, entry("note", `Next action: ${action.text} · ${action.owner} · due ${new Date(action.dueAt).toLocaleString("en-IN")}`, by)),
          ),

        setBedAvailable: (id, available, by = "Supply Controller") =>
          mut(id, (v) =>
            log(
              { ...v, bedAvailable: available, inventory: { ...v.inventory, bedAvailable: available } },
              entry("inventory", available ? "Bed re-confirmed available" : "Selected bed became UNAVAILABLE", by),
            ),
          ),

        setAlternateProperty: (id, name, by = "Visit Controller") =>
          mut(id, (v) => log({ ...v, alternateProperty: name }, entry("note", `Alternate option added: ${name}`, by))),

        logComms: (id, text, by = "Visit Controller") => mut(id, (v) => log(v, entry("comms", text, by))),
        addNote: (id, text, by = "Visit Controller") => mut(id, (v) => log(v, entry("note", text, by))),

        reschedule: (id, at, reason, by = "Visit Controller") =>
          mut(id, (v) => {
            const next = log(
              { ...v, scheduledAt: at, confirmation: "pending", movement: "unknown", outcome: "rescheduled" },
              entry("stage", `Rescheduled to ${new Date(at).toLocaleString("en-IN")} — ${reason}`, by),
            );
            return advance(next, "scheduled", by);
          }),

        cancelVisit: (id, reason, by = "Visit Controller") =>
          mut(id, (v) => {
            const next = log(
              { ...v, confirmation: "cancelled", outcome: "lost", lostNote: reason },
              entry("outcome", `Visit cancelled — ${reason}`, by),
            );
            return advance(next, "lost", by);
          }),

        pushAlert: (a) =>
          set((s) => {
            // de-dupe: same visit + kind still unresolved
            if (s.alerts.some((x) => x.visitId === a.visitId && x.kind === a.kind && !x.resolvedAt)) return s;
            return { alerts: [{ id: uid("al"), ts: Date.now(), ...a }, ...s.alerts].slice(0, 250) };
          }),

        resolveAlert: (id) =>
          set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, resolvedAt: Date.now() } : a)) })),

        markAlertsSeen: () => set({ alertsSeenAt: Date.now() }),

        removeVisit: (id) =>
          set((s) => {
            const next = { ...s.visits };
            delete next[id];
            return { visits: next };
          }),

        resetAll: () => set({ visits: {}, alerts: [], alertsSeenAt: 0, seededTourIds: [] }),
      };
    },
    { name: "gharpayy-live-visit-war-room-v1" },
  ),
);

export type { AlertKind };
