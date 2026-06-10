// @ts-nocheck
import { useMemo, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  ChevronLeft, MessageCircle, Phone, Mail, Bell, AlertTriangle, FileText, Wrench, Plus,
  Star, Calendar, IndianRupee, TrendingUp, TrendingDown, Edit3, Save, X, FileSignature,
  CheckCircle2, Clock, Activity, Trash2, Sparkles,
} from "lucide-react";
import BookOSShell, { KPI, StatusChip, GoldBtn, OutlineBtn, EmptyState } from "@/referral-app/components/bookos/Shell";
import {
  TenantsDB, RentsDB, BookingsDB, MaintenanceDB, PaymentsDB, NotificationsDB, ActivityDB, useStore,
} from "@/referral-app/lib/bookos/store";
import { fmt, fmtShort, waLink, timeAgo } from "@/referral-app/lib/bookos/format";

function metrics(t: any, rents: any[]) {
  const mine = rents.filter((r: any) => r.tenantName === t.name);
  const paid = mine.filter((r: any) => r.status === "paid").length;
  const overdue = mine.filter((r: any) => r.status === "overdue").length;
  const pending = mine.filter((r: any) => r.status === "pending").length;
  const total = mine.length || 1;
  const onTime = Math.round((paid / total) * 100);
  const lifetime = mine.filter((r: any) => r.status === "paid").reduce((a: number, b: any) => a + b.amount, 0);
  const dues = mine.filter((r: any) => r.status !== "paid").reduce((a: number, b: any) => a + b.amount, 0);
  const tenureDays = Math.max(0, Math.floor((Date.now() - +new Date(t.createdAt)) / 86400000));
  const tenureMonths = Math.max(1, Math.round(tenureDays / 30));
  let score = 50 + Math.round(onTime * 0.4) - overdue * 12 - pending * 4;
  if (t.status === "notice") score -= 15;
  if (t.status === "exited") score = 0;
  score = Math.max(0, Math.min(100, score));
  return { onTime, lifetime, dues, tenureDays, tenureMonths, overdue, pending, paid, total: mine.length, score };
}

export default function TenantDetail() {
  const { id } = useParams() as any;
  const [, setLocation] = useLocation();
  const t = useStore(() => TenantsDB.get(id));
  const rents = useStore(() => RentsDB.all().filter((r: any) => r.tenantName === (t?.name || "")));
  const bookings = useStore(() => BookingsDB.all().filter((b: any) => b.tenantName === (t?.name || "")));
  const tickets = useStore(() => MaintenanceDB.all().filter((m: any) => m.roomNumber === (t?.roomNumber || "") && m.propertyName === (t?.propertyName || "")));
  const activity = useStore(() => ActivityDB.all().filter((a: any) => a.meta?.name === (t?.name || "") || a.entityId === id).slice(0, 30));

  const [tab, setTab] = useState<"overview" | "ledger" | "comms" | "docs" | "activity">("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>(t || {});
  const [note, setNote] = useState("");

  if (!t) return (
    <BookOSShell title="Tenant not found">
      <Link href="/manager/bookos/tenants" className="text-amber-700">← Back to tenants</Link>
    </BookOSShell>
  );

  const m = useMemo(() => metrics(t, rents), [t, rents]);

  const markRentPaid = (r: any) => {
    const now = new Date().toISOString();
    RentsDB.update(r.id, { status: "paid", paidAt: now, ref: "MANUAL-" + Date.now().toString(36).slice(-6).toUpperCase() });
    PaymentsDB.create({ tenantName: t.name, amount: r.amount, method: "UPI", type: "rent", createdAt: now } as any);
    ActivityDB.create({ action: "rent_paid", entity: "rent", entityId: r.id, meta: { name: t.name, month: r.month, amount: r.amount }, createdAt: now });
    NotificationsDB.create({ title: "Rent received", body: `${t.name} · ${r.month} · ${fmt(r.amount)}`, kind: "success", read: false, createdAt: now, link: `/manager/bookos/tenants/${id}` });
  };

  const sendReminder = () => {
    const now = new Date().toISOString();
    NotificationsDB.create({ title: "Reminder sent", body: `Rent reminder → ${t.name}`, kind: "info", read: false, createdAt: now });
    ActivityDB.create({ action: "tenant_reminded", entity: "tenant", entityId: id, meta: { name: t.name }, createdAt: now });
  };

  const changeStatus = (status: string) => {
    if (!confirm(`Mark ${t.name} as "${status}"?`)) return;
    const now = new Date().toISOString();
    TenantsDB.update(id, { status });
    ActivityDB.create({ action: "tenant_status", entity: "tenant", entityId: id, meta: { name: t.name, status }, createdAt: now });
    NotificationsDB.create({ title: `Tenant ${status}`, body: t.name, kind: status === "exited" ? "warn" : "info", read: false, createdAt: now });
  };

  const raiseTicket = () => {
    const title = prompt("Maintenance issue?");
    if (!title) return;
    const now = new Date().toISOString();
    MaintenanceDB.create({ title, propertyName: t.propertyName, roomNumber: t.roomNumber, priority: "med", status: "open", createdAt: now } as any);
    ActivityDB.create({ action: "ticket_created", entity: "maintenance", entityId: id, meta: { name: t.name, title }, createdAt: now });
  };

  const addNote = () => {
    if (!note.trim()) return;
    const now = new Date().toISOString();
    const existing = (t.notes || "").trim();
    const stamped = `[${new Date().toLocaleString("en-IN", { hour12: false })}] ${note.trim()}`;
    TenantsDB.update(id, { notes: existing ? `${existing}\n${stamped}` : stamped });
    ActivityDB.create({ action: "note_added", entity: "tenant", entityId: id, meta: { name: t.name }, createdAt: now });
    setNote("");
  };

  const saveEdit = () => {
    TenantsDB.update(id, {
      name: draft.name, phone: draft.phone, email: draft.email,
      propertyName: draft.propertyName, roomNumber: draft.roomNumber,
      rent: Number(draft.rent) || 0, deposit: Number(draft.deposit) || 0,
      moveInDate: draft.moveInDate,
    });
    setEditing(false);
  };

  const removeTenant = () => {
    if (!confirm(`Permanently delete tenant ${t.name}? This won't delete bookings.`)) return;
    TenantsDB.del(id);
    setLocation("/manager/bookos/tenants");
  };

  const scoreTone = m.score >= 75 ? "from-emerald-500 to-emerald-600 text-white" : m.score >= 50 ? "from-amber-500 to-amber-600 text-white" : "from-rose-500 to-rose-600 text-white";
  const scoreLabel = m.score >= 75 ? "Healthy" : m.score >= 50 ? "Watch" : "At risk";

  return (
    <BookOSShell eyebrow="TENANT" title={t.name}
      actions={
        <>
          <a href={`tel:${t.phone}`}><OutlineBtn><Phone className="w-4 h-4" /> Call</OutlineBtn></a>
          <a href={waLink(t.phone, `Hi ${t.name},`)} target="_blank" rel="noreferrer"><OutlineBtn><MessageCircle className="w-4 h-4" /> WhatsApp</OutlineBtn></a>
          <Link href="/manager/bookos/tenants"><OutlineBtn><ChevronLeft className="w-4 h-4" /> Back</OutlineBtn></Link>
        </>
      }>

      {/* HERO */}
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 mb-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 grid place-items-center text-2xl font-bold shrink-0 shadow-md">
            {(t.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-2xl text-slate-900">{t.name}</h2>
              <StatusChip status={t.status} />
              {m.score >= 85 && m.lifetime > 50000 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  <Star className="w-3 h-3 fill-amber-700" /> VIP
                </span>
              )}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              {t.propertyName} · Room <b>{t.roomNumber || "—"}</b> · since <b>{m.tenureMonths}mo</b>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{t.phone}{t.email ? ` · ${t.email}` : ""}</div>
          </div>
          <div className={`rounded-2xl bg-gradient-to-br ${scoreTone} px-5 py-3 text-center shrink-0 shadow-md`}>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">Health</div>
            <div className="text-3xl font-bold tabular-nums">{m.score}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">{scoreLabel}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <KPI label="Monthly rent" value={fmt(t.rent)} />
          <KPI accent label="Lifetime value" value={fmtShort(m.lifetime)} sub={`${m.paid} months paid`} />
          <KPI label="On-time %" value={m.onTime + "%"} sub={`${m.overdue} overdue · ${m.pending} pending`} />
          <KPI label="Outstanding" value={m.dues > 0 ? fmtShort(m.dues) : "—"} sub="dues" />
          <KPI label="Deposit held" value={fmt(t.deposit)} sub={t.moveInDate ? `Since ${t.moveInDate}` : ""} />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={sendReminder} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-50">
          <Bell className="w-3.5 h-3.5" /> Send rent reminder
        </button>
        <button onClick={raiseTicket} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-50">
          <Wrench className="w-3.5 h-3.5" /> Raise ticket
        </button>
        {t.status !== "notice" && (
          <button onClick={() => changeStatus("notice")} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-amber-200 bg-white hover:bg-amber-50">
            <AlertTriangle className="w-3.5 h-3.5" /> Mark on notice
          </button>
        )}
        {t.status !== "active" && (
          <button onClick={() => changeStatus("active")} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark active
          </button>
        )}
        {t.status !== "exited" && (
          <button onClick={() => changeStatus("exited")} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
            <X className="w-3.5 h-3.5" /> Mark exited
          </button>
        )}
        <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
          <Edit3 className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={removeTenant} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-4 border-b border-amber-200 overflow-x-auto scrollbar-hide">
        {[
          { id: "overview", label: "Overview" },
          { id: "ledger", label: `Rent ledger (${m.total})` },
          { id: "comms", label: "Notes" },
          { id: "docs", label: "Documents" },
          { id: "activity", label: `Activity (${activity.length})` },
        ].map((x) => (
          <button key={x.id} onClick={() => setTab(x.id as any)}
            className={`shrink-0 text-sm px-4 py-2 -mb-px font-semibold transition-colors ${tab === x.id ? "text-amber-700 border-b-2 border-amber-600" : "text-slate-500 hover:text-slate-700"}`}>
            {x.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="font-serif text-lg mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-600" /> Snapshot</div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Field icon={Phone} label="Phone" value={t.phone} />
                <Field icon={Mail} label="Email" value={t.email || "—"} />
                <Field icon={Calendar} label="Move-in" value={t.moveInDate || "—"} />
                <Field icon={Clock} label="Tenure" value={`${m.tenureMonths} months (${m.tenureDays}d)`} />
                <Field icon={IndianRupee} label="Monthly rent" value={fmt(t.rent)} />
                <Field icon={IndianRupee} label="Deposit" value={fmt(t.deposit)} />
              </div>
            </div>

            {/* Linked bookings */}
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="font-serif text-lg mb-2">Linked bookings ({bookings.length})</div>
              {!bookings.length ? <div className="text-sm text-slate-400 italic">No bookings linked.</div> : (
                <div className="space-y-2">
                  {bookings.map((b: any) => (
                    <Link key={b.id} href={`/manager/bookos/bookings/${b.id}`} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40">
                      <div className="text-sm">
                        <div className="font-semibold text-slate-900">{b.propertyName} · {b.roomNumber || "—"}</div>
                        <div className="text-xs text-slate-500">{timeAgo(b.createdAt)} · token {fmt(b.tokenAmount)}</div>
                      </div>
                      <StatusChip status={b.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets */}
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="font-serif text-lg mb-2 flex items-center justify-between">
                <span>Maintenance ({tickets.length})</span>
                <button onClick={raiseTicket} className="text-xs font-semibold text-amber-700 inline-flex items-center gap-1"><Plus className="w-3 h-3" /> New</button>
              </div>
              {!tickets.length ? <div className="text-sm text-slate-400 italic">No tickets for this room.</div> : (
                <div className="space-y-2">
                  {tickets.map((tk: any) => (
                    <div key={tk.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-sm">
                      <div>
                        <div className="font-semibold text-slate-900">{tk.title}</div>
                        <div className="text-xs text-slate-500">{timeAgo(tk.createdAt)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip status={tk.priority} />
                        <StatusChip status={tk.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lifecycle timeline */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="font-serif text-lg mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-600" /> Lifecycle</div>
              <div className="relative pl-5 space-y-3">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gradient-to-b from-amber-300 via-amber-200 to-transparent" />
                <TimelineDot color="emerald" title="Onboarded" sub={t.moveInDate || timeAgo(t.createdAt)} />
                {m.paid > 0 && <TimelineDot color="emerald" title={`${m.paid} rent payments`} sub={fmtShort(m.lifetime)} />}
                {m.overdue > 0 && <TimelineDot color="rose" title={`${m.overdue} overdue month${m.overdue > 1 ? "s" : ""}`} sub={fmtShort(m.dues) + " owed"} />}
                {t.status === "notice" && <TimelineDot color="amber" title="On notice" sub="exit pending" />}
                {t.status === "exited" && <TimelineDot color="slate" title="Exited" />}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/50 p-5">
              <div className="font-serif text-lg mb-2">Renewal lens</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Likelihood</div>
              <div className="text-3xl font-bold text-amber-700 mt-0.5">{m.score >= 75 ? "High" : m.score >= 50 ? "Medium" : "Low"}</div>
              <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                {m.score >= 75 ? "Strong on-time history. Offer loyalty discount on renewal." : m.score >= 50 ? "Mixed signals. Schedule a check-in this week." : "Risk of churn. Personal call recommended."}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "ledger" && (
        <div className="rounded-2xl border border-amber-200 bg-white/80 overflow-hidden">
          {!rents.length ? <EmptyState title="No rent records yet" /> : (
            <table className="w-full text-sm">
              <thead className="bg-amber-50 text-[10px] uppercase tracking-wider text-slate-600">
                <tr><th className="text-left px-4 py-2">Month</th><th className="text-right px-4 py-2">Amount</th><th className="text-center px-4 py-2">Status</th><th className="text-left px-4 py-2">Paid on</th><th className="text-left px-4 py-2">Ref</th><th className="px-4 py-2"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rents.map((r: any) => (
                  <tr key={r.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-2.5 font-semibold">{r.month}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{fmt(r.amount)}</td>
                    <td className="px-4 py-2.5 text-center"><StatusChip status={r.status} /></td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{r.paidAt ? new Date(r.paidAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-500">{r.ref || "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      {r.status !== "paid" && (
                        <button onClick={() => markRentPaid(r)} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Mark paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "comms" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <div className="flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Add a note — pinned to tenant record…"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400" />
              <GoldBtn onClick={addNote}><Plus className="w-4 h-4" /> Add</GoldBtn>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            {!t.notes ? (
              <div className="text-sm text-slate-400 italic">No notes yet. Notes capture context like preferences, complaints, payment promises.</div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">{t.notes}</pre>
            )}
          </div>
        </div>
      )}

      {tab === "docs" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Aadhaar / ID proof", icon: FileSignature },
            { name: "Rental agreement", icon: FileText },
            { name: "Police verification", icon: FileSignature },
            { name: "Move-in photos", icon: FileText },
            { name: "Deposit receipt", icon: FileText },
          ].map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.name} className="rounded-2xl border-2 border-dashed border-amber-200 bg-white/60 p-5 text-center">
                <Icon className="w-6 h-6 mx-auto text-amber-600 mb-2" />
                <div className="text-sm font-semibold text-slate-800">{d.name}</div>
                <div className="text-xs text-slate-500 mt-1">Not uploaded</div>
                <button className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200">Upload</button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-2xl border border-amber-200 bg-white/80 p-4 space-y-2">
          {!activity.length ? <EmptyState title="No activity recorded" /> : activity.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 p-2 hover:bg-amber-50/40 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{a.action.replace(/_/g, " ")}</div>
                <div className="text-xs text-slate-500">{a.meta?.month && `${a.meta.month} · `}{a.meta?.amount && fmt(a.meta.amount)}</div>
              </div>
              <div className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-3xl border border-amber-200 max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-serif text-xl text-slate-900">Edit tenant</div>
              <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["name", "Name", "text"], ["phone", "Phone", "tel"], ["email", "Email", "email"],
                ["propertyName", "Property", "text"], ["roomNumber", "Room", "text"],
                ["rent", "Rent", "number"], ["deposit", "Deposit", "number"], ["moveInDate", "Move-in", "date"],
              ].map(([k, lbl, type]: any) => (
                <label key={k} className={k === "name" || k === "propertyName" ? "col-span-2" : ""}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{lbl}</div>
                  <input type={type} value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400" />
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <GoldBtn onClick={saveEdit} className="flex-1 justify-center"><Save className="w-4 h-4" /> Save</GoldBtn>
              <OutlineBtn onClick={() => setEditing(false)}>Cancel</OutlineBtn>
            </div>
          </div>
        </div>
      )}
    </BookOSShell>
  );
}

function Field({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
        <div className="font-semibold text-slate-800 truncate">{value}</div>
      </div>
    </div>
  );
}

function TimelineDot({ color, title, sub }: any) {
  const c: any = { emerald: "bg-emerald-500", rose: "bg-rose-500", amber: "bg-amber-500", slate: "bg-slate-400" };
  return (
    <div className="relative">
      <div className={`absolute -left-[14px] top-1.5 w-2.5 h-2.5 rounded-full ${c[color]} ring-2 ring-white`} />
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
