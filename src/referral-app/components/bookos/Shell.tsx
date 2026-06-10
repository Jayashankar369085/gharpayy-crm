// @ts-nocheck
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Layout } from "@/referral-app/components/layout";
import {
  LayoutDashboard, Calendar, FileText, Users, IndianRupee, Receipt,
  Building2, FolderOpen, Wallet, Wrench, UserCog, BarChart2,
  Bell, Shield, Settings as SettingsIcon, Plus, Command,
  Magnet, Map, Layers, Crown, TrendingUp, MapPin, Home, Gauge,
} from "lucide-react";
import { Workflow, useStore, NotificationsDB, BookingsDB, RentsDB, bookingStats, rentStats } from "@/referral-app/lib/bookos/store";
import { seedIfEmpty } from "@/referral-app/lib/bookos/seed";
import CommandPalette from "./CommandPalette";

const NAV = [
  { to: "/manager/bookos", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/manager/bookos/founder", label: "Founder", icon: Gauge },
  { to: "/manager/bookos/command", label: "Command", icon: Crown },
  { to: "/manager/bookos/leads", label: "Leads", icon: Magnet },
  { to: "/manager/bookos/visits", label: "Visits", icon: MapPin },
  { to: "/manager/bookos/movein", label: "Move-in", icon: Home },
  { to: "/manager/bookos/areas", label: "Demand", icon: TrendingUp },
  { to: "/manager/bookos/map", label: "Live map", icon: Map },
  { to: "/manager/bookos/inventory", label: "Inventory", icon: Layers },
  { to: "/manager/bookos/bookings", label: "Bookings", icon: Calendar },
  { to: "/manager/bookos/quotations", label: "Quotations", icon: FileText },
  { to: "/manager/bookos/tenants", label: "Tenants", icon: Users },
  { to: "/manager/bookos/payments", label: "Payments", icon: IndianRupee },
  { to: "/manager/bookos/rents", label: "Rents", icon: Receipt },
  { to: "/manager/bookos/properties", label: "Properties", icon: Building2 },
  { to: "/manager/bookos/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/manager/bookos/expenses", label: "Expenses", icon: Wallet },
  { to: "/manager/bookos/documents", label: "Docs", icon: FolderOpen },
  { to: "/manager/bookos/staff", label: "Staff", icon: UserCog },
  { to: "/manager/bookos/analytics", label: "Analytics", icon: BarChart2 },
  { to: "/manager/bookos/notifications", label: "Inbox", icon: Bell },
  { to: "/manager/bookos/admin", label: "Admin", icon: Shield },
  { to: "/manager/bookos/settings", label: "Settings", icon: SettingsIcon },
];


export default function BookOSShell({ title, eyebrow, actions, children }: any) {
  const [loc, setLoc] = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const notifs = useStore(() => NotificationsDB.all());
  const unread = notifs.filter((n: any) => !n.read).length;

  useEffect(() => {
    seedIfEmpty();
    Workflow.syncExpiry();
    Workflow.syncRentOverdue();
    const t = setInterval(() => { Workflow.syncExpiry(); }, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen(true);
      } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.key === "n") setLoc("/manager/bookos/bookings/new");
        if (e.key === "q") setLoc("/manager/bookos/quotations/new");
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [setLoc]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-56 border-r border-amber-200/40 bg-white/70 backdrop-blur sticky top-0 h-screen overflow-y-auto">
            <div className="px-4 py-5 border-b border-amber-100">
              <div className="text-[10px] font-bold tracking-[0.2em] text-amber-700">GHARPAYY</div>
              <div className="font-serif text-xl text-slate-900">Booking OS</div>
            </div>
            <nav className="flex-1 py-3 px-2 space-y-0.5">
              {NAV.map((n) => {
                const active = n.exact ? loc === n.to : loc.startsWith(n.to);
                const Icon = n.icon;
                return (
                  <Link key={n.to} href={n.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-900 font-semibold" : "text-slate-600 hover:bg-slate-100"}`}>
                    <Icon className="w-4 h-4" />
                    <span className="flex-1">{n.label}</span>
                    {n.label === "Inbox" && unread > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">{unread}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-amber-100">
              <button onClick={() => setPaletteOpen(true)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 bg-slate-100 hover:bg-slate-200">
                <span className="flex items-center gap-2"><Command className="w-3 h-3" /> Command</span>
                <kbd className="text-[10px] bg-white border border-slate-200 rounded px-1 py-0.5">⌘K</kbd>
              </button>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {/* Hero */}
            <div className="border-b border-amber-200/40 bg-gradient-to-r from-white via-amber-50/40 to-white">
              <div className="px-4 sm:px-6 lg:px-8 py-5 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  {eyebrow && <div className="text-[10px] font-bold tracking-[0.2em] text-amber-700 mb-1">{eyebrow}</div>}
                  <h1 className="font-serif text-2xl sm:text-3xl text-slate-900" style={{ letterSpacing: "-0.02em" }}>{title}</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">{actions}</div>
              </div>
              {/* Today pulse strip — always-on operator context */}
              <TodayPulse />
              {/* Mobile nav */}
              <div className="lg:hidden px-3 pb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {NAV.map((n) => {
                  const active = n.exact ? loc === n.to : loc.startsWith(n.to);
                  return (
                    <Link key={n.to} href={n.to}
                      className={`shrink-0 text-xs px-3 py-1.5 rounded-full border ${active ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </Layout>
  );
}

function TodayPulse() {
  const bookings = useStore(() => BookingsDB.all());
  const rents = useStore(() => RentsDB.all());
  const s = useStore(() => bookingStats());
  const r = useStore(() => rentStats());
  const today = new Date().toISOString().slice(0, 10);
  const newToday = bookings.filter((b: any) => b.createdAt.slice(0, 10) === today).length;
  const liveOffers = bookings.filter((b: any) => b.status === "approved").length;
  const overdue = rents.filter((x: any) => x.status === "overdue").length;
  const items = [
    { k: "Today", v: newToday, hint: "new bookings", tone: "amber" },
    { k: "Live offers", v: liveOffers, hint: "15-min timers", tone: "emerald" },
    { k: "Pending", v: s.pending, hint: "awaiting approve", tone: "amber" },
    { k: "Overdue rent", v: overdue, hint: "auto-flagged", tone: overdue > 0 ? "rose" : "slate" },
    { k: "Collected", v: `₹${Math.round(r.collected/1000)}k`, hint: "this month", tone: "emerald" },
  ];
  const toneCls: any = {
    amber: "text-amber-700", emerald: "text-emerald-700",
    rose: "text-rose-700", slate: "text-slate-700",
  };
  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-3 -mt-1 flex gap-2 overflow-x-auto scrollbar-hide">
      {items.map((i) => (
        <Link key={i.k} href="/manager/bookos/command"
          className="shrink-0 rounded-xl border border-amber-200/60 bg-white/80 backdrop-blur px-3 py-1.5 flex items-center gap-2 hover:border-amber-300">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{i.k}</span>
          <span className={`text-sm font-bold ${toneCls[i.tone]}`}>{i.v}</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">{i.hint}</span>
        </Link>
      ))}
    </div>
  );
}

export function KPI({ label, value, sub, accent }: any) {
  return (
    <div className={`rounded-2xl border bg-white/80 backdrop-blur p-4 ${accent ? "border-amber-300" : "border-slate-200"}`}>
      <div className="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? "text-amber-700" : "text-slate-900"}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const cls = chipClass(status);
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>{status}</span>;
}
function chipClass(s: string) {
  const m: any = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    paid: "bg-emerald-200 text-emerald-900 border-emerald-300",
    expired: "bg-red-100 text-red-800 border-red-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
    overdue: "bg-red-100 text-red-800 border-red-200",
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    sent: "bg-blue-100 text-blue-800 border-blue-200",
    accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    converted: "bg-amber-200 text-amber-900 border-amber-300",
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    notice: "bg-amber-100 text-amber-800 border-amber-200",
    exited: "bg-slate-100 text-slate-600 border-slate-200",
    open: "bg-amber-100 text-amber-800 border-amber-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    done: "bg-emerald-100 text-emerald-800 border-emerald-200",
    high: "bg-red-100 text-red-800 border-red-200",
    med: "bg-amber-100 text-amber-800 border-amber-200",
    low: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return m[s] || "bg-slate-100 text-slate-700 border-slate-200";
}

export function GoldBtn({ children, ...p }: any) {
  return (
    <button {...p} className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:from-amber-600 hover:to-amber-700 ${p.className || ""}`}>
      {children}
    </button>
  );
}
export function OutlineBtn({ children, ...p }: any) {
  return (
    <button {...p} className={`inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 ${p.className || ""}`}>
      {children}
    </button>
  );
}

export function EmptyState({ title, hint, cta }: any) {
  return (
    <div className="border-2 border-dashed border-amber-200 rounded-2xl p-10 text-center bg-white/50">
      <div className="text-lg font-serif text-slate-900">{title}</div>
      {hint && <div className="text-sm text-slate-500 mt-1">{hint}</div>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function PlusIcon() { return <Plus className="w-4 h-4" />; }