// @ts-nocheck
import { useMemo } from "react";
import { getZoneStats, type LeadLike } from "@/lib/analytics";
import { ZoneCard } from "./ZoneCard";

export function ZoneGrid({ leads }: { leads: LeadLike[] }) {
  const stats = useMemo(() => getZoneStats(leads), [leads]);
  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Gharpayy 5 zones</div>
          <h2 className="text-lg md:text-xl font-bold text-white">Zone performance · live</h2>
        </div>
        <div className="text-[11px] text-slate-500">Hero copy from gharpayy.com</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => <ZoneCard key={s.slug} stat={s} />)}
      </div>
    </div>
  );
}
