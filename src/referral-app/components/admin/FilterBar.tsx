// @ts-nocheck
import { useMemo } from "react";
import { CAPTAINS } from "@/lib/captains";
import { PERSONAS } from "@/lib/personas";

export type AdminFilters = {
  persona: string;
  area: string;
  expert: string;
  range: "today" | "7d" | "30d" | "all";
};

export const DEFAULT_FILTERS: AdminFilters = {
  persona: "ALL",
  area: "ALL",
  expert: "ALL",
  range: "all",
};

export function FilterBar({
  leads,
  value,
  onChange,
}: {
  leads: any[];
  value: AdminFilters;
  onChange: (next: AdminFilters) => void;
}) {
  const areas = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads || []) if (l.area) set.add(l.area);
    return Array.from(set).sort();
  }, [leads]);
  const set = (k: keyof AdminFilters) => (v: string) => onChange({ ...value, [k]: v });

  return (
    <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <select
          value={value.persona}
          onChange={(e) => set("persona")(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white text-sm px-2 font-medium text-slate-700"
        >
          <option value="ALL">All personas</option>
          {PERSONAS.map((p: any) => (
            <option key={p.id} value={p.id}>{p.emoji} {p.title}</option>
          ))}
        </select>
        <select
          value={value.area}
          onChange={(e) => set("area")(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white text-sm px-2 font-medium text-slate-700"
        >
          <option value="ALL">All areas</option>
          {areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={value.expert}
          onChange={(e) => set("expert")(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white text-sm px-2 font-medium text-slate-700 col-span-2 md:col-span-1"
        >
          <option value="ALL">All experts</option>
          {CAPTAINS.map((c) => (
            <option key={c.id} value={c.id}>{c.name} · {c.title}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["today", "7d", "30d", "all"] as const).map((r) => (
          <button
            key={r}
            onClick={() => set("range")(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              value.range === r
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {r === "today" ? "Today" : r === "all" ? "All time" : r}
          </button>
        ))}
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-900 ml-auto"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function applyAdminFilters(leads: any[], f: AdminFilters): any[] {
  let out = leads || [];
  if (f.persona !== "ALL") out = out.filter((l) => l.personaId === f.persona);
  if (f.area !== "ALL") out = out.filter((l) => l.area === f.area);
  if (f.expert !== "ALL") out = out.filter((l) => l.captainId === f.expert || (l.assignedAgentName || "").includes(f.expert));
  if (f.range !== "all") {
    const cutoff = Date.now() - (f.range === "today" ? 24 : f.range === "7d" ? 7 * 24 : 30 * 24) * 3600 * 1000;
    out = out.filter((l) => new Date(l.createdAt).getTime() >= cutoff);
  }
  return out;
}
