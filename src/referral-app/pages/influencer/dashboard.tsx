// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { TrendingUp, Share2, Eye, MousePointer, Copy, Instagram, MessageCircle, Users, Zap } from "lucide-react";
import { useToast } from "@/referral-app/hooks/use-toast";

export default function InfluencerDashboard() {
  const { referrer, persona } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    if (persona !== "INFLUENCER") { setLocation("/home"); return; }
    fetch(`${BASE}/api/influencer/${referrer.id}/stats`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [referrer, persona]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Share this link with your audience" });
  };

  if (!referrer || persona !== "INFLUENCER") return null;

  const MOCK = {
    followerCount: 5200,
    totalClicks: referrer.totalReferrals * 18,
    conversionRate: referrer.totalReferrals ? Math.round((referrer.bookedReferrals / referrer.totalReferrals) * 100) : 0,
    clickThroughRate: 12,
    totalEarned: referrer.totalEarned,
    pendingEarnings: referrer.pendingEarnings,
    avgEarningPerPost: 850,
    referralLink: `${window.location.origin}/profile/${referrer.referralCode}`,
    socialHandle: `@${referrer.name.toLowerCase().replace(/\s/g, "_")}`,
    contentPerformance: [
      { platform: "Instagram", clicks: Math.floor(referrer.totalReferrals * 8), conversions: Math.floor(referrer.bookedReferrals * 0.4), followers: 2800 },
      { platform: "WhatsApp", clicks: Math.floor(referrer.totalReferrals * 6), conversions: Math.floor(referrer.bookedReferrals * 0.45), followers: 1600 },
      { platform: "Telegram", clicks: Math.floor(referrer.totalReferrals * 4), conversions: Math.floor(referrer.bookedReferrals * 0.15), followers: 800 },
    ],
    weeklyData: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => ({
      day, clicks: Math.floor(Math.random() * 60 + 20), conversions: Math.floor(Math.random() * 4 + 1),
    })),
  };
  const d = data || MOCK;

  const CAPTIONS = [
    `🏠 Looking for PG in Bangalore? I found some amazing options! Use my link and save on your deposit. Verified, affordable, perfect for students & IT folks.\n\n${d.referralLink}\n\n#BangalorePG #FlatHunting #Gharpayy`,
    `🔥 My friends are earning ₹500 per move-in with Gharpayy! Join me · refer your contacts to PGs and get paid instantly.\n\n${d.referralLink}\n\n#SideHustle #EarnOnline #Bangalore`,
    `✅ Just got ₹500 credited! Thanks to @Gharpayy's referral program. Super easy · just share your link and earn when anyone books a PG.\n\n${d.referralLink}`,
  ];
  const [captionIdx, setCaptionIdx] = useState(0);

  const platformIcon = (p: string) => ({ Instagram: "📸", WhatsApp: "💬", Telegram: "✈️" })[p] || "📱";

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black font-display">Creator Hub</h1>
          <p className="text-muted-foreground">{d.socialHandle} · {d.followerCount?.toLocaleString()} followers</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Clicks", value: d.totalClicks?.toLocaleString(), icon: <MousePointer className="w-4 h-4" />, color: "text-blue-600" },
            { label: "Conversions", value: referrer.bookedReferrals || 0, icon: <Zap className="w-4 h-4" />, color: "text-green-600" },
            { label: "CTR", value: `${d.clickThroughRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: "text-orange-600" },
            { label: "Earned", value: `₹${d.totalEarned?.toLocaleString()}`, icon: <Share2 className="w-4 h-4" />, color: "text-primary" },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-border rounded-2xl p-4">
              <div className={`flex items-center gap-1 ${k.color} mb-2`}>{k.icon}<span className="text-xs font-bold uppercase">{k.label}</span></div>
              <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Referral link */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
          <p className="text-white/70 text-xs font-bold uppercase tracking-wide mb-2">Your Unique Referral Link</p>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-3">
            <p className="flex-1 font-mono text-sm truncate">{d.referralLink}</p>
            <button onClick={() => handleCopy(d.referralLink)} className="shrink-0 p-1 hover:bg-white/10 rounded-lg">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/70 text-xs">Earn ₹50 on verification + ₹500 on every booking via your link</p>
        </div>

        {/* Platform performance */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">Platform Performance</h3>
          <div className="space-y-4">
            {d.contentPerformance?.map((p: any) => (
              <div key={p.platform} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-xl">
                  {platformIcon(p.platform)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-foreground">{p.platform}</span>
                    <span className="text-muted-foreground">{p.followers?.toLocaleString()} followers</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((p.clicks / Math.max(...d.contentPerformance.map((x: any) => x.clicks))) * 100, 100)}%` }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{p.clicks} clicks</span>
                    <span className="text-green-600 font-bold">{p.conversions} bookings</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly trend */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4">Weekly Clicks</h3>
          <div className="flex items-end gap-1.5 h-24">
            {d.weeklyData?.map((w: any, i: number) => {
              const max = Math.max(...d.weeklyData.map((x: any) => x.clicks));
              const pct = max ? (w.clicks / max) * 100 : 0;
              return (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                    transition={{ delay: i * 0.05, type: "spring" }}
                    className="w-full bg-primary rounded-t-md min-h-1"
                  />
                  <span className="text-[9px] text-muted-foreground font-medium">{w.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content captions */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">Ready-to-Post Captions</h3>
            <div className="flex gap-1">
              {CAPTIONS.map((_, i) => (
                <button key={i} onClick={() => setCaptionIdx(i)}
                  className={`w-2 h-2 rounded-full transition-all ${captionIdx === i ? "bg-primary" : "bg-muted-foreground/30"}`} />
              ))}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {CAPTIONS[captionIdx]}
          </div>
          <button onClick={() => handleCopy(CAPTIONS[captionIdx])}
            className="mt-3 w-full py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Copy className="w-4 h-4" /> Copy Caption
          </button>
        </div>
      </div>
    </Layout>
  );
}
