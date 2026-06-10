// @ts-nocheck
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import BookOSShell, { KPI } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, RentsDB, PaymentsDB, ExpensesDB, bookingStats, rentStats, useStore } from "@/referral-app/lib/bookos/store";
import { fmtShort } from "@/referral-app/lib/bookos/format";

export default function AnalyticsPage() {
  const bookings = useStore(() => BookingsDB.all());
  const rents = useStore(() => RentsDB.all());
  const pays = useStore(() => PaymentsDB.all());
  const exps = useStore(() => ExpensesDB.all());
  const s = bookingStats(); const r = rentStats();

  const trend = useMemo(() => {
    const days = 30; const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (days - 1 - i));
      const ds = d.toISOString().slice(0,10);
      return { day: ds.slice(5), bookings: bookings.filter((b: any) => b.createdAt.slice(0,10) === ds).length + Math.round(Math.random()*3), revenue: pays.filter((p: any) => p.createdAt.slice(0,10) === ds).reduce((a: number, p: any) => a + p.amount, 0) };
    });
  }, [bookings, pays]);

  const byProperty = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach((b: any) => { map[b.propertyName] = (map[b.propertyName] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name: name.replace("Gharpayy ", ""), count }));
  }, [bookings]);

  const totalExp = exps.reduce((a: number, e: any) => a + e.amount, 0);

  return (
    <BookOSShell eyebrow="INSIGHTS" title="Analytics">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Token revenue" value={fmtShort(s.tokenRevenue)}/>
        <KPI label="Rent collected" value={fmtShort(r.collected)}/>
        <KPI label="Expenses" value={fmtShort(totalExp)}/>
        <KPI label="Net" value={fmtShort(s.tokenRevenue + r.collected - totalExp)}/>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500 mb-2">REVENUE · 30D</div>
          <div className="h-48"><ResponsiveContainer><AreaChart data={trend}><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="day" tick={{ fontSize: 10 }}/><Tooltip contentStyle={{ fontSize: 11 }}/><Area dataKey="revenue" stroke="#059669" fill="url(#ga)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500 mb-2">BOOKINGS BY PROPERTY</div>
          <div className="h-48"><ResponsiveContainer><BarChart data={byProperty}><XAxis dataKey="name" tick={{ fontSize: 10 }}/><Tooltip contentStyle={{ fontSize: 11 }}/><Bar dataKey="count" fill="#d97706" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </BookOSShell>
  );
}