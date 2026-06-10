// @ts-nocheck
import OwnerShell from "@/referral-app/components/bookos/OwnerShell";
import { KPI } from "@/referral-app/components/bookos/Shell";
import { PropertiesDB, RentsDB, useStore } from "@/referral-app/lib/bookos/store";
import { RoomsXDB, useInventoryStore } from "@/referral-app/lib/bookos/inventory";
import { fmtShort } from "@/referral-app/lib/bookos/format";

export default function OwnerRevenue() {
  const props = useStore(() => PropertiesDB.all());
  const rents = useStore(() => RentsDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());

  const byProp = props.map((p: any) => {
    const pr = rents.filter((r: any) => r.propertyName === p.name);
    const collected = pr.filter((r: any) => r.status === "paid").reduce((s: number, r: any) => s + r.amount, 0);
    const pending = pr.filter((r: any) => r.status !== "paid").reduce((s: number, r: any) => s + r.amount, 0);
    const myRooms = rooms.filter((rm: any) => rm.propertyId === p.id);
    const vacant = myRooms.filter((rm: any) => rm.commercialStatus === "available").length;
    const vacancyCost = vacant * (myRooms[0]?.rent || 15000);
    return { ...p, collected, pending, vacant, vacancyCost };
  }).sort((a: any, b: any) => b.collected - a.collected);

  const totalCollected = byProp.reduce((s: number, p: any) => s + p.collected, 0);
  const totalVacancyCost = byProp.reduce((s: number, p: any) => s + p.vacancyCost, 0);

  return (
    <OwnerShell title="Revenue Control Tower">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Collected" value={fmtShort(totalCollected)}/>
        <KPI label="Pending" value={fmtShort(byProp.reduce((s: number, p: any) => s + p.pending, 0))}/>
        <KPI label="Vacancy cost" value={fmtShort(totalVacancyCost)}/>
        <KPI label="Properties" value={byProp.length}/>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-amber-50/60 text-[10px] uppercase tracking-wider text-amber-800">
            <tr>
              <th className="text-left p-3">Property</th>
              <th className="text-right p-3">Collected</th>
              <th className="text-right p-3">Pending</th>
              <th className="text-right p-3">Vacant</th>
              <th className="text-right p-3">Vacancy cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {byProp.map((p: any) => (
              <tr key={p.id} className="hover:bg-amber-50/30">
                <td className="p-3 font-semibold text-slate-900">{p.name}<div className="text-[10px] text-slate-500 font-normal">{p.area}</div></td>
                <td className="p-3 text-right text-emerald-700 font-bold">{fmtShort(p.collected)}</td>
                <td className="p-3 text-right text-amber-700">{fmtShort(p.pending)}</td>
                <td className="p-3 text-right">{p.vacant}</td>
                <td className="p-3 text-right text-rose-700">{fmtShort(p.vacancyCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OwnerShell>
  );
}
