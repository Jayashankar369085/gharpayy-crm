// @ts-nocheck
import { Link } from "wouter";
import { useState } from "react";
import { Plus, Download, Zap, Trash2 } from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { BookingsDB, Workflow, bookingStats, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, timeAgo, countdown, csv, downloadFile } from "@/referral-app/lib/bookos/format";

export default function BookingsList() {
  const all = useStore(() => BookingsDB.all());
  const s = useStore(() => bookingStats());
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<string[]>([]);
  const filtered = filter === "all" ? all : all.filter((b: any) => b.status === filter);
  const toggle = (id: string) => setSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const bulk = (fn: (id: string) => void) => { sel.forEach(fn); setSel([]); };

  return (
    <BookOSShell eyebrow="OPERATIONS" title="Bookings"
      actions={<>
        <OutlineBtn onClick={() => downloadFile("bookings.csv", csv(all))}><Download className="w-4 h-4"/> CSV</OutlineBtn>
        <Link href="/manager/bookos/bookings/new"><GoldBtn><Plus className="w-4 h-4"/> New</GoldBtn></Link>
      </>}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KPI label="Total" value={s.total}/>
        <KPI label="Pending" value={s.pending}/>
        <KPI accent label="Live" value={s.approved}/>
        <KPI label="Paid" value={s.paid}/>
        <KPI label="Conversion" value={s.conversion + "%"}/>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {["all","pending","approved","paid","expired","cancelled"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border ${filter === f ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>
            {f} {f !== "all" && <span className="ml-1 text-slate-400">{(s as any)[f] ?? ""}</span>}
          </button>
        ))}
        {sel.length > 0 && (
          <div className="ml-auto flex gap-1.5">
            <span className="text-xs text-slate-500 self-center">{sel.length} selected</span>
            <OutlineBtn onClick={() => bulk((id) => Workflow.approveBooking(id))}><Zap className="w-3 h-3"/> Approve</OutlineBtn>
            <OutlineBtn onClick={() => bulk((id) => BookingsDB.del(id))}><Trash2 className="w-3 h-3"/> Delete</OutlineBtn>
          </div>
        )}
      </div>
      {!filtered.length ? (
        <EmptyState title="No bookings here" hint="Create a new booking to get started"
          cta={<Link href="/manager/bookos/bookings/new"><GoldBtn><Plus className="w-4 h-4"/> New booking</GoldBtn></Link>}/>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-[10px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2 text-left">Tenant</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Property</th>
                <th className="px-3 py-2 text-right">Offer</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">Token</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left hidden lg:table-cell">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b: any) => (
                <tr key={b.id} className="hover:bg-amber-50/40">
                  <td className="px-3 py-2.5"><input type="checkbox" checked={sel.includes(b.id)} onChange={() => toggle(b.id)}/></td>
                  <td className="px-3 py-2.5">
                    <Link href={`/manager/bookos/bookings/${b.id}`} className="font-semibold text-slate-900 hover:text-amber-700">{b.tenantName}</Link>
                    <div className="text-xs text-slate-500 md:hidden">{b.propertyName}</div>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-slate-700">{b.propertyName} {b.roomNumber && <span className="text-slate-400">· {b.roomNumber}</span>}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmt(b.discountedRent)}</td>
                  <td className="px-3 py-2.5 text-right hidden sm:table-cell text-slate-600">{fmt(b.tokenAmount)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <StatusChip status={b.status}/>
                      {b.status === "approved" && <span className="text-[10px] font-mono text-amber-700">{countdown(b.offerExpiresAt)}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell text-xs text-slate-500">{timeAgo(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BookOSShell>
  );
}