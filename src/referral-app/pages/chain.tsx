// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { GitBranch, CheckCircle2, Clock, Home, Share2, Copy } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";
import { useToast } from "@/referral-app/hooks/use-toast";

interface ChainData {
  root: { id: number; name: string; referralCode: string; xp: number; totalEarned: number; level: string };
  directReferrals: { id: number; name: string; status: string; earned: number; area: string; joinedAt: string }[];
  stats: { totalNodes: number; bookedNodes: number; pendingNodes: number; totalChainEarnings: number; conversionRate: number };
}

export default function ChainPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/chain/${referrer.id}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [referrer]);

  const statusColor = (s: string) => ({
    BOOKED: "bg-green-100 text-green-700 border-green-200",
    VERIFIED: "bg-blue-100 text-blue-700 border-blue-200",
    PENDING: "bg-orange-100 text-orange-700 border-orange-200",
  }[s] || "bg-slate-100 text-slate-600");

  const statusIcon = (s: string) => ({ BOOKED: "🏠", VERIFIED: "✅", PENDING: "⏳" }[s] || "·");

  const handleShare = async () => {
    if (!referrer) return;
    const link = `${window.location.origin}/profile/${referrer.referralCode}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Referral link copied!", description: "Share it to grow your chain" });
  };

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Referral Chain" subtitle="Your network tree · everyone you've brought in" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-display flex items-center gap-2">
              <GitBranch className="w-8 h-8 text-primary" /> Referral Chain
            </h1>
            <p className="text-muted-foreground mt-1">Your referral network and conversion tree</p>
          </div>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>

        {/* Stats overview */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-foreground">{data?.stats.totalNodes || 0}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Total Referred</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-green-600">{data?.stats.bookedNodes || 0}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Booked</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-primary">{data?.stats.conversionRate || 0}%</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Conversion</p>
            </div>
          </div>
        )}

        {/* Your earnings from chain */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-orange-700 uppercase tracking-wide">Total Chain Earnings</p>
              <p className="text-4xl font-black text-orange-600 mt-1">₹{data?.stats.totalChainEarnings?.toLocaleString() || 0}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
          <p className="text-xs text-orange-600 mt-3">₹50 per verification + ₹500 per booking</p>
        </div>

        {/* Root node - you */}
        <div className="relative">
          <div className="bg-primary text-white rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-black">
              {data?.root.name.charAt(0) || referrer.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">{data?.root.name || referrer.name}</p>
              <p className="text-white/70 text-sm">You · {data?.root.level || "BEGINNER"} · {data?.root.xp || 0} XP</p>
            </div>
            <div className="text-right">
              <p className="font-black text-xl">₹{data?.root.totalEarned?.toLocaleString() || 0}</p>
              <p className="text-white/70 text-xs">Total earned</p>
            </div>
          </div>

          {/* Connection line */}
          {(data?.directReferrals.length || 0) > 0 && (
            <div className="flex justify-center mt-0">
              <div className="w-0.5 h-6 bg-primary/30" />
            </div>
          )}
        </div>

        {/* Direct referrals tree */}
        {(data?.directReferrals.length || 0) === 0 && !loading ? (
          <div className="text-center py-8 bg-card border border-border rounded-2xl">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-bold text-slate-600">Your chain is empty</p>
            <p className="text-sm text-slate-500 mt-1">Start referring people to grow your network</p>
            <button onClick={handleShare}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm">
              Share Your Link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Your Direct Referrals</h3>
            {(data?.directReferrals || []).map((person, i) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-black text-slate-600">
                  {person.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground">{person.area} · {new Date(person.joinedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {person.earned > 0 && <span className="text-xs font-bold text-green-600">+₹{person.earned}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusColor(person.status)}`}>
                    {statusIcon(person.status)} {person.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Referral link */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-bold text-muted-foreground mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
            <p className="text-xs font-mono text-foreground flex-1 truncate">
              {window.location.origin}/profile/{referrer.referralCode}
            </p>
            <button onClick={handleShare} className="flex items-center gap-1 text-primary text-xs font-bold hover:underline shrink-0">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
