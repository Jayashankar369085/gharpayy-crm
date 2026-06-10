// @ts-nocheck
import OwnerShell from "@/referral-app/components/bookos/OwnerShell";
import { KPI } from "@/referral-app/components/bookos/Shell";
import { PropertiesDB, RentsDB, MaintenanceDB, useStore } from "@/referral-app/lib/bookos/store";
import { RoomsXDB, useInventoryStore, propertyHealth } from "@/referral-app/lib/bookos/inventory";

function badge(score: number) {
  if (score >= 85) return { label: "Elite", c: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  if (score >= 70) return { label: "Healthy", c: "bg-amber-100 text-amber-800 border-amber-200" };
  if (score >= 50) return { label: "Watch", c: "bg-orange-100 text-orange-800 border-orange-200" };
  return { label: "At Risk", c: "bg-rose-100 text-rose-800 border-rose-200" };
}

export default function OwnerHealth() {
  const props = useStore(() => PropertiesDB.all());
  const rents = useStore(() => RentsDB.all());
  const maint = useStore(() => MaintenanceDB.all());
  const rooms = useInventoryStore(() => RoomsXDB.all());

  const scored = props.map((p: any) => {
    const myRooms = rooms.filter((rm: any) => rm.propertyId === p.id);
    return { ...p, score: propertyHealth(p, myRooms, rents, maint), myRooms };
  }).sort((a: any, b: any) => b.score - a.score);

  const avg = scored.length ? Math.round(scored.reduce((s: number, p: any) => s + p.score, 0) / scored.length) : 0;

  return (
    <OwnerShell title="Property Health Score">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Portfolio score" value={avg + "/100"}/>
        <KPI label="Elite" value={scored.filter((p: any) => p.score >= 85).length}/>
        <KPI label="Healthy" value={scored.filter((p: any) => p.score >= 70 && p.score < 85).length}/>
        <KPI label="At-risk" value={scored.filter((p: any) => p.score < 50).length}/>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {scored.map((p: any) => {
          const b = badge(p.score);
          const vacancyRisk = p.myRooms.filter((rm: any) => rm.commercialStatus === "notice").length;
          return (
            <div key={p.id} className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-serif text-lg text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.area}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${b.c}`}>{b.label}</span>
              </div>
              <div className="text-4xl font-bold text-amber-700 my-2">{p.score}<span className="text-base text-slate-400 font-normal">/100</span></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Metric label="Occupancy" weight="25%"/>
                <Metric label="Collection" weight="25%"/>
                <Metric label="Maintenance" weight="15%"/>
                <Metric label="Reviews" weight="15%"/>
                <Metric label="Response" weight="10%"/>
                <Metric label="Conversion" weight="10%"/>
              </div>
              {vacancyRisk > 0 && <div className="mt-3 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-2">⚠️ {vacancyRisk} rooms on notice — vacancy risk next month</div>}
            </div>
          );
        })}
      </div>
    </OwnerShell>
  );
}

function Metric({ label, weight }: any) {
  return (
    <div className="flex items-center justify-between bg-amber-50/40 border border-amber-100 rounded-md px-2 py-1">
      <span className="text-slate-700">{label}</span>
      <span className="text-[10px] text-slate-500 font-mono">{weight}</span>
    </div>
  );
}
