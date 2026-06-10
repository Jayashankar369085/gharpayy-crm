// @ts-nocheck
import OwnerShell from "@/referral-app/components/bookos/OwnerShell";
import { KPI, StatusChip } from "@/referral-app/components/bookos/Shell";
import { MaintenanceDB, useStore } from "@/referral-app/lib/bookos/store";
import { timeAgo } from "@/referral-app/lib/bookos/format";

export default function OwnerMaintenance() {
  const items = useStore(() => MaintenanceDB.all());
  const open = items.filter((m: any) => m.status !== "done");
  const high = items.filter((m: any) => m.priority === "high" && m.status !== "done");

  const byCat: any = {};
  items.forEach((m: any) => { byCat[m.title.split(" ")[0]] = (byCat[m.title.split(" ")[0]] || 0) + 1; });

  return (
    <OwnerShell title="Maintenance Operating System">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Open" value={open.length}/>
        <KPI label="High priority" value={high.length}/>
        <KPI label="Done all-time" value={items.filter((m: any) => m.status === "done").length}/>
        <KPI label="Total" value={items.length}/>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
        <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 font-semibold text-amber-900 text-sm">All tickets</div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {items.map((m: any) => (
              <tr key={m.id} className="hover:bg-amber-50/30">
                <td className="p-3"><div className="font-semibold text-slate-900">{m.title}</div><div className="text-xs text-slate-500">{m.propertyName} {m.roomNumber ? `· #${m.roomNumber}` : ""} · {timeAgo(m.createdAt)}</div></td>
                <td className="p-3"><StatusChip status={m.priority}/></td>
                <td className="p-3 text-right"><StatusChip status={m.status}/></td>
              </tr>
            ))}
            {!items.length && <tr><td className="p-10 text-center text-slate-400">No tickets.</td></tr>}
          </tbody>
        </table>
      </div>
    </OwnerShell>
  );
}
