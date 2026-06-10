// @ts-nocheck
import { useAdminGetAnalytics, useAdminGetLeads, useAdminAutoRoute } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { Users, UserCheck, Home, Target, TrendingUp, IndianRupee, Headset, Clock, Zap, AlertTriangle, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useEffect, useMemo, useState } from "react";
import { CAPTAINS } from "@/lib/captains";
import { getAvgFirstResponseHours, getSlaBreaches } from "@/lib/analytics";
import { FilterBar, applyAdminFilters, DEFAULT_FILTERS, type AdminFilters } from "@/referral-app/components/admin/FilterBar";
import { KpiCard } from "@/referral-app/components/admin/KpiCard";
import { FunnelCard } from "@/referral-app/components/admin/FunnelCard";
import { SourceAttribution } from "@/referral-app/components/admin/SourceAttribution";
import { SlaAlerts } from "@/referral-app/components/admin/SlaAlerts";
import { ActivityFeed } from "@/referral-app/components/admin/ActivityFeed";
import { ZoneGrid } from "@/referral-app/components/admin/ZoneGrid";
import { TierMix } from "@/referral-app/components/admin/TierMix";
import { ChannelMix } from "@/referral-app/components/admin/ChannelMix";
import { ZoneHero } from "@/referral-app/components/admin/ZoneHero";
import { toast } from "sonner";
import { AdminPitch } from "@/referral-app/components/admin/AdminPitch";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setLocation("/admin");
    }
  }, [isAdminAuthenticated, setLocation]);

  const { data: analytics, isLoading } = useAdminGetAnalytics();
  const { data: leadsRes } = useAdminGetLeads();
  const allLeads = leadsRes?.leads || [];
  const autoRoute = useAdminAutoRoute();

  const [filters, setFilters] = useState<AdminFilters>(DEFAULT_FILTERS);
  const filteredLeads = useMemo(() => applyAdminFilters(allLeads, filters), [allLeads, filters]);

  const slaCount = useMemo(() => getSlaBreaches(filteredLeads, 24).length, [filteredLeads]);
  const avgFirstResp = useMemo(() => getAvgFirstResponseHours(filteredLeads), [filteredLeads]);
  const todayCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    return filteredLeads.filter((l: any) => new Date(l.createdAt).getTime() >= cutoff).length;
  }, [filteredLeads]);
  const unassignedCount = useMemo(() => allLeads.filter((l: any) => !l.captainId).length, [allLeads]);

  const captainWorkload = useMemo(() => {
    return CAPTAINS.map((c) => {
      const matched = filteredLeads.filter((l: any) =>
        (l.captainId && l.captainId === c.id) ||
        (l.assignedAgentName && l.assignedAgentName.toLowerCase().includes(c.name.toLowerCase()))
      );
      const open = matched.filter((l: any) => !["BOOKED", "CLOSED", "LOST"].includes(l.status)).length;
      const closed = matched.filter((l: any) => ["BOOKED", "CLOSED"].includes(l.status)).length;
      const breaches = getSlaBreaches(matched, 24).length;
      return { expert: c, open, closed, total: matched.length, breaches };
    }).sort((a, b) => b.open - a.open);
  }, [filteredLeads]);

  const activeCaptains = captainWorkload.filter((c) => c.open > 0).length;

  if (!isAdminAuthenticated) return null;

  if (isLoading || !analytics) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPitch
          eyebrow="Overview · Gharpayy ops"
          title="The whole NMS pipeline through a Gharpayy lens"
          pitch={{
            why: "Every lead, expert and rupee maps to one of the 5 hero zones from gharpayy.com.",
            how: "Filter, auto-route, and watch SLA. Real NMS data · Gharpayy pitch on top.",
            next: "Clear unassigned, then open the zone with the highest open count below.",
          }}
        />
        {/* HERO · gharpayy.com 5 zones, always at the top */}
        <ZoneHero leads={filteredLeads} />

        {/* Action row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-orange-400 font-black">Today's cockpit</div>
            <h2 className="text-xl md:text-2xl font-black text-white">{todayCount} new leads · {unassignedCount} need a expert</h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter, route, follow up. The whole NMS pipeline in one screen.</p>
          </div>
          <button
            onClick={() => autoRoute.mutate(undefined as any, {
              onSuccess: (r: any) => toast.success(`Auto-routed ${r?.count ?? 0} unassigned leads`),
            })}
            disabled={autoRoute.isPending || unassignedCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-black shrink-0 shadow-lg shadow-orange-500/30"
          >
            <Zap className="w-4 h-4" />
            {autoRoute.isPending ? "Routing…" : `Auto-route ${unassignedCount} unassigned`}
          </button>
        </div>

        <FilterBar leads={allLeads} value={filters} onChange={setFilters} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard title="Today's leads" value={todayCount} icon={Calendar} tone="orange" />
          <KpiCard title="Avg first reply" value={avgFirstResp != null ? `${avgFirstResp}h` : "-"} icon={Clock} tone="blue" hint="Time to first expert note" />
          <KpiCard title="SLA breaches" value={slaCount} icon={AlertTriangle} tone={slaCount > 0 ? "red" : "green"} hint=">24h with no follow-up" />
          <KpiCard title="Active experts" value={`${activeCaptains}/${CAPTAINS.length}`} icon={Headset} tone="primary" hint="With ≥1 open lead" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <DarkMetric title="Total leads" value={analytics.totalLeads} icon={Users} tone="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
          <DarkMetric title="Verified" value={analytics.verifiedLeads} icon={UserCheck} tone="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" />
          <DarkMetric title="Booked PGs" value={analytics.bookedLeads} icon={Home} tone="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
          <DarkMetric title="Conversion" value={`${Math.round(analytics.conversionRate)}%`} icon={Target} tone="text-orange-400" bg="bg-orange-500/10" border="border-orange-500/20" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-emerald-500/15 rounded-lg"><IndianRupee className="w-4 h-4 text-emerald-400" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Money flow</h3>
            </div>
            <div className="space-y-4">
              <Money label="Revenue generated" value={analytics.totalRevenue} tone="text-white" sub="₹2,000 per booking" />
              <Money label="Payout liability" value={analytics.totalPayoutLiability} tone="text-orange-400" sub="Promised to referrers" />
              <Money label="Net platform profit" value={analytics.totalRevenue - analytics.totalPayoutLiability} tone="text-emerald-400" sub="Revenue − payouts" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-blue-500/15 rounded-lg"><TrendingUp className="w-4 h-4 text-blue-400" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Pipeline</h3>
            </div>
            <div className="space-y-2.5">
              {analytics.leadsByStatus.map((s: any) => (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-20 shrink-0 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.status}</div>
                  <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getStatusColor(s.status)}`} style={{ width: `${Math.max(4, (s.count / Math.max(1, analytics.totalLeads)) * 100)}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm font-black text-white">{s.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FunnelCard leads={filteredLeads} />
          <SourceAttribution leads={filteredLeads} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TierMix leads={filteredLeads} />
          <ChannelMix leads={filteredLeads} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SlaAlerts leads={filteredLeads} />
          <ActivityFeed leads={filteredLeads} limit={12} />
        </div>

        {/* Expert Workload */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-500/15 rounded-lg"><Headset className="w-4 h-4 text-orange-400" /></div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Expert workload</h3>
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Live · routed by persona + zone</span>
          </div>

          <div className="grid grid-cols-1 sm:hidden gap-2">
            {captainWorkload.map(({ expert, open, closed, total }) => (
              <div key={expert.id} className="border border-slate-800 bg-slate-950 rounded-xl p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm">{expert.initial}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">{expert.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{expert.title}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-blue-500/10 rounded-lg py-1.5"><div className="font-black text-blue-400 text-base">{open}</div><div className="text-[10px] text-slate-500">Open</div></div>
                  <div className="bg-emerald-500/10 rounded-lg py-1.5"><div className="font-black text-emerald-400 text-base">{closed}</div><div className="text-[10px] text-slate-500">Closed</div></div>
                  <div className="bg-slate-800 rounded-lg py-1.5"><div className="font-black text-slate-200 text-base">{total}</div><div className="text-[10px] text-slate-500">Total</div></div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-4">Expert</th>
                  <th className="py-2 pr-4">Desk</th>
                  <th className="py-2 pr-4 text-right">Open</th>
                  <th className="py-2 pr-4 text-right">Closed</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 text-right">SLA</th>
                </tr>
              </thead>
              <tbody>
                {captainWorkload.map(({ expert, open, closed, total }) => (
                  <tr key={expert.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs">{expert.initial}</div>
                        <span className="font-bold text-slate-100">{expert.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{expert.title}</td>
                    <td className="py-3 pr-4 text-right font-black text-blue-400">{open}</td>
                    <td className="py-3 pr-4 text-right font-black text-emerald-400">{closed}</td>
                    <td className="py-3 pr-4 text-right font-black text-slate-100">{total}</td>
                    <td className="py-3 text-right text-xs text-slate-500">{expert.responseSla}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function DarkMetric({ title, value, icon: Icon, tone, bg, border }: any) {
  return (
    <div className={`bg-slate-900 border ${border} p-4 rounded-2xl flex items-start gap-3`}>
      <div className={`p-2.5 rounded-xl ${bg}`}><Icon className={`w-5 h-5 ${tone}`} /></div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black tracking-tight text-white">{value}</p>
      </div>
    </div>
  );
}

function Money({ label, value, tone, sub }: any) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-widest">{label}</p>
      <p className={`text-2xl font-black ${tone}`}>₹{Number(value || 0).toLocaleString()}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function getStatusColor(status: string) {
  switch(status) {
    case 'NEW': return 'bg-blue-400';
    case 'CONTACTED': return 'bg-indigo-400';
    case 'VERIFIED': return 'bg-amber-400';
    case 'MATCHED': return 'bg-purple-400';
    case 'VISIT': return 'bg-pink-400';
    case 'BOOKED': return 'bg-green-500';
    case 'CLOSED': return 'bg-emerald-600';
    case 'LOST': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
}