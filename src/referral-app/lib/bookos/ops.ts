// @ts-nocheck
// Room Booking OS — visits, room timeline, USP, pricing, move-in pack
import { useEffect, useState } from "react";
import { RoomsXDB, FloorsDB, BedsDB, readyToSell } from "./inventory";
import { BookingsDB, PropertiesDB, NotificationsDB, ActivityDB, RentsDB, PaymentsDB, TenantsDB, Settings, Templates } from "./store";
import { waLink, fillTemplate } from "./format";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const K = (n: string) => `bookos_${n}_v1`;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
const load = (k: string) => { if (typeof localStorage === "undefined") return []; try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const save = (k: string, d: any) => { if (typeof localStorage === "undefined") return; localStorage.setItem(k, JSON.stringify(d)); };

function makeDB<T extends { id: string }>(name: string) {
  const key = K(name);
  return {
    key, all(): T[] { return load(key); },
    get(id: string): T | undefined { return load(key).find((x: T) => x.id === id); },
    where(fn: (r: T) => boolean): T[] { return load(key).filter(fn); },
    create(data: Omit<T, "id">): T { const all = load(key); const row = { id: uid(), ...data } as T; all.unshift(row); save(key, all); notify(); return row; },
    update(id: string, patch: Partial<T>): T | null { const all = load(key); const i = all.findIndex((x: T) => x.id === id); if (i === -1) return null; all[i] = { ...all[i], ...patch }; save(key, all); notify(); return all[i]; },
    del(id: string) { save(key, load(key).filter((x: T) => x.id !== id)); notify(); },
    replace(rows: T[]) { save(key, rows); notify(); },
  };
}

/* ─── Visits ─────────────────────────────────────────────── */
export type VisitStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "no_show" | "cancelled" | "converted";
export type Visit = {
  id: string;
  propertyId: string; propertyName: string;
  floorId?: string; roomId?: string; roomNumber?: string; bedId?: string;
  customerName: string; customerPhone: string; customerEmail?: string;
  date: string; time: string; // "2026-06-11" "18:00"
  coordinatorName?: string; managerName?: string; managerPhone?: string;
  status: VisitStatus; probability: number; // 0..100
  notes?: string; outcome?: string;
  createdAt: string; updatedAt: string;
};
export const VisitsDB = makeDB<Visit>("visits");

/* ─── Room timeline events ───────────────────────────────── */
export type RoomEvent = {
  id: string; roomId: string;
  kind: "status" | "readiness" | "visit" | "quote" | "booking" | "payment" | "movein" | "note" | "usp" | "price";
  title: string; detail?: string; meta?: any; createdAt: string;
};
export const RoomEventsDB = makeDB<RoomEvent>("room_events");
export const logRoom = (roomId: string, kind: RoomEvent["kind"], title: string, detail?: string, meta?: any) =>
  RoomEventsDB.create({ roomId, kind, title, detail, meta, createdAt: new Date().toISOString() } as any);

/* ─── Room Bookings (room-linked tokens/contracts) ───────── */
export type RoomBooking = {
  id: string; bookingId?: string;
  roomId: string; bedId?: string;
  customerName: string; customerPhone: string;
  rent: number; deposit: number; token: number;
  moveInDate?: string; status: "draft" | "token_pending" | "token_paid" | "deposit_paid" | "rent_paid" | "movein_done" | "cancelled";
  collected: { token: boolean; deposit: boolean; firstRent: boolean; agreement: boolean; kyc: boolean };
  createdAt: string; updatedAt: string;
};
export const RoomBookingsDB = makeDB<RoomBooking>("room_bookings");

/* ─── USP / catalog options (the "sub-options") ──────────── */
export const USP = {
  size: ["Extra Large", "Large", "Medium", "Compact", "Small"],
  ventilation: ["Excellent", "Good", "Average", "Poor", "None"],
  window: ["Corner Window", "Full Window", "Large Window", "Medium Window", "Small Window", "No Window"],
  sunlight: ["Full Day", "Morning", "Evening", "Limited"],
  view: ["Balcony", "Garden", "Open", "Road", "Internal"],
  washroom: ["Attached", "Semi-attached", "Common"],
  noise: ["Silent", "Low", "Medium", "High"],
  position: ["Corner", "End Corridor", "Independent", "Near Lift", "Near Terrace"],
  furniture: ["Premium", "Standard", "Newly Installed"],
};

export const READINESS_REASONS = {
  available: ["Ready now", "Ready today evening", "Ready tomorrow", "Ready after cleaning"],
  occupied: ["Tenant leaving today", "Tenant leaving this week", "Tenant leaving next month", "Renewal expected"],
  maintenance: ["Plumbing", "Electrical", "Furniture", "Painting", "Appliance issue"],
  cleaning: ["Standard cleaning", "Deep cleaning", "Sanitization"],
  inspection_pending: ["Operations check", "Owner approval"],
  notice: ["Notice served", "Awaiting handover"],
};

/* ─── Pricing Engine ─────────────────────────────────────── */
export function computeSuggestedPrice(opts: {
  base: number; floor?: number; sharing?: number; usp?: any; demand?: number;
}) {
  const base = opts.base || 0;
  const floorPrem = (opts.floor ?? 1) >= 2 ? (opts.floor! - 1) * 250 : 0; // higher floor premium
  const sizeMap: any = { "Extra Large": 1500, Large: 1000, Medium: 500, Compact: 200, Small: 0 };
  const windowMap: any = { "Corner Window": 600, "Full Window": 500, "Large Window": 400, "Medium Window": 200, "Small Window": 100, "No Window": -500 };
  const ventMap: any = { Excellent: 400, Good: 200, Average: 0, Poor: -200, None: -500 };
  const washMap: any = { Attached: 1000, "Semi-attached": 400, Common: 0 };
  const viewMap: any = { Balcony: 700, Garden: 500, Open: 300, Road: -100, Internal: 0 };
  const u = opts.usp || {};
  const breakdown = {
    base, floorPrem,
    size: sizeMap[u.size] || 0,
    window: windowMap[u.window] || 0,
    ventilation: ventMap[u.ventilation] || 0,
    washroom: washMap[u.washroom] || 0,
    view: viewMap[u.view] || 0,
    demand: Math.round((opts.demand || 0) * base * 0.05),
  };
  const total = Object.values(breakdown).reduce((s: any, v: any) => s + v, 0);
  return { suggested: Math.max(0, Math.round(total / 100) * 100), breakdown };
}

/* ─── Move-In Pack & Customer Confirmation ──────────────── */
export function generateMoveInPack(args: { booking?: any; room?: any; property?: any; visit?: any }) {
  const { booking, room, property } = args;
  const set = Settings.get();
  const addr = property?.address || `${property?.name}, ${property?.area}`;
  const maps = `https://maps.google.com/?q=${encodeURIComponent(addr || property?.name || "")}`;
  const lines = [
    `🏠 *${property?.name || booking?.propertyName}*`,
    `Booking confirmed for ${booking?.tenantName || ""}`,
    ``,
    `📍 Address: ${addr}`,
    `🗺 Maps: ${maps}`,
    ``,
    `🚪 Room: ${room?.roomNumber || booking?.roomNumber || "—"}`,
    `🛏 Sharing: ${room?.sharing || "—"}`,
    `📅 Move-in: ${booking?.moveInDate || "TBD"}`,
    ``,
    `💰 Rent: ₹${(booking?.discountedRent || room?.rent || 0).toLocaleString("en-IN")}/mo`,
    `🔒 Deposit: ₹${(booking?.deposit || 0).toLocaleString("en-IN")}`,
    `🎟 Token: ₹${(booking?.tokenAmount || 0).toLocaleString("en-IN")} ${booking?.paidRef ? "(paid · " + booking.paidRef + ")" : "(pending)"}`,
    ``,
    `👤 Property Manager: ${property?.ownerName || "—"}`,
    `📞 Manager #: ${property?.ownerPhone || set.adminPhone}`,
    `📞 24×7 Support: ${set.adminPhone}`,
    ``,
    `✅ Check-in: ${booking?.moveInDate || "TBD"} after 12 noon`,
    `📜 House rules + WiFi shared on move-in`,
    ``,
    `— Team ${set.brand}`,
  ];
  const text = lines.join("\n");
  return {
    text,
    maps,
    waUrl: waLink(booking?.tenantPhone || "", text),
    address: addr,
    managerPhone: property?.ownerPhone || set.adminPhone,
  };
}

/* ─── Workflow helpers ─────────────────────────────────── */
export const Ops = {
  setReadiness(roomId: string, patch: Partial<{ commercialStatus: string; operationalStatus: string; turnaround: string; readyDate: string | null; reason: string }>) {
    const r = RoomsXDB.update(roomId, { ...patch, updatedAt: new Date().toISOString() } as any);
    if (r) {
      logRoom(roomId, "readiness", "Readiness updated", `${patch.commercialStatus || r.commercialStatus} · ${patch.operationalStatus || r.operationalStatus}${patch.reason ? " · " + patch.reason : ""}`);
    }
    return r;
  },
  updateUSP(roomId: string, usp: any) {
    const r = RoomsXDB.update(roomId, { usp, updatedAt: new Date().toISOString() } as any);
    if (r) logRoom(roomId, "usp", "Selling points updated", Object.entries(usp).map(([k, v]) => `${k}: ${v}`).join(" · "));
    return r;
  },
  updatePricing(roomId: string, rent: number, breakdown?: any) {
    const r = RoomsXDB.update(roomId, { rent, priceBreakdown: breakdown, updatedAt: new Date().toISOString() } as any);
    if (r) logRoom(roomId, "price", "Rent updated", `₹${rent.toLocaleString("en-IN")}`);
    return r;
  },
  scheduleVisit(v: Partial<Visit>) {
    const now = new Date().toISOString();
    const visit = VisitsDB.create({
      ...v, status: "scheduled", probability: 60, createdAt: now, updatedAt: now,
    } as any);
    // soft-lock the room
    if (v.roomId) {
      const r = RoomsXDB.get(v.roomId);
      if (r && r.commercialStatus === "available") RoomsXDB.update(v.roomId, { commercialStatus: "reserved", updatedAt: now } as any);
      logRoom(v.roomId, "visit", `Visit scheduled · ${v.customerName}`, `${v.date} ${v.time} · ${v.customerPhone}`);
    }
    NotificationsDB.create({ title: `Visit scheduled · ${v.customerName}`, body: `${v.propertyName} · ${v.date} ${v.time}`, kind: "info", read: false, createdAt: now, link: "/manager/bookos/visits" } as any);
    return visit;
  },
  updateVisit(id: string, patch: Partial<Visit>) {
    return VisitsDB.update(id, { ...patch, updatedAt: new Date().toISOString() } as any);
  },
  createRoomBooking(args: { roomId: string; bedId?: string; customerName: string; customerPhone: string; rent: number; deposit: number; token: number; moveInDate?: string }) {
    const now = new Date().toISOString();
    const room = RoomsXDB.get(args.roomId);
    const prop = room ? PropertiesDB.all().find((p: any) => p.id === room.propertyId) : null;
    // create RoomBooking and a Booking (legacy)
    const rb = RoomBookingsDB.create({
      roomId: args.roomId, bedId: args.bedId,
      customerName: args.customerName, customerPhone: args.customerPhone,
      rent: args.rent, deposit: args.deposit, token: args.token, moveInDate: args.moveInDate,
      status: "token_pending",
      collected: { token: false, deposit: false, firstRent: false, agreement: false, kyc: false },
      createdAt: now, updatedAt: now,
    } as any);
    const b = BookingsDB.create({
      tenantName: args.customerName, tenantPhone: args.customerPhone,
      propertyName: prop?.name || "—", roomNumber: room?.roomNumber || null,
      moveInDate: args.moveInDate || null,
      actualRent: args.rent, discountedRent: args.rent, deposit: args.deposit,
      maintenanceFee: 0, maintenanceType: "One-Time",
      tokenAmount: args.token, stayDurationMonths: 11, noticePeriodMonths: 1,
      status: "pending", createdAt: now, updatedAt: now,
    } as any);
    RoomBookingsDB.update(rb.id, { bookingId: b.id } as any);
    if (room) {
      RoomsXDB.update(room.id, { commercialStatus: "booked", updatedAt: now } as any);
      logRoom(room.id, "booking", `Booking created · ${args.customerName}`, `₹${args.rent.toLocaleString()}/mo · token ₹${args.token.toLocaleString()}`);
    }
    NotificationsDB.create({ title: `Booking created · ${args.customerName}`, body: `${prop?.name} ${room?.roomNumber || ""} · ₹${args.token.toLocaleString()} token`, kind: "success", read: false, createdAt: now, link: `/manager/bookos/bookings/${b.id}` } as any);
    return { booking: b, roomBooking: rb };
  },
  collect(rbId: string, kind: "token" | "deposit" | "firstRent" | "agreement" | "kyc", amount?: number, method: any = "UPI", ref?: string) {
    const rb = RoomBookingsDB.get(rbId);
    if (!rb) return null;
    const collected = { ...rb.collected, [kind]: true };
    RoomBookingsDB.update(rbId, { collected } as any);
    if (amount && (kind === "token" || kind === "deposit" || kind === "firstRent")) {
      PaymentsDB.create({ bookingId: rb.bookingId, tenantName: rb.customerName, amount, method, ref, type: kind === "firstRent" ? "rent" : kind, createdAt: new Date().toISOString() } as any);
    }
    logRoom(rb.roomId, "payment", `${kind} collected`, amount ? `₹${amount.toLocaleString()}${ref ? " · " + ref : ""}` : undefined);
    return RoomBookingsDB.get(rbId);
  },
  approveMoveIn(rbId: string) {
    const rb = RoomBookingsDB.get(rbId);
    if (!rb) return null;
    const all = Object.values(rb.collected);
    if (!all.every(Boolean)) { alert("Complete the move-in checklist first"); return null; }
    const room = RoomsXDB.get(rb.roomId);
    const prop = room ? PropertiesDB.all().find((p: any) => p.id === room.propertyId) : null;
    const now = new Date().toISOString();
    RoomBookingsDB.update(rbId, { status: "movein_done" } as any);
    RoomsXDB.update(rb.roomId, { commercialStatus: "occupied", updatedAt: now } as any);
    TenantsDB.create({
      name: rb.customerName, phone: rb.customerPhone,
      propertyName: prop?.name || "—", roomNumber: room?.roomNumber,
      moveInDate: rb.moveInDate || now.slice(0, 10),
      rent: rb.rent, deposit: rb.deposit, status: "active", createdAt: now,
    } as any);
    const month = (rb.moveInDate || now).slice(0, 7);
    RentsDB.create({ bookingId: rb.bookingId, tenantName: rb.customerName, propertyName: prop?.name || "—", month, amount: rb.rent, status: "paid", paidAt: now, createdAt: now } as any);
    logRoom(rb.roomId, "movein", `Move-in approved · ${rb.customerName}`, prop?.name);
    NotificationsDB.create({ title: `✓ Move-in: ${rb.customerName}`, body: `${prop?.name} ${room?.roomNumber}`, kind: "success", read: false, createdAt: now, link: "/manager/bookos/movein" } as any);
    return rb;
  },
};

/* ─── Hooks ──────────────────────────────────────────────── */
export function useOps<T>(getter: () => T): T {
  const [v, setV] = useState(getter);
  useEffect(() => { setV(getter()); const u = subscribe(() => setV(getter())); return () => { u; }; // eslint-disable-next-line
  }, []);
  return v;
}
