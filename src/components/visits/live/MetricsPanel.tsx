import { Card } from "@/components/ui/card";
import type { DailyMetrics } from "@/lib/visits/live-engine";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-[10.5px] text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export function MetricsPanel({ m }: { m: DailyMetrics }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
        <Stat label="Visits scheduled" value={m.scheduled} />
        <Stat label="Confirmed" value={m.confirmed} />
        <Stat label="En route" value={m.enRoute} />
        <Stat label="Completed" value={m.completed} />
        <Stat label="No-shows" value={m.noShows} />
        <Stat label="Rescheduled" value={m.rescheduled} />
        <Stat label="Quotations sent" value={m.quotationsSent} />
        <Stat label="Quotation TAT" value={`${m.avgQuotationTurnaroundMin}m`} sub="feedback → quotation" />
        <Stat label="Arrival → quotation" value={`${m.avgArrivalToQuotationMin}m`} />
        <Stat label="Quotation → token" value={`${m.avgQuotationToTokenMin}m`} />
        <Stat label="Bookings" value={m.booked} />
        <Stat label="Same-day booking" value={`${m.sameDayBookingPct}%`} />
        <Stat label="Stuck w/o next action" value={m.stuckWithoutNextAction} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Table title="Coordinator performance" head={["Coordinator", "Visits", "Done", "Booked", "Conv"]}
          rows={m.coordinatorRows.map((r) => [r.name, r.visits, r.completed, r.booked, `${r.conv}%`])} />
        <Table title="Lead-owner conversion" head={["Owner", "Visits", "Booked", "Conv"]}
          rows={m.ownerRows.map((r) => [r.name, r.visits, r.booked, `${r.conv}%`])} />
        <Table title="Property-wise visit conversion" head={["Property", "Visits", "Booked", "Conv"]}
          rows={m.propertyRows.map((r) => [r.name, r.visits, r.booked, `${r.conv}%`])} />
        <Table title="Room-wise demand" head={["Room", "Requests"]}
          rows={m.roomDemand.map((r) => [r.room, r.count])} />
        <Table title="Lost reasons" head={["Reason", "Count"]}
          rows={m.lostReasons.map(([k, c]) => [k.replace(/-/g, " "), c])} />
      </div>
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: Array<Array<string | number>> }) {
  return (
    <Card className="p-3">
      <h3 className="text-xs font-semibold mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No data yet.</p>
      ) : (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground text-left">
              {head.map((h) => <th key={h} className="font-medium pb-1">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border/60">
                {r.map((c, j) => <td key={j} className="py-1 tabular-nums">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
