// @ts-nocheck
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { ZoneGrid } from "@/referral-app/components/admin/ZoneGrid";
import { GHARPAYY_ZONES } from "@/lib/gharpayy-zones";
import { PRICING_TIERS } from "@/lib/pricing-tiers";

export default function AdminZones() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  useEffect(() => { if (!isAdminAuthenticated) setLocation("/admin"); }, [isAdminAuthenticated, setLocation]);
  const { data } = useAdminGetLeads();
  const leads = data?.leads || [];
  if (!isAdminAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">5 hero zones</div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Gharpayy zones · operations</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Same five zones a real Gharpayy customer sees on the homepage. Click any zone to open the expert workload, lead pipeline,
            properties and the live map for that zone.
          </p>
        </div>

        <ZoneGrid leads={leads} />

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-base font-bold text-white mb-3">Pricing tiers · the real Gharpayy ladder</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PRICING_TIERS.map((t) => (
              <div key={t.id} className="rounded-xl p-3 border border-slate-800 bg-slate-950/40">
                <div className="text-xl">{t.emoji}</div>
                <div className="font-black text-white mt-1">{t.name}</div>
                <div className="text-xs text-slate-400 font-mono">{t.range}</div>
                <div className="text-[11px] text-slate-500 mt-1.5 leading-snug">{t.tagline}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
