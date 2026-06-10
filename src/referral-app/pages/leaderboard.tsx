// @ts-nocheck
import { useAppStore } from "@/referral-app/lib/store";
import { useGetLeaderboard } from "@/referral-app/api";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { LEVEL_NAMES } from "@/referral-app/lib/constants";
import { motion } from "framer-motion";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { Trophy, Flame, Target } from "lucide-react";
import { cn } from "@/referral-app/lib/utils";

export default function LeaderboardPage() {
  const { persona, referrer } = useAppStore();
  const [, setLocation] = useLocation();

  if (!persona || !referrer) {
    setLocation("/");
    return null;
  }

  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  if (isLoading || !leaderboard) {
    return (
      <Layout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl mb-8" />
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </Layout>
    );
  }

  const isGuard = persona === "GUARD";
  const isStudent = persona === "STUDENT";
  const isEarner = persona === "EARNER";

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className={cn(
          "mb-8 p-8 rounded-3xl text-center relative overflow-hidden",
          isGuard ? "bg-zinc-900 border border-zinc-800" : 
          isStudent ? "bg-orange-50 border border-orange-100" : 
          "bg-slate-900 border border-slate-800"
        )}>
          <Trophy className={cn(
            "w-24 h-24 mx-auto mb-4 opacity-20 absolute -top-4 -right-4",
            isGuard ? "text-green-500" : isStudent ? "text-orange-500" : "text-white"
          )} />
          
          <h1 className={cn(
            "text-4xl md:text-5xl font-black font-display tracking-tight mb-2 relative z-10",
            isGuard ? "text-white" : isStudent ? "text-orange-950" : "text-white"
          )}>
            {isGuard ? "Top Kamaal Wale" : isStudent ? "Campus Leaderboard" : "Top Performers"}
          </h1>
          
          <p className={cn(
            "font-medium relative z-10",
            isGuard ? "text-zinc-400" : isStudent ? "text-orange-700" : "text-slate-400"
          )}>
            {isGuard ? "Sabse zyada refer karne wale boss log" : 
             isStudent ? "See who's helping the most friends find homes" : 
             "Ranked by XP and total successful bookings"}
          </p>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isMe = entry.referrerId === referrer.id;
            const levelName = LEVEL_NAMES[entry.persona]?.[entry.level] || entry.level;
            
            return (
              <motion.div
                key={entry.referrerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  isMe ? (
                    isGuard ? "bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
                    isStudent ? "bg-white border-orange-300 shadow-md shadow-orange-500/10 ring-2 ring-orange-500" :
                    "bg-primary/5 border-primary/30 shadow-sm ring-1 ring-primary/50"
                  ) : "bg-card border-border hover:border-primary/30"
                )}
              >
                {/* Rank */}
                <div className={cn(
                  "w-12 h-12 shrink-0 flex items-center justify-center rounded-xl font-black text-xl",
                  index === 0 ? "bg-yellow-400 text-yellow-900 shadow-inner" :
                  index === 1 ? "bg-slate-300 text-slate-800 shadow-inner" :
                  index === 2 ? "bg-amber-600 text-amber-100 shadow-inner" :
                  "bg-muted text-muted-foreground"
                )}>
                  {index < 3 ? <Trophy className="w-6 h-6" /> : `#${entry.rank}`}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-lg truncate">
                      {entry.name} {isMe && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-2">YOU</span>}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{levelName}</span>
                    {entry.streak > 2 && (
                      <span className="flex items-center gap-1 text-red-500 font-bold text-xs">
                        <Flame className="w-3 h-3 fill-red-500" /> {entry.streak}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                  <div className={cn("hidden sm:block text-left", !isEarner && "sm:hidden")}>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Bookings</p>
                    <p className="font-black text-foreground flex items-center gap-1 justify-end">
                      {entry.bookedReferrals} <Target className="w-3 h-3 text-green-500" />
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-bold uppercase mb-0.5">Total XP</p>
                    <p className="font-black text-xl text-foreground tabular-nums tracking-tight">
                      {entry.xp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}