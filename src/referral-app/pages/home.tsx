// @ts-nocheck
import { useAppStore } from "@/referral-app/lib/store";
import { useGetReferrerDashboard } from "@/referral-app/api";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { LEVEL_NAMES } from "@/referral-app/lib/constants";
import { getDailyQuote } from "@/referral-app/lib/quotes";
import { motion } from "framer-motion";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { Wallet, Trophy, Target, Star, ChevronRight, Activity, Award, Zap, Flame, GitBranch, TrendingUp } from "lucide-react";
import { Badge } from "@/referral-app/components/ui/badge";

export default function HomePage() {
  const { persona, referrer } = useAppStore();
  const [, setLocation] = useLocation();

  if (!persona) { setLocation("/"); return null; }
  if (!referrer) { setLocation("/register"); return null; }

  if (persona === "PG_MANAGER") { setLocation("/manager"); return null; }
  if (persona === "BROKER") { setLocation("/broker"); return null; }
  if (persona === "INFLUENCER") { setLocation("/influencer"); return null; }
  if (persona === "CORPORATE_HR") { setLocation("/corporate"); return null; }

  const { data: dashboard, isLoading } = useGetReferrerDashboard(referrer.id);
  const quote = getDailyQuote(persona);

  if (isLoading || !dashboard) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  const levelName = LEVEL_NAMES[persona]?.[dashboard.referrer.level] || dashboard.referrer.level;
  const progressPercent = Math.min(100, Math.max(0,
    ((dashboard.referrer.xp - dashboard.currentLevelXp) /
    (dashboard.nextLevelXp - dashboard.currentLevelXp)) * 100
  ));

  // Quick action shortcuts for all personas
  const quickActions = [
    { label: "Refer Now", icon: "💸", href: "/refer" },
    { label: "Streak", icon: "🔥", href: "/streak" },
    { label: "Leaderboard", icon: "🏆", href: "/leaderboard" },
    { label: "Earnings", icon: "💰", href: "/earnings" },
    { label: "Lucky Draw", icon: "🎰", href: "/lucky-draw" },
    { label: "My Chain", icon: "🔗", href: "/chain" },
  ];

  // ── GUARD ──────────────────────────────────────────────────────────
  if (persona === "GUARD") {
    return (
      <Layout>
        <div className="p-4 space-y-5">

          {/* Daily Quote */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/10 border border-orange-500/20 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-xl shrink-0">💬</span>
            <p className="text-orange-300 font-bold text-sm leading-snug">{quote}</p>
          </motion.div>

          {/* Hero Earnings Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-800 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-zinc-700 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-32 h-32 text-green-500" />
            </div>
            <p className="text-zinc-400 font-bold mb-1">TOTAL KAMAI</p>
            <h2 className="text-5xl font-black text-green-400 tracking-tighter mb-4">₹{dashboard.referrer.totalEarned}</h2>
            <div className="flex items-center gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-700/50">
              <div className="bg-orange-500 text-white w-10 h-10 flex items-center justify-center rounded-lg font-black text-xl">
                {dashboard.rank}
              </div>
              <div>
                <p className="text-sm text-zinc-400 font-bold uppercase">Rank</p>
                <p className="font-bold text-white leading-none">Top Referrer</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map(a => (
              <button key={a.href} onClick={() => setLocation(a.href)}
                className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 flex flex-col items-center gap-1.5 hover:bg-zinc-700 active:scale-95 transition-all">
                <span className="text-xl">{a.icon}</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Big Refer CTA */}
          <button
            onClick={() => setLocation("/refer")}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all text-white rounded-3xl p-6 flex flex-col items-center justify-center gap-3 shadow-[0_10px_0_rgba(194,65,12,1)]"
          >
            <span className="text-4xl">💰</span>
            <span className="text-2xl font-black uppercase tracking-wide">Naya Refer Karo</span>
            <span className="text-orange-200 text-sm">PG · Flat · Ghar · Sab kuch</span>
          </button>

          {/* XP Level */}
          <div className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-zinc-400 font-bold text-sm">LEVEL</p>
                <h3 className="text-2xl font-black text-white">{levelName}</h3>
              </div>
              <span className="text-orange-400 font-bold">{dashboard.referrer.xp} XP</span>
            </div>
            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 15 }}
                className="h-full bg-orange-500 rounded-full"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2 text-right font-medium">{dashboard.nextLevelXp - dashboard.referrer.xp} XP to go</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ── STUDENT ────────────────────────────────────────────────────────
  if (persona === "STUDENT") {
    return (
      <Layout>
        <div className="p-6 space-y-5 max-w-2xl mx-auto">

          {/* Daily Quote */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-xl shrink-0">✨</span>
            <p className="text-orange-800 font-semibold text-sm leading-snug italic">"{quote}"</p>
          </motion.div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-800">Hi, {dashboard.referrer.name.split(' ')[0]} 👋</h2>
              <p className="text-orange-600 font-medium">Help a friend find a home, earn together!</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 border border-orange-200 shadow-sm">
              <Trophy className="w-6 h-6" />
            </div>
          </div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl shadow-orange-100/50 border border-orange-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0" />
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Your Wallet</p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">₹{dashboard.referrer.totalEarned}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500 mb-1">Campus Rank</p>
                <p className="text-4xl font-black text-orange-500 tracking-tight">#{dashboard.rank}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-orange-50">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {levelName}
                </span>
                <span className="text-orange-600">{dashboard.referrer.xp} / {dashboard.nextLevelXp} XP</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 40 }}
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-3 gap-2">
            {quickActions.slice(1).map(a => (
              <button key={a.href} onClick={() => setLocation(a.href)}
                className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all">
                <span className="text-xl">{a.icon}</span>
                <span className="text-[10px] font-bold text-slate-500">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Refer CTA */}
          <button
            onClick={() => setLocation("/refer")}
            className="w-full bg-slate-900 hover:bg-slate-800 transition-colors text-white rounded-2xl p-4 flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg leading-tight">Refer a Friend</p>
                <p className="text-white/70 text-sm">PGs, Flats & Houses · Earn ₹500</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white/50" />
          </button>

          {/* Activity */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold font-display text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Recent Activity
            </h3>
            {dashboard.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboard.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-orange-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                        {activity.amount && <span className="ml-2 text-green-600 font-medium">+₹{activity.amount}</span>}
                        {activity.xpGained && <span className="ml-2 text-orange-500 font-medium">+{activity.xpGained} XP</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No activity yet. Start referring!</p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ── EARNER (default) ───────────────────────────────────────────────
  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* Daily Quote */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
          <Zap className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-slate-600 text-sm font-medium italic leading-snug">"{quote}"</p>
        </motion.div>

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Earnings Command</h2>
            <p className="text-sm text-muted-foreground font-medium">Welcome back, {dashboard.referrer.name}</p>
          </div>
          <Badge variant="outline" className="bg-white px-3 py-1 font-mono text-xs">
            {dashboard.referrer.referralCode}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Paid</p>
            <p className="text-2xl font-black text-slate-900">₹{dashboard.referrer.paidEarnings}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-2xl font-black text-orange-600">₹{dashboard.referrer.pendingEarnings}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Conversion</p>
            <p className="text-2xl font-black text-slate-900">
              {dashboard.referrer.totalReferrals ?
                Math.round((dashboard.referrer.bookedReferrals / dashboard.referrer.totalReferrals) * 100) : 0}%
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Streak</p>
            <p className="text-2xl font-black text-slate-900 flex items-center gap-1">
              {dashboard.referrer.streak} <Flame className="w-5 h-5 text-red-500" />
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map(a => (
            <button key={a.href} onClick={() => setLocation(a.href)}
              className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">
              <span className="text-xl">{a.icon}</span>
              <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Pipeline + Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                Pipeline
              </h3>
              <button onClick={() => setLocation("/activity")} className="text-xs text-orange-500 font-bold">View All →</button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Total Referrals", value: dashboard.referrer.totalReferrals, pct: 100, color: "bg-slate-800" },
                { label: "Verified Leads", value: dashboard.referrer.verifiedReferrals, pct: dashboard.referrer.totalReferrals ? (dashboard.referrer.verifiedReferrals / dashboard.referrer.totalReferrals) * 100 : 0, color: "bg-orange-400" },
                { label: "Bookings", value: dashboard.referrer.bookedReferrals, pct: dashboard.referrer.totalReferrals ? (dashboard.referrer.bookedReferrals / dashboard.referrer.totalReferrals) * 100 : 0, color: "bg-green-500" },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-600">{row.label}</span>
                    <span className="font-bold text-slate-900">{row.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div className={`h-full ${row.color} rounded-full`} style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                {levelName}
              </h3>
              <p className="text-sm text-slate-500 mb-6">Rank #{dashboard.rank} · Gharpayy Homes</p>
              <div className="mb-2 flex justify-between items-end">
                <span className="text-3xl font-black text-slate-900">{dashboard.referrer.xp} <span className="text-base text-slate-500 font-medium">XP</span></span>
                <span className="text-sm font-medium text-orange-600">{dashboard.nextLevelXp} XP required</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 40 }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>
            <button
              onClick={() => setLocation("/refer")}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors"
            >
              Add New Lead →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
