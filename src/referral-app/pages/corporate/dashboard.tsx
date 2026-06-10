// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion } from "framer-motion";
import { Building2, Users, Home, CheckCircle2, Clock, MapPin, TrendingUp, Plus } from "lucide-react";

export default function CorporateDashboard() {
  const { referrer, persona } = useAppStore();
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    if (persona !== "CORPORATE_HR") { setLocation("/home"); return; }
    fetch(`${BASE}/api/corporate/${referrer.id}/dashboard`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [referrer, persona]);

  if (!referrer || persona !== "CORPORATE_HR") return null;

  const MOCK = {
    company: "TechCorp India Pvt Ltd",
    totalEmployees: referrer.totalReferrals || 18,
    housed: referrer.bookedReferrals || 11,
    verified: referrer.verifiedReferrals || 15,
    pending: 4,
    housingRate: 61,
    totalEarned: referrer.totalEarned,
    pendingEarnings: referrer.pendingEarnings,
    avgRent: 10500,
    savingsVsIndividual: (referrer.bookedReferrals || 11) * 1500,
    departments: [
      { dept: "Engineering", employees: 7, housed: 5 },
      { dept: "Sales", employees: 4, housed: 3 },
      { dept: "Design", employees: 4, housed: 2 },
      { dept: "Operations", employees: 3, housed: 1 },
    ],
    preferredAreas: [
      { area: "Koramangala", count: 4, avgRent: 12000, pgsAvailable: 45 },
      { area: "HSR Layout", count: 3, avgRent: 11000, pgsAvailable: 38 },
      { area: "Marathahalli", count: 2, avgRent: 9500, pgsAvailable: 75 },
      { area: "Whitefield", count: 2, avgRent: 10000, pgsAvailable: 42 },
    ],
    recentHires: [
      { id: 1, name: "Priya Sharma", department: "Engineering", status: "HOUSED", area: "Koramangala", joiningDate: new Date(Date.now() - 7 * 86400000).toISOString() },
      { id: 2, name: "Ravi Kumar", department: "Sales", status: "SEARCHING", area: "HSR Layout", joiningDate: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 3, name: "Neha Verma", department: "Design", status: "HOUSED", area: "Indiranagar", joiningDate: new Date(Date.now() - 14 * 86400000).toISOString() },
      { id: 4, name: "Amit Singh", department: "Engineering", status: "HOUSED", area: "Marathahalli", joiningDate: new Date(Date.now() - 21 * 86400000).toISOString() },
    ],
  };
  const d = data || MOCK;

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-display">HR Housing Hub</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <Building2 className="w-4 h-4" /> {d.company}
            </p>
          </div>
          <button onClick={() => setLocation("/refer")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* Headline stats */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Total Employees</p>
              <p className="text-4xl font-black mt-1">{d.totalEmployees}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Housed</p>
              <p className="text-4xl font-black mt-1 text-green-300">{d.housed}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Searching</p>
              <p className="text-4xl font-black mt-1 text-yellow-300">{d.pending}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide">Housing Rate</p>
              <p className="text-4xl font-black mt-1 text-blue-200">{d.housingRate}%</p>
            </div>
          </div>
        </div>

        {/* Housing rate progress */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-foreground">Housing Progress</h3>
            <span className="text-sm font-bold text-primary">{d.housed}/{d.totalEmployees} employees housed</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${d.housingRate}%` }}
              transition={{ type: "spring", stiffness: 50 }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{d.pending} employees still searching for housing</p>
        </div>

        {/* Savings card */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-green-700 text-sm font-bold uppercase tracking-wide">Company Savings vs. Individual Booking</p>
              <p className="text-4xl font-black text-green-600 mt-1">₹{d.savingsVsIndividual?.toLocaleString()}</p>
              <p className="text-green-600/70 text-xs mt-1">Bulk referral discounts + faster placement</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Department breakdown */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-4">By Department</h3>
            <div className="space-y-3">
              {d.departments.map((dept: any) => {
                const pct = dept.employees ? (dept.housed / dept.employees) * 100 : 0;
                return (
                  <div key={dept.dept}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{dept.dept}</span>
                      <span className="text-muted-foreground">{dept.housed}/{dept.employees}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-orange-500"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred areas */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Top Areas
            </h3>
            <div className="space-y-3">
              {d.preferredAreas.map((area: any) => (
                <div key={area.area} className="flex items-center justify-between p-2 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-foreground">{area.area}</p>
                    <p className="text-xs text-muted-foreground">{area.pgsAvailable} PGs available</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-primary">{area.count} employees</p>
                    <p className="text-xs text-muted-foreground">₹{area.avgRent.toLocaleString()}/mo avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent hires */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-foreground">Recent Hires</h3>
            <button onClick={() => setLocation("/refer")} className="text-xs text-primary font-bold hover:underline">+ Refer new hire</button>
          </div>
          <div className="space-y-3">
            {d.recentHires.map((hire: any) => (
              <div key={hire.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">
                  {hire.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{hire.name}</p>
                  <p className="text-xs text-muted-foreground">{hire.department} · {hire.area}</p>
                </div>
                <div className="flex items-center gap-1">
                  {hire.status === "HOUSED"
                    ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Housed</span>
                    : <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Searching</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
