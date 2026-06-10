// @ts-nocheck
// Lead capture & funnel tracking for public site → Booking OS wiring
import { useEffect, useState } from "react";

const K = "bookos_leads_v1";
const EK = "bookos_events_v1";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const load = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const save = (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v));

export type LeadStage = "new" | "qualified" | "quoted" | "visit" | "booked" | "lost";
export type LeadAction = "view" | "wa_click" | "call_click" | "save" | "compare" | "quote_request" | "visit_request" | "booking_request" | "brochure";

export type Lead = {
  id: string;
  source: "areas" | "listings" | "detail" | "direct";
  area?: string;
  propertyId?: string | number;
  propertyName?: string;
  roomNumber?: string;
  action: LeadAction;
  name?: string;
  phone?: string;
  email?: string;
  moveInDate?: string;
  notes?: string;
  stage: LeadStage;
  score: number; // 0–100
  createdAt: string;
  updatedAt: string;
};

export type DemandEvent = {
  id: string;
  action: LeadAction;
  area?: string;
  propertyId?: string | number;
  propertyName?: string;
  createdAt: string;
};

function scoreFor(action: LeadAction): number {
  return ({ view: 5, wa_click: 25, call_click: 30, save: 15, compare: 15,
    quote_request: 55, visit_request: 70, booking_request: 90, brochure: 20 } as any)[action] || 10;
}
function stageFor(action: LeadAction): LeadStage {
  if (action === "booking_request") return "booked";
  if (action === "visit_request") return "visit";
  if (action === "quote_request") return "quoted";
  if (["wa_click", "call_click", "save"].includes(action)) return "qualified";
  return "new";
}

export const LeadsDB = {
  all(): Lead[] { if (typeof localStorage === "undefined") return []; return load(K); },
  get(id: string) { return this.all().find((l) => l.id === id); },
  create(input: Partial<Lead>): Lead {
    const all = this.all();
    const now = new Date().toISOString();
    const action = (input.action || "view") as LeadAction;
    const row: Lead = {
      id: uid(),
      source: input.source || "direct",
      area: input.area,
      propertyId: input.propertyId,
      propertyName: input.propertyName,
      roomNumber: input.roomNumber,
      action,
      name: input.name,
      phone: input.phone,
      email: input.email,
      moveInDate: input.moveInDate,
      notes: input.notes,
      stage: input.stage || stageFor(action),
      score: input.score ?? scoreFor(action),
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(row); save(K, all); notify(); return row;
  },
  update(id: string, patch: Partial<Lead>) {
    const all = this.all();
    const i = all.findIndex((l) => l.id === id);
    if (i === -1) return null;
    all[i] = { ...all[i], ...patch, updatedAt: new Date().toISOString() };
    save(K, all); notify(); return all[i];
  },
  del(id: string) { save(K, this.all().filter((l) => l.id !== id)); notify(); },
  replace(rows: Lead[]) { save(K, rows); notify(); },
};

export const EventsDB = {
  all(): DemandEvent[] { if (typeof localStorage === "undefined") return []; return load(EK); },
  create(e: Partial<DemandEvent>) {
    if (typeof localStorage === "undefined") return;
    const all = this.all();
    const row: DemandEvent = {
      id: uid(),
      action: (e.action || "view") as LeadAction,
      area: e.area, propertyId: e.propertyId, propertyName: e.propertyName,
      createdAt: new Date().toISOString(),
    };
    all.unshift(row);
    save(EK, all.slice(0, 2000)); // cap
    notify();
  },
  replace(rows: DemandEvent[]) { save(EK, rows); notify(); },
};

// Single entry point used by public pages
export function track(action: LeadAction, meta: Partial<Lead> = {}) {
  if (typeof localStorage === "undefined") return;
  EventsDB.create({ action, area: meta.area, propertyId: meta.propertyId, propertyName: meta.propertyName });
  // Only create lead row for high-intent actions or when contact provided
  const highIntent: LeadAction[] = ["quote_request", "visit_request", "booking_request", "brochure", "wa_click", "call_click"];
  if (highIntent.includes(action) || meta.phone) {
    LeadsDB.create({ ...meta, action });
  }
}

export function funnelByArea() {
  const ev = EventsDB.all();
  const leads = LeadsDB.all();
  const map: Record<string, { views: number; enquiries: number; quotes: number; visits: number; bookings: number }> = {};
  ev.forEach((e) => {
    if (!e.area) return;
    map[e.area] ||= { views: 0, enquiries: 0, quotes: 0, visits: 0, bookings: 0 };
    if (e.action === "view") map[e.area].views++;
    if (["wa_click", "call_click", "save"].includes(e.action)) map[e.area].enquiries++;
    if (e.action === "quote_request") map[e.area].quotes++;
    if (e.action === "visit_request") map[e.area].visits++;
    if (e.action === "booking_request") map[e.area].bookings++;
  });
  leads.forEach((l) => {
    if (!l.area) return;
    map[l.area] ||= { views: 0, enquiries: 0, quotes: 0, visits: 0, bookings: 0 };
    if (l.stage === "booked") map[l.area].bookings++;
  });
  return Object.entries(map).map(([area, v]) => ({ area, ...v }))
    .sort((a, b) => b.views + b.bookings * 10 - (a.views + a.bookings * 10));
}

export function leadStats() {
  const all = LeadsDB.all();
  const by: any = { new: 0, qualified: 0, quoted: 0, visit: 0, booked: 0, lost: 0 };
  all.forEach((l) => { by[l.stage]++; });
  return { total: all.length, ...by, avgScore: all.length ? Math.round(all.reduce((s, l) => s + l.score, 0) / all.length) : 0 };
}

export function useLeadsStore<T>(getter: () => T): T {
  const [v, setV] = useState(getter);
  useEffect(() => { setV(getter()); const u = subscribe(() => setV(getter())); return () => { u; }; // eslint-disable-next-line
  }, []);
  return v;
}
