// @ts-nocheck
import { Link } from "wouter";
import type { ZoneStat } from "@/lib/analytics";
import { CAPTAIN_BY_ID } from "@/lib/captains";
import { ArrowRight, Users, CheckCircle2, Clock, TrendingUp } from "lucide-react";

export function ZoneCard({ stat }: { stat: ZoneStat }) {
  const expert = CAPTAIN_BY_ID[stat.captainId];
  return (
    <Link
      href={`/admin/zone/${stat.slug}`}
      className="group block rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 hover:border-orange-500/50 transition shadow-lg"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={stat.heroImage}
          alt={stat.display}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-white">
          {stat.occupancy}% full
        </div>
        <div className="absolute bottom-2 left-3 right-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">{stat.name}</div>
          <div className="text-sm font-bold text-white truncate">{stat.tagline}</div>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg bg-blue-500/10 py-1.5 border border-blue-500/20">
            <div className="text-base font-black text-blue-400 leading-none">{stat.open}</div>
            <div className="text-[9px] uppercase text-slate-500 tracking-wider mt-0.5">Open</div>
          </div>
          <div className="rounded-lg bg-green-500/10 py-1.5 border border-green-500/20">
            <div className="text-base font-black text-green-400 leading-none">{stat.booked}</div>
            <div className="text-[9px] uppercase text-slate-500 tracking-wider mt-0.5">Booked</div>
          </div>
          <div className="rounded-lg bg-orange-500/10 py-1.5 border border-orange-500/20">
            <div className="text-base font-black text-orange-400 leading-none">{stat.conversion}%</div>
            <div className="text-[9px] uppercase text-slate-500 tracking-wider mt-0.5">Conv</div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-black">
              {expert?.initial || "G"}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-bold text-slate-200">{expert?.name || "Expert"}</div>
              <div className="text-[10px] text-slate-500">{stat.avgFirstReplyH ? `${stat.avgFirstReplyH}h reply` : "-"}</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition" />
        </div>
      </div>
    </Link>
  );
}
