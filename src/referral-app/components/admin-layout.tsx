// @ts-nocheck
import { Link, useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import {
  LayoutDashboard, Users, CreditCard, BarChart3, LogOut, Building2,
  Map as MapIcon, Headset, Trophy, Radio, MapPin, Sparkles,
} from "lucide-react";
import { cn } from "@/referral-app/lib/utils";
import { GHARPAYY_ZONES } from "@/lib/gharpayy-zones";
import { useAdminGetLeads } from "@/referral-app/api";
import { zoneForLead } from "@/lib/gharpayy-zones";

export function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const { setAdminAuthenticated } = useAdminStore();
  const { data: leadsRes } = useAdminGetLeads();
  const leads = leadsRes?.leads || [];

  const handleLogout = () => setAdminAuthenticated(false);

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/admin/zones", icon: MapPin, label: "Zones" },
    { href: "/admin/map", icon: MapIcon, label: "Live Map" },
    { href: "/admin/leads", icon: Users, label: "Leads" },
    { href: "/admin/properties", icon: Building2, label: "Properties" },
    { href: "/admin/experts", icon: Headset, label: "Experts" },
    { href: "/admin/payouts", icon: CreditCard, label: "Payouts" },
    { href: "/admin/earners", icon: Trophy, label: "Earners" },
    { href: "/admin/channels", icon: Radio, label: "Channels" },
    { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 text-white border-r border-slate-800 shrink-0">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-sm font-black">G</span>
            <span className="leading-tight">
              Gharpayy
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Ops Cockpit</span>
            </span>
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location === item.href || location.startsWith(item.href + "/")
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <Link href="/home" className="flex items-center gap-3 px-3 py-2 text-xs text-slate-500 hover:text-slate-200">
            <Sparkles className="w-3.5 h-3.5" /> Switch to earner app
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-left text-xs text-slate-500 hover:text-white">
            <LogOut className="w-3.5 h-3.5" /> Exit Admin
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
          <h1 className="text-base font-bold font-display flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-xs font-black">G</span>
            Ops Cockpit
          </h1>
          <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Mobile Nav */}
        <nav className="md:hidden bg-slate-900 border-b border-slate-800 flex overflow-x-auto sticky top-[57px] z-20">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 min-w-[68px] flex flex-col items-center justify-center gap-1 px-3 py-2 text-[10px] font-bold border-b-2 transition-colors",
                location === item.href || location.startsWith(item.href + "/")
                  ? "border-orange-500 text-orange-400 bg-orange-500/10"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label.split(" ")[0]}
            </Link>
          ))}
        </nav>

        {/* Zone Chips Bar · the spine */}
        <ZoneChipsBar leads={leads} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}

function ZoneChipsBar({ leads }: { leads: any[] }) {
  const [, setLocation] = useLocation();
  return (
    <div className="bg-slate-900/60 border-b border-slate-800 px-4 md:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mr-1 shrink-0">Zones</span>
      {GHARPAYY_ZONES.map((z) => {
        const matched = leads.filter((l: any) => zoneForLead(l)?.slug === z.slug);
        const open = matched.filter((l: any) => !["BOOKED", "CLOSED", "LOST"].includes(l.status)).length;
        return (
          <button
            key={z.slug}
            onClick={() => setLocation(`/admin/zone/${z.slug}`)}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold text-slate-200 transition"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: z.color }} />
            {z.display}
            <span className="text-[10px] font-mono text-slate-400">{open}</span>
          </button>
        );
      })}
    </div>
  );
}
