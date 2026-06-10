// @ts-nocheck
import { useEffect, useState } from "react";
import { useGetAreas } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Building2, TrendingUp, ChevronRight, Sparkles } from "lucide-react";
import { track } from "@/referral-app/lib/bookos/leads";
import LeadModal from "@/referral-app/components/bookos/LeadModal";

const AREA_EMOJIS: Record<string, string> = {
  koramangala: "☕", "hsr-layout": "🚀", indiranagar: "🍺", marathahalli: "💻",
  "electronic-city": "🏭", whitefield: "🌳", "btm-layout": "🎓", bellandur: "🌊",
  hebbal: "✈️", yelahanka: "🏡",
};

const AREA_COLORS = [
  "from-orange-50 to-orange-100 border-orange-200",
  "from-blue-50 to-blue-100 border-blue-200",
  "from-purple-50 to-purple-100 border-purple-200",
  "from-green-50 to-green-100 border-green-200",
  "from-yellow-50 to-yellow-100 border-yellow-200",
  "from-pink-50 to-pink-100 border-pink-200",
];

export default function AreasPage() {
  const { data: areas, isLoading } = useGetAreas();
  const [, setLocation] = useLocation();
  const [modal, setModal] = useState<{ mode: any; area?: string } | null>(null);

  useEffect(() => { track("view", { source: "areas" }); }, []);

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900">Explore Areas</h1>
          <p className="text-slate-500 text-sm mt-1">Bangalore's top PG locations ranked by demand</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(areas || []).map((area, i) => (
              <motion.div
                key={area.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { track("view", { source: "areas", area: area.name }); setLocation(`/pg?area=${encodeURIComponent(area.name)}`); }}
                className={`bg-gradient-to-br ${AREA_COLORS[i % AREA_COLORS.length]} border rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group relative`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{AREA_EMOJIS[area.slug] || "📍"}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{area.name}</h3>
                      <p className="text-slate-500 text-xs">{area.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs text-slate-500 font-medium">Available</p>
                    <p className="font-black text-slate-800">{area.availablePGs}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs text-slate-500 font-medium">Avg Rent</p>
                    <p className="font-black text-slate-800">₹{(area.avgRent / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2">
                    <p className="text-xs text-slate-500 font-medium">Demand</p>
                    <div className="flex items-center justify-center gap-0.5">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <p className="font-black text-slate-800 text-sm">{area.popularityScore}</p>
                    </div>
                  </div>
                </div>

                {area.metroNearby && (
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    🚇 {area.metroNearby}
                  </p>
                )}
                <button onClick={(e) => { e.stopPropagation(); track("quote_request", { source: "areas", area: area.name }); setModal({ mode: "quote", area: area.name }); }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow">
                  <Sparkles className="w-3 h-3"/> Get quotation
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <LeadModal open={!!modal} onClose={() => setModal(null)} mode={modal?.mode} area={modal?.area}/>
    </Layout>
  );
}
