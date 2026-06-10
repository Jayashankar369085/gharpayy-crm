// @ts-nocheck
// Unified BookOS store — localStorage + pub/sub
import { useEffect, useState } from "react";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const K = (n: string) => `bookos_${n}_v1`;

const load = (k: string) => {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const save = (k: string, d: any) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(k, JSON.stringify(d));
};

const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach((f) => f());

function makeDB<T extends { id: string }>(name: string) {
  const key = K(name);
  return {
    key,
    all(): T[] { return load(key); },
    get(id: string): T | undefined { return load(key).find((x: T) => x.id === id); },
    create(data: Omit<T, "id">): T {
      const all = load(key);
      const row = { id: uid(), ...data } as T;
      all.unshift(row); save(key, all); notify(); return row;
    },
    update(id: string, patch: Partial<T>): T | null {
      const all = load(key);
      const i = all.findIndex((x: T) => x.id === id);
      if (i === -1) return null;
      all[i] = { ...all[i], ...patch };
      save(key, all); notify(); return all[i];
    },
    del(id: string) {
      save(key, load(key).filter((x: T) => x.id !== id)); notify();
    },
    replace(rows: T[]) { save(key, rows); notify(); },
  };
}

/* Entities */
export type BookingStatus = "pending" | "approved" | "paid" | "expired" | "cancelled";
export type Booking = {
  id: string; tenantName: string; tenantPhone: string; propertyName: string;
  roomNumber?: string | null; moveInDate?: string | null;
  actualRent: number; discountedRent: number; deposit: number;
  maintenanceFee: number; maintenanceType: "One-Time" | "Monthly";
  tokenAmount: number; stayDurationMonths: number; noticePeriodMonths: number;
  upiId?: string; adminPhone?: string; notes?: string;
  status: BookingStatus; offerExpiresAt?: string | null; paidRef?: string | null;
  createdAt: string; updatedAt: string; createdBy?: string;
};
export const BookingsDB = makeDB<Booking>("bookings");

export type Rent = {
  id: string; bookingId?: string; tenantName: string; propertyName: string;
  month: string; amount: number; status: "paid" | "pending" | "overdue";
  paidAt?: string | null; ref?: string | null; createdAt: string;
};
export const RentsDB = makeDB<Rent>("rents");

export type Quotation = {
  id: string; serial: string; tenantName: string; tenantPhone: string;
  propertyName: string; roomNumber?: string; rent: number; deposit: number;
  maintenance: number; tokenAmount: number; offerRent: number;
  notes?: string; status: "draft" | "sent" | "accepted" | "rejected" | "converted";
  createdAt: string; sentAt?: string; createdBy?: string;
};
export const QuotationsDB = makeDB<Quotation>("quotations");

export type Tenant = {
  id: string; name: string; phone: string; email?: string;
  propertyName: string; roomNumber?: string;
  moveInDate?: string; rent: number; deposit: number;
  status: "active" | "notice" | "exited"; notes?: string; createdAt: string;
};
export const TenantsDB = makeDB<Tenant>("tenants");

export type Property = {
  id: string; name: string; area: string; address?: string;
  totalRooms: number; occupiedRooms: number; rentRange: string;
  ownerName?: string; ownerPhone?: string; createdAt: string;
};
export const PropertiesDB = makeDB<Property>("properties");

export type Payment = {
  id: string; bookingId?: string; tenantName: string; amount: number;
  method: "UPI" | "Cash" | "Bank" | "Card"; ref?: string;
  type: "token" | "rent" | "deposit" | "other"; createdAt: string;
};
export const PaymentsDB = makeDB<Payment>("payments");

export type Expense = {
  id: string; category: string; vendor?: string; amount: number;
  propertyName?: string; notes?: string; date: string; createdAt: string;
};
export const ExpensesDB = makeDB<Expense>("expenses");

export type Maintenance = {
  id: string; title: string; propertyName: string; roomNumber?: string;
  priority: "low" | "med" | "high"; status: "open" | "in_progress" | "done";
  assignee?: string; cost?: number; notes?: string; createdAt: string;
};
export const MaintenanceDB = makeDB<Maintenance>("maintenance");

export type Staff = {
  id: string; name: string; phone: string; role: string;
  email?: string; active: boolean; createdAt: string;
};
export const StaffDB = makeDB<Staff>("staff");

export type Document = {
  id: string; title: string; type: "agreement" | "id" | "invoice" | "other";
  tenantName?: string; propertyName?: string; url?: string; notes?: string;
  createdAt: string;
};
export const DocumentsDB = makeDB<Document>("documents");

export type Notification = {
  id: string; title: string; body?: string;
  kind: "info" | "warn" | "success" | "danger"; read: boolean;
  link?: string; createdAt: string;
};
export const NotificationsDB = makeDB<Notification>("notifications");

export type Activity = {
  id: string; actor?: string; action: string; entity: string;
  entityId?: string; meta?: any; createdAt: string;
};
export const ActivityDB = makeDB<Activity>("activity");

/* Settings (single object) */
const SETTINGS_KEY = K("settings_obj");
export const Settings = {
  get() {
    if (typeof localStorage === "undefined") return defaultSettings();
    try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
    catch { return defaultSettings(); }
  },
  set(patch: any) {
    const cur = Settings.get();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...cur, ...patch }));
    notify();
  },
};
function defaultSettings() {
  return {
    brand: "Gharpayy",
    upiId: "gharpayy@upi",
    adminPhone: "+919876543210",
    offerWindowMins: 15,
    currency: "INR",
  };
}

/* Templates */
const TPL_KEY = K("templates_obj");
export const Templates = {
  get() {
    if (typeof localStorage === "undefined") return defaultTemplates();
    try { return { ...defaultTemplates(), ...JSON.parse(localStorage.getItem(TPL_KEY) || "{}") }; }
    catch { return defaultTemplates(); }
  },
  set(patch: any) {
    localStorage.setItem(TPL_KEY, JSON.stringify({ ...Templates.get(), ...patch })); notify();
  },
};
function defaultTemplates() {
  return {
    offer: "Hi {name}! Locked an exclusive offer for {property} room {room}: ₹{offer}/mo (was ₹{rent}). Pay ₹{token} token via UPI to confirm. Expires in {mins} min.",
    reminder: "{name}, your offer for {property} expires in {mins} min. Pay token to lock it.",
    paid: "Thanks {name}! Token of ₹{token} received. Welcome to {property}. Move-in: {movein}.",
    overdue: "Hi {name}, rent of ₹{amount} for {month} is overdue. Please pay at the earliest.",
  };
}

/* Hook */
export function useStore<T>(getter: () => T): T {
  const [v, setV] = useState(getter);
  useEffect(() => {
    setV(getter());
    const u = subscribe(() => setV(getter()));
    return () => { u; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

/* Workflow helpers — cross-module wiring (the "100x" part) */
export const Workflow = {
  approveBooking(id: string, windowMins?: number) {
    const mins = windowMins ?? Settings.get().offerWindowMins;
    const b = BookingsDB.update(id, {
      status: "approved",
      offerExpiresAt: new Date(Date.now() + mins * 60000).toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (b) {
      ActivityDB.create({ action: "approved", entity: "booking", entityId: id, createdAt: new Date().toISOString() });
      NotificationsDB.create({ title: `Offer live for ${b.tenantName}`, body: `${b.propertyName} · ₹${b.discountedRent} · ${mins}m timer`, kind: "info", read: false, createdAt: new Date().toISOString(), link: `/manager/bookos/bookings/${id}` });
    }
    return b;
  },
  markPaid(id: string, ref?: string) {
    const b = BookingsDB.update(id, { status: "paid", paidRef: ref || null, updatedAt: new Date().toISOString() });
    if (!b) return null;
    // auto-create tenant
    TenantsDB.create({
      name: b.tenantName, phone: b.tenantPhone, propertyName: b.propertyName,
      roomNumber: b.roomNumber || undefined, moveInDate: b.moveInDate || undefined,
      rent: b.discountedRent, deposit: b.deposit, status: "active",
      createdAt: new Date().toISOString(),
    });
    // first rent record
    const month = (b.moveInDate || new Date().toISOString()).slice(0, 7);
    RentsDB.create({
      bookingId: b.id, tenantName: b.tenantName, propertyName: b.propertyName,
      month, amount: b.discountedRent, status: "pending", createdAt: new Date().toISOString(),
    });
    // payment record
    PaymentsDB.create({
      bookingId: b.id, tenantName: b.tenantName, amount: b.tokenAmount,
      method: "UPI", ref: ref, type: "token", createdAt: new Date().toISOString(),
    });
    ActivityDB.create({ action: "paid", entity: "booking", entityId: id, meta: { amount: b.tokenAmount }, createdAt: new Date().toISOString() });
    NotificationsDB.create({ title: `✓ ${b.tenantName} paid token`, body: `${b.propertyName} · ₹${b.tokenAmount}`, kind: "success", read: false, createdAt: new Date().toISOString(), link: `/manager/bookos/bookings/${id}` });
    return b;
  },
  cancelBooking(id: string) {
    const b = BookingsDB.update(id, { status: "cancelled", updatedAt: new Date().toISOString() });
    if (b) ActivityDB.create({ action: "cancelled", entity: "booking", entityId: id, createdAt: new Date().toISOString() });
    return b;
  },
  syncExpiry() {
    const all = BookingsDB.all();
    const now = Date.now();
    let dirty = false;
    all.forEach((b: Booking) => {
      if (b.status === "approved" && b.offerExpiresAt && +new Date(b.offerExpiresAt) <= now) {
        b.status = "expired";
        b.updatedAt = new Date().toISOString();
        dirty = true;
      }
    });
    if (dirty) { BookingsDB.replace(all); }
  },
  syncRentOverdue() {
    const all = RentsDB.all();
    const today = new Date(); today.setHours(0,0,0,0);
    const cutoffMonth = today.toISOString().slice(0,7);
    let dirty = false;
    all.forEach((r: Rent) => {
      if (r.status === "pending" && r.month < cutoffMonth) {
        r.status = "overdue"; dirty = true;
      }
    });
    if (dirty) RentsDB.replace(all);
  },
  convertQuoteToBooking(qid: string): Booking | null {
    const q = QuotationsDB.get(qid);
    if (!q) return null;
    const now = new Date().toISOString();
    const b = BookingsDB.create({
      tenantName: q.tenantName, tenantPhone: q.tenantPhone, propertyName: q.propertyName,
      roomNumber: q.roomNumber || null, moveInDate: null,
      actualRent: q.rent, discountedRent: q.offerRent || q.rent,
      deposit: q.deposit, maintenanceFee: q.maintenance, maintenanceType: "One-Time",
      tokenAmount: q.tokenAmount, stayDurationMonths: 11, noticePeriodMonths: 1,
      status: "pending", createdAt: now, updatedAt: now,
    } as any);
    QuotationsDB.update(qid, { status: "converted" });
    ActivityDB.create({ action: "converted", entity: "quotation", entityId: qid, meta: { bookingId: b.id }, createdAt: now });
    return b;
  },
};

/* Aggregate stats */
export function bookingStats() {
  const all = BookingsDB.all();
  return {
    total: all.length,
    pending: all.filter((b: Booking) => b.status === "pending").length,
    approved: all.filter((b: Booking) => b.status === "approved").length,
    paid: all.filter((b: Booking) => b.status === "paid").length,
    expired: all.filter((b: Booking) => b.status === "expired").length,
    tokenRevenue: all.filter((b: Booking) => b.status === "paid").reduce((s: number, b: Booking) => s + b.tokenAmount, 0),
    avgTicket: all.length ? Math.round(all.reduce((s: number, b: Booking) => s + b.discountedRent, 0) / all.length) : 0,
    conversion: all.length ? Math.round((all.filter((b: Booking) => b.status === "paid").length / all.length) * 100) : 0,
  };
}
export function rentStats() {
  const all = RentsDB.all();
  return {
    collected: all.filter((r: Rent) => r.status === "paid").reduce((s: number, r: Rent) => s + r.amount, 0),
    pending: all.filter((r: Rent) => r.status === "pending").reduce((s: number, r: Rent) => s + r.amount, 0),
    overdue: all.filter((r: Rent) => r.status === "overdue").reduce((s: number, r: Rent) => s + r.amount, 0),
    mrr: all.filter((r: Rent) => r.status !== "overdue").reduce((s: number, r: Rent) => s + r.amount, 0),
  };
}