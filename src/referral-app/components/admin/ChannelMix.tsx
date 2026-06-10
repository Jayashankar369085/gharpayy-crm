// @ts-nocheck
import { useMemo } from "react";
import { getChannelROI, type LeadLike } from "@/lib/analytics";
import { Radio } from "lucide-react";

export function ChannelMix({ leads }: { leads: LeadLike[] }) {
  const data = useMemo(() => getChannelROI(leads), [leads]);
  const max = Math.max(1, ...data.map((d) => d.leads));
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-4 h-4 text-orange-400" />
        <h3 className="text-base font-bold text-white">Channels · what actually works</h3>
      </div>
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <div className="text-lg w-6 shrink-0 text-center">{d.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-200 truncate">{d.name}</span>
                <span className="font-mono text-slate-400 shrink-0">{d.leads} leads · {d.conversion}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${(d.leads / max) * 100}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-black text-green-400">₹{(d.revenue / 1000).toFixed(1)}k</div>
              <div className="text-[9px] text-slate-500 uppercase">revenue</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
