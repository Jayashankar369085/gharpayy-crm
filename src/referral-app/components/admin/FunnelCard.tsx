// @ts-nocheck
import { TrendingDown } from "lucide-react";
import { getFunnelStages, type LeadLike } from "@/lib/analytics";

export function FunnelCard({ leads, title = "Lead funnel" }: { leads: LeadLike[]; title?: string }) {
  const stages = getFunnelStages(leads);
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base md:text-lg font-bold text-slate-900">{title}</h3>
        <span className="text-[11px] uppercase tracking-widest text-slate-500">drop-off between stages</span>
      </div>
      <div className="space-y-3">
        {stages.map((s, i) => {
          const pct = Math.max(4, Math.round((s.count / max) * 100));
          return (
            <div key={s.stage}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">{s.stage}</span>
                <span className="font-mono font-bold text-slate-900">{s.count}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.isLeak ? "bg-red-500" : "bg-orange-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {i > 0 && (
                <div className={`flex items-center gap-1 text-[11px] mt-1 ${s.isLeak ? "text-red-600 font-bold" : "text-slate-500"}`}>
                  <TrendingDown className="w-3 h-3" />
                  {s.dropPct}% drop {s.isLeak && "· biggest leak"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
