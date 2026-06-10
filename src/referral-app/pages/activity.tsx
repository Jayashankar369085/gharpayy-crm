// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { Activity, TrendingUp } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";

interface ActivityItem {
  id: number;
  type: string;
  icon: string;
  label: string;
  amount: number | null;
  xp: number | null;
  createdAt: string;
}

export default function ActivityPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/activity/${referrer.id}`)
      .then(r => r.json()).then(d => setActivities(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [referrer]);

  const FILTERS = ["ALL", "EARNINGS", "XP", "REFERRALS", "CHECK-INS"];

  const filtered = activities.filter(a => {
    if (filter === "ALL") return true;
    if (filter === "EARNINGS") return a.amount && a.amount > 0;
    if (filter === "XP") return a.xp && a.xp > 0;
    if (filter === "REFERRALS") return ["REFERRAL_SUBMITTED", "LEAD_VERIFIED", "BOOKING_CONFIRMED"].includes(a.type);
    if (filter === "CHECK-INS") return a.type === "CHECKIN";
    return true;
  });

  const groupByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach(a => {
      const d = new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (!groups[d]) groups[d] = [];
      groups[d].push(a);
    });
    return groups;
  };

  const grouped = groupByDate(filtered);

  const totalEarned = activities.filter(a => a.amount).reduce((s, a) => s + (a.amount || 0), 0);
  const totalXp = activities.filter(a => a.xp).reduce((s, a) => s + (a.xp || 0), 0);

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Activity Feed" subtitle="Your complete earnings and XP history" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
        <div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-green-600">₹{totalEarned}</p>
            <p className="text-xs text-green-700 font-medium mt-1">Total from activity</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-orange-600">{totalXp} XP</p>
            <p className="text-xs text-orange-700 font-medium mt-1">XP this period</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                ${filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Activity list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-bold text-slate-600">No activity yet</p>
            <p className="text-sm text-slate-500 mt-1">Start referring to see your activity here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{date}</p>
                <div className="space-y-2">
                  {items.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-xl shrink-0">
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{a.label}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {a.amount && <p className="font-black text-green-600 text-sm">+₹{a.amount}</p>}
                        {a.xp && <p className="font-bold text-orange-500 text-xs">+{a.xp} XP</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
