// @ts-nocheck
import { Link } from "wouter";
import { useMemo } from "react";
import { GHARPAYY_ZONES } from "@/lib/gharpayy-zones";
import { CAPTAIN_BY_ID } from "@/lib/captains";
import { getZoneStats } from "@/lib/analytics";
import { ArrowRight, Flame, MapPin } from "lucide-react";

// The hero of the cockpit · gharpayy.com's 5 zones, always visible,
// always with real numbers from the NMS user's actual leads.
export function ZoneHero({ leads }: { leads: any[] }) {
  const stats = useMemo(() => {
    const s = getZoneStats(leads);
    const byId = Object.fromEntries(s.map((x) => [x.slug, x]));
    return GHARPAYY_ZONES.map((z) => ({ z, s: byId[z.slug] || { open: 0, booked: 0, conversion: 0, occupancy: 0, total: 0, avgFirstReplyH: null } }));
  }, [leads]);

  const totalOpen = stats.reduce((a, b) => a + (b.s.open || 0), 0);
  const totalBooked = stats.reduce((a, b) => a + (b.s.booked || 0), 0);
  const hottest = [...stats].sort((a, b) => (b.s.open || 0) - (a.s.open || 0))[0];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.25),transparent_60%)]" />
      <div className="relative p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              <Flame className="w-3 h-3" /> Gharpayy · Bengaluru · 5 hero zones
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 leading-tight">
              The 5 zones we win in. Every day. Every lead.
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Hero copy + offers from <span className="text-slate-200 font-bold">gharpayy.com</span>. Numbers from your NMS app · live.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Stat label="Open" value={totalOpen} tone="text-blue-400" />
            <Stat label="Booked" value={totalBooked} tone="text-emerald-400" />
            {hottest && (
              <Link href={`/admin/zone/${hottest.z.slug}`} className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black">
                <Flame className="w-3.5 h-3.5" /> Hottest: {hottest.z.display} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map(({ z, s }) => {
            const expert = CAPTAIN_BY_ID[z.captainId];
            return (
              <Link
                key={z.slug}
                href={`/admin/zone/${z.slug}`}
                className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 hover:border-orange-500 transition shadow-lg hover:shadow-orange-500/20"
              >
                <div className="relative h-28 overflow-hidden">
                  <img src={z.heroImage} alt={z.display} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-orange-500 text-[9px] font-black text-white tracking-wider">
                    {z.offer.split(" ").slice(0, 4).join(" ")}
                  </div>
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-white/90 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {z.name}
                    </div>
                    <div className="text-xs font-bold text-white truncate leading-tight mt-0.5">{z.tagline}</div>
                  </div>
                </div>
                <div className="p-2.5">
                  <div className="text-[9px] text-slate-500 truncate">{z.amenity}</div>
                  <div className="grid grid-cols-3 gap-1 mt-1.5">
                    <Mini value={s.open} label="Open" tone="text-blue-400" />
                    <Mini value={s.booked} label="Won" tone="text-emerald-400" />
                    <Mini value={`${s.conversion || 0}%`} label="Conv" tone="text-orange-400" />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center shrink-0" style={{ background: z.color }}>
                        {expert?.initial || "G"}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 truncate">{expert?.name?.split(" ")[0] || "Expert"}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: any) {
  return (
    <div className="text-right">
      <div className={`text-2xl font-black leading-none ${tone}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function Mini({ value, label, tone }: any) {
  return (
    <div className="text-center">
      <div className={`text-sm font-black leading-none ${tone}`}>{value}</div>
      <div className="text-[8px] uppercase tracking-wider text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}
