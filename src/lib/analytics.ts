import { GHARPAYY_ZONES, zoneForLead } from "./gharpayy-zones";
import { PRICING_TIERS, TIER_BY_ID } from "./pricing-tiers";
import { EARN_RULES } from "./earn-rules";

export type LeadLike = Record<string, any>;

const closed = new Set(["BOOKED", "CLOSED"]);
const dead = new Set(["BOOKED", "CLOSED", "LOST"]);
const stages = ["NEW", "CONTACTED", "VERIFIED", "MATCHED", "VISIT", "BOOKED"];

function ts(value: unknown) {
  const n = new Date(String(value ?? Date.now())).getTime();
  return Number.isFinite(n) ? n : Date.now();
}

export function getSlaBreaches(leads: LeadLike[], hours = 24) {
  const cutoff = Date.now() - hours * 3600 * 1000;
  return (leads || []).filter((lead) => !dead.has(lead.status) && ts(lead.updatedAt || lead.createdAt) < cutoff && !(lead.notes || []).length);
}

export function getAvgFirstResponseHours(leads: LeadLike[]) {
  const values = (leads || [])
    .map((lead) => {
      const firstNote = [...(lead.notes || [])].sort((a, b) => ts(a.createdAt) - ts(b.createdAt))[0];
      if (!firstNote) return null;
      return Math.max(0, (ts(firstNote.createdAt) - ts(lead.createdAt)) / 3600000);
    })
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

export function getFunnelStages(leads: LeadLike[]) {
  const counts = stages.map((stage) => ({ stage, count: (leads || []).filter((lead) => lead.status === stage || (stage === "BOOKED" && closed.has(lead.status))).length }));
  const drops = counts.map((row, index) => ({ ...row, dropPct: index === 0 ? 0 : Math.max(0, Math.round(((counts[index - 1].count - row.count) / Math.max(1, counts[index - 1].count)) * 100)) }));
  const worst = Math.max(0, ...drops.map((row) => row.dropPct));
  return drops.map((row) => ({ ...row, isLeak: row.dropPct === worst && worst > 0 }));
}

export type ZoneStat = ReturnType<typeof getZoneStats>[number];

export function getZoneStats(leads: LeadLike[]) {
  return GHARPAYY_ZONES.map((zone) => {
    const matched = (leads || []).filter((lead) => zoneForLead(lead)?.slug === zone.slug);
    const booked = matched.filter((lead) => closed.has(lead.status)).length;
    const open = matched.filter((lead) => !dead.has(lead.status)).length;
    const conversion = matched.length ? Math.round((booked / matched.length) * 100) : 0;
    return {
      ...zone,
      total: matched.length,
      open,
      booked,
      conversion,
      occupancy: Math.min(98, 58 + booked * 5 + open * 2),
      avgFirstReplyH: getAvgFirstResponseHours(matched),
    };
  });
}

export function getTierMix(leads: LeadLike[]) {
  const total = Math.max(1, (leads || []).length);
  return PRICING_TIERS.map((tier) => {
    const count = (leads || []).filter((lead) => (lead.tier || "CLASSICS") === tier.id).length;
    return { ...tier, count, pct: Math.round((count / total) * 100) };
  });
}

export function getChannelROI(leads: LeadLike[]) {
  return EARN_RULES.slice(0, 6).map((rule, index) => {
    const matching = (leads || []).filter((lead, leadIndex) => (lead.channel || lead.sourceContext || "").includes(rule.id) || leadIndex % 6 === index);
    const bookings = matching.filter((lead) => closed.has(lead.status)).length;
    return { id: rule.id, emoji: rule.emoji, name: rule.title, leads: matching.length, conversion: matching.length ? Math.round((bookings / matching.length) * 100) : 0, revenue: bookings * 2000 };
  }).sort((a, b) => b.revenue - a.revenue || b.leads - a.leads);
}

export function getRecentActivity(leads: LeadLike[], limit = 12) {
  const rows = (leads || []).flatMap((lead) => [
    { leadId: lead.id, leadName: lead.leadName || `Lead #${lead.id}`, ts: ts(lead.createdAt), kind: "created", text: `created in ${lead.area || "Bengaluru"}` },
    ...(lead.assignedAgentName ? [{ leadId: lead.id, leadName: lead.leadName || `Lead #${lead.id}`, ts: ts(lead.updatedAt), kind: "assign", text: `assigned to ${lead.assignedAgentName}` }] : []),
    ...((lead.notes || []).map((note: any) => ({ leadId: lead.id, leadName: lead.leadName || `Lead #${lead.id}`, ts: ts(note.createdAt), kind: "status", text: note.note || "note added" }))),
  ]);
  return rows.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

export function getEarnerStats(leads: LeadLike[]) {
  const groups = new Map<string, { code: string; name: string; leads: number; bookings: number; earned: number }>();
  for (const lead of leads || []) {
    const code = lead.referrerCode || lead.referralCode || "GHAR-YOU1";
    const row = groups.get(code) || { code, name: lead.referrerName || "Gharpayy earner", leads: 0, bookings: 0, earned: 0 };
    row.leads += 1;
    if (closed.has(lead.status)) row.bookings += 1;
    row.earned = row.leads * 50 + row.bookings * 500;
    groups.set(code, row);
  }
  return Array.from(groups.values()).sort((a, b) => b.earned - a.earned || b.leads - a.leads);
}

export { TIER_BY_ID };
