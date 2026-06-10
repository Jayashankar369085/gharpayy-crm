// @ts-nocheck
import { useParams, useLocation } from "wouter";
import { useGetTeam } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { Users, Trophy, Crown, ChevronLeft, Star } from "lucide-react";

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "bg-slate-100 text-slate-600",
  EXPLORER: "bg-blue-100 text-blue-700",
  HUSTLER: "bg-orange-100 text-orange-700",
  PRO: "bg-purple-100 text-purple-700",
  LEGEND: "bg-yellow-100 text-yellow-700",
};

const PERSONA_EMOJIS: Record<string, string> = {
  GUARD: "🛡️", STUDENT: "🎓", EARNER: "💼", PG_MANAGER: "🏠",
};

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetTeam(Number(params.id));

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 space-y-4">
          <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!data) return <Layout><div className="p-6 text-center text-slate-500">Team not found</div></Layout>;

  const { team, members } = data;

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        <button onClick={() => setLocation("/teams")} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Teams
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-3xl p-6">
          <h1 className="text-3xl font-black font-display text-slate-900 mb-1">{team.name}</h1>
          {team.description && <p className="text-slate-600 mb-4">{team.description}</p>}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Members</p>
              <p className="text-2xl font-black text-slate-900">{team.memberCount}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Total XP</p>
              <p className="text-2xl font-black text-primary">{team.totalXp}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase">Earned</p>
              <p className="text-2xl font-black text-green-600">₹{team.totalEarned.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Members ({members.length})
          </h2>
          <div className="space-y-3">
            {members.map((member, i) => (
              <motion.div key={member.referrerId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl border border-slate-100">
                  {PERSONA_EMOJIS[member.persona] || "👤"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{member.name}</span>
                    {member.isCaptain && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[member.level]}`}>{member.level}</span>
                    <span className="text-xs text-slate-400">{member.xp} XP</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">+{member.contribution} XP</p>
                  <p className="text-xs text-slate-400">contributed</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
