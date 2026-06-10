// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { useToast } from "@/referral-app/hooks/use-toast";
import { Swords, Trophy, Clock, Zap, Users, Plus } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";

interface Battle {
  id: number;
  challengerTeamId: number;
  challengerTeamName: string;
  defenderTeamId: number;
  defenderTeamName: string;
  status: string;
  challengerScore: number;
  defenderScore: number;
  winnerTeamId: number | null;
  prizeXp: number;
  prizeCash: number;
  metric: string;
  endsAt: string;
}

export default function SquadBattlesPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ challengerTeamId: 1, defenderTeamId: 2, metric: "referrals", prizeXp: 500, durationHours: 24 });

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/squad-battles`)
      .then(r => r.json()).then(d => setBattles(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [referrer]);

  const MOCK_BATTLES: Battle[] = [
    { id: 1, challengerTeamId: 1, challengerTeamName: "Koramangala Kings", defenderTeamId: 2, defenderTeamName: "HSR Hustlers", status: "ACTIVE", challengerScore: 12, defenderScore: 9, winnerTeamId: null, prizeXp: 500, prizeCash: 0, metric: "referrals", endsAt: new Date(Date.now() + 18 * 3600000).toISOString() },
    { id: 2, challengerTeamId: 2, challengerTeamName: "HSR Hustlers", defenderTeamId: 3, defenderTeamName: "Student Brigade", status: "ACTIVE", challengerScore: 5, defenderScore: 7, winnerTeamId: null, prizeXp: 300, prizeCash: 0, metric: "bookings", endsAt: new Date(Date.now() + 6 * 3600000).toISOString() },
    { id: 3, challengerTeamId: 3, challengerTeamName: "Student Brigade", defenderTeamId: 1, defenderTeamName: "Koramangala Kings", status: "COMPLETED", challengerScore: 4, defenderScore: 8, winnerTeamId: 1, prizeXp: 200, prizeCash: 0, metric: "referrals", endsAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  ];

  const allBattles = battles.length > 0 ? battles : MOCK_BATTLES;

  const handleCreateBattle = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/squad-battles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const battle = await res.json();
        setBattles(prev => [battle, ...prev]);
        setShowCreate(false);
        toast({ title: "⚔️ Battle Started!", description: "Challenge has been sent to the opposing team!" });
      }
    } finally {
      setCreating(false);
    }
  };

  const timeLeft = (endsAt: string) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Squad Battles" subtitle="Challenge other teams · winner takes all XP & cash" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-display flex items-center gap-2">
              <Swords className="w-8 h-8 text-primary" /> Squad Battles
            </h1>
            <p className="text-muted-foreground mt-1">Teams compete head-to-head for XP glory</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> New Battle
          </button>
        </div>

        {/* Create battle form */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <h3 className="font-bold text-foreground">⚔️ Challenge a Team</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Your Team</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  value={form.challengerTeamId} onChange={e => setForm(f => ({ ...f, challengerTeamId: Number(e.target.value) }))}>
                  <option value={1}>Koramangala Kings</option>
                  <option value={2}>HSR Hustlers</option>
                  <option value={3}>Student Brigade</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Opponent</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  value={form.defenderTeamId} onChange={e => setForm(f => ({ ...f, defenderTeamId: Number(e.target.value) }))}>
                  <option value={2}>HSR Hustlers</option>
                  <option value={1}>Koramangala Kings</option>
                  <option value={3}>Student Brigade</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Battle Metric</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                  <option value="referrals">Total Referrals</option>
                  <option value="bookings">Successful Bookings</option>
                  <option value="xp">XP Earned</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Duration</label>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: Number(e.target.value) }))}>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={168}>1 Week</option>
                </select>
              </div>
            </div>
            <button onClick={handleCreateBattle} disabled={creating}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {creating ? "Starting..." : "⚔️ Start Battle!"}
            </button>
          </motion.div>
        )}

        {/* Active battles */}
        <div className="space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Live Battles
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
            </div>
          ) : (
            allBattles.filter(b => b.status === "ACTIVE").map((battle, i) => {
              const total = battle.challengerScore + battle.defenderScore || 1;
              const cPct = Math.round((battle.challengerScore / total) * 100);
              const dPct = 100 - cPct;
              return (
                <motion.div key={battle.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase">Live</span>
                      <span className="text-xs text-muted-foreground capitalize">{battle.metric}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {timeLeft(battle.endsAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 text-center">
                      <p className="font-black text-sm text-foreground">{battle.challengerTeamName}</p>
                      <p className="text-3xl font-black text-primary">{battle.challengerScore}</p>
                    </div>
                    <div className="text-2xl font-black text-muted-foreground">VS</div>
                    <div className="flex-1 text-center">
                      <p className="font-black text-sm text-foreground">{battle.defenderTeamName}</p>
                      <p className="text-3xl font-black text-slate-600">{battle.defenderScore}</p>
                    </div>
                  </div>

                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${cPct}%` }}
                      className="h-full bg-primary rounded-l-full"
                    />
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${dPct}%` }}
                      className="h-full bg-slate-400 rounded-r-full"
                    />
                  </div>

                  <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                    <span>{cPct}%</span>
                    <span className="text-yellow-600 font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {battle.prizeXp} XP prize
                    </span>
                    <span>{dPct}%</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Completed battles */}
        {allBattles.filter(b => b.status === "COMPLETED").length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-foreground">Recent Results</h2>
            {allBattles.filter(b => b.status === "COMPLETED").map((battle) => (
              <div key={battle.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">
                    {battle.challengerTeamName} vs {battle.defenderTeamName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {battle.challengerScore} – {battle.defenderScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-orange-600">
                    🏆 {battle.winnerTeamId === battle.challengerTeamId ? battle.challengerTeamName : battle.defenderTeamName} wins
                  </p>
                  <p className="text-xs text-muted-foreground">+{battle.prizeXp} XP</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
