// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Download, Plus, Search, MessageCircle, Phone, Bell, AlertTriangle,
  Filter, Grid3x3, List, ChevronDown, Star, TrendingUp, Users, Sparkles, ArrowUpDown,
} from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import { TenantsDB, RentsDB, BookingsDB, NotificationsDB, ActivityDB, useStore } from "@/referral-app/lib/bookos/store";
import { fmt, fmtShort, csv, downloadFile, timeAgo, waLink } from "@/referral-app/lib/bookos/format";

// Tenant health/rent score derived from rent ledger
function tenantMetrics(t: any, rents: any[]) {
  const mine = rents.filter((r: any) => r.tenantName === t.name);
  const paid = mine.filter((r: any) => r.status === "paid").length;
  const overdue = mine.filter((r: any) => r.status === "overdue").length;
  const pending = mine.filter((r: any) => r.status === "pending").length;
  const total = mine.length || 1;
  const onTime = Math.round((paid / total) * 100);
  const lifetime = mine.filter((r: any) => r.status === "paid").reduce((a: number, b: any) => a + b.amount, 0);
  const dues = mine.filter((r: any) => r.status !== "paid").reduce((a: number, b: any) => a + b.amount, 0);
  const tenureDays = Math.max(0, Math.floor((Date.now() - +new Date(t.createdAt)) / 86400000));
  // 0..100 health
  let score = 50;
  score += Math.round(onTime * 0.4);
  score -= overdue * 12;
  score -= pending * 4;
  if (t.status === "notice") score -= 15;
  if (t.status === "exited") score = 0;
  score = Math.max(0, Math.min(100, score));
  return { onTime, lifetime, dues, tenureDays, overdue, pending, paid, score };
}

const SEGMENTS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "notice", label: "On notice" },
  { id: "exited", label: "Exited" },
  { id: "overdue", label: "Has overdue", tone: "rose" },
  { id: "vip", label: "VIP", tone: "amber" },
  { id: "new", label: "New (≤30d)" },
];

export default function TenantsList() {
  const [, setLocation] = useLocation();
  const tenants = useStore(() => TenantsDB.all());
  const rents = useStore(() => RentsDB.all());
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"recent" | "rent" | "score" | "dues" | "name">("recent");
  const [sel, setSel] = useState<string[]>([]);

  const enriched = useMemo(() => tenants.map((t: any) => ({ ...t, m: tenantMetrics(t, rents) })), [tenants, rents]);

  const filtered = useMemo(() => {
    let rows = enriched;
    if (q.trim()) {
      const s = q.toLowerCase();
      rows = rows.filter((t: any) =>
        t.name.toLowerCase().includes(s) || t.phone.includes(s) ||
        (t.propertyName || "").toLowerCase().includes(s) || (t.roomNumber || "").toLowerCase().includes(s),
      );
    }
    if (seg === "active" || seg === "notice" || seg === "exited") rows = rows.filter((t: any) => t.status === seg);
    if (seg === "overdue") rows = rows.filter((t: any) => t.m.overdue > 0);
    if (seg === "vip") rows = rows.filter((t: any) => t.m.score >= 85 && t.m.lifetime > 50000);
    if (seg === "new") rows = rows.filter((t: any) => t.m.tenureDays <= 30);
    const sorters: any = {
      recent: (a: any, b: any) => +new Date(b.createdAt) - +new Date(a.createdAt),
      rent: (a: any, b: any) => b.rent - a.rent,
      score: (a: any, b: any) => b.m.score - a.m.score,
      dues: (a: any, b: any) => b.m.dues - a.m.dues,
      name: (a: any, b: any) => a.name.localeCompare(b.name),
    };
    return [...rows].sort(sorters[sortBy]);
  }, [enriched, q, seg, sortBy]);

  const totals = useMemo(() => {
    const active = enriched.filter((t: any) => t.status === "active");
    const mrr = active.reduce((a: number, b: any) => a + (b.rent || 0), 0);
    const avgTenure = enriched.length ? Math.round(enriched.reduce((a: number, b: any) => a + b.m.tenureDays, 0) / enriched.length) : 0;
    const atRisk = enriched.filter((t: any) => t.m.score < 50 && t.status !== "exited").length;
    const ltvSum = enriched.reduce((a: number, b: any) => a + b.m.lifetime, 0);
    return { active: active.length, mrr, avgTenure, atRisk, ltvSum };
  }, [enriched]);

  const toggle = (id: string) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const allChecked = filtered.length > 0 && filtered.every((t: any) => sel.includes(t.id));
  const toggleAll = () => setSel(allChecked ? [] : filtered.map((t: any) => t.id));

  const bulkRemind = () => {
    if (!sel.length) return;
    const now = new Date().toISOString();
    sel.forEach((id) => {
      const t = tenants.find((x: any) => x.id === id);
      if (!t) return;
      NotificationsDB.create({ title: "Reminder sent", body: `Rent reminder → ${t.name}`, kind: "info", read: false, createdAt: now });
      ActivityDB.create({ action: "tenant_reminded", entity: "tenant", entityId: id, meta: { name: t.name }, createdAt: now });
    });
    setSel([]);
  };
  const bulkNotice = () => {
    if (!sel.length || !confirm(`Mark ${sel.length} tenant(s) on notice?`)) return;
    sel.forEach((id) => TenantsDB.update(id, { status: "notice" }));
    setSel([]);
  };

  return (
    <BookOSShell eyebrow="PEOPLE" title="Tenants"
      actions={
        <>
          <OutlineBtn onClick={() => downloadFile("tenants.csv", csv(filtered.map(({ m, ...t }: any) => t)))}>
            <Download className="w-4 h-4" /> CSV
          </OutlineBtn>
          <Link href="/manager/bookos/bookings/new"><GoldBtn><Plus className="w-4 h-4" /> Onboard tenant</GoldBtn></Link>
        </>
      }>
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <KPI accent label="Total" value={enriched.length} sub={`${totals.active} active`} />
        <KPI label="Monthly MRR" value={fmtShort(totals.mrr)} sub="active only" />
        <KPI label="Avg tenure" value={totals.avgTenure + "d"} sub="all tenants" />
        <KPI label="At-risk" value={totals.atRisk} sub="score < 50" />
        <KPI label="Lifetime value" value={fmtShort(totals.ltvSum)} sub="all collected" />
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-amber-200 bg-white/80 backdrop-blur p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, property, room…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-400" />
        </div>
        <div className="relative">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none pl-8 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium">
            <option value="recent">Newest first</option>
            <option value="score">Health score ↓</option>
            <option value="rent">Rent ↓</option>
            <option value="dues">Dues ↓</option>
            <option value="name">Name A–Z</option>
          </select>
          <ArrowUpDown className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button onClick={() => setView("list")} className={`px-2.5 py-2 ${view === "list" ? "bg-amber-100 text-amber-800" : "text-slate-500"}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setView("grid")} className={`px-2.5 py-2 ${view === "grid" ? "bg-amber-100 text-amber-800" : "text-slate-500"}`}><Grid3x3 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Segments */}
      <div className="flex gap-1.5 overflow-x-auto mb-4 scrollbar-hide">
        {SEGMENTS.map((s) => {
          const active = seg === s.id;
          const tone = s.tone === "rose" ? "border-rose-300 text-rose-700 bg-rose-50"
            : s.tone === "amber" ? "border-amber-300 text-amber-800 bg-amber-50"
            : "border-slate-200 text-slate-600 bg-white";
          return (
            <button key={s.id} onClick={() => setSeg(s.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${active ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 font-semibold shadow-sm" : tone + " hover:border-amber-300"}`}>
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Bulk bar */}
      {sel.length > 0 && (
        <div className="mb-3 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-white p-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-amber-900 px-2">{sel.length} selected</span>
          <button onClick={bulkRemind} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 inline-flex items-center gap-1"><Bell className="w-3 h-3" /> Send rent reminder</button>
          <button onClick={bulkNotice} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-200 hover:bg-amber-50 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Mark on notice</button>
          <button onClick={() => setSel([])} className="ml-auto text-xs text-slate-500 px-2">Clear</button>
        </div>
      )}

      {!filtered.length ? (
        <EmptyState title={q || seg !== "all" ? "No matches" : "No tenants yet"}
          hint={q || seg !== "all" ? "Try a different filter." : "Tenants are auto-created when a booking is paid."} />
      ) : view === "list" ? (
        <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-amber-50 to-white text-[10px] uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3 py-2 w-8"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                <th className="px-3 py-2 text-left">Tenant</th>
                <th className="px-3 py-2 text-left hidden md:table-cell">Property</th>
                <th className="px-3 py-2 text-right">Rent</th>
                <th className="px-3 py-2 hidden lg:table-cell">Health</th>
                <th className="px-3 py-2 text-right hidden lg:table-cell">LTV</th>
                <th className="px-3 py-2 text-right hidden md:table-cell">Dues</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 hidden xl:table-cell">Tenure</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t: any) => (
                <tr key={t.id} className={`hover:bg-amber-50/40 transition-colors ${sel.includes(t.id) ? "bg-amber-50/60" : ""}`}>
                  <td className="px-3 py-2.5"><input type="checkbox" checked={sel.includes(t.id)} onChange={() => toggle(t.id)} /></td>
                  <td className="px-3 py-2.5">
                    <Link href={"/manager/bookos/tenants/" + t.id} className="flex items-center gap-2.5 group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 grid place-items-center text-xs font-bold shrink-0">
                        {(t.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-amber-700 truncate flex items-center gap-1">
                          {t.name}
                          {t.m.score >= 85 && t.m.lifetime > 50000 && <Star className="w-3 h-3 fill-amber-400 text-amber-500" />}
                        </div>
                        <div className="text-xs text-slate-500">{t.phone}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-slate-700">
                    <div className="truncate max-w-[180px]">{t.propertyName}</div>
                    <div className="text-xs text-slate-500">Room {t.roomNumber || "—"}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmt(t.rent)}</td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <HealthBar score={t.m.score} />
                  </td>
                  <td className="px-3 py-2.5 text-right hidden lg:table-cell text-slate-700 tabular-nums">{fmtShort(t.m.lifetime)}</td>
                  <td className="px-3 py-2.5 text-right hidden md:table-cell tabular-nums">
                    {t.m.dues > 0 ? <span className="text-rose-700 font-semibold">{fmtShort(t.m.dues)}</span> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center"><StatusChip status={t.status} /></td>
                  <td className="px-3 py-2.5 hidden xl:table-cell text-xs text-slate-500">{t.m.tenureDays}d</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <a href={`tel:${t.phone}`} onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Phone className="w-3.5 h-3.5" /></a>
                      <a href={waLink(t.phone, `Hi ${t.name}, just a friendly check-in from Gharpayy.`)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700"><MessageCircle className="w-3.5 h-3.5" /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t: any) => (
            <Link key={t.id} href={"/manager/bookos/tenants/" + t.id}
              className="rounded-2xl border border-amber-200 bg-white/80 p-4 hover:border-amber-400 hover:shadow-md transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 grid place-items-center font-bold shrink-0">
                  {(t.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                    {t.name}
                    {t.m.score >= 85 && t.m.lifetime > 50000 && <Star className="w-3 h-3 fill-amber-400 text-amber-500" />}
                  </div>
                  <div className="text-xs text-slate-500">{t.phone}</div>
                </div>
                <StatusChip status={t.status} />
              </div>
              <div className="text-xs text-slate-600 mb-2 truncate">{t.propertyName} · Room {t.roomNumber || "—"}</div>
              <HealthBar score={t.m.score} />
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Rent</div><div className="text-sm font-bold">{fmtShort(t.rent)}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">LTV</div><div className="text-sm font-bold">{fmtShort(t.m.lifetime)}</div></div>
                <div><div className="text-[10px] text-slate-500 uppercase tracking-wider">Dues</div><div className={`text-sm font-bold ${t.m.dues > 0 ? "text-rose-700" : "text-slate-400"}`}>{t.m.dues > 0 ? fmtShort(t.m.dues) : "—"}</div></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BookOSShell>
  );
}

function HealthBar({ score }: { score: number }) {
  const tone = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Watch" : "At risk";
  const labelTone = score >= 75 ? "text-emerald-700" : score >= 50 ? "text-amber-700" : "text-rose-700";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full ${tone} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-[10px] font-bold tabular-nums ${labelTone}`}>{score}</span>
      <span className={`text-[9px] uppercase tracking-wider hidden xl:inline ${labelTone}`}>{label}</span>
    </div>
  );
}
