// @ts-nocheck
import { useMemo } from "react";
import { getTierMix, type LeadLike } from "@/lib/analytics";
import { Crown } from "lucide-react";

export function TierMix({ leads }: { leads: LeadLike[] }) {
  const mix = useMemo(() => getTierMix(leads), [leads]);
  const max = Math.max(1, ...mix.map((m) => m.count));
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-4 h-4 text-orange-400" />
        <h3 className="text-base font-bold text-white">Pricing tier mix</h3>
        <span className="text-[10px] text-slate-500 ml-auto">where revenue lives</span>
      </div>
      <div className="space-y-2.5">
        {mix.map((m) => (
          <div key={m.id}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-200">{m.name}</span>
              <span className="font-mono text-slate-400">{m.count} <span className="text-slate-600">· {m.pct}%</span></span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max(2, (m.count / max) * 100)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
