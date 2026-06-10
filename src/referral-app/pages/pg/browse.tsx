// @ts-nocheck
import { useEffect, useState } from "react";
import { useGetProperties, useGetAreas } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, MapPin, Star, Wifi, Wind, Utensils, Shield, ChevronRight, Building2, Zap } from "lucide-react";
import { Badge } from "@/referral-app/components/ui/badge";
import { Input } from "@/referral-app/components/ui/input";
import { track } from "@/referral-app/lib/bookos/leads";
import LeadModal from "@/referral-app/components/bookos/LeadModal";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  ac: <Wind className="w-3 h-3" />,
  food: <Utensils className="w-3 h-3" />,
  security: <Shield className="w-3 h-3" />,
};

const BANGALORE_AREAS = ["Koramangala", "HSR Layout", "Indiranagar", "Marathahalli", "Electronic City", "Whitefield", "BTM Layout", "Bellandur"];

const GENDER_LABELS: Record<string, string> = { MALE: "Boys", FEMALE: "Girls", ANY: "Co-ed" };

export default function PgBrowsePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState<string | undefined>();
  const [gender, setGender] = useState<string | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [modal, setModal] = useState<any>(null);

  useEffect(() => { track("view", { source: "listings" }); }, []);

  const { data, isLoading } = useGetProperties({
    area: selectedArea,
    gender: gender as any,
    maxPrice,
    availability: "ANY" as any,
    limit: 30,
  });

  const properties = (data?.properties || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-900">Browse PGs</h1>
          <p className="text-slate-500 text-sm mt-1">Find verified PGs across Bangalore</p>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search by name or area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>
        </div>

        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-xl p-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gender</p>
              <div className="flex gap-2">
                {["", "MALE", "FEMALE", "ANY"].map(g => (
                  <button key={g} onClick={() => setGender(g || undefined)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${gender === (g || undefined) ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}>
                    {g === "" ? "All" : GENDER_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Max Rent</p>
              <div className="flex gap-2 flex-wrap">
                {[undefined, 7000, 10000, 15000, 20000].map(price => (
                  <button key={price ?? "all"} onClick={() => setMaxPrice(price)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${maxPrice === price ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}>
                    {price ? `≤₹${price.toLocaleString()}` : "Any"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Area Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setSelectedArea(undefined)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${!selectedArea ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}>
            All Areas
          </button>
          {BANGALORE_AREAS.map(area => (
            <button key={area} onClick={() => setSelectedArea(area === selectedArea ? undefined : area)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${selectedArea === area ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}>
              {area}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No PGs found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium">{properties.length} PGs found</p>
            {properties.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { track("view", { source: "listings", area: p.area, propertyId: p.id, propertyName: p.name }); setLocation(`/pg/${p.id}`); }}
                className="bg-white border border-slate-100 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-orange-100 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">{p.name}</h3>
                      {p.isVerified && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] px-1.5">Verified</Badge>}
                      <Badge variant="outline" className={`text-[10px] px-1.5 ${p.availability === "AVAILABLE" ? "text-green-600 border-green-200 bg-green-50" : "text-red-500 border-red-200 bg-red-50"}`}>
                        {p.availability === "AVAILABLE" ? `${p.availableRooms} rooms` : "FULL"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                      <MapPin className="w-3 h-3" />
                      <span>{p.area}</span>
                      {p.nearbyMetro && <span className="text-slate-400">· 🚇 {p.nearbyMetro}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-slate-900">₹{p.monthlyRent.toLocaleString()}<span className="text-sm font-normal text-slate-500">/mo</span></span>
                      <span className="text-sm text-slate-400">·</span>
                      <span className="text-sm text-slate-500">{GENDER_LABELS[p.gender]}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    {p.avgRating && (
                      <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 rounded-lg px-2 py-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-slate-700">{(p.avgRating as number).toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({p.totalReviews})</span>
                      </div>
                    )}
                    {p.referralBonus > 0 && (
                      <Badge className="bg-orange-500 text-white text-[10px]">+₹{p.referralBonus} bonus</Badge>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
                {p.amenities && p.amenities.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {(p.amenities as string[]).slice(0, 4).map((a: string) => (
                      <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] text-slate-600 font-medium">
                        {AMENITY_ICONS[a.toLowerCase()] || "·"} {a}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { track("booking_request", { source: "listings", area: p.area, propertyId: p.id, propertyName: p.name }); setModal({ mode: "booking", area: p.area, propertyId: p.id, propertyName: p.name, rent: p.monthlyRent }); }}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow">
                    <Zap className="w-3 h-3"/> Book
                  </button>
                  <button onClick={() => { track("quote_request", { source: "listings", area: p.area, propertyId: p.id, propertyName: p.name }); setModal({ mode: "quote", area: p.area, propertyId: p.id, propertyName: p.name, rent: p.monthlyRent }); }}
                    className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-amber-300 text-amber-800">
                    Quote
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <LeadModal open={!!modal} onClose={() => setModal(null)} {...(modal || {})}/>
    </Layout>
  );
}
