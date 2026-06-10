// @ts-nocheck
import { Link, useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { LayoutDashboard, IndianRupee, Receipt, Wrench, ShieldCheck } from "lucide-react";

const NAV = [
  { to: "/owner", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/owner/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/owner/collections", label: "Collections", icon: Receipt },
  { to: "/owner/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/owner/health", label: "Health", icon: ShieldCheck },
];

export default function OwnerShell({ title, eyebrow, actions, children }: any) {
  const [loc] = useLocation();
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-50">
        <div className="border-b border-amber-200/40 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em] text-amber-700">{eyebrow || "OWNER COMMAND CENTER"}</div>
              <h1 className="font-serif text-2xl sm:text-3xl text-slate-900" style={{ letterSpacing: "-0.02em" }}>{title}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">{actions}</div>
          </div>
          <nav className="px-4 sm:px-6 lg:px-8 pb-2 flex gap-1.5 overflow-x-auto">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = n.exact ? loc === n.to : loc.startsWith(n.to);
              return (
                <Link key={n.to} href={n.to}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${active ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold" : "bg-white border-slate-200 text-slate-600"}`}>
                  <Icon className="w-3.5 h-3.5"/> {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </Layout>
  );
}
