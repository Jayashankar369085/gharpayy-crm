// @ts-nocheck
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { useGetReferrerDashboard, useGetReferrerEarningsChart } from "@/referral-app/api";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Calendar, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";
import { Skeleton } from "@/referral-app/components/ui/skeleton";

export default function EarningsPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();

  if (!referrer) { setLocation("/"); return null; }

  const { data: dashboard, isLoading: dashLoading } = useGetReferrerDashboard(referrer.id);
  const { data: chart, isLoading: chartLoading } = useGetReferrerEarningsChart(referrer.id);

  const isLoading = dashLoading || chartLoading;

  if (isLoading || !dashboard) {
    return (
      <Layout>
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const maxEarned = chart ? Math.max(...chart.map((d: any) => d.earned), 1) : 1;
  const totalFromChart = chart?.reduce((s: number, d: any) => s + d.earned, 0) || 0;

  return (
    <Layout>
      <PageHeader title="My Earnings" subtitle="Paid, pending & lifetime income from referrals" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <p className="text-muted-foreground mt-1">Full breakdown of all your income</p>
        </div>

        {/* Total earned hero */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl p-6 shadow-xl">
          <p className="text-white/70 font-bold uppercase text-xs tracking-wider mb-2">Total Lifetime Earnings</p>
          <p className="text-6xl font-black tracking-tight">₹{dashboard.referrer.totalEarned.toLocaleString()}</p>
          <div className="flex gap-6 mt-5 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/60 text-xs mb-1">Paid Out</p>
              <p className="text-xl font-black text-green-200">₹{dashboard.referrer.paidEarnings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">Pending</p>
              <p className="text-xl font-black text-yellow-200">₹{dashboard.referrer.pendingEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Verification Bonus</p>
            </div>
            <p className="text-2xl font-black text-foreground">₹{(dashboard.referrer.verifiedReferrals * 50).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{dashboard.referrer.verifiedReferrals} leads × ₹50</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Booking Bonus</p>
            </div>
            <p className="text-2xl font-black text-foreground">₹{(dashboard.referrer.bookedReferrals * 500).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{dashboard.referrer.bookedReferrals} bookings × ₹500</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Pending Payout</p>
            </div>
            <p className="text-2xl font-black text-orange-600">₹{dashboard.referrer.pendingEarnings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Processing within 48h</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Conversion Rate</p>
            </div>
            <p className="text-2xl font-black text-foreground">
              {dashboard.referrer.totalReferrals ? Math.round((dashboard.referrer.bookedReferrals / dashboard.referrer.totalReferrals) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Leads → bookings</p>
          </div>
        </div>

        {/* Monthly earnings chart */}
        {chart && chart.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Monthly Earnings
              </h3>
              <span className="text-sm font-bold text-primary">₹{totalFromChart.toLocaleString()} total</span>
            </div>
            <div className="flex items-end gap-2 h-36">
              {chart.map((d: any, i: number) => {
                const pct = (d.earned / maxEarned) * 100;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-[10px] font-bold text-primary">₹{(d.earned / 1000).toFixed(1)}k</p>
                    <div className="w-full relative flex items-end justify-center" style={{ height: "96px" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ delay: i * 0.07, type: "spring", stiffness: 60 }}
                        className="w-full bg-primary rounded-t-lg min-h-1 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/10 w-1/2 h-full skew-x-12" />
                      </motion.div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium">{d.month}</p>
                    <p className="text-[9px] text-muted-foreground">{d.referrals}R</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payout schedule */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-bold text-blue-800 mb-3">💳 Payout Schedule</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Verification bonus (₹50)</span>
              <span className="font-bold text-blue-800">Within 48h of verification</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Booking bonus (₹500)</span>
              <span className="font-bold text-blue-800">Within 48h of move-in</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Minimum payout</span>
              <span className="font-bold text-blue-800">₹100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Processing days</span>
              <span className="font-bold text-blue-800">Monday – Friday</span>
            </div>
          </div>
          <button onClick={() => setLocation("/payout-setup")}
            className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm">
            Manage Payout Method →
          </button>
        </div>
      </div>
    </Layout>
  );
}
