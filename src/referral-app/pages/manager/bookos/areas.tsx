// @ts-nocheck
import BookOSShell, { KPI } from "@/referral-app/components/bookos/Shell";
import { funnelByArea, useLeadsStore } from "@/referral-app/lib/bookos/leads";

export default function AreasFunnelPage() {
  const rows = useLeadsStore(() => funnelByArea());
  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  const totalBookings = rows.reduce((s, r) => s + r.bookings, 0);

  return (
    <BookOSShell eyebrow="DEMAND" title="Area-level conversion funnel">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Areas tracked" value={rows.length}/>
        <KPI label="Total views" value={totalViews}/>
        <KPI label="Bookings" value={totalBookings}/>
        <KPI label="Conv %" value={totalViews ? Math.round((totalBookings / totalViews) * 100) + "%" : "0%"}/>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-amber-50/60 text-[10px] uppercase tracking-wider text-amber-800">
            <tr>
              <th className="text-left p-3">Area</th>
              <th className="text-right p-3">Views</th>
              <th className="text-right p-3">Enquiries</th>
              <th className="text-right p-3">Quotes</th>
              <th className="text-right p-3">Visits</th>
              <th className="text-right p-3">Bookings</th>
              <th className="text-right p-3">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const score = r.views + r.bookings * 10 + r.visits * 5;
              return (
                <tr key={r.area} className="hover:bg-amber-50/30">
                  <td className="p-3 font-semibold text-slate-900">{r.area}</td>
                  <td className="p-3 text-right">{r.views}</td>
                  <td className="p-3 text-right">{r.enquiries}</td>
                  <td className="p-3 text-right text-amber-700">{r.quotes}</td>
                  <td className="p-3 text-right text-violet-700">{r.visits}</td>
                  <td className="p-3 text-right text-emerald-700 font-bold">{r.bookings}</td>
                  <td className="p-3 text-right font-mono text-xs bg-amber-50/40">{score}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7} className="p-10 text-center text-sm text-slate-400">No demand events yet. Visit /areas or /pg from the public site.</td></tr>}
          </tbody>
        </table>
      </div>
    </BookOSShell>
  );
}
