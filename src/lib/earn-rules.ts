export type EarnRule = {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timePerWeek: string;
  bestZone?: string;
  payoutOnLead: number;
  payoutOnTour: number;
  payoutOnBooking: number;
  howTo: string[];
  topEarner?: { name: string; monthly: number };
};

export const EARN_RULES: EarnRule[] = [
  { id: "whatsapp-circle", emoji: "💬", title: "WhatsApp circle", blurb: "Share verified rooms in friend and alumni groups.", difficulty: "Easy", timePerWeek: "2h", bestZone: "HSR", payoutOnLead: 50, payoutOnTour: 150, payoutOnBooking: 500, howTo: ["Pick one zone", "Send the short verified-room copy", "Forward warm replies to the expert"], topEarner: { name: "Pooja S.", monthly: 18500 } },
  { id: "campus-captain", emoji: "🎓", title: "Campus captain", blurb: "Help students find safe PGs near college clusters.", difficulty: "Medium", timePerWeek: "4h", bestZone: "Koramangala", payoutOnLead: 60, payoutOnTour: 175, payoutOnBooking: 650, howTo: ["Post in student groups", "Collect budget and move-in date", "Book one verified tour slot"], topEarner: { name: "Ravi K.", monthly: 26400 } },
  { id: "office-slack", emoji: "🏢", title: "Office Slack drops", blurb: "Route relocating teammates to commute-safe stays.", difficulty: "Easy", timePerWeek: "1h", bestZone: "Whitefield", payoutOnLead: 75, payoutOnTour: 200, payoutOnBooking: 700, howTo: ["Share the office-route line", "Ask for office gate and budget", "Let the zone expert shortlist"], topEarner: { name: "Megha R.", monthly: 31200 } },
  { id: "society-scout", emoji: "🏘️", title: "Society scout", blurb: "Spot vacancies and owner leads inside societies.", difficulty: "Hard", timePerWeek: "5h", bestZone: "North", payoutOnLead: 100, payoutOnTour: 250, payoutOnBooking: 900, howTo: ["Capture property details", "Verify owner contact", "Share room photos and rent truth"], topEarner: { name: "Imran A.", monthly: 42000 } },
  { id: "broker-ally", emoji: "🤝", title: "Broker ally", blurb: "Send overflow inventory and renters to Gharpayy.", difficulty: "Medium", timePerWeek: "3h", bestZone: "Indiranagar", payoutOnLead: 80, payoutOnTour: 225, payoutOnBooking: 800, howTo: ["Forward overflow requirements", "Tag area and urgency", "Track close and payout from admin"], topEarner: { name: "Neha V.", monthly: 36800 } },
  { id: "hr-relocation", emoji: "🧳", title: "HR relocation", blurb: "Help new joiners move near work without broker chaos.", difficulty: "Medium", timePerWeek: "2h", bestZone: "Whitefield", payoutOnLead: 90, payoutOnTour: 250, payoutOnBooking: 850, howTo: ["Share joining cohort list", "Collect budget bands", "Schedule batch tours"], topEarner: { name: "Anita H.", monthly: 50500 } },
  { id: "creator-reels", emoji: "🎥", title: "Creator reels", blurb: "Turn verified rooms and area truth into short videos.", difficulty: "Hard", timePerWeek: "6h", bestZone: "Koramangala", payoutOnLead: 70, payoutOnTour: 175, payoutOnBooking: 750, howTo: ["Shoot one room truth reel", "Add area and rent CTA", "Send DMs to referral form"], topEarner: { name: "Karthik M.", monthly: 64000 } },
  { id: "parent-network", emoji: "👨‍👩‍👧", title: "Parent network", blurb: "Reassure parents with safe, documented PG options.", difficulty: "Easy", timePerWeek: "2h", bestZone: "North", payoutOnLead: 60, payoutOnTour: 175, payoutOnBooking: 650, howTo: ["Share safety-first copy", "Collect guardian concerns", "Connect to expert on WhatsApp"], topEarner: { name: "Deepa K.", monthly: 21800 } },
  { id: "nri-returnee", emoji: "✈️", title: "NRI returnee desk", blurb: "Premium handholding for people landing in Bengaluru.", difficulty: "Hard", timePerWeek: "4h", bestZone: "Indiranagar", payoutOnLead: 125, payoutOnTour: 300, payoutOnBooking: 1100, howTo: ["Share concierge copy", "Ask landing date and office area", "Route to premium expert"], topEarner: { name: "Sara P.", monthly: 47200 } },
  { id: "owner-intro", emoji: "🔑", title: "Owner intro", blurb: "Introduce owners with real supply; earn when rooms move.", difficulty: "Hard", timePerWeek: "3h", bestZone: "HSR", payoutOnLead: 150, payoutOnTour: 0, payoutOnBooking: 1200, howTo: ["Capture owner and building", "Add room count and rent", "Let BookOS turn inventory live"], topEarner: { name: "Rohan I.", monthly: 58600 } },
];

export const EARN_BY_ID: Record<string, EarnRule> = Object.fromEntries(EARN_RULES.map((rule) => [rule.id, rule]));

export function expectedMonthlyEarning(rule: EarnRule, leadsPerMonth = 8) {
  const tourRate = rule.difficulty === "Hard" ? 0.42 : rule.difficulty === "Medium" ? 0.5 : 0.58;
  const bookingRate = rule.difficulty === "Hard" ? 0.2 : rule.difficulty === "Medium" ? 0.24 : 0.28;
  return Math.round(leadsPerMonth * rule.payoutOnLead + leadsPerMonth * tourRate * rule.payoutOnTour + leadsPerMonth * bookingRate * rule.payoutOnBooking);
}
