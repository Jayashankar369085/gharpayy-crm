// @ts-nocheck
import { Link } from "wouter";
import BookOSShell, { KPI } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, RentsDB, PropertiesDB, MaintenanceDB, useStore, bookingStats, rentStats } from "@/referral-app/lib/bookos/store";
import { LeadsDB, useLeadsStore, leadStats } from "@/referral-app/lib/bookos/leads";
import { RoomsXDB, useInventoryStore, propertyHealth } from "@/referral-app/lib/bookos/inventory";
import { fmtShort } from "@/referral-app/lib/bookos/format";
import { TrendingUp, AlertTriangle } from "lucide-react";

export default function CommandPage() {
  const bookings = useStore(() => BookingsDB.all());
  const rents = useStore(() => RentsDB.all());
  const props = useStore(() => PropertiesDB.all());
  const maint = useStore(() => MaintenanceDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());
  const leads = useLeadsStore(() => LeadsDB.all());
  const s = useStore(() => bookingStats());
  const r = useStore(() => rentStats());
  const ls = useLeadsStore(() => leadStats());

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b: any) => b.createdAt.slice(0, 10) === today);
  const todayLeads = leads.filter((l: any) => l.createdAt.slice(0, 10) === today);
  const atRiskRooms = rooms.filter((r: any) => r.operationalStatus === "maintenance" || r.commercialStatus === "notice");

  const propHealth = props.map((p: any) => ({
    ...p, score: propertyHealth(p, rooms.filter((rm: any) => rm.propertyId === p.id), rents, maint),
  })).sort((a: any, b: any) => b.score - a.score);

  return (
    <BookOSShell eyebrow="EXECUTIVE COMMAND CENTER" title="Today, on one screen">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Today · Leads" value={todayLeads.length}/>
        <KPI label="Today · Bookings" value={todayBookings.length}/>
        <KPI label="Revenue added today" value={fmtShort(todayBookings.reduce((x: number, b: any) => x + b.tokenAmount, 0))}/>
        <KPI label="Pipeline value" value={fmtShort(s.avgTicket * s.total)}/>
      </div>
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <KPI label="Occupancy" value={rooms.length ? Math.round(rooms.filter((rm: any) => rm.commercialStatus === "occupied").length / rooms.length * 100) + "%" : "—"}/>
        <KPI label="Collections" value={fmtShort(r.collected)} sub={`Overdue ${fmtShort(r.overdue)}`}/>
        <KPI label="At-risk rooms" value={atRiskRooms.length} sub="maintenance / on notice"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg text-slate-900 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600"/> Property leaderboard</div>
          <div className="space-y-1.5">
            {propHealth.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50/40">
                <div className="text-xs font-mono text-slate-400 w-5">{i + 1}</div>
                <div className="flex-1 truncate font-medium text-slate-800 text-sm">{p.name}</div>
                <div className={`text-sm font-bold ${p.score >= 80 ? "text-emerald-700" : p.score >= 60 ? "text-amber-700" : "text-rose-700"}`}>{p.score}</div>
              </div>
            ))}
            {!propHealth.length && <div className="text-xs text-slate-400 italic">No properties</div>}
          </div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
          <div className="font-serif text-lg text-slate-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600"/> Risk watchlist</div>
          <div className="space-y-1.5 text-sm">
            {atRiskRooms.slice(0, 8).map((rm: any) => (
              <div key={rm.id} className="flex items-center gap-2 p-1.5">
                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">#{rm.roomNumber}</span>
                <span className="text-slate-700 text-xs">{rm.operationalStatus} · {rm.commercialStatus}</span>
              </div>
            ))}
            {!atRiskRooms.length && <div className="text-xs text-slate-400 italic">All clear ✨</div>}
          </div>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-2 text-xs">
        <Link href="/manager/bookos/leads" className="rounded-xl border border-amber-200 bg-white px-4 py-3 hover:bg-amber-50">Open leads pipeline →</Link>
        <Link href="/manager/bookos/map" className="rounded-xl border border-amber-200 bg-white px-4 py-3 hover:bg-amber-50">View live map →</Link>
        <Link href="/owner" className="rounded-xl border border-amber-200 bg-white px-4 py-3 hover:bg-amber-50">Switch to owner view →</Link>
      </div>
    </BookOSShell>
  );
}
