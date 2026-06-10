// @ts-nocheck
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { getEarnerStats } from "@/lib/analytics";
import { Trophy, Crown } from "lucide-react";
import { AdminPitch } from "@/referral-app/components/admin/AdminPitch";

export default function AdminEarners() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  useEffect(() => { if (!isAdminAuthenticated) setLocation("/admin"); }, [isAdminAuthenticated, setLocation]);
  const { data } = useAdminGetLeads();
  const leads = data?.leads || [];
  const rows = useMemo(() => getEarnerStats(leads), [leads]);
  if (!isAdminAuthenticated) return null;

  const total = rows.reduce((s, r) => s + r.earned, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPitch
          eyebrow="Earners · Gharpayy referral engine"
          title="Real people making money with Gharpayy"
          pitch={{
            why: "Showing earnings is the loudest reason new users join Gharpayy.",
            how: "Track earned ₹, conversions and streak · promote top earners to Society Expert.",
            next: "Click the row above the line and DM them a Society Expert offer.",
          }}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Stat label="Active earners" value={rows.length} />
          <Stat label="₹ paid out" value={`₹${(total / 1000).toFixed(1)}k`} />
          <Stat label="Top earner" value={rows[0]?.name || "-"} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/40 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 text-left">#</th>
                <th className="px-4 py-2.5 text-left">Earner</th>
                <th className="px-4 py-2.5 text-right">Leads</th>
                <th className="px-4 py-2.5 text-right">Bookings</th>
                <th className="px-4 py-2.5 text-right">Earned</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r, i) => (
                <tr key={r.code} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-500 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{r.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{r.code}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-blue-400 font-bold">{r.leads}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-bold">{r.bookings}</td>
                  <td className="px-4 py-3 text-right text-orange-400 font-black">₹{r.earned.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {i < 3 ? (
                      <button className="text-[10px] font-bold text-orange-400 hover:underline inline-flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Promote
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</div>
      <div className="text-xl font-black text-white mt-1 truncate">{value}</div>
    </div>
  );
}
