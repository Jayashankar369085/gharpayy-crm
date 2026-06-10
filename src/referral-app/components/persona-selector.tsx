// @ts-nocheck
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/referral-app/lib/store";
import { ShieldAlert, GraduationCap, Briefcase, Building2, Handshake, Share2, Users } from "lucide-react";
import { Button } from "@/referral-app/components/ui/button";

type PersonaId = "GUARD" | "STUDENT" | "EARNER" | "PG_MANAGER" | "BROKER" | "INFLUENCER" | "CORPORATE_HR";

const PERSONAS: {
  id: PersonaId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  emoji: string;
  tag: string;
}[] = [
  {
    id: "GUARD",
    title: "Daily Worker",
    subtitle: "Simple, bold, make extra cash.",
    icon: <ShieldAlert className="w-8 h-8" />,
    color: "bg-zinc-900 border-zinc-700 text-white",
    activeColor: "ring-2 ring-primary border-primary bg-zinc-800 shadow-[0_0_30px_rgba(249,115,22,0.4)]",
    emoji: "🛡️",
    tag: "Easy Start",
  },
  {
    id: "STUDENT",
    title: "College Student",
    subtitle: "Help friends find homes, earn rewards.",
    icon: <GraduationCap className="w-8 h-8" />,
    color: "bg-orange-50 border-orange-100 text-orange-950",
    activeColor: "ring-2 ring-primary border-primary bg-orange-100 shadow-xl shadow-orange-500/20",
    emoji: "🎓",
    tag: "Most Popular",
  },
  {
    id: "EARNER",
    title: "Side Hustler",
    subtitle: "Track every lead, max your income.",
    icon: <Briefcase className="w-8 h-8" />,
    color: "bg-white border-slate-200 text-slate-900",
    activeColor: "ring-2 ring-primary border-primary bg-white shadow-2xl",
    emoji: "💼",
    tag: "Best ROI",
  },
  {
    id: "PG_MANAGER",
    title: "Property Manager",
    subtitle: "List PGs & flats, fill rooms fast.",
    icon: <Building2 className="w-8 h-8" />,
    color: "bg-blue-50 border-blue-100 text-blue-950",
    activeColor: "ring-2 ring-blue-500 border-blue-400 bg-blue-100 shadow-xl shadow-blue-500/20",
    emoji: "🏠",
    tag: "Property Owner",
  },
  {
    id: "BROKER",
    title: "Broker / Agent",
    subtitle: "Professional pipeline, max commission.",
    icon: <Handshake className="w-8 h-8" />,
    color: "bg-slate-800 border-slate-700 text-white",
    activeColor: "ring-2 ring-green-400 border-green-400 bg-slate-900 shadow-xl shadow-green-500/20",
    emoji: "🤝",
    tag: "High Earners",
  },
  {
    id: "INFLUENCER",
    title: "Influencer",
    subtitle: "Share links, earn on every home booking.",
    icon: <Share2 className="w-8 h-8" />,
    color: "bg-purple-50 border-purple-100 text-purple-950",
    activeColor: "ring-2 ring-purple-500 border-purple-400 bg-purple-100 shadow-xl shadow-purple-500/20",
    emoji: "📱",
    tag: "Content Creator",
  },
  {
    id: "CORPORATE_HR",
    title: "Corporate HR",
    subtitle: "House new hires · PGs, flats & more.",
    icon: <Users className="w-8 h-8" />,
    color: "bg-indigo-50 border-indigo-100 text-indigo-950",
    activeColor: "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-100 shadow-xl shadow-indigo-500/20",
    emoji: "🏢",
    tag: "Enterprise",
  },
];

const labelMap: Record<PersonaId, string> = {
  GUARD: "Daily Worker",
  STUDENT: "Student",
  EARNER: "Hustler",
  PG_MANAGER: "Property Manager",
  BROKER: "Broker",
  INFLUENCER: "Influencer",
  CORPORATE_HR: "Corporate HR",
};

export function PersonaSelector() {
  const { setPersona } = useAppStore();
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<PersonaId | null>(null);

  const handleContinue = () => {
    if (selected) {
      setPersona(selected as any);
      setLocation("/register");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      <div className="max-w-5xl w-full">
        {/* Hero Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-4xl">🏘️</span>
              <div className="text-left">
                <h1 className="text-2xl font-black font-display text-orange-600 leading-none">Gharpayy</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Homes</p>
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-slate-900 mb-3">
              Who are you?
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Gharpayy Homes transforms based on your role · PGs, flats &amp; houses for everyone in Bangalore.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">₹50 per verification</span>
              <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">₹500 per booking</span>
              <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full font-bold">7 unique experiences</span>
            </div>
          </motion.div>
        </div>

        {/* First row · 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {PERSONAS.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 + 0.1 }}
              onClick={() => setSelected(p.id)}
              className={`
                relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300
                ${selected === p.id ? `${p.activeColor} scale-105` : `${p.color} hover:-translate-y-1 hover:shadow-md`}
              `}
            >
              {p.tag && (
                <span className="absolute top-2.5 right-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                  {p.tag}
                </span>
              )}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors
                ${selected === p.id ? "bg-primary text-white" : "bg-black/5 text-current"}`}>
                {p.icon}
              </div>
              <h3 className="text-base font-bold font-display mb-1 leading-tight">{p.title}</h3>
              <p className="text-xs opacity-70 font-medium leading-snug">{p.subtitle}</p>
              {selected === p.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-2.5 left-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Second row · 3 cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {PERSONAS.slice(4).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 4) * 0.07 + 0.1 }}
              onClick={() => setSelected(p.id)}
              className={`
                relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300
                ${selected === p.id ? `${p.activeColor} scale-105` : `${p.color} hover:-translate-y-1 hover:shadow-md`}
              `}
            >
              {p.tag && (
                <span className="absolute top-2.5 right-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                  {p.tag}
                </span>
              )}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors
                ${selected === p.id ? "bg-primary text-white" : "bg-black/5 text-current"}`}>
                {p.icon}
              </div>
              <h3 className="text-base font-bold font-display mb-1 leading-tight">{p.title}</h3>
              <p className="text-xs opacity-70 font-medium leading-snug">{p.subtitle}</p>
              {selected === p.id && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-2.5 left-2.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-full md:w-auto md:min-w-[360px] h-14 text-lg font-bold shadow-xl shadow-primary/20"
            disabled={!selected}
            onClick={handleContinue}
          >
            {selected ? `Continue as ${labelMap[selected]} ${PERSONAS.find(p => p.id === selected)?.emoji}` : "Select your role above"}
          </Button>
          <Link href="/refer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Just want to refer someone? Skip registration →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
