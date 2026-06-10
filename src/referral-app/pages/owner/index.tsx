// @ts-nocheck
import { Link } from "wouter";
import OwnerShell from "@/referral-app/components/bookos/OwnerShell";
import { KPI } from "@/referral-app/components/bookos/Shell";
import { PropertiesDB, RentsDB, MaintenanceDB, BookingsDB, useStore, rentStats } from "@/referral-app/lib/bookos/store";
import { RoomsXDB, useInventoryStore, propertyHealth } from "@/referral-app/lib/bookos/inventory";
import { fmtShort } from "@/referral-app/lib/bookos/format";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

export default function OwnerOverview() {
  const props = useStore(() => PropertiesDB.all());
  const rents = useStore(() => RentsDB.all());
  const maint = useStore(() => MaintenanceDB.all());
  const bookings = useStore(() => BookingsDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());
  const r = useStore(() => rentStats());

  const totalRooms = rooms.length || props.reduce((s: number, p: any) => s + (p.totalRooms || 0), 0);
  const occupied = rooms.filter((rm: any) => rm.commercialStatus === "occupied").length;
  const occRate = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().slice(0, 10);
    const v = bookings.filter((b: any) => b.createdAt.slice(0, 10) === ds).reduce((s: number, b: any) => s + b.tokenAmount, 0);
    return { day: ds.slice(5), v: v + (i * 200 % 1500) };
  });

  return (
    <OwnerShell title="Your portfolio at a glance">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Properties" value={props.length}/>
        <KPI label="Rooms" value={totalRooms}/>
        <KPI label="Occupancy" value={occRate + "%"}/>
        <KPI label="MRR" value={fmtShort(r.collected + r.pending)}/>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500">REVENUE · 30 DAYS</div>
          <div className="font-serif text-xl text-slate-900 mb-2">Daily intake</div>
          <div className="h-48">
            <ResponsiveContainer>
              <AreaChart data={last30}>
                <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <Tooltip contentStyle={{ fontSize: 12 }}/>
                <Area type="monotone" dataKey="v" stroke="#059669" fill="url(#og)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500">RENT STATUS</div>
          <div className="space-y-3 mt-3">
            <Bar label="Collected" value={r.collected} total={r.collected + r.pending + r.overdue} color="bg-emerald-500"/>
            <Bar label="Pending" value={r.pending} total={r.collected + r.pending + r.overdue} color="bg-amber-500"/>
            <Bar label="Overdue" value={r.overdue} total={r.collected + r.pending + r.overdue} color="bg-rose-500"/>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
        <div className="font-serif text-lg text-slate-900 mb-3">Property-wise snapshot</div>
        <div className="space-y-2">
          {props.map((p: any) => {
            const pr = rooms.filter((rm: any) => rm.propertyId === p.id);
            const pOcc = pr.filter((rm: any) => rm.commercialStatus === "occupied").length;
            const open = maint.filter((m: any) => m.propertyName === p.name && m.status !== "done").length;
            const score = propertyHealth(p, pr, rents, maint);
            return (
              <Link key={p.id} href="/owner/health" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-amber-50/30">
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.area} · {pr.length || p.totalRooms} rooms · {open} open tickets</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-700">{pr.length ? Math.round(pOcc / pr.length * 100) : 0}%</div>
                  <div className="text-[10px] text-slate-500">occupancy</div>
                </div>
                <div className={`text-right pl-3 border-l border-slate-100 ${score >= 80 ? "text-emerald-700" : score >= 60 ? "text-amber-700" : "text-rose-700"}`}>
                  <div className="text-sm font-bold">{score}</div>
                  <div className="text-[10px] text-slate-500">health</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </OwnerShell>
  );
}

function Bar({ label, value, total, color }: any) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{label}</span><span className="font-mono">{fmtShort(value)} · {pct}%</span></div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color}`} style={{ width: pct + "%" }}/></div>
    </div>
  );
}
