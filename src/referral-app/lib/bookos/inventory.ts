// @ts-nocheck
// Inventory OS — Property → Floor → Room → Bed + readiness engine
import { useEffect, useState } from "react";

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
    key,
    all(): T[] { return load(key); },
    get(id: string): T | undefined { return load(key).find((x: T) => x.id === id); },
    where(fn: (r: T) => boolean): T[] { return load(key).filter(fn); },
    create(data: Omit<T, "id">): T { const all = load(key); const row = { id: uid(), ...data } as T; all.unshift(row); save(key, all); notify(); return row; },
    update(id: string, patch: Partial<T>): T | null { const all = load(key); const i = all.findIndex((x: T) => x.id === id); if (i === -1) return null; all[i] = { ...all[i], ...patch }; save(key, all); notify(); return all[i]; },
    del(id: string) { save(key, load(key).filter((x: T) => x.id !== id)); notify(); },
    replace(rows: T[]) { save(key, rows); notify(); },
  };
}

export type Floor = { id: string; propertyId: string; number: number; name?: string; wing?: string; createdAt: string };
export const FloorsDB = makeDB<Floor>("floors");

export type CommercialStatus = "available" | "reserved" | "quoted" | "booked" | "occupied" | "notice";
export type OperationalStatus = "ready" | "cleaning" | "maintenance" | "inspection_pending" | "audit_pending";
export type Turnaround = "none" | "checkout_today" | "checkout_tomorrow" | "movein_today" | "movein_scheduled";

export type RoomX = {
  id: string;
  propertyId: string;
  floorId?: string;
  roomNumber: string;
  wing?: string;
  type?: string; // Standard/Deluxe/Premium
  category?: string;
  gender?: "male" | "female" | "any";
  sharing: number; // capacity
  carpetArea?: number;
  ceilingHeight?: number;
  windows?: number;
  rent: number;
  deposit?: number;
  // Equipment lists (string ids)
  furniture: string[];
  utilities: string[];
  amenities: string[];
  electrical: { usbPorts: number; sockets: number; internetPoints: number; smartSwitches: boolean };
  photos?: string[];
  notes?: string;
  // Readiness
  commercialStatus: CommercialStatus;
  operationalStatus: OperationalStatus;
  turnaround: Turnaround;
  readyDate?: string | null;
  createdAt: string;
  updatedAt: string;
};
export const RoomsXDB = makeDB<RoomX>("roomsx");

export type Bed = { id: string; roomId: string; label: string; status: "vacant" | "occupied" | "reserved" | "blocked"; tenantName?: string; createdAt: string };
export const BedsDB = makeDB<Bed>("beds");

// Option catalogs (used by add-room form)
export const FURNITURE = ["Bed", "Mattress", "Wardrobe", "Study Table", "Chair", "Mirror", "Shoe Rack", "Curtains", "Bedside Table"];
export const UTILITIES = ["Fan", "AC", "Geyser", "Refrigerator", "Microwave", "Induction", "RO Water", "TV"];
export const AMENITIES = ["Attached Bathroom", "Balcony", "Window", "Sunlight", "Cross Ventilation", "Pet Friendly"];

// Readiness score 0..100
export function readinessScore(r: RoomX): number {
  let s = 0;
  // commercial
  s += { available: 35, reserved: 20, quoted: 25, booked: 15, occupied: 0, notice: 10 }[r.commercialStatus] ?? 0;
  // operational
  s += { ready: 40, cleaning: 20, maintenance: 0, inspection_pending: 25, audit_pending: 25 }[r.operationalStatus] ?? 0;
  // turnaround
  s += { none: 25, movein_today: 15, movein_scheduled: 20, checkout_today: 10, checkout_tomorrow: 15 }[r.turnaround] ?? 0;
  return Math.min(100, s);
}
export function readyToSell(r: RoomX): boolean {
  return ["available", "quoted"].includes(r.commercialStatus) && r.operationalStatus === "ready";
}

export const ROOM_STATUS_COLOR: Record<CommercialStatus, string> = {
  available: "bg-emerald-500",
  reserved: "bg-amber-400",
  quoted: "bg-blue-400",
  booked: "bg-violet-500",
  occupied: "bg-rose-500",
  notice: "bg-orange-500",
};
export const ROOM_STATUS_LABEL: Record<CommercialStatus, string> = {
  available: "Vacant", reserved: "Reserved", quoted: "Quoted",
  booked: "Booked", occupied: "Occupied", notice: "On notice",
};

export function useInventoryStore<T>(getter: () => T): T {
  const [v, setV] = useState(getter);
  useEffect(() => { setV(getter()); const u = subscribe(() => setV(getter())); return () => { u; }; // eslint-disable-next-line
  }, []);
  return v;
}

// Property health score
export function propertyHealth(p: any, rooms: RoomX[], rents: any[], maint: any[]): number {
  const total = rooms.length || 1;
  const occ = rooms.filter((r) => ["occupied", "booked"].includes(r.commercialStatus)).length / total;
  const collected = rents.filter((r) => r.propertyName === p.name && r.status === "paid").length;
  const totalRents = Math.max(1, rents.filter((r) => r.propertyName === p.name).length);
  const collection = collected / totalRents;
  const openMaint = maint.filter((m) => m.propertyName === p.name && m.status !== "done").length;
  const maintScore = Math.max(0, 1 - openMaint / 10);
  return Math.round(occ * 25 + collection * 25 + maintScore * 15 + 0.8 * 15 + 0.7 * 10 + collection * 10);
}
