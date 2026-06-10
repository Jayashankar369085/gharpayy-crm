import { CAPTAINS } from "./captains";

export type GharpayyZone = {
  slug: string;
  name: string;
  display: string;
  tagline: string;
  offer: string;
  amenity: string;
  landmarks: string[];
  areaSlugs: string[];
  captainId: string;
  color: string;
  lat: number;
  lng: number;
  heroImage: string;
};

const svgHero = (label: string, from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="900" height="520" fill="url(#g)"/><circle cx="735" cy="90" r="150" fill="rgba(255,255,255,.18)"/><circle cx="130" cy="410" r="190" fill="rgba(0,0,0,.16)"/><path d="M70 365c115-80 205-108 340-92 148 17 257-3 420-108v220H70z" fill="rgba(255,255,255,.18)"/><text x="58" y="96" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="white">${label}</text><text x="62" y="145" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,.78)">Gharpayy verified zone</text></svg>`)}`;

export const GHARPAYY_ZONES: GharpayyZone[] = [
  { slug: "hsr-bellandur", name: "HSR · Bellandur", display: "HSR", tagline: "ORR tech corridor without commute lies", offer: "Fastest verified PG tours", amenity: "Metro, parks, startups and food streets", landmarks: ["HSR BDA", "Bellandur", "Sarjapur Road"], areaSlugs: ["hsr-layout", "hsr", "bellandur", "sarjapur-road"], captainId: CAPTAINS[0].id, color: "#F97316", lat: 12.9116, lng: 77.6389, heroImage: svgHero("HSR", "#f97316", "#0f172a") },
  { slug: "koramangala-btm", name: "Koramangala · BTM", display: "Koramangala", tagline: "Campus, founders and nightlife inventory", offer: "Zero broker pressure", amenity: "Christ, Forum, startup lanes", landmarks: ["Forum", "Christ", "BTM"], areaSlugs: ["koramangala", "btm-layout", "jayanagar"], captainId: CAPTAINS[1].id, color: "#EC4899", lat: 12.9352, lng: 77.6245, heroImage: svgHero("Koramangala", "#ec4899", "#111827") },
  { slug: "indiranagar-domlur", name: "Indiranagar · Domlur", display: "Indiranagar", tagline: "Premium rooms with neighbourhood proof", offer: "Premium shortlist in 20 min", amenity: "Metro, cafés and CBD access", landmarks: ["100 ft Road", "Domlur", "Ulsoor"], areaSlugs: ["indiranagar", "domlur", "ulsoor", "mg-road"], captainId: CAPTAINS[2].id, color: "#8B5CF6", lat: 12.9784, lng: 77.6408, heroImage: svgHero("Indiranagar", "#8b5cf6", "#020617") },
  { slug: "whitefield-marathahalli", name: "Whitefield · Marathahalli", display: "Whitefield", tagline: "ITPL move-ins mapped to office gates", offer: "Office-route verified", amenity: "ITPL, metro, Brookefield", landmarks: ["ITPL", "Brookefield", "Marathahalli"], areaSlugs: ["whitefield", "marathahalli", "brookefield", "itpl"], captainId: CAPTAINS[3].id, color: "#06B6D4", lat: 12.9698, lng: 77.75, heroImage: svgHero("Whitefield", "#06b6d4", "#0f172a") },
  { slug: "north-hebbal", name: "Hebbal · Manyata", display: "North", tagline: "North Bengaluru stays for teams and families", offer: "Family-safe inventory", amenity: "Manyata, airport road, lake belt", landmarks: ["Hebbal", "Manyata", "Airport Road"], areaSlugs: ["hebbal", "manyata", "yelahanka", "north-bengaluru"], captainId: CAPTAINS[4].id, color: "#22C55E", lat: 13.0358, lng: 77.597, heroImage: svgHero("North BLR", "#22c55e", "#111827") },
];

export const ZONE_BY_SLUG: Record<string, GharpayyZone> = Object.fromEntries(GHARPAYY_ZONES.map((zone) => [zone.slug, zone]));

export function zoneForArea(area?: string | null): GharpayyZone | null {
  const slug = String(area ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return GHARPAYY_ZONES.find((zone) => zone.areaSlugs.some((areaSlug) => slug.includes(areaSlug) || areaSlug.includes(slug))) ?? null;
}

export function zoneForLead(lead: { zoneId?: string | null; area?: string | null }): GharpayyZone | null {
  if (lead?.zoneId && ZONE_BY_SLUG[lead.zoneId]) return ZONE_BY_SLUG[lead.zoneId];
  return zoneForArea(lead?.area) ?? GHARPAYY_ZONES[0];
}
