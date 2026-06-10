export type ReferContext = {
  area: string | null;
  expert: string | null;
  persona: string | null;
  propertyType: string | null;
  source: string | null;
};

export function readReferContext(params: URLSearchParams): ReferContext {
  const area = params.get("area") || params.get("zone") || null;
  const expert = params.get("expert") || params.get("captain") || null;
  const persona = params.get("persona") || null;
  const propertyType = params.get("type") || params.get("propertyType") || null;
  const source = params.get("source") || (area ? `area:${area}` : persona ? `persona:${persona}` : "super-app:home");

  return { area, expert, persona, propertyType, source };
}
