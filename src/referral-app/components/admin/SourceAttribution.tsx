// @ts-nocheck
import type { LeadLike } from "@/lib/analytics";
import { useLocation } from "wouter";
import { Compass } from "lucide-react";

const SOURCE_LABEL: Record<string, string> = {
  "area:koramangala": "Area · Koramangala",
  "area:hsr-layout": "Area · HSR Layout",
  "area:bellandur": "Area · Bellandur",
  "area:sarjapur-road": "Area · Sarjapur Road",
  "area:indiranagar": "Area · Indiranagar",
  "area:whitefield": "Area · Whitefield",
  "persona:founder-koramangala": "Persona · Founder",
  "persona:techie-orr": "Persona · ORR Techie",
  "persona:student-christ": "Persona · Christ student",
  "persona:nri-returnee": "Persona · NRI returnee",
  "quiz": "Persona quiz",
  "super-app:home": "Super app home",
  "home": "Insights home",
  "header": "Header CTA",
};

function pretty(src: string) {
  if (SOURCE_LABEL[src]) return SOURCE_LABEL[src];
  if (src.startsWith("area:")) return `Area · ${src.slice(5)}`;
  if (src.startsWith("persona:")) return `Persona · ${src.slice(8)}`;
  return src;
}

export function SourceAttribution({ leads }: { leads: LeadLike[] }) {
  const [, setLocation] = useLocation();
  const groups: Record<string, number> = {};
  for (const l of leads || []) {
    const k = (l as any).sourceContext || "(direct)";
    groups[k] = (groups[k] || 0) + 1;
  }
  const rows = Object.entries(groups)
    .map(([k, count]) => ({ k, label: pretty(k), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Compass className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold text-slate-900">Where leads came from</h3>
          <p className="text-xs text-slate-500">Tap a row to filter the inbox.</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No source data yet · submit a referral from any Insights page.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <button
              key={r.k}
              onClick={() => setLocation(`/admin/leads?source=${encodeURIComponent(r.k)}`)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 truncate group-hover:text-orange-600">{r.label}</span>
                <span className="font-mono font-bold text-slate-900 ml-2">{r.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 group-hover:bg-orange-500 transition-colors" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
