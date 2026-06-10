// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAppStore } from "@/referral-app/lib/store";
import { SwitchCamera, X, Check } from "lucide-react";

const ROLES = [
  { id: "GUARD",        emoji: "🛡️", label: "Daily Worker",   bg: "bg-zinc-800 text-white",          ring: "ring-zinc-500" },
  { id: "STUDENT",      emoji: "🎓", label: "Student",         bg: "bg-orange-50 text-orange-900",    ring: "ring-orange-400" },
  { id: "EARNER",       emoji: "💼", label: "Side Hustler",    bg: "bg-slate-50 text-slate-900",      ring: "ring-slate-400" },
  { id: "PG_MANAGER",   emoji: "🏠", label: "PG Manager",      bg: "bg-blue-50 text-blue-900",        ring: "ring-blue-400" },
  { id: "BROKER",       emoji: "🤝", label: "Broker",          bg: "bg-slate-800 text-white",         ring: "ring-green-400" },
  { id: "INFLUENCER",   emoji: "📱", label: "Influencer",      bg: "bg-purple-50 text-purple-900",    ring: "ring-purple-400" },
  { id: "CORPORATE_HR", emoji: "🏢", label: "Corporate HR",    bg: "bg-indigo-50 text-indigo-900",    ring: "ring-indigo-400" },
] as const;

const PERSONA_HOME: Record<string, string> = {
  GUARD: "/home", STUDENT: "/home", EARNER: "/home",
  PG_MANAGER: "/manager", BROKER: "/broker",
  INFLUENCER: "/influencer", CORPORATE_HR: "/corporate",
};

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const { persona, setPersona } = useAppStore();
  const [, setLocation] = useLocation();

  const handleSwitch = (id: string) => {
    setPersona(id as any);
    setOpen(false);
    setTimeout(() => setLocation(PERSONA_HOME[id] ?? "/home"), 100);
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 md:bottom-6 w-12 h-12 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-slate-700 transition-colors border-2 border-white/10"
        title="Switch Role"
      >
        <SwitchCamera className="w-5 h-5" />
      </button>

      {/* Backdrop + Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black font-display text-slate-900">Switch Role</h2>
                  <p className="text-sm text-slate-500">Test any experience instantly</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((role) => {
                  const isActive = persona === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleSwitch(role.id)}
                      className={`
                        relative flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all
                        ${isActive
                          ? `ring-2 ${role.ring} border-transparent ${role.bg} shadow-md`
                          : `${role.bg} border-transparent hover:border-slate-200 hover:shadow-sm`}
                      `}
                    >
                      <span className="text-2xl">{role.emoji}</span>
                      <span className="font-bold text-sm leading-tight">{role.label}</span>
                      {isActive && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-xs text-slate-400 mt-5">
                Switching role changes your dashboard experience
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
