// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { Zap, Clock, MapPin, Flame, ChevronRight, Star } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";

interface FlashDeal {
  id: number;
  propertyId: number;
  propertyName: string;
  area: string;
  originalRent: number;
  dealRent: number;
  bonusMultiplier: number;
  bonusAmount: number;
  spotsTotal: number;
  spotsTaken: number;
  expiresAt: string;
  discount: number;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("EXPIRED"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return <span className="font-mono font-black">{timeLeft}</span>;
}

export default function FlashDealsPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/flash-deals`)
      .then(r => r.json()).then(d => setDeals(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [referrer]);

  const urgencyColor = (expiresAt: string) => {
    const hours = (new Date(expiresAt).getTime() - Date.now()) / 3600000;
    if (hours < 2) return "text-red-600 bg-red-50 border-red-200";
    if (hours < 6) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Flash Deals" subtitle="Limited-time bonus commissions on select homes" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl p-6 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <Zap key={i} className="absolute w-6 h-6" style={{ left: `${i * 15}%`, top: `${(i * 23) % 80}%` }} />
            ))}
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">⚡ Flash Deals</span>
            </div>
            <h1 className="text-3xl font-black font-display">Limited-Time PG Deals</h1>
            <p className="text-white/80 mt-1">Exclusive discounts + 2-4x referral bonus. Today only!</p>
          </div>
        </div>

        {/* Active deal count banner */}
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            <span className="font-bold text-red-700">{deals.length} active deals right now</span>
          </div>
          <span className="text-red-600 text-sm font-medium">Hurry up!</span>
        </div>

        {/* Deals */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">😴</p>
            <p className="font-bold text-slate-600">No flash deals right now</p>
            <p className="text-sm text-slate-500 mt-1">Check back soon · new deals drop daily!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deals.map((deal, i) => {
              const spotsLeft = deal.spotsTotal - deal.spotsTaken;
              const fillPct = (deal.spotsTaken / deal.spotsTotal) * 100;
              return (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border-2 border-orange-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setLocation(`/pg/${deal.propertyId}`)}
                >
                  {/* Discount badge */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold">
                      <Zap className="w-4 h-4" />
                      {deal.discount}% OFF + {deal.bonusMultiplier}x referral bonus
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/20 border border-white/30`}>
                      <Clock className="w-3 h-3" />
                      <CountdownTimer expiresAt={deal.expiresAt} />
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-foreground text-lg">{deal.propertyName}</h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {deal.area}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-3xl font-black text-green-600">₹{deal.dealRent.toLocaleString()}</span>
                      <span className="text-lg text-muted-foreground line-through">₹{deal.originalRent.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
                      <p className="text-sm font-bold text-orange-700">
                        🎁 Your referral bonus: <span className="text-lg">₹{deal.bonusAmount}</span>
                        <span className="font-normal text-orange-600"> (normally ₹{Math.round(deal.bonusAmount / deal.bonusMultiplier)})</span>
                      </p>
                    </div>

                    {/* Spots left */}
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className={spotsLeft <= 2 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                          {spotsLeft <= 2 ? `⚠️ Only ${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left!` : `${spotsLeft} spots remaining`}
                        </span>
                        <span className="text-muted-foreground">{deal.spotsTaken}/{deal.spotsTotal}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                          transition={{ delay: i * 0.1 + 0.3, type: "spring" }}
                          className={`h-full rounded-full ${fillPct > 75 ? "bg-red-500" : fillPct > 50 ? "bg-orange-500" : "bg-green-500"}`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-2">Flash deals refresh daily at 8 AM</p>
      </div>
    </Layout>
  );
}
