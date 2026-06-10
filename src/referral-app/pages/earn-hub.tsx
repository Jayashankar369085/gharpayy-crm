// @ts-nocheck
import { Link } from "wouter";
import { EARN_RULES, expectedMonthlyEarning } from "@/lib/earn-rules";
import { GHARPAYY_ZONES } from "@/lib/gharpayy-zones";
import { Sparkles, ArrowRight, TrendingUp, Trophy, Wallet, Flame } from "lucide-react";

const DIFF_TONE: any = {
  Easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function EarnHubPage() {
  const totalTopMonthly = EARN_RULES.reduce((s, r) => s + (r.topEarner?.monthly || 0), 0);
  const sumOfPotential = EARN_RULES.reduce((s, r) => s + expectedMonthlyEarning(r, 8), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.35),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-14 pb-10">
          <Link href="/home" className="text-xs text-slate-400 hover:text-white">← Back</Link>
          <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">
            <Sparkles className="w-3 h-3" /> Make money with Gharpayy
          </div>
          <h1 className="mt-2 text-3xl md:text-5xl font-black leading-tight">
            10 ways to earn from real Bengaluru rentals.
          </h1>
          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl">
            Pick a channel that matches your network. Each one ships with copy, posters, scripts and a Gharpayy Expert
            who actually closes the deal. Cash out weekly via UPI.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Stat icon={Wallet} label="Top earner this month" value={`₹${Math.round(64000).toLocaleString()}`} tone="text-emerald-300" />
            <Stat icon={TrendingUp} label="Combined potential" value={`₹${sumOfPotential.toLocaleString()}/mo`} tone="text-orange-300" />
            <Stat icon={Trophy} label="Active earners" value="218 this week" tone="text-blue-300" />
            <Stat icon={Flame} label="Paid in last 7 days" value="₹4.7L" tone="text-rose-300" />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-8">
        {/* The 10 ways */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-orange-400 font-black">The 10 ways</div>
              <h2 className="text-xl md:text-2xl font-black">Pick one. Start today.</h2>
            </div>
            <div className="text-[11px] text-slate-500 hidden md:block">Each card → playbook → WhatsApp link.</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EARN_RULES.map((r, i) => {
              const monthly = expectedMonthlyEarning(r, 8);
              return (
                <Link
                  key={r.id}
                  href={`/earn/${r.id}`}
                  className="group relative bg-slate-900 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-5 transition shadow-lg hover:shadow-orange-500/10"
                >
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-600">#{String(i + 1).padStart(2, "0")}</div>
                  <div className="text-3xl">{r.emoji}</div>
                  <div className="mt-2 font-black text-white text-base leading-tight">{r.title}</div>
                  <div className="mt-1 text-[11px] text-slate-400 leading-snug">{r.blurb}</div>

                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black border ${DIFF_TONE[r.difficulty]}`}>{r.difficulty}</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-800 text-slate-300">⏱ {r.timePerWeek}</span>
                    {r.bestZone && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-orange-500/15 text-orange-300 border border-orange-500/30">
                        📍 {r.bestZone}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-end justify-between">
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-slate-500">Realistic / month</div>
                      <div className="text-xl font-black text-orange-400 leading-none mt-0.5">₹{monthly.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] uppercase tracking-widest text-slate-500">Top earner</div>
                      <div className="text-[11px] font-bold text-emerald-300 leading-none mt-0.5">
                        ₹{r.topEarner?.monthly.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-500 leading-none mt-0.5">{r.topEarner?.name}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-300 group-hover:text-orange-400 transition">
                    <span>Open playbook</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trust strip · earn = real bookings, not a discount */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤝</div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-orange-400 font-black">Why this works</div>
              <h3 className="text-lg font-black text-white">People earn here because Gharpayy ships real homes.</h3>
              <p className="text-sm text-slate-400 mt-1">
                Every payout below is from a verified booking in one of our 5 zones. Renters don't pay more · owners pay
                Gharpayy, and Gharpayy shares with the friend who introduced you. That's it.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
            {GHARPAYY_ZONES.map((z) => (
              <div key={z.slug} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: z.color }} />
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 truncate">{z.display}</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{z.tagline}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-400 font-black">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`mt-1 text-lg font-black ${tone}`}>{value}</div>
    </div>
  );
}
