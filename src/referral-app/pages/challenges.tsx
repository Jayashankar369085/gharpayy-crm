// @ts-nocheck
import { useGetChallenges, useCompleteChallenge } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useAppStore } from "@/referral-app/lib/store";
import { motion } from "framer-motion";
import { Target, Zap, CheckCircle2, Clock, Trophy } from "lucide-react";
import { useToast } from "@/referral-app/hooks/use-toast";
import { Badge } from "@/referral-app/components/ui/badge";

const TYPE_COLORS: Record<string, string> = {
  DAILY: "bg-blue-100 text-blue-700",
  WEEKLY: "bg-purple-100 text-purple-700",
  MILESTONE: "bg-yellow-100 text-yellow-700",
  SPECIAL: "bg-red-100 text-red-700",
};

export default function ChallengesPage() {
  const { referrer } = useAppStore();
  const { toast } = useToast();
  const { data: challenges, isLoading, refetch } = useGetChallenges({ referrerId: referrer?.id });
  const complete = useCompleteChallenge();

  const handleComplete = async (challengeId: number) => {
    if (!referrer) return;
    try {
      const result = await complete.mutateAsync({ challengeId, data: { referrerId: referrer.id } });
      toast({
        title: `+${result.xpEarned} XP earned! 🎉`,
        description: result.bonusEarned > 0 ? `Also got ₹${result.bonusEarned} bonus!` : "Challenge complete!",
      });
      refetch();
    } catch (e: any) {
      if (e.response?.status === 409) {
        toast({ title: "Already completed", description: "You've already done this challenge" });
      } else {
        toast({ title: "Failed to complete", variant: "destructive" });
      }
    }
  };

  const active = (challenges || []).filter(c => !c.isCompleted);
  const completed = (challenges || []).filter(c => c.isCompleted);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Challenges
          </h1>
          <p className="text-slate-500 text-sm mt-1">Complete challenges, earn XP and bonus rewards</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">Active</p>
            <p className="text-2xl font-black text-primary">{active.length}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">Completed</p>
            <p className="text-2xl font-black text-green-600">{completed.length}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">Total XP</p>
            <p className="text-2xl font-black text-slate-800">{completed.reduce((s, c) => s + c.xpReward, 0)}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-bold text-slate-900">Active Challenges</h2>
                {active.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl shrink-0">{c.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{c.title}</h3>
                          <Badge variant="outline" className={`text-[10px] px-1.5 ${TYPE_COLORS[c.type]}`}>{c.type}</Badge>
                        </div>
                        <p className="text-slate-500 text-sm mb-3">{c.description}</p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-sm font-bold text-primary">
                            <Zap className="w-3.5 h-3.5" /> +{c.xpReward} XP
                          </span>
                          {c.bonusAmount > 0 && (
                            <span className="text-sm font-bold text-green-600">+₹{c.bonusAmount}</span>
                          )}
                          {c.expiresAt && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" /> Expires {new Date(c.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleComplete(c.id)}
                        disabled={complete.isPending || !referrer}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {complete.isPending ? "..." : "Complete"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Completed ({completed.length})
                </h2>
                {completed.map((c, i) => (
                  <div key={c.id} className="bg-green-50/50 border border-green-100 rounded-2xl p-5 opacity-80">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{c.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-700">{c.title}</h3>
                        <p className="text-slate-500 text-sm">{c.description}</p>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(challenges || []).length === 0 && (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No challenges available</p>
                <p className="text-slate-400 text-sm mt-1">Check back soon for new challenges!</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
