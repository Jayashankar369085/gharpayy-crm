export type PricingTier = {
  id: string;
  name: string;
  range: string;
  min: number;
  max: number;
  emoji: string;
  color: string;
  tagline: string;
};

export const PRICING_TIERS: PricingTier[] = [
  { id: "STARTER", name: "Starter", range: "₹6k–₹9k", min: 0, max: 9000, emoji: "🌱", color: "#22C55E", tagline: "Budget beds with fast move-in." },
  { id: "CLASSICS", name: "Classics", range: "₹9k–₹13k", min: 9001, max: 13000, emoji: "🏠", color: "#F97316", tagline: "The reliable PG sweet spot." },
  { id: "COMFORT", name: "Comfort", range: "₹13k–₹18k", min: 13001, max: 18000, emoji: "🛋️", color: "#3B82F6", tagline: "Better rooms, food and commute." },
  { id: "PREMIUM", name: "Premium", range: "₹18k–₹28k", min: 18001, max: 28000, emoji: "✨", color: "#A855F7", tagline: "Founder and tech-lead grade stays." },
  { id: "SIGNATURE", name: "Signature", range: "₹28k+", min: 28001, max: Number.MAX_SAFE_INTEGER, emoji: "👑", color: "#EAB308", tagline: "Private inventory and concierge close." },
];

export const TIER_BY_ID: Record<string, PricingTier> = Object.fromEntries(PRICING_TIERS.map((tier) => [tier.id, tier]));

export function tierForRent(rent: number): PricingTier {
  return PRICING_TIERS.find((tier) => rent >= tier.min && rent <= tier.max) ?? PRICING_TIERS[1];
}

export function tierForBudget(budget?: number | string | null): string {
  const numeric = typeof budget === "string" ? Number(budget.replace(/[^0-9]/g, "")) : Number(budget ?? 0);
  return tierForRent(Number.isFinite(numeric) && numeric > 0 ? numeric : 12000).id;
}
