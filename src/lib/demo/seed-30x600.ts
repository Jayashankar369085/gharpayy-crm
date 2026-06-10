/**
 * War-room demo seed: 30 fake users, 18,000 leads, matching tours,
 * quotations, follow-ups. Idempotent — calling clearDemo() wipes only
 * demo-tagged records and restores the original mock baseline.
 */
import { useApp } from "@/lib/store";
import { useQuotations, type Quotation } from "@/lib/crm10x/quotations";
import { TCMS, LEADS, TOURS, ACTIVITIES, FOLLOWUPS, PROPERTIES } from "@/lib/mock-data";
import type { Lead, TCM, Tour, FollowUp, Intent, LeadStage } from "@/lib/types";

const DEMO_TAG = "__demo30x600";

/* ---------------- helpers ---------------- */

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function chance(pct: number) { return Math.random() * 100 < pct; }
function isoDaysFromNow(d: number) {
  return new Date(Date.now() + d * 86_400_000).toISOString();
}

const FIRST_NAMES = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Krishna","Ishaan","Rohan","Kabir","Ansh","Sai","Reyansh","Aanya","Diya","Aadhya","Saanvi","Pari","Anika","Myra","Ira","Riya","Tara","Zara","Kiara","John","Sara","Liam","Emma","Noah","Olivia","Ahmed","Fatima","Wei","Mei","Yuki","Hiro","Marco","Sofia","Lucas","Mia"];
const LAST_NAMES = ["Sharma","Verma","Gupta","Singh","Patel","Reddy","Iyer","Nair","Khan","Mehta","Joshi","Kapoor","Bose","Das","Roy","Shah","Pillai","Menon","Smith","Wong","Chen","Lee","Garcia","Brown","Khan","Ali","Tanaka","Park","Müller"];
const CITIES = ["Bangalore","Pune","Mumbai","Hyderabad","Delhi","Chennai","Kolkata","Gurgaon"];
const SOURCES = ["WhatsApp","Meta Ads","Website","Referral","CSV Import","Manual","Google","Justdial","99acres","Walk-in"];
const SEGMENTS = ["Student","Working Pro","Parents","International"] as const;

const TEAMS = [
  { team: "Lead Gen",      count: 8, roleBase: "lg"  },
  { team: "SDR",           count: 8, roleBase: "sdr" },
  { team: "Visit Coord",   count: 5, roleBase: "vc"  },
  { team: "Closer",        count: 4, roleBase: "cl"  },
  { team: "Ops",           count: 3, roleBase: "op"  },
  { team: "Manager",       count: 2, roleBase: "mg"  },
] as const;

/* ---------------- generators ---------------- */

function buildTcms(): TCM[] {
  const tcms: TCM[] = [];
  let idx = 0;
  for (const t of TEAMS) {
    for (let i = 0; i < t.count; i++) {
      idx++;
      const first = FIRST_NAMES[idx % FIRST_NAMES.length];
      const last  = LAST_NAMES[(idx * 3) % LAST_NAMES.length];
      tcms.push({
        id: `${DEMO_TAG}-tcm-${idx}`,
        name: `${first} ${last}`,
        initials: `${first[0]}${last[0]}`,
        zone: rnd(CITIES) + " Central",
        conversionRate: 0.05 + Math.random() * 0.25,
        avgResponseMins: rndInt(3, 30),
        // @ts-expect-error — team is denormalized for the demo, not on the schema
        team: t.team,
      });
    }
  }
  return tcms;
}

function pickSegment(): typeof SEGMENTS[number] {
  const r = Math.random() * 100;
  if (r < 35) return "Student";
  if (r < 85) return "Working Pro";
  if (r < 95) return "Parents";
  return "International";
}

function budgetForSegment(seg: typeof SEGMENTS[number]) {
  switch (seg) {
    case "Student":       return rndInt(8000, 18000);
    case "Working Pro":   return rndInt(15000, 45000);
    case "Parents":       return rndInt(18000, 35000);
    case "International": return rndInt(25000, 80000);
  }
}

function pickStage(): LeadStage {
  const r = Math.random() * 100;
  if (r < 55) return "new";
  if (r < 73) return "contacted";
  if (r < 85) return "tour-scheduled";
  if (r < 92) return "tour-done";
  if (r < 96) return "negotiation";
  if (r < 99) return "booked";
  return "dropped";
}

function pickIntent(): Intent {
  const r = Math.random() * 100;
  if (r < 18) return "hot";
  if (r < 55) return "warm";
  return "cold";
}

function buildLeads(tcms: TCM[], total: number): Lead[] {
  const leads: Lead[] = [];
  const propertyAreas = Array.from(new Set(PROPERTIES.map((p) => p.area)));
  const phoneSet = new Set<string>();

  for (let i = 0; i < total; i++) {
    const seg   = pickSegment();
    const first = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const last  = LAST_NAMES[(i * 13) % LAST_NAMES.length];
    const tcm   = tcms[i % tcms.length];

    // Phones — inject ~3% duplicates and ~2% spam
    let phone: string;
    if (chance(2)) {
      phone = "+91 0000000000"; // spam marker
    } else if (chance(3) && phoneSet.size > 0) {
      phone = Array.from(phoneSet)[rndInt(0, phoneSet.size - 1)];
    } else {
      phone = `+91 ${rndInt(70000, 99999)}${rndInt(10000, 99999)}`;
    }
    phoneSet.add(phone);

    const intent = pickIntent();
    const stage  = pickStage();
    const createdDays = rndInt(0, 60);
    const tags = [DEMO_TAG, seg, ...(chance(12) ? ["no-response"] : []), ...(chance(6) ? ["revisit"] : []), ...(chance(4) ? ["cancelled"] : []), ...(chance(1) ? ["refund"] : [])];

    leads.push({
      id: `${DEMO_TAG}-lead-${i + 1}`,
      name: `${first} ${last}`,
      phone,
      source: rnd(SOURCES),
      budget: budgetForSegment(seg),
      moveInDate: isoDaysFromNow(rndInt(-5, 60)).slice(0, 10),
      preferredArea: rnd(propertyAreas),
      assignedTcmId: tcm.id,
      stage,
      intent,
      confidence: stage === "booked" ? 100 : stage === "negotiation" ? rndInt(60, 90) : stage === "tour-done" ? rndInt(40, 75) : intent === "hot" ? rndInt(40, 70) : intent === "warm" ? rndInt(20, 50) : rndInt(5, 25),
      tags,
      nextFollowUpAt: chance(75) ? isoDaysFromNow(rndInt(-3, 10)) : null, // ~25% orphan
      responseSpeedMins: rndInt(1, 240),
      createdAt: isoDaysFromNow(-createdDays),
      updatedAt: isoDaysFromNow(rndInt(-createdDays, 0)),
    });
  }
  return leads;
}

function buildTours(leads: Lead[]): Tour[] {
  const out: Tour[] = [];
  for (const l of leads) {
    if (l.stage === "new" || l.stage === "contacted") continue;
    const prop = PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)];
    const scheduledAt = isoDaysFromNow(l.stage === "tour-scheduled" ? rndInt(0, 7) : rndInt(-30, -1));
    const status = l.stage === "tour-scheduled" ? "scheduled" : l.stage === "dropped" && chance(40) ? "no-show" : "completed";
    const filled = status === "completed" && chance(70);
    out.push({
      id: `${DEMO_TAG}-tour-${l.id}`,
      leadId: l.id,
      propertyId: prop.id,
      tcmId: l.assignedTcmId,
      scheduledAt,
      status,
      decision: l.stage === "booked" ? "booked" : l.stage === "negotiation" ? "thinking" : l.stage === "dropped" ? "dropped" : null,
      postTour: {
        outcome: l.stage === "booked" ? "booked" : l.stage === "dropped" ? "not-interested" : filled ? "thinking" : null,
        confidence: filled ? rndInt(20, 90) : 0,
        objection: filled ? rnd(["price","location","amenities","timing","parents","comparing"]) : null,
        objectionNote: filled ? "Auto-logged demo objection." : "",
        expectedDecisionAt: filled ? isoDaysFromNow(rndInt(1, 14)) : null,
        nextFollowUpAt: filled ? isoDaysFromNow(rndInt(1, 7)) : null,
        filledAt: filled ? new Date().toISOString() : null,
      },
      createdAt: scheduledAt,
      updatedAt: scheduledAt,
    });
  }
  return out;
}

function buildFollowUps(leads: Lead[]): FollowUp[] {
  return leads
    .filter((l) => l.nextFollowUpAt)
    .map((l) => ({
      id: `${DEMO_TAG}-fu-${l.id}`,
      leadId: l.id,
      tcmId: l.assignedTcmId,
      dueAt: l.nextFollowUpAt!,
      priority: l.intent === "hot" ? "high" : l.intent === "warm" ? "medium" : "low",
      reason: "Demo follow-up",
      done: chance(20),
    }));
}

/* ---------------- public api ---------------- */

export interface SeedReport {
  tcms: number;
  leads: number;
  tours: number;
  followUps: number;
  quotes: number;
  bySegment: Record<string, number>;
  byStage: Record<string, number>;
  byTeam: Record<string, number>;
  durationMs: number;
}

export function seedDemoCompany(totalLeads = 18_000): SeedReport {
  const t0 = performance.now();
  const tcms  = buildTcms();
  const leads = buildLeads(tcms, totalLeads);
  const tours = buildTours(leads);
  const fus   = buildFollowUps(leads);

  // segment + stage + team rollups
  const bySegment: Record<string, number> = {};
  const byStage:   Record<string, number> = {};
  const byTeam:    Record<string, number> = {};
  leads.forEach((l) => {
    const seg = l.tags.find((t) => SEGMENTS.includes(t as typeof SEGMENTS[number])) ?? "?";
    bySegment[seg] = (bySegment[seg] ?? 0) + 1;
    byStage[l.stage] = (byStage[l.stage] ?? 0) + 1;
  });
  tcms.forEach((t) => {
    // @ts-expect-error — team is denormalized
    const team = t.team as string;
    byTeam[team] = (byTeam[team] ?? 0) + leads.filter((l) => l.assignedTcmId === t.id).length;
  });

  // Wipe prior demo records first (idempotent)
  clearDemoData(/* keepBaseline */ true);

  // Merge into store
  useApp.setState((s) => ({
    tcms:  [...s.tcms.filter((x) => !x.id.startsWith(DEMO_TAG)), ...tcms],
    leads: [...s.leads.filter((x) => !x.id.startsWith(DEMO_TAG)), ...leads],
    tours: [...s.tours.filter((x) => !x.id.startsWith(DEMO_TAG)), ...tours],
    followUps: [...s.followUps.filter((x) => !x.id.startsWith(DEMO_TAG)), ...fus],
  }));

  // Seed a few demo quotations on negotiation-stage leads
  const negotiationLeads = leads.filter((l) => l.stage === "negotiation" || l.stage === "booked").slice(0, 500);
  const quotes: Quotation[] = negotiationLeads.map((l) => {
    const prop = PROPERTIES[Math.floor(Math.random() * PROPERTIES.length)];
    return {
      id: `${DEMO_TAG}-q-${l.id}`,
      leadId: l.id,
      tcmId: l.assignedTcmId,
      propertyId: prop.id,
      propertyName: prop.name,
      roomType: rnd(["Single", "Double", "Triple"]),
      actualRent: l.budget,
      discountedPrice: l.budget - (chance(40) ? rndInt(500, 3000) : 0),
      deposit: l.budget * 2,
      prebook: 1000,
      maintenance: 1500,
      maintenanceType: "Monthly",
      lockIn: "6 months",
      notice: "1 month",
      validityMinutes: 60 * 24,
      validUntilISO: isoDaysFromNow(1),
      message: "Demo quote",
      status: "sent",
      sentAt: isoDaysFromNow(rndInt(-7, -1)),
    };
  });
  useQuotations.setState((s) => ({
    quotations: [...s.quotations.filter((x) => !x.id.startsWith(DEMO_TAG)), ...quotes],
  } as Partial<ReturnType<typeof useQuotations.getState>>));

  return {
    tcms: tcms.length,
    leads: leads.length,
    tours: tours.length,
    followUps: fus.length,
    quotes: quotes.length,
    bySegment,
    byStage,
    byTeam,
    durationMs: Math.round(performance.now() - t0),
  };
}

export function clearDemoData(keepBaseline = false): void {
  useApp.setState((s) => ({
    tcms:      keepBaseline ? s.tcms.filter((x) => !x.id.startsWith(DEMO_TAG))      : TCMS,
    leads:     keepBaseline ? s.leads.filter((x) => !x.id.startsWith(DEMO_TAG))     : LEADS,
    tours:     keepBaseline ? s.tours.filter((x) => !x.id.startsWith(DEMO_TAG))     : TOURS,
    followUps: keepBaseline ? s.followUps.filter((x) => !x.id.startsWith(DEMO_TAG)) : FOLLOWUPS,
    activities: keepBaseline ? s.activities                                         : ACTIVITIES,
  }));
  useQuotations.setState((s) => ({
    quotations: s.quotations.filter((x) => !x.id.startsWith(DEMO_TAG)),
  }));
}

export function isDemoLoaded(): boolean {
  return useApp.getState().leads.some((l) => l.id.startsWith(DEMO_TAG));
}