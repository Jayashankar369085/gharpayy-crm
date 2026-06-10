// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Target, MapPin, BarChart2, Phone, ChevronRight, Plus } from "lucide-react";

interface BrokerData {
  referrer: any;
  totalLeads: number;
  verified: number;
  booked: number;
  conversionRate: number;
  avgDealValue: number;
  projectedMonthly: number;
  totalEarned: number;
  pendingEarnings: number;
  pipeline: { stage: string; count: number; color: string }[];
  areas: { area: string; leads: number; bookings: number }[];
  commissionRate: number;
}

export default function BrokerDashboard() {
  const { referrer, persona } = useAppStore();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<BrokerData | null>(null);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    if (persona !== "BROKER") { setLocation("/home"); return; }
    fetch(`${BASE}/api/broker/${referrer.id}/dashboard`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [referrer, persona]);

  if (!referrer || persona !== "BROKER") return null;

  const MOCK: BrokerData = {
    referrer: { name: referrer.name },
    totalLeads: referrer.totalReferrals || 24,
    verified: referrer.verifiedReferrals || 18,
    booked: referrer.bookedReferrals || 7,
    conversionRate: 29,
    avgDealValue: 8500,
    projectedMonthly: referrer.totalEarned || 4400,
    totalEarned: referrer.totalEarned || 5200,
    pendingEarnings: referrer.pendingEarnings || 1200,
    pipeline: [
      { stage: "Prospects", count: 6, color: "#94a3b8" },
      { stage: "Contacted", count: 11, color: "#f97316" },
      { stage: "Verified", count: 18, color: "#3b82f6" },
      { stage: "Booked", count: 7, color: "#22c55e" },
    ],
    areas: [
      { area: "Koramangala", leads: 9, bookings: 3 },
      { area: "HSR Layout", leads: 6, bookings: 2 },
      { area: "Indiranagar", leads: 5, bookings: 1 },
      { area: "Marathahalli", leads: 4, bookings: 1 },
    ],
    commissionRate: 8,
  };
  const d = data || MOCK;

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-display">Broker Command</h1>
            <p className="text-muted-foreground">Professional pipeline · {d.commissionRate}% commission rate</p>
          </div>
          <button onClick={() => setLocation("/refer")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: d.totalLeads, color: "text-foreground", sub: "All time" },
            { label: "Verified", value: d.verified, color: "text-blue-600", sub: `${d.totalLeads ? Math.round(d.verified/d.totalLeads*100) : 0}% rate` },
            { label: "Booked", value: d.booked, color: "text-green-600", sub: `${d.conversionRate}% close rate` },
            { label: "Commission", value: `₹${d.totalEarned.toLocaleString()}`, color: "text-primary", sub: "Total earned" },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{k.label}</p>
              <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Earnings summary */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-6">
          <h3 className="font-bold mb-4 text-white/70 uppercase text-xs tracking-wider">Earnings Dashboard</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-xs mb-1">Total Earned</p>
              <p className="text-3xl font-black text-green-400">₹{d.totalEarned.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Pending</p>
              <p className="text-3xl font-black text-orange-400">₹{d.pendingEarnings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Proj. Monthly</p>
              <p className="text-3xl font-black text-blue-400">₹{d.projectedMonthly.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Sales Pipeline */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Sales Pipeline
          </h3>
          <div className="space-y-3">
            {d.pipeline.map((stage, i) => {
              const maxCount = Math.max(...d.pipeline.map(s => s.count));
              const pct = maxCount ? (stage.count / maxCount) * 100 : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span className="text-foreground">{stage.stage}</span>
                    <span style={{ color: stage.color }} className="font-black">{stage.count}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1, type: "spring" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Area breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Performance by Area
          </h3>
          <div className="space-y-3">
            {d.areas.map((area) => (
              <div key={area.area} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-foreground">{area.area}</p>
                  <p className="text-xs text-muted-foreground">{area.leads} leads · {area.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-primary">₹{(area.bookings * 500).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{area.leads ? Math.round(area.bookings/area.leads*100) : 0}% CVR</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Browse PGs", sub: "Find new inventory", icon: "🏠", href: "/pg" },
            { label: "Leaderboard", sub: "Your broker rank", icon: "🏆", href: "/leaderboard" },
            { label: "Flash Deals", sub: "High bonus PGs", icon: "⚡", href: "/flash" },
            { label: "Calculator", sub: "Project earnings", icon: "🧮", href: "/calculator" },
          ].map(a => (
            <button key={a.label} onClick={() => setLocation(a.href)}
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all text-left">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="font-bold text-sm text-foreground">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
