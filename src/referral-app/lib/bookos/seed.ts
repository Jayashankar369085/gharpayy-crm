// @ts-nocheck
import {
  BookingsDB, RentsDB, QuotationsDB, TenantsDB, PropertiesDB,
  PaymentsDB, ExpensesDB, MaintenanceDB, StaffDB, DocumentsDB,
  NotificationsDB, ActivityDB,
} from "./store";
import { FloorsDB, RoomsXDB, BedsDB } from "./inventory";
import { LeadsDB, EventsDB } from "./leads";
import { VisitsDB, RoomEventsDB, RoomBookingsDB } from "./ops";

const SEED_KEY = "bookos_seeded_v3";
const OPS_SEED_KEY = "bookos_ops_seeded_v1";


export function seedIfEmpty() {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem(SEED_KEY, "1");

  const now = Date.now();
  const iso = (offsetH = 0) => new Date(now - offsetH * 3600000).toISOString();
  const month = (m: number) => { const d = new Date(); d.setMonth(d.getMonth() - m); return d.toISOString().slice(0, 7); };

  const props = [
    { name: "Gharpayy Koramangala", area: "Koramangala", totalRooms: 24, occupiedRooms: 19, rentRange: "₹12K–₹22K", ownerName: "Ramesh", ownerPhone: "+919000000001" },
    { name: "Gharpayy HSR", area: "HSR Layout", totalRooms: 18, occupiedRooms: 15, rentRange: "₹13K–₹24K", ownerName: "Lakshmi", ownerPhone: "+919000000002" },
    { name: "Gharpayy Indiranagar", area: "Indiranagar", totalRooms: 16, occupiedRooms: 11, rentRange: "₹15K–₹28K", ownerName: "Anil", ownerPhone: "+919000000003" },
  ];
  const created = props.map((p) => PropertiesDB.create({ ...p, createdAt: iso(48) }));

  // Floors + Rooms per property
  const commercials = ["available", "occupied", "occupied", "available", "quoted", "occupied", "notice", "reserved"];
  const operationals = ["ready", "ready", "ready", "cleaning", "ready", "maintenance", "ready", "ready"];
  const turnarounds = ["none", "none", "checkout_today", "none", "movein_today", "none", "checkout_tomorrow", "none"];

  created.forEach((p: any, pi: number) => {
    const floorCount = 3 + pi;
    for (let fn = 1; fn <= floorCount; fn++) {
      const f = FloorsDB.create({ propertyId: p.id, number: fn, createdAt: iso(48) } as any);
      const roomsPerFloor = 4 + (pi % 2);
      for (let rn = 1; rn <= roomsPerFloor; rn++) {
        const idx = (fn * rn) % commercials.length;
        const sharing = (rn % 3) + 1;
        const rent = 10000 + sharing * 4000 + pi * 2000;
        const room = RoomsXDB.create({
          propertyId: p.id, floorId: f.id,
          roomNumber: `${fn}0${rn}`,
          type: rn % 2 === 0 ? "Deluxe" : "Standard",
          gender: "any", sharing, rent, deposit: rent * 2,
          carpetArea: 100 + sharing * 40, ceilingHeight: 10, windows: 1 + (rn % 2),
          furniture: ["Bed", "Mattress", "Wardrobe", "Study Table", "Chair"],
          utilities: rn % 2 === 0 ? ["Fan", "AC", "Geyser"] : ["Fan", "Geyser"],
          amenities: ["Attached Bathroom", "Window", ...(rn % 3 === 0 ? ["Balcony"] : [])],
          electrical: { usbPorts: 2 + (rn % 3), sockets: 4, internetPoints: 1, smartSwitches: rn % 4 === 0 },
          commercialStatus: commercials[idx] as any,
          operationalStatus: operationals[idx] as any,
          turnaround: turnarounds[idx] as any,
          createdAt: iso(48), updatedAt: iso(48),
        } as any);
        for (let bi = 0; bi < sharing; bi++) {
          BedsDB.create({ roomId: room.id, label: `Bed ${String.fromCharCode(65 + bi)}`,
            status: room.commercialStatus === "occupied" ? "occupied" : "vacant", createdAt: iso(48) } as any);
        }
      }
    }
  });

  // Staff
  [{ name: "Priya R", phone: "+919876500001", role: "Sales", active: true },
   { name: "Karan S", phone: "+919876500002", role: "Operations", active: true },
   { name: "Ankit M", phone: "+919876500003", role: "Maintenance", active: true }]
    .forEach((s) => StaffDB.create({ ...s, createdAt: iso(72) }));

  // Bookings
  const bookings = [
    { tenantName: "Arjun Mehta", tenantPhone: "+919812345001", propertyName: "Gharpayy Koramangala", roomNumber: "204", actualRent: 18000, discountedRent: 16500, deposit: 33000, maintenanceFee: 1500, maintenanceType: "One-Time", tokenAmount: 2000, stayDurationMonths: 11, noticePeriodMonths: 1, status: "paid", paidRef: "UPI-8821", offerExpiresAt: null, createdAt: iso(72), updatedAt: iso(70) },
    { tenantName: "Neha Kapoor", tenantPhone: "+919812345002", propertyName: "Gharpayy HSR", roomNumber: "112", actualRent: 22000, discountedRent: 19500, deposit: 39000, maintenanceFee: 1500, maintenanceType: "Monthly", tokenAmount: 2500, stayDurationMonths: 11, noticePeriodMonths: 1, status: "approved", offerExpiresAt: new Date(now + 12 * 60000).toISOString(), createdAt: iso(2), updatedAt: iso(1) },
    { tenantName: "Vivek Sharma", tenantPhone: "+919812345003", propertyName: "Gharpayy Indiranagar", roomNumber: "301", actualRent: 25000, discountedRent: 23000, deposit: 46000, maintenanceFee: 2000, maintenanceType: "One-Time", tokenAmount: 3000, stayDurationMonths: 11, noticePeriodMonths: 1, status: "pending", offerExpiresAt: null, createdAt: iso(1), updatedAt: iso(1) },
  ];
  bookings.forEach((b) => BookingsDB.create(b as any));

  TenantsDB.create({ name: "Arjun Mehta", phone: "+919812345001", propertyName: "Gharpayy Koramangala", roomNumber: "204", moveInDate: month(2) + "-01", rent: 16500, deposit: 33000, status: "active", createdAt: iso(72) });
  TenantsDB.create({ name: "Rohit Das", phone: "+919812345010", propertyName: "Gharpayy HSR", roomNumber: "203", moveInDate: month(5) + "-01", rent: 17500, deposit: 35000, status: "active", createdAt: iso(720) });
  TenantsDB.create({ name: "Megha P", phone: "+919812345011", propertyName: "Gharpayy Indiranagar", roomNumber: "202", moveInDate: month(8) + "-01", rent: 21000, deposit: 42000, status: "notice", createdAt: iso(1500) });

  for (let m = 0; m < 3; m++) {
    RentsDB.create({ tenantName: "Arjun Mehta", propertyName: "Gharpayy Koramangala", month: month(m), amount: 16500, status: m === 0 ? "pending" : "paid", paidAt: m === 0 ? null : iso(24 * (m * 30)), createdAt: iso(24) });
    RentsDB.create({ tenantName: "Rohit Das", propertyName: "Gharpayy HSR", month: month(m), amount: 17500, status: "paid", paidAt: iso(24 * (m * 30 + 2)), createdAt: iso(24) });
    RentsDB.create({ tenantName: "Megha P", propertyName: "Gharpayy Indiranagar", month: month(m), amount: 21000, status: m === 0 ? "overdue" : "paid", paidAt: m === 0 ? null : iso(24 * (m * 30 + 4)), createdAt: iso(24) });
  }

  ["Q-1001", "Q-1002", "Q-1003"].forEach((s, i) => QuotationsDB.create({
    serial: s, tenantName: ["Aditya","Pooja","Riya"][i], tenantPhone: "+91981234600" + i,
    propertyName: props[i].name, roomNumber: String(101 + i),
    rent: 18000 + i * 1000, deposit: 36000 + i * 2000, maintenance: 1500,
    tokenAmount: 2000, offerRent: 17000 + i * 1000,
    status: ["sent","draft","accepted"][i] as any, createdAt: iso(12 * (i + 1)),
  } as any));

  PaymentsDB.create({ tenantName: "Arjun Mehta", amount: 2000, method: "UPI", ref: "UPI-8821", type: "token", createdAt: iso(70) });
  PaymentsDB.create({ tenantName: "Rohit Das", amount: 17500, method: "UPI", ref: "UPI-7710", type: "rent", createdAt: iso(48) });

  ExpensesDB.create({ category: "Electricity", vendor: "BESCOM", amount: 28400, propertyName: "Gharpayy Koramangala", date: month(0) + "-05", createdAt: iso(120) });
  ExpensesDB.create({ category: "Cleaning", vendor: "SwachhCo", amount: 12000, propertyName: "Gharpayy HSR", date: month(0) + "-01", createdAt: iso(96) });

  MaintenanceDB.create({ title: "Geyser not heating", propertyName: "Gharpayy Koramangala", roomNumber: "204", priority: "high", status: "in_progress", assignee: "Ankit M", createdAt: iso(6) });
  MaintenanceDB.create({ title: "WiFi router replacement", propertyName: "Gharpayy HSR", priority: "med", status: "open", createdAt: iso(2) });
  MaintenanceDB.create({ title: "Repaint corridor", propertyName: "Gharpayy Indiranagar", priority: "low", status: "done", cost: 8500, createdAt: iso(200) });

  DocumentsDB.create({ title: "Arjun – Rent Agreement", type: "agreement", tenantName: "Arjun Mehta", propertyName: "Gharpayy Koramangala", createdAt: iso(72) });

  // Demand events + leads
  const areas = ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Marathahalli"];
  for (let i = 0; i < 120; i++) {
    EventsDB.create({ action: "view", area: areas[i % areas.length], propertyName: props[i % 3].name });
  }
  ["wa_click", "save", "quote_request", "visit_request", "booking_request"].forEach((a, i) => {
    for (let j = 0; j < 3 + i; j++) EventsDB.create({ action: a as any, area: areas[j % areas.length], propertyName: props[j % 3].name });
  });
  const seedLeads = [
    { name: "Tanvi", phone: "+919812345020", area: "Koramangala", propertyName: "Gharpayy Koramangala", action: "booking_request", stage: "booked", source: "detail" },
    { name: "Rahul", phone: "+919812345021", area: "HSR Layout", propertyName: "Gharpayy HSR", action: "visit_request", stage: "visit", source: "detail" },
    { name: "Sneha", phone: "+919812345022", area: "Indiranagar", propertyName: "Gharpayy Indiranagar", action: "quote_request", stage: "quoted", source: "listings" },
    { name: "Karthik", phone: "+919812345023", area: "Whitefield", action: "wa_click", stage: "qualified", source: "areas" },
    { name: "Anonymous", area: "Marathahalli", action: "view", stage: "new", source: "areas" },
  ];
  seedLeads.forEach((l) => LeadsDB.create(l as any));

  NotificationsDB.create({ title: "Welcome to Booking OS 3.0", body: "Room twin, visits war room, move-in center & founder tower now live.", kind: "info", read: false, createdAt: iso(0) });
  NotificationsDB.create({ title: "1 rent overdue", body: "Megha P · ₹21,000", kind: "warn", read: false, createdAt: iso(0), link: "/manager/bookos/rents" });

  ActivityDB.create({ action: "seeded_v3", entity: "system", createdAt: iso(0) });

  seedOpsIfEmpty();
}

export function seedOpsIfEmpty() {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(OPS_SEED_KEY)) return;
  localStorage.setItem(OPS_SEED_KEY, "1");
  const now = Date.now();
  const iso = (offsetH = 0) => new Date(now - offsetH * 3600000).toISOString();

  const rooms = RoomsXDB.all();
  const props = PropertiesDB.all();

  // Decorate first few rooms with USP + price breakdown + timeline events
  const USP_SAMPLES = [
    { size: "Large", window: "Full Window", ventilation: "Excellent", view: "Balcony", washroom: "Attached", noise: "Low", position: "Corner", sunlight: "Morning", furniture: "Premium" },
    { size: "Medium", window: "Large Window", ventilation: "Good", view: "Garden", washroom: "Attached", noise: "Silent", position: "End Corridor", sunlight: "Full Day", furniture: "Standard" },
    { size: "Compact", window: "Medium Window", ventilation: "Average", view: "Internal", washroom: "Common", noise: "Medium", position: "Near Lift", sunlight: "Limited", furniture: "Standard" },
  ];
  rooms.slice(0, 9).forEach((r: any, i: number) => {
    const usp = USP_SAMPLES[i % 3];
    RoomsXDB.update(r.id, { usp } as any);
    RoomEventsDB.create({ roomId: r.id, kind: "usp", title: "USP catalogued", detail: `${usp.size} · ${usp.window} · ${usp.washroom}`, createdAt: iso(72 + i) } as any);
    RoomEventsDB.create({ roomId: r.id, kind: "readiness", title: "Readiness updated", detail: `${r.commercialStatus} · ${r.operationalStatus}`, createdAt: iso(48 + i) } as any);
    if (i % 3 === 0) RoomEventsDB.create({ roomId: r.id, kind: "visit", title: "Visit scheduled", detail: "Demo customer · evening", createdAt: iso(24 + i) } as any);
  });

  // Seed a few visits
  const staffNames = ["Priya R", "Karan S", "Ankit M"];
  const samplesV = [
    { idx: 0, name: "Rahul Verma", phone: "+919812345040", h: 4, t: "18:00", status: "scheduled", prob: 75 },
    { idx: 1, name: "Sneha Iyer", phone: "+919812345041", h: 6, t: "16:30", status: "confirmed", prob: 85 },
    { idx: 2, name: "Aman Sinha", phone: "+919812345042", h: 28, t: "11:00", status: "scheduled", prob: 60 },
    { idx: 3, name: "Riya Shah", phone: "+919812345043", h: -2, t: "19:00", status: "completed", prob: 90 },
    { idx: 4, name: "Vikram Roy", phone: "+919812345044", h: -26, t: "17:00", status: "converted", prob: 100 },
  ];
  samplesV.forEach((s, k) => {
    const r = rooms[s.idx];
    if (!r) return;
    const p = props.find((x: any) => x.id === r.propertyId);
    const dt = new Date(now + (s.h - 24) * 3600000);
    VisitsDB.create({
      propertyId: r.propertyId, propertyName: p?.name || "",
      floorId: r.floorId, roomId: r.id, roomNumber: r.roomNumber,
      customerName: s.name, customerPhone: s.phone,
      date: dt.toISOString().slice(0, 10), time: s.t,
      coordinatorName: staffNames[k % 3], managerName: staffNames[(k + 1) % 3], managerPhone: "+919876500001",
      status: s.status as any, probability: s.prob,
      createdAt: iso(s.h > 0 ? 1 : Math.abs(s.h)), updatedAt: iso(1),
    } as any);
  });

  // Seed one in-progress room booking with partial collection
  const r0 = rooms[0];
  if (r0) {
    const p0 = props.find((x: any) => x.id === r0.propertyId);
    const rb = RoomBookingsDB.create({
      roomId: r0.id, customerName: "Pooja Nair", customerPhone: "+919812345050",
      rent: r0.rent, deposit: r0.rent * 2, token: 2500,
      moveInDate: new Date(now + 5 * 86400000).toISOString().slice(0, 10),
      status: "token_paid",
      collected: { token: true, deposit: false, firstRent: false, agreement: false, kyc: true },
      createdAt: iso(20), updatedAt: iso(2),
    } as any);
    RoomEventsDB.create({ roomId: r0.id, kind: "booking", title: "Booking created · Pooja Nair", detail: `₹${r0.rent.toLocaleString()}/mo`, createdAt: iso(20) } as any);
    RoomEventsDB.create({ roomId: r0.id, kind: "payment", title: "token collected", detail: `₹2,500 · UPI-DEMO`, createdAt: iso(18) } as any);
  }
}

