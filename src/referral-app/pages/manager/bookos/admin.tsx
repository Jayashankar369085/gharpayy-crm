// @ts-nocheck
import BookOSShell, { KPI, EmptyState } from "@/referral-app/components/bookos/Shell";
import { ActivityDB, BookingsDB, TenantsDB, QuotationsDB, useStore } from "@/referral-app/lib/bookos/store";
import { timeAgo } from "@/referral-app/lib/bookos/format";

export default function AdminPage() {
  const acts = useStore(() => ActivityDB.all());
  const b = useStore(() => BookingsDB.all());
  const t = useStore(() => TenantsDB.all());
  const q = useStore(() => QuotationsDB.all());
  return (
    <BookOSShell eyebrow="CONSOLE" title="Admin">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI accent label="Activity" value={acts.length}/><KPI label="Bookings" value={b.length}/><KPI label="Tenants" value={t.length}/><KPI label="Quotes" value={q.length}/>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
        <div className="font-serif text-lg mb-3">Live activity</div>
        {!acts.length ? <EmptyState title="No activity yet"/> : (
          <div className="space-y-1 max-h-96 overflow-y-auto">{acts.slice(0, 80).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between text-sm border-b border-slate-100 py-1.5">
              <div><span className="font-mono text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">{a.action}</span> <span className="text-slate-600">{a.entity}</span> {a.entityId && <span className="text-slate-400 text-xs">· {a.entityId.slice(0,8)}</span>}</div>
              <div className="text-xs text-slate-400">{timeAgo(a.createdAt)}</div>
            </div>
          ))}</div>
        )}
      </div>
    </BookOSShell>
  );
}