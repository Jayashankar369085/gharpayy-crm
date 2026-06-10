// @ts-nocheck
import { useParams, useLocation } from "wouter";
import { useGetReferrerByCode } from "@/referral-app/api";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Users, ArrowRight, MessageCircle, ExternalLink, Star, Zap } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/referral-app/hooks/use-toast";

const PERSONA_LABELS: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  GUARD:        { emoji: "🛡️", label: "Daily Worker",   color: "text-zinc-700",   bg: "from-zinc-800 to-zinc-900" },
  STUDENT:      { emoji: "🎓", label: "College Student", color: "text-orange-700", bg: "from-orange-400 to-orange-600" },
  EARNER:       { emoji: "💼", label: "Side Hustler",    color: "text-blue-700",   bg: "from-blue-500 to-blue-700" },
  PG_MANAGER:   { emoji: "🏠", label: "PG Manager",      color: "text-teal-700",   bg: "from-teal-500 to-teal-700" },
  BROKER:       { emoji: "🤝", label: "Broker / Agent",  color: "text-slate-700",  bg: "from-slate-700 to-slate-900" },
  INFLUENCER:   { emoji: "📱", label: "Influencer",      color: "text-purple-700", bg: "from-purple-500 to-purple-700" },
  CORPORATE_HR: { emoji: "🏢", label: "Corporate HR",    color: "text-indigo-700", bg: "from-indigo-500 to-indigo-700" },
};

const LEVEL_BADGE: Record<string, string> = {
  BEGINNER: "🌱 Beginner",
  EXPLORER: "🔍 Explorer",
  HUSTLER:  "🔥 Hustler",
  PRO:      "⭐ Pro",
  LEGEND:   "👑 Legend",
};

export default function PublicProfilePage() {
  const params = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referrer, isLoading } = useGetReferrerByCode(params.code);

  const referralLink = `${window.location.origin}/refer?ref=${params.code}`;
  const joinLink = `${window.location.origin}/`;

  const personaInfo = PERSONA_LABELS[referrer?.persona ?? "EARNER"] ?? PERSONA_LABELS.EARNER;

  const whatsappMsg = encodeURIComponent(
    `Hey! I found a great PG in Bangalore through Gharpayy 🏠\n\nLooking for a PG? Use my referral link and I'll help you find the perfect spot:\n${referralLink}\n\n-${referrer?.name ?? ""}`
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Referral link copied!", description: "Share it with anyone looking for a PG" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Find a PG through ${referrer?.name ?? "me"} on Gharpayy`,
        text: `Looking for a PG in Bangalore? ${referrer?.name ?? "I"} can help you find verified PGs!\n\nEarn ₹500 on booking via my referral link:`,
        url: referralLink,
      });
    } else {
      handleCopy();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#FBFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!referrer) {
    return (
      <div className="min-h-[100dvh] bg-[#FBFBFC] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-4xl mb-4">🏠</p>
        <h1 className="text-2xl font-black font-display text-slate-800 mb-2">Profile not found</h1>
        <p className="text-slate-500 mb-6">This referral code doesn't exist.</p>
        <button onClick={() => setLocation("/")} className="px-6 py-3 bg-orange-500 text-white font-bold rounded-full">
          Go to Gharpayy →
        </button>
      </div>
    );
  }

  const conversionRate = referrer.totalReferrals > 0
    ? Math.round((referrer.bookedReferrals / referrer.totalReferrals) * 100)
    : 0;

  return (
    <div className="min-h-[100dvh] bg-[#FBFBFC]">

      {/* Hero Banner */}
      <div className={`bg-gradient-to-br ${personaInfo.bg} text-white px-6 pt-12 pb-20 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-32 h-32 rounded-full bg-white"
              style={{ top: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%`, transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative text-center max-w-sm mx-auto">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-5xl mx-auto mb-4 shadow-xl border-4 border-white/30">
            {personaInfo.emoji}
          </div>
          <h1 className="text-3xl font-black font-display">{referrer.name}</h1>
          <p className="text-white/80 mt-1 font-medium">{personaInfo.label} on Gharpayy</p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-bold">
              {LEVEL_BADGE[referrer.level] ?? referrer.level}
            </span>
            {referrer.teamName && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium flex items-center gap-1">
                <Users className="w-3 h-3" /> {referrer.teamName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Stats Card */}
      <div className="px-4 -mt-10 max-w-sm mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-black text-slate-900">{referrer.totalReferrals}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Referrals</p>
          </div>
          <div className="border-x border-slate-100">
            <p className="text-2xl font-black text-green-600">{referrer.bookedReferrals}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Bookings</p>
          </div>
          <div>
            <p className="text-2xl font-black text-orange-500">{referrer.xp}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">XP</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-6 pb-12 max-w-sm mx-auto space-y-5">

        {/* Credibility Strip */}
        {conversionRate > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-800 text-sm">{conversionRate}% booking success rate</p>
              <p className="text-green-600 text-xs">{referrer.verifiedReferrals} leads verified · {referrer.bookedReferrals} booked</p>
            </div>
          </motion.div>
        )}

        {/* Value Prop */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🏠</span>
            <div>
              <h2 className="font-black text-orange-900 text-lg leading-tight">
                Looking for a PG in Bangalore?
              </h2>
              <p className="text-orange-700 text-sm mt-1">
                {referrer.name.split(" ")[0]} will help you find verified, affordable PGs in top areas · Koramangala, HSR, Indiranagar & more.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
            <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
            Verified listings only
            <span className="mx-1">·</span>
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            Fast matching
          </div>
        </motion.div>

        {/* Primary CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <a href={referralLink}
            className="flex items-center justify-center gap-3 w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-95">
            Book via {referrer.name.split(" ")[0]} <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>

        {/* Share Row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-3 gap-3">
          <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 py-3 bg-green-500 text-white rounded-2xl font-bold text-xs hover:bg-green-600 transition-colors">
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
          <button onClick={handleNativeShare}
            className="flex flex-col items-center gap-1.5 py-3 bg-blue-500 text-white rounded-2xl font-bold text-xs hover:bg-blue-600 transition-colors">
            <Share2 className="w-5 h-5" />
            Share
          </button>
          <button onClick={handleCopy}
            className="flex flex-col items-center gap-1.5 py-3 bg-slate-700 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-colors">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </motion.div>

        {/* Referral Link Preview */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 truncate flex-1">{referralLink}</span>
          <button onClick={handleCopy} className="text-orange-500 text-xs font-bold shrink-0">
            {copied ? "✓" : "Copy"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-medium">also on Gharpayy</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Recruit Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl p-6 text-center">
          <p className="text-3xl mb-2">💰</p>
          <h3 className="font-black text-xl mb-1">Earn ₹500 per booking</h3>
          <p className="text-slate-300 text-sm mb-4">
            Know someone looking for a PG? Refer them and earn big. Join {referrer.name.split(" ")[0]} on Gharpayy.
          </p>
          <a href={joinLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors text-sm">
            Start Earning Too <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Powered by <span className="font-bold text-orange-500">Gharpayy</span> · PG Referral Platform, Bangalore
        </p>

      </div>
    </div>
  );
}
