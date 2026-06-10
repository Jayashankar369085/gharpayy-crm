// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/referral-app/hooks/use-toast";
import { Flame, Calendar, Zap, Gift, CheckCircle2, Lock } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";

interface StreakData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalCheckins: number;
    lastCheckinDate: string | null;
    lastXpAwarded: number;
  };
  recentLogs: { checkinDate: string; xpAwarded: number; streakDay: number }[];
}

export default function StreakPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/streaks/${referrer.id}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [referrer]);

  const checkedInToday = data?.streak.lastCheckinDate === new Date().toISOString().slice(0, 10);

  const handleCheckin = async () => {
    if (!referrer || spinning || checkedInToday) return;
    setSpinning(true);
    try {
      const res = await fetch(`${BASE}/api/streaks/${referrer.id}/checkin`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 2500);
        toast({ title: `🔥 Day ${json.newStreak} streak!`, description: `+${json.xpAwarded} XP earned${json.bonusAwarded ? ` + ₹${json.bonusAwarded} bonus` : ""}` });
        const updated = await fetch(`${BASE}/api/streaks/${referrer.id}`).then(r => r.json());
        setData(updated);
      } else {
        toast({ title: json.message || "Already checked in today!" });
      }
    } finally {
      setSpinning(false);
    }
  };

  const MILESTONES = [
    { days: 3, reward: "+30 XP", icon: "🔥" },
    { days: 7, reward: "+₹100", icon: "💰" },
    { days: 14, reward: "+200 XP", icon: "⚡" },
    { days: 30, reward: "+₹500", icon: "👑" },
  ];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const log = data?.recentLogs.find(l => l.checkinDate === d);
    return { date: d, checked: !!log, xp: log?.xpAwarded || 0, day: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(d).getDay()] };
  }).reverse();

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Daily Streak" subtitle="Check in every day to keep your streak alive 🔥" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-muted-foreground mt-1">Check in every day to earn XP and bonus rewards</p>
        </div>

        {/* Main streak display */}
        <motion.div
          className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white text-center overflow-hidden shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        >
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <Flame key={i} className="absolute w-8 h-8" style={{ left: `${(i * 23) % 90}%`, top: `${(i * 17) % 80}%` }} />
            ))}
          </div>
          <AnimatePresence>
            {showFireworks && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }}
                exit={{}} transition={{ duration: 1.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-6xl">🎉</span>
              </motion.div>
            )}
          </AnimatePresence>
          {loading ? (
            <div className="h-24 animate-pulse" />
          ) : (
            <>
              <motion.div
                key={data?.streak.currentStreak}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-8xl font-black mb-2 leading-none"
              >
                {data?.streak.currentStreak || 0}
              </motion.div>
              <p className="text-white/80 text-xl font-bold mb-1">Day Streak</p>
              <p className="text-white/60 text-sm">Longest: {data?.streak.longestStreak || 0} days • Total check-ins: {data?.streak.totalCheckins || 0}</p>
            </>
          )}
        </motion.div>

        {/* Check-in button */}
        <motion.button
          onClick={handleCheckin}
          disabled={checkedInToday || spinning || loading}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-lg
            ${checkedInToday
              ? "bg-green-100 text-green-700 border-2 border-green-200 cursor-default"
              : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200"
            }`}
        >
          {checkedInToday ? (
            <><CheckCircle2 className="w-7 h-7" /> Checked in today!</>
          ) : spinning ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}><Flame className="w-7 h-7" /></motion.div> Checking in...</>
          ) : (
            <><Flame className="w-7 h-7" /> Check In Now (+{Math.min((data?.streak.currentStreak || 0) * 2 + 5, 55)} XP)</>
          )}
        </motion.button>

        {/* Last 7 days calendar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> This Week
          </h3>
          <div className="grid grid-cols-7 gap-1.5">
            {last7.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.day}</span>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center text-lg font-bold
                    ${d.checked ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-muted text-muted-foreground"}`}
                >
                  {d.checked ? "🔥" : "·"}
                </motion.div>
                {d.checked && <span className="text-[9px] text-orange-500 font-bold">+{d.xp}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Milestone rewards */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" /> Streak Milestones
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {MILESTONES.map((m) => {
              const achieved = (data?.streak.longestStreak || 0) >= m.days;
              return (
                <div key={m.days} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all
                  ${achieved ? "border-orange-300 bg-orange-50" : "border-border bg-card"}`}>
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{m.days}-Day Streak</p>
                    <p className={`text-xs font-bold ${achieved ? "text-orange-600" : "text-muted-foreground"}`}>{m.reward}</p>
                  </div>
                  {achieved
                    ? <CheckCircle2 className="w-4 h-4 text-orange-500 ml-auto" />
                    : <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
