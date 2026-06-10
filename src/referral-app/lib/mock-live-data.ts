// @ts-nocheck
const json = (data: any, init?: ResponseInit) => Response.json(data, init);
const now = () => new Date().toISOString();
const inHours = (h: number) => new Date(Date.now() + h * 3600000).toISOString();
const names = ["Koramangala", "HSR Layout", "Bellandur", "Indiranagar", "Marathahalli", "Whitefield"];

const read = (key: string, fallback: any) => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(fallback));
  } catch {}
  return fallback;
};
const write = (key: string, value: any) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export function installReferralMockApi() {
  if (typeof window === "undefined" || (window as any).__gharpayyMockApiInstalled) return;
  (window as any).__gharpayyMockApiInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    if (!url.pathname.startsWith("/api/")) return originalFetch(input, init);

    const path = url.pathname;
    const method = (init?.method || "GET").toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (path.startsWith("/api/visits")) {
      const fallback = [{ id: 1, propertyId: 2, propertyName: "HSR Comfort PG", visitorName: "Sneha", visitorPhone: "9876543210", scheduledAt: inHours(26), status: "SCHEDULED", notes: "Prefers single sharing" }];
      const visits = read("gharpayy_visits_v1", fallback);
      if (method === "POST") { const visit = { id: Date.now(), status: "SCHEDULED", ...body }; write("gharpayy_visits_v1", [visit, ...visits]); return json(visit); }
      if (method === "PATCH") { const id = Number(path.split("/").pop()); const next = visits.map((v: any) => v.id === id ? { ...v, ...body } : v); write("gharpayy_visits_v1", next); return json({ ok: true }); }
      return json(visits);
    }

    if (path.includes("/streaks/")) {
      if (path.endsWith("/checkin")) return json({ newStreak: 7, xpAwarded: 35, bonusAwarded: 100 });
      return json({ streak: { currentStreak: 6, longestStreak: 12, totalCheckins: 24, lastCheckinDate: null, lastXpAwarded: 25 }, recentLogs: [0,1,2,4,5].map((d) => ({ checkinDate: new Date(Date.now() - d * 86400000).toISOString().slice(0, 10), xpAwarded: 20 + d, streakDay: 6 - d })) });
    }

    if (path === "/api/squad-battles") {
      const fallback = [{ id: 1, challengerTeamId: 1, challengerTeamName: "Koramangala Kings", defenderTeamId: 2, defenderTeamName: "HSR Hustlers", status: "ACTIVE", challengerScore: 12, defenderScore: 9, winnerTeamId: null, prizeXp: 500, prizeCash: 0, metric: "referrals", endsAt: inHours(18) }];
      const battles = read("gharpayy_battles_v1", fallback);
      if (method === "POST") { const battle = { id: Date.now(), challengerTeamName: "Your Squad", defenderTeamName: "Expert Desk", challengerScore: 0, defenderScore: 0, status: "ACTIVE", endsAt: inHours(body.durationHours || 24), prizeCash: 0, ...body }; write("gharpayy_battles_v1", [battle, ...battles]); return json(battle); }
      return json(battles);
    }

    if (path.includes("/chain/")) return json({ root: { id: 1, name: "You", referralCode: "GHAR-YOU1", xp: 480, totalEarned: 8450, level: "HUSTLER" }, stats: { totalNodes: 14, bookedNodes: 4, pendingNodes: 6, totalChainEarnings: 8450, conversionRate: 29 }, directReferrals: [1,2,3,4].map((i) => ({ id: i, name: ["Sneha", "Ravi", "Pooja", "Karthik"][i-1], status: ["BOOKED", "VERIFIED", "PENDING", "BOOKED"][i-1], earned: i % 2 ? 500 : 50, area: names[i], joinedAt: new Date(Date.now() - i * 86400000).toISOString() })) });
    if (path.includes("/influencer/")) return json(null);
    if (path.includes("/corporate/")) return json(null);
    if (path.includes("/broker/")) return json(null);
    if (path === "/api/flash-deals") return json([1,2,3].map((i) => ({ id: i, propertyId: i, propertyName: `${names[i]} Fast Move-in PG`, area: names[i], originalRent: 12000 + i * 800, dealRent: 9800 + i * 650, bonusMultiplier: 2 + i, bonusAmount: (2 + i) * 500, spotsTotal: 8, spotsTaken: 2 + i, expiresAt: inHours(5 + i), discount: 12 + i * 3 })));
    if (path.includes("/lucky-draw/")) return path.endsWith("/spin") ? json({ prize: "₹50", prizeIndex: 3, message: "You won ₹50", draw: { prize: "₹50", spinDate: now() } }) : json({ canSpin: true, recentWins: [{ prize: "100 XP", spinDate: now() }] });
    if (path.includes("/activity/")) return json([1,2,3,4,5].map((i) => ({ id: i, type: ["REFERRAL_SUBMITTED", "LEAD_VERIFIED", "BOOKING_CONFIRMED", "CHECKIN", "PAYOUT"][i-1], icon: ["🏠", "✅", "💰", "🔥", "🏦"][i-1], label: ["Lead submitted", "Lead verified", "Booking confirmed", "Daily check-in", "Payout processed"][i-1], amount: i === 2 ? 50 : i === 3 ? 500 : null, xp: i < 4 ? 20 * i : 10, createdAt: new Date(Date.now() - i * 3600000).toISOString() })));

    return json({ ok: true });
  };
}