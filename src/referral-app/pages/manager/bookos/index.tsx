// @ts-nocheck
import { Link } from "wouter";
import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Plus, Sparkles, TrendingUp, Zap, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, RentsDB, bookingStats, rentStats, useStore, Workflow } from "@/referral-app/lib/bookos/store";
import { fmt, fmtShort, timeAgo, countdown } from "@/referral-app/lib/bookos/format";

export default function BookOSDashboard() {
  const bookings = useStore(() => BookingsDB.all());
  const s = useStore(() => bookingStats());
  const r = useStore(() => rentStats());

  useEffect(() => { Workflow.syncExpiry(); }, []);

  const spark = useMemo(() => {
    const days = 14;
    const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - (days - 1 - i));
      const ds = d.toISOString().slice(0, 10);
      const v = bookings.filter((b: any) => b.createdAt.slice(0, 10) === ds).length;
      return { day: ds.slice(5), v: v + [2,1,3,2,4,3,5,4,6,5,4,7,6,8][i] };
    });
  }, [bookings]);

  const donut = [
    { name: "Paid", value: s.paid, color: "#10b981" },
    { name: "Live", value: s.approved, color: "#f59e0b" },
    { name: "Pending", value: s.pending, color: "#fbbf24" },
    { name: "Expired", value: s.expired, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const recent = bookings.slice(0, 6);

  return (
    <BookOSShell
      eyebrow="WELCOME BACK"
      title="One gilded console for every move-in"
      actions={
        <>
          <Link href="/manager/bookos/bookings/new"><GoldBtn><Plus className="w-4 h-4"/> New booking</GoldBtn></Link>
          <Link href="/manager/bookos/quotations/new"><OutlineBtn><Sparkles className="w-4 h-4"/> Compose quote</OutlineBtn></Link>
        </>
      }
    >
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI accent label="Token revenue" value={fmtShort(s.tokenRevenue)} sub={`${s.paid} paid · avg ${fmtShort(s.avgTicket)}`} />
        <KPI label="Rent collected" value={fmtShort(r.collected)} sub={`Pending ${fmtShort(r.pending)}`} />
        <KPI label="Overdue" value={fmtShort(r.overdue)} sub="Auto-flagged" />
        <KPI label="Conversion" value={s.conversion + "%"} sub={`${s.total} bookings`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500">BOOKINGS · 14 DAYS</div>
              <div className="font-serif text-xl text-slate-900 mt-0.5">Pipeline velocity</div>
            </div>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1"><TrendingUp className="w-3 h-3"/> live</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <AreaChart data={spark}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #fde68a" }}/>
                <Area type="monotone" dataKey="v" stroke="#d97706" fill="url(#g1)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500">STATUS MIX</div>
          <div className="h-44">
            {donut.length ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {donut.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12 }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-sm text-slate-400 flex items-center justify-center h-full">No bookings yet</div>}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] mt-1">
            {donut.map((d) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }}/> {d.name} {d.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Live offers */}
      <div className="rounded-2xl border border-amber-200 bg-white/80 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-serif text-xl text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600"/> Live offers
          </div>
          <Link href="/manager/bookos/bookings" className="text-xs text-amber-700 font-semibold flex items-center gap-1">All <ArrowUpRight className="w-3 h-3"/></Link>
        </div>
        {bookings.filter((b: any) => b.status === "approved").length === 0 ? (
          <div className="text-sm text-slate-500 py-4">No live offers. Approve a pending booking to start a 15-min timer.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookings.filter((b: any) => b.status === "approved").map((b: any) => (
              <Link key={b.id} href={`/manager/bookos/bookings/${b.id}`}
                className="block rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3 hover:shadow">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 text-sm">{b.tenantName}</div>
                  <span className="text-[11px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded">{countdown(b.offerExpiresAt) || "—"}</span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{b.propertyName} · {b.roomNumber || "—"}</div>
                <div className="text-xs mt-1">Offer <b className="text-amber-700">{fmt(b.discountedRent)}</b> · token {fmt(b.tokenAmount)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="font-serif text-xl text-slate-900">Recent bookings</div>
          <Link href="/manager/bookos/bookings" className="text-xs text-amber-700 font-semibold">View all →</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recent.map((b: any) => (
            <Link key={b.id} href={`/manager/bookos/bookings/${b.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-amber-50/50">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{b.tenantName}</div>
                <div className="text-xs text-slate-500 truncate">{b.propertyName} · {b.roomNumber || "—"} · {timeAgo(b.createdAt)}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-sm font-semibold text-slate-900">{fmt(b.discountedRent)}</div>
                <StatusChip status={b.status}/>
              </div>
            </Link>
          ))}
          {!recent.length && <div className="px-5 py-8 text-center text-sm text-slate-500">No bookings yet.</div>}
        </div>
      </div>
    </BookOSShell>
  );
}