// @ts-nocheck
import OwnerShell from "@/referral-app/components/bookos/OwnerShell";
import { KPI, StatusChip } from "@/referral-app/components/bookos/Shell";
import { RentsDB, useStore } from "@/referral-app/lib/bookos/store";
import { fmtShort } from "@/referral-app/lib/bookos/format";

const BUCKETS = [
  { label: "0-7 days", max: 7 },
  { label: "8-15 days", max: 15 },
  { label: "16-30 days", max: 30 },
  { label: "30+ days", max: 60 },
  { label: "60+ days", max: 90 },
  { label: "90+ days", max: Infinity },
];

function ageDays(month: string) {
  const due = new Date(month + "-05");
  return Math.floor((Date.now() - +due) / 86400000);
}

export default function OwnerCollections() {
  const rents = useStore(() => RentsDB.all());
  const overdue = rents.filter((r: any) => r.status !== "paid");
  const buckets = BUCKETS.map((b, i) => {
    const min = i === 0 ? 0 : BUCKETS[i - 1].max;
    return { ...b, items: overdue.filter((r: any) => { const a = ageDays(r.month); return a >= min && a < b.max; }) };
  });

  return (
    <OwnerShell title="Rent Collection War Room">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        {buckets.map((b: any) => (
          <KPI key={b.label} label={b.label} value={b.items.length} sub={fmtShort(b.items.reduce((s: number, r: any) => s + r.amount, 0))}/>
        ))}
      </div>
      <div className="space-y-3">
        {buckets.filter((b: any) => b.items.length).map((b: any) => (
          <div key={b.label} className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 font-semibold text-amber-900 text-sm">{b.label} · {b.items.length} tenants</div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {b.items.map((r: any) => (
                  <tr key={r.id} className="hover:bg-amber-50/30">
                    <td className="p-3"><div className="font-semibold text-slate-900">{r.tenantName}</div><div className="text-xs text-slate-500">{r.propertyName}</div></td>
                    <td className="p-3 text-xs text-slate-600">{r.month}</td>
                    <td className="p-3 text-right font-bold text-rose-700">{fmtShort(r.amount)}</td>
                    <td className="p-3 text-right"><StatusChip status={r.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {!overdue.length && <div className="rounded-2xl border-2 border-dashed border-emerald-200 p-10 text-center text-emerald-700 font-semibold">🎉 All rents collected</div>}
      </div>
    </OwnerShell>
  );
}
