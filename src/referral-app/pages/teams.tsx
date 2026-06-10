// @ts-nocheck
import { useState } from "react";
import { useGetTeams, useGetTeamLeaderboard, useCreateTeam, useJoinTeam } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useLocation } from "wouter";
import { useAppStore } from "@/referral-app/lib/store";
import { motion } from "framer-motion";
import { Users, Trophy, Plus, Hash, ChevronRight, Crown, Shield } from "lucide-react";
import { Button } from "@/referral-app/components/ui/button";
import { Input } from "@/referral-app/components/ui/input";
import { useToast } from "@/referral-app/hooks/use-toast";

export default function TeamsPage() {
  const [, setLocation] = useLocation();
  const { referrer } = useAppStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<"browse" | "leaderboard" | "create">("browse");
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const { data: teams, isLoading, refetch } = useGetTeams();
  const { data: leaderboard } = useGetTeamLeaderboard({ limit: 10 });
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();

  const handleCreate = async () => {
    if (!teamName || !referrer) return;
    try {
      const team = await createTeam.mutateAsync({ data: { name: teamName, description: teamDesc, captainId: referrer.id } });
      toast({ title: "Team created!", description: `Your team "${teamName}" is live. Share the invite code.` });
      setTeamName(""); setTeamDesc("");
      refetch();
      setTab("browse");
    } catch (e: any) {
      toast({ title: "Failed to create team", variant: "destructive" });
    }
  };

  const handleJoin = async (teamId: number, inviteCode: string) => {
    if (!referrer) return;
    setJoiningId(teamId);
    try {
      await joinTeam.mutateAsync({ teamId, data: { referrerId: referrer.id, inviteCode } });
      toast({ title: "Joined team!", description: "You're now part of the team 🎉" });
      refetch();
    } catch {
      toast({ title: "Failed to join", variant: "destructive" });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Teams
            </h1>
            <p className="text-slate-500 text-sm mt-1">Join a squad, climb together, earn more</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          {(["browse", "leaderboard", "create"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${tab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
              {t === "create" ? "Create" : t === "leaderboard" ? "🏆 Rankings" : "Browse"}
            </button>
          ))}
        </div>

        {tab === "browse" && (
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)
            ) : (teams || []).length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No teams yet</p>
                <p className="text-slate-400 text-sm">Be the first to create one!</p>
              </div>
            ) : (
              (teams || []).map((team, i) => (
                <motion.div key={team.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white border border-slate-100 rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg">{team.name}</h3>
                        {referrer && team.captainId === referrer.id && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      {team.description && <p className="text-slate-500 text-sm mb-2">{team.description}</p>}
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {team.memberCount} members</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-yellow-500" /> {team.totalXp} XP</span>
                        <span className="font-medium text-green-700">₹{team.totalEarned.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <button onClick={() => setLocation(`/teams/${team.id}`)}
                        className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                        View <ChevronRight className="w-4 h-4" />
                      </button>
                      {referrer && team.captainId !== referrer.id && (
                        <button onClick={() => handleJoin(team.id, team.inviteCode)}
                          disabled={joiningId === team.id}
                          className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
                          {joiningId === team.id ? "..." : "Join"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono text-slate-500">Invite code: </span>
                    <span className="text-xs font-mono font-bold text-slate-700">{team.inviteCode}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="space-y-3">
            {(leaderboard || []).map((entry, i) => (
              <motion.div key={entry.teamId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-slate-100 text-slate-700" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-500"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${entry.rank}`}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{entry.teamName}</p>
                  <div className="flex gap-3 text-sm text-slate-500">
                    <span>{entry.memberCount} members</span>
                    <span>{entry.totalBookings} bookings</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary">{entry.totalXp} XP</p>
                  <p className="text-sm font-bold text-green-600">₹{entry.totalEarned.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === "create" && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">Create a Team</h2>
            {!referrer ? (
              <p className="text-slate-500 text-sm">Please <a href="/register" className="text-primary underline">register</a> to create a team.</p>
            ) : (
              <>
                <Input placeholder="Team name (e.g. 'HSR Hustlers')" value={teamName} onChange={e => setTeamName(e.target.value)} />
                <Input placeholder="Description (optional)" value={teamDesc} onChange={e => setTeamDesc(e.target.value)} />
                <Button onClick={handleCreate} disabled={!teamName || createTeam.isPending} className="w-full">
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
                <p className="text-xs text-slate-400 text-center">You'll be the expert. Invite others with the generated code.</p>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
