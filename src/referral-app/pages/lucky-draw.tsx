// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/referral-app/hooks/use-toast";
import { Sparkles, Gift, Clock, Star } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";

const SEGMENTS = [
  { label: "50 XP", color: "#f97316", emoji: "⚡" },
  { label: "₹25", color: "#3b82f6", emoji: "💰" },
  { label: "100 XP", color: "#22c55e", emoji: "🔥" },
  { label: "₹50", color: "#a855f7", emoji: "💎" },
  { label: "200 XP", color: "#f59e0b", emoji: "⭐" },
  { label: "₹100", color: "#ef4444", emoji: "👑" },
  { label: "500 XP", color: "#06b6d4", emoji: "🚀" },
  { label: "₹25", color: "#84cc16", emoji: "💸" },
];

export default function LuckyDrawPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [canSpin, setCanSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<{ prize: string; prizeIndex: number; message: string } | null>(null);
  const [recentWins, setRecentWins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/lucky-draw/${referrer.id}`)
      .then(r => r.json())
      .then(d => { setCanSpin(d.canSpin); setRecentWins(d.recentWins || []); })
      .finally(() => setLoading(false));
  }, [referrer]);

  const handleSpin = async () => {
    if (!referrer || !canSpin || spinning) return;
    setSpinning(true);
    setWinner(null);
    try {
      const res = await fetch(`${BASE}/api/lucky-draw/${referrer.id}/spin`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        const segmentAngle = 360 / SEGMENTS.length;
        const winningIndex = json.prizeIndex ?? 0;
        const targetAngle = 360 * 8 + (SEGMENTS.length - winningIndex) * segmentAngle - segmentAngle / 2;
        setRotation(prev => prev + targetAngle);
        setTimeout(() => {
          setWinner(json);
          setCanSpin(false);
          setRecentWins(prev => [json.draw, ...prev.slice(0, 4)]);
          toast({ title: `🎉 ${json.message}`, description: "Your prize has been credited!" });
          setSpinning(false);
        }, 4000);
      } else {
        toast({ title: json.message || "Already spun today!" });
        setSpinning(false);
      }
    } catch {
      setSpinning(false);
    }
  };

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Lucky Draw" subtitle="Spin once daily · win XP or cash bonus! 🎰" />
      <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
        <div className="text-center">
        </div>

        {/* Spin Wheel */}
        <div className="relative flex items-center justify-center">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0" style={{
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "24px solid #f97316",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }} />

          {/* Wheel */}
          <div className="relative w-72 h-72">
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.2, 0.8, 0.4, 1] }}
              className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-2xl"
              style={{ background: "conic-gradient(" + SEGMENTS.map((s, i) => `${s.color} ${i * (360 / SEGMENTS.length)}deg ${(i + 1) * (360 / SEGMENTS.length)}deg`).join(", ") + ")" }}
            >
              {SEGMENTS.map((s, i) => {
                const angle = (i + 0.5) * (360 / SEGMENTS.length);
                const rad = (angle - 90) * Math.PI / 180;
                const r = 100;
                const x = 50 + r * Math.cos(rad) * 0.6;
                const y = 50 + r * Math.sin(rad) * 0.6;
                return (
                  <div key={i} className="absolute text-white font-black text-xs text-center leading-tight"
                    style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${angle}deg)`, width: "60px" }}>
                    <div>{s.emoji}</div>
                    <div>{s.label}</div>
                  </div>
                );
              })}
            </motion.div>

            {/* Center button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handleSpin}
                disabled={!canSpin || spinning || loading}
                className={`w-20 h-20 rounded-full border-4 border-white font-black text-sm shadow-xl flex flex-col items-center justify-center transition-all
                  ${canSpin && !spinning ? "bg-orange-500 hover:bg-orange-600 text-white scale-100 hover:scale-105" : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}
              >
                {spinning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5 }}><Star className="w-6 h-6" /></motion.div>
                  : <>✨<br />SPIN</>}
              </button>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          {loading ? <p className="text-muted-foreground">Loading...</p>
            : canSpin ? (
              <p className="text-green-600 font-bold text-lg flex items-center justify-center gap-2">
                <Gift className="w-5 h-5" /> Spin available! Tap the wheel.
              </p>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3 justify-center">
                <Clock className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="font-bold text-slate-700">Come back tomorrow!</p>
                  <p className="text-sm text-slate-500">1 free spin per day</p>
                </div>
              </div>
            )}
        </div>

        {/* Winner announcement */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white text-center shadow-xl"
            >
              <p className="text-5xl mb-2">🎉</p>
              <h3 className="text-2xl font-black">{winner.prize}</h3>
              <p className="text-white/80 mt-1">Prize credited to your account!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent wins */}
        {recentWins.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="font-bold text-foreground">Recent Wins</h3>
            {recentWins.slice(0, 5).map((w: any, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="font-medium">{w.prize}</span>
                <span className="text-muted-foreground">{new Date(w.spinDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
