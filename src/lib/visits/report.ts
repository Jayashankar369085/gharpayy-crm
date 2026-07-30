import {
  probabilityFor,
  STAGE_META,
  type VisitRecord,
} from "@/lib/visits/war-store";

/**
 * Auto visit reports.
 *
 * Every visit produces a report without anyone typing one: the record's own
 * timeline, objections and outcome are rendered into a WhatsApp-pasteable
 * block. Regenerated whenever the close-out data changes.
 */

const t = (ms?: number) =>
  ms ? new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—";

const mins = (a?: number, b?: number) =>
  a && b ? `${Math.max(0, Math.round((b - a) / 60000))}m` : "—";

export function isClosedOut(v: VisitRecord) {
  return ["completed", "objection", "follow-up", "booked", "lost"].includes(v.stage);
}

/** Stable signature — report regenerates only when something meaningful changed. */
export function reportSignature(v: VisitRecord) {
  return [
    v.stage,
    v.reaction ?? "",
    v.decision ?? "",
    v.outcome ?? "",
    v.lostReason ?? "",
    v.followUpStage ?? "",
    v.objections.length,
    v.completedAt ?? 0,
  ].join("|");
}

export function buildVisitReport(v: VisitRecord): string {
  const prob = probabilityFor(v.reaction, v.objections.length, v.stage);
  const lines: string[] = [];

  lines.push(`VISIT REPORT · ${v.leadName}${v.walkIn ? " (walk-in)" : ""}`);
  lines.push(`${v.propertyName} · ${v.propertyArea}`);
  lines.push(`Coordinator: ${v.tcmName}`);
  lines.push("");
  lines.push("— Timeline —");
  lines.push(`Scheduled: ${t(v.scheduledAt)}`);
  if (v.startedAt) lines.push(`Started: ${t(v.startedAt)}`);
  if (v.reachedAt) lines.push(`At property: ${t(v.reachedAt)}`);
  if (v.ongoingAt) lines.push(`Tour began: ${t(v.ongoingAt)}`);
  if (v.completedAt) lines.push(`Completed: ${t(v.completedAt)} (on site ${mins(v.reachedAt ?? v.startedAt, v.completedAt)})`);
  lines.push("");
  lines.push("— What happened —");
  lines.push(`Stage: ${STAGE_META[v.stage].label}`);
  if (v.reaction) lines.push(`Reaction: ${v.reaction}`);
  if (v.decision) lines.push(`Decision: ${v.decision.replace(/-/g, " ")}`);
  if (v.occupancy) lines.push(`Wants: ${v.occupancy} sharing`);
  if (v.budget) lines.push(`Budget: ₹${v.budget.toLocaleString("en-IN")}`);
  if (v.moveInBy) lines.push(`Move-in: ${v.moveInBy}`);
  lines.push(`Booking probability: ${prob}%`);

  if (v.objections.length) {
    lines.push("");
    lines.push(`— Objections (${v.objections.length}) —`);
    v.objections.forEach((o, i) => {
      lines.push(
        `${i + 1}. [${o.category}] ${o.subType} → ${o.resolution}` +
          (o.customerSaid ? `\n   Said: "${o.customerSaid}"` : "") +
          (o.salesResponse ? `\n   Handled: ${o.salesResponse}` : ""),
      );
    });
  }

  lines.push("");
  lines.push("— Next —");
  if (v.outcome === "booked") lines.push("BOOKED ✅ — move to onboarding.");
  else if (v.stage === "lost") lines.push(`LOST — ${(v.lostReason ?? "no reason logged").replace(/-/g, " ")}`);
  else if (v.followUpStage) lines.push(`Follow-up: ${v.followUpStage.replace(/-/g, " ")}`);
  else if (prob >= 70) lines.push("Hot — close today with a token offer.");
  else if (prob >= 40) lines.push("Warm — send comparison + call in 24h.");
  else lines.push("Cold — re-match to alternate property.");
  if (v.managerNote) lines.push(`Manager note: ${v.managerNote}`);

  return lines.join("\n");
}

export function buildDayReport(all: VisitRecord[], dayStart: number): string {
  const dayEnd = dayStart + 24 * 3600_000;
  const day = all
    .filter((v) => v.scheduledAt >= dayStart && v.scheduledAt < dayEnd)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  if (day.length === 0) return "No visits recorded today.";

  const done = day.filter(isClosedOut);
  const booked = day.filter((v) => v.stage === "booked" || v.outcome === "booked");
  const lost = day.filter((v) => v.stage === "lost");
  const walkIns = day.filter((v) => v.walkIn);
  const objections = day.reduce((s, v) => s + v.objections.length, 0);
  const pipeline = Math.round(
    day.reduce((s, v) => s + probabilityFor(v.reaction, v.objections.length, v.stage) / 100, 0) * 10,
  ) / 10;

  const byTcm = new Map<string, VisitRecord[]>();
  day.forEach((v) => {
    const arr = byTcm.get(v.tcmName) ?? [];
    arr.push(v);
    byTcm.set(v.tcmName, arr);
  });

  const lines: string[] = [];
  lines.push(`END-OF-DAY VISIT REPORT · ${new Date(dayStart).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}`);
  lines.push("");
  lines.push(`Visits: ${day.length} (${walkIns.length} walk-in) · Closed out: ${done.length}`);
  lines.push(`Booked: ${booked.length} · Lost: ${lost.length} · Objections logged: ${objections}`);
  lines.push(`Expected bookings from today: ${pipeline}`);
  lines.push("");
  Array.from(byTcm.entries()).forEach(([tcm, list]) => {
    lines.push(`— ${tcm} (${list.length}) —`);
    list.forEach((v) => {
      const prob = probabilityFor(v.reaction, v.objections.length, v.stage);
      lines.push(
        `${t(v.scheduledAt)} · ${v.leadName} · ${v.propertyName} · ${STAGE_META[v.stage].label} · ${prob}%` +
          (v.walkIn ? " · walk-in" : ""),
      );
    });
    lines.push("");
  });

  return lines.join("\n").trim();
}
