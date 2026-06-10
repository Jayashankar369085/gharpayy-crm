// @ts-nocheck
import { Link } from "wouter";
import BookOSShell, { KPI } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, RentsDB, PaymentsDB, PropertiesDB, MaintenanceDB, useStore, bookingStats, rentStats } from "@/referral-app/lib/bookos/store";
import { RoomsXDB, readyToSell, useInventoryStore } from "@/referral-app/lib/bookos/inventory";
import { VisitsDB, RoomBookingsDB, useOps } from "@/referral-app/lib/bookos/ops";
import { LeadsDB, useLeadsStore } from "@/referral-app/lib/bookos/leads";
import { fmt, fmtShort } from "@/referral-app/lib/bookos/format";

export default function FounderTower() {
  const bs = useStore(() => bookingStats());
  const rs = useStore(() => rentStats());
  const bookings = useStore(() => BookingsDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());
  const visits = useOps(() => VisitsDB.all());
  const rbs = useOps(() => RoomBookingsDB.all());
  const props = useStore(() => PropertiesDB.all());
  const leads = useLeadsStore(() => LeadsDB.all());
  const maint = useStore(() => MaintenanceDB.all());

  const today = new Date().toISOString().slice(0, 10);
  const todays = {
    leads: leads.filter((l: any) => l.createdAt.slice(0, 10) === today).length,
    visits: visits.filter((v: any) => v.date === today).length,
    bookings: bookings.filter((b: any) => b.createdAt.slice(0, 10) === today).length,
    revenue: bookings.filter((b: any) => b.createdAt.slice(0, 10) === today && b.status === "paid").reduce((s: number, b: any) => s + b.tokenAmount, 0),
  };

  const totalBeds = rooms.reduce((s: number, r: any) => s + (r.sharing || 0), 0);
  const occupied = rooms.filter((r: any) => r.commercialStatus === "occupied").length;
  const occRate = rooms.length ? Math.round((occupied / rooms.length) * 100) : 0;
  const readyToSellCount = rooms.filter((r: any) => readyToSell(r)).length;
  const notReady = rooms.filter((r: any) => r.operationalStatus !== "ready" && r.commercialStatus !== "occupied").length;

  // property ranking
  const byProp = props.map((p: any) => {
    const pRooms = rooms.filter((r: any) => r.propertyId === p.id);
    const pOcc = pRooms.filter((r: any) => r.commercialStatus === "occupied").length;
    const occ = pRooms.length ? Math.round((pOcc / pRooms.length) * 100) : 0;
    const rev = bookings.filter((b: any) => b.propertyName === p.name && b.status === "paid").reduce((s: number, b: any) => s + b.discountedRent, 0);
    const pendingMaint = maint.filter((m: any) => m.propertyName === p.name && m.status !== "done").length;
    return { p, occ, rev, pendingMaint };
  });
  const top = [...byProp].sort((a, b) => b.rev - a.rev).slice(0, 5);
  const bottom = [...byProp].sort((a, b) => a.occ - b.occ).slice(0, 5);

  const collectionsAtRisk = bookings.filter((b: any) => b.status === "approved" || b.status === "expired").length;
  const bookingsAtRisk = rbs.filter((rb: any) => rb.status !== "movein_done" && !rb.collected.token).length;

  return (
    <BookOSShell eyebrow="FOUNDER CONTROL TOWER" title="Entire company · one screen">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Today · Leads" value={todays.leads}/>
        <KPI accent label="Today · Visits" value={todays.visits}/>
        <KPI accent label="Today · Bookings" value={todays.bookings}/>
        <KPI accent label="Today · Revenue" value={fmtShort(todays.revenue)}/>
      </div>

      <div className="grid lg:grid-cols-4 gap-4 mb-5">
        <Section title="Inventory">
          <Row k="Total beds" v={totalBeds}/>
          <Row k="Occupied" v={occupied}/>
          <Row k="Ready to sell" v={readyToSellCount} tone="emerald"/>
          <Row k="Not ready" v={notReady} tone={notReady > 0 ? "rose" : "slate"}/>
        </Section>
        <Section title="Sales">
          <Row k="Leads (all)" v={leads.length}/>
          <Row k="Visits scheduled" v={visits.filter((v: any) => v.status === "scheduled").length}/>
          <Row k="Booked" v={bs.paid}/>
          <Row k="Conversion" v={bs.conversion + "%"} tone="emerald"/>
        </Section>
        <Section title="Collections">
          <Row k="Collected" v={fmtShort(rs.collected)} tone="emerald"/>
          <Row k="Pending" v={fmtShort(rs.pending)}/>
          <Row k="Overdue" v={fmtShort(rs.overdue)} tone={rs.overdue > 0 ? "rose" : "slate"}/>
          <Row k="At risk" v={collectionsAtRisk}/>
        </Section>
        <Section title="Operations">
          <Row k="Open tickets" v={maint.filter((m: any) => m.status !== "done").length}/>
          <Row k="Move-ins pending" v={rbs.filter((r: any) => r.status !== "movein_done").length}/>
          <Row k="Bookings at risk" v={bookingsAtRisk} tone={bookingsAtRisk > 0 ? "rose" : "slate"}/>
          <Row k="Occupancy" v={occRate + "%"}/>
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3">Top properties</div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-500"><tr><th className="text-left py-1">Property</th><th>Occupancy</th><th>Revenue</th></tr></thead>
            <tbody>{top.map((t) => (
              <tr key={t.p.id} className="border-t border-slate-100"><td className="py-1.5">{t.p.name}</td><td className="text-center font-mono">{t.occ}%</td><td className="text-right font-bold text-emerald-700">{fmtShort(t.rev)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-white/80 p-5">
          <div className="font-serif text-lg mb-3 text-rose-800">At-risk properties</div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-slate-500"><tr><th className="text-left py-1">Property</th><th>Occupancy</th><th>Open maint</th></tr></thead>
            <tbody>{bottom.map((t) => (
              <tr key={t.p.id} className="border-t border-slate-100"><td className="py-1.5">{t.p.name}</td><td className="text-center font-mono">{t.occ}%</td><td className="text-right text-rose-700 font-bold">{t.pendingMaint}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </BookOSShell>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
      <div className="text-[10px] font-bold tracking-[0.18em] text-amber-700 mb-2">{title.toUpperCase()}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ k, v, tone = "slate" }: any) {
  const c = { emerald: "text-emerald-700", rose: "text-rose-700", slate: "text-slate-900" }[tone];
  return <div className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className={`font-bold ${c}`}>{v}</span></div>;
}
