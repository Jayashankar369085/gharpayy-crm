// @ts-nocheck
import { useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads, useAdminGetProperties, useAdminUpdateLeadStatus } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { ZONE_BY_SLUG, zoneForLead } from "@/lib/gharpayy-zones";
import { CAPTAIN_BY_ID, captainWaLink } from "@/lib/captains";
import { PRICING_TIERS, TIER_BY_ID } from "@/lib/pricing-tiers";
import { getAvgFirstResponseHours, getSlaBreaches } from "@/lib/analytics";
import { MapPin, Clock, AlertTriangle, IndianRupee, Phone, MessageCircle, ArrowLeft, CheckCircle2, Building2 } from "lucide-react";

export default function AdminZoneDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/zone/:slug");
  const slug = params?.slug || "";
  const zone = ZONE_BY_SLUG[slug];
  const { isAdminAuthenticated } = useAdminStore();
  useEffect(() => { if (!isAdminAuthenticated) setLocation("/admin"); }, [isAdminAuthenticated, setLocation]);

  const { data: leadsRes } = useAdminGetLeads();
  const { data: propertiesRes } = useAdminGetProperties();
  const updateStatus = useAdminUpdateLeadStatus();

  const leads = leadsRes?.leads || [];
  const allProps = propertiesRes || [];

  const matchedLeads = useMemo(() => leads.filter((l: any) => zoneForLead(l)?.slug === slug), [leads, slug]);
  const matchedProps = useMemo(() =>
    allProps.filter((p: any) => zone?.areaSlugs?.includes(String(p.area || "").toLowerCase().replace(/\s+/g, "-"))),
  [allProps, zone, slug]);

  if (!isAdminAuthenticated || !zone) return null;
  const expert = CAPTAIN_BY_ID[zone.captainId];

  const open = matchedLeads.filter((l: any) => !["BOOKED", "CLOSED", "LOST"].includes(l.status)).length;
  const booked = matchedLeads.filter((l: any) => ["BOOKED", "CLOSED"].includes(l.status)).length;
  const breaches = getSlaBreaches(matchedLeads, 24).length;
  const avgReply = getAvgFirstResponseHours(matchedLeads);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <button onClick={() => setLocation("/admin/zones")} className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> All zones
        </button>

        {/* Hero */}
        <div className="relative h-44 md:h-56 rounded-2xl overflow-hidden border border-slate-800">
          <img src={zone.heroImage} alt={zone.display} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 p-5 md:p-7 flex flex-col justify-end">
            <div className="text-[10px] uppercase tracking-widest text-orange-300 font-bold">Gharpayy</div>
            <h1 className="text-3xl md:text-4xl font-black text-white">{zone.name}</h1>
            <div className="text-sm text-white/80 mt-1">{zone.tagline}</div>
            <div className="text-xs text-white/60 mt-2 flex items-center gap-2 flex-wrap">
              <MapPin className="w-3 h-3" /> {zone.landmarks.join(" · ")}
              <span className="text-orange-300">| {zone.amenity}</span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Open leads" value={open} hint="not yet booked / lost" tone="blue" />
          <Kpi label="Booked" value={booked} hint="closed wins" tone="green" />
          <Kpi label="SLA breaches" value={breaches} hint=">24h no follow-up" tone={breaches > 0 ? "red" : "slate"} />
          <Kpi label="Avg reply" value={avgReply ? `${avgReply}h` : "-"} hint="time to first note" tone="orange" />
        </div>

        {/* Expert card */}
        {expert && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white flex items-center justify-center text-xl font-black shrink-0">
              {expert.initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-white">{expert.name} · {expert.title}</div>
              <div className="text-xs text-slate-400">{expert.responseSla} · {expert.closed} closed · {expert.active} active</div>
              <div className="text-xs text-slate-500 italic mt-1">"{expert.quote}"</div>
            </div>
            <a
              href={captainWaLink(expert, `Hi ${expert.name}, checking in on ${zone.display} pipeline.`)}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-green-500 text-white text-xs font-bold hover:bg-green-600"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp expert
            </a>
          </div>
        )}

        {/* Leads list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">Leads in {zone.display} ({matchedLeads.length})</h3>
            <button onClick={() => setLocation(`/admin/leads?zone=${slug}`)} className="text-xs text-orange-400 hover:underline">Open in pipeline →</button>
          </div>
          {matchedLeads.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No leads yet for this zone.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {matchedLeads.slice(0, 12).map((l: any) => (
                <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-100 truncate">{l.leadName || `Lead #${l.id}`}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {(l.tier && TIER_BY_ID[l.tier]?.name) || "Classics"} · {l.personaId || "-"} · {l.area || "-"}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">{l.status}</span>
                  <button
                    onClick={() => setLocation(`/admin/leads/${l.id}`)}
                    className="text-[11px] font-bold text-orange-400 hover:underline shrink-0"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Properties */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-400" /> Properties in {zone.display} ({matchedProps.length})
            </h3>
            <button onClick={() => setLocation("/admin/properties")} className="text-xs text-orange-400 hover:underline">All properties →</button>
          </div>
          {matchedProps.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No properties listed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matchedProps.slice(0, 6).map((p: any) => (
                <div key={p.id} className="border border-slate-800 rounded-lg p-3 flex items-start justify-between gap-2 bg-slate-950/40">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                      {p.name}
                      {p.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{p.area} · {p.gender} · {p.availableRooms}/{p.totalRooms} free</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-orange-400">₹{(p.monthlyRent / 1000).toFixed(0)}k</div>
                    <div className="text-[10px] text-slate-500">{p.totalReviews} reviews</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Kpi({ label, value, hint, tone }: any) {
  const map: any = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    slate: "text-slate-300 bg-slate-800/40 border-slate-700",
  };
  return (
    <div className={`rounded-xl p-4 border ${map[tone] || map.slate}`}>
      <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">{label}</div>
      <div className="text-2xl font-black mt-0.5">{value}</div>
      <div className="text-[10px] opacity-60 mt-0.5">{hint}</div>
    </div>
  );
}
