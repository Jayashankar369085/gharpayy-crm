// @ts-nocheck
import { Link } from "wouter";
import { Plus, Download, ArrowRight } from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { QuotationsDB, Workflow, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, timeAgo, csv, downloadFile } from "@/referral-app/lib/bookos/format";

export default function QuotationsList() {
  const all = useStore(() => QuotationsDB.all());
  const k = (s: string) => all.filter((q: any) => q.status === s).length;

  return (
    <BookOSShell eyebrow="QUOTES" title="Quotations"
      actions={<>
        <OutlineBtn onClick={() => downloadFile("quotations.csv", csv(all))}><Download className="w-4 h-4"/> CSV</OutlineBtn>
        <Link href="/manager/bookos/quotations/new"><GoldBtn><Plus className="w-4 h-4"/> New quote</GoldBtn></Link>
      </>}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KPI label="Total" value={all.length}/>
        <KPI label="Draft" value={k("draft")}/>
        <KPI label="Sent" value={k("sent")}/>
        <KPI accent label="Accepted" value={k("accepted")}/>
        <KPI label="Converted" value={k("converted")}/>
      </div>
      {!all.length ? <EmptyState title="No quotations yet" hint="Compose your first quote" cta={<Link href="/manager/bookos/quotations/new"><GoldBtn><Plus className="w-4 h-4"/> New</GoldBtn></Link>}/> : (
        <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-[10px] uppercase tracking-wider text-slate-600">
              <tr><th className="px-3 py-2 text-left">Serial</th><th className="px-3 py-2 text-left">Tenant</th><th className="px-3 py-2 text-left hidden md:table-cell">Property</th><th className="px-3 py-2 text-right">Rent</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {all.map((q: any) => (
                <tr key={q.id} className="hover:bg-amber-50/40">
                  <td className="px-3 py-2.5 font-mono text-xs">{q.serial}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/manager/bookos/quotations/${q.id}`} className="font-semibold hover:text-amber-700">{q.tenantName}</Link>
                    <div className="text-xs text-slate-500">{timeAgo(q.createdAt)}</div>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">{q.propertyName}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmt(q.offerRent || q.rent)}</td>
                  <td className="px-3 py-2.5"><StatusChip status={q.status}/></td>
                  <td className="px-3 py-2.5 text-right">
                    {q.status !== "converted" && (
                      <button onClick={() => Workflow.convertQuoteToBooking(q.id)}
                        className="text-xs text-amber-700 font-semibold inline-flex items-center gap-1">Convert <ArrowRight className="w-3 h-3"/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </BookOSShell>
  );
}