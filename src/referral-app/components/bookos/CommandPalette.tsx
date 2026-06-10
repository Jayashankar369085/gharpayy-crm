// @ts-nocheck
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { BookingsDB, TenantsDB, QuotationsDB, useStore } from "@/referral-app/lib/bookos/store";

const ROUTES = [
  ["Overview", "/manager/bookos"],
  ["New booking", "/manager/bookos/bookings/new"],
  ["New quotation", "/manager/bookos/quotations/new"],
  ["Bookings", "/manager/bookos/bookings"],
  ["Quotations", "/manager/bookos/quotations"],
  ["Tenants", "/manager/bookos/tenants"],
  ["Rents", "/manager/bookos/rents"],
  ["Payments", "/manager/bookos/payments"],
  ["Properties", "/manager/bookos/properties"],
  ["Maintenance", "/manager/bookos/maintenance"],
  ["Expenses", "/manager/bookos/expenses"],
  ["Documents", "/manager/bookos/documents"],
  ["Staff", "/manager/bookos/staff"],
  ["Analytics", "/manager/bookos/analytics"],
  ["Notifications", "/manager/bookos/notifications"],
  ["Admin", "/manager/bookos/admin"],
  ["Settings", "/manager/bookos/settings"],
];

export default function CommandPalette({ onClose }: any) {
  const [, setLoc] = useLocation();
  const [q, setQ] = useState("");
  const bookings = useStore(() => BookingsDB.all());
  const tenants = useStore(() => TenantsDB.all());
  const quotes = useStore(() => QuotationsDB.all());

  const items = useMemo(() => {
    const t = q.toLowerCase();
    const all = [
      ...ROUTES.map(([label, to]) => ({ label, sub: "Go to", to })),
      ...bookings.map((b: any) => ({ label: `📅 ${b.tenantName}`, sub: `${b.propertyName} · ${b.status}`, to: `/manager/bookos/bookings/${b.id}` })),
      ...tenants.map((x: any) => ({ label: `👤 ${x.name}`, sub: `${x.propertyName}`, to: `/manager/bookos/tenants/${x.id}` })),
      ...quotes.map((x: any) => ({ label: `📄 ${x.serial} · ${x.tenantName}`, sub: x.propertyName, to: `/manager/bookos/quotations/${x.id}` })),
    ];
    if (!t) return all.slice(0, 12);
    return all.filter((i) => i.label.toLowerCase().includes(t) || i.sub.toLowerCase().includes(t)).slice(0, 14);
  }, [q, bookings, tenants, quotes]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search bookings, tenants, jump to module…"
            className="flex-1 outline-none text-sm" />
          <kbd className="text-[10px] text-slate-400">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.map((it: any, i: number) => (
            <button key={i} onClick={() => { setLoc(it.to); onClose(); }}
              className="w-full text-left px-4 py-2.5 hover:bg-amber-50 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-900">{it.label}</div>
                <div className="text-xs text-slate-500">{it.sub}</div>
              </div>
              <span className="text-xs text-amber-700">↵</span>
            </button>
          ))}
          {!items.length && <div className="px-4 py-8 text-center text-sm text-slate-500">No matches</div>}
        </div>
      </div>
    </div>
  );
}