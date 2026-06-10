// @ts-nocheck
import { useState, useEffect } from "react";
import { useAppStore } from "@/referral-app/lib/store";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/referral-app/hooks/use-toast";
import { Calendar, MapPin, Clock, CheckCircle2, XCircle, Plus, Building2 } from "lucide-react";
import { PageHeader } from "@/referral-app/components/page-header";

interface Visit {
  id: number;
  propertyId: number;
  propertyName: string;
  visitorName: string;
  visitorPhone: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
}

export default function VisitsPage() {
  const { referrer } = useAppStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    propertyId: 1, propertyName: "Sunrise PG Koramangala",
    visitorName: "", visitorPhone: "", scheduledAt: "", notes: "",
  });
  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    if (!referrer) { setLocation("/"); return; }
    fetch(`${BASE}/api/visits/${referrer.id}`)
      .then(r => r.json()).then(d => setVisits(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [referrer]);

  const handleBook = async () => {
    if (!referrer || !form.visitorName || !form.scheduledAt) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referrerId: referrer.id }),
      });
      if (res.ok) {
        const visit = await res.json();
        setVisits(prev => [visit, ...prev]);
        setShowForm(false);
        toast({ title: "✅ Visit Scheduled!", description: `Visit booked for ${new Date(form.scheduledAt).toLocaleDateString()}` });
        setForm({ propertyId: 1, propertyName: "Sunrise PG Koramangala", visitorName: "", visitorPhone: "", scheduledAt: "", notes: "" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (visitId: number) => {
    await fetch(`${BASE}/api/visits/${visitId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status: "CANCELLED" } : v));
    toast({ title: "Visit cancelled" });
  };

  const statusColor = (s: string) => ({
    SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
    CONFIRMED: "bg-green-100 text-green-700 border-green-200",
    COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
  }[s] || "bg-muted text-muted-foreground border-border");

  const PROPERTIES = [
    { id: 1, name: "Sunrise PG Koramangala", area: "Koramangala" },
    { id: 2, name: "Green Valley PG HSR", area: "HSR Layout" },
    { id: 3, name: "Tech Hub PG Marathahalli", area: "Marathahalli" },
    { id: 5, name: "Student Corner BTM", area: "BTM Layout" },
    { id: 7, name: "Cozy Nest Electronic City", area: "Electronic City" },
    { id: 8, name: "Sky View PG Bellandur", area: "Bellandur" },
  ];

  if (!referrer) return null;

  return (
    <Layout>
      <PageHeader title="Site Visits" subtitle="Schedule and track property visits for your leads" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black font-display flex items-center gap-2">
              <Calendar className="w-8 h-8 text-primary" /> Site Visits
            </h1>
            <p className="text-muted-foreground mt-1">Schedule PG site visits for your referrals</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Book Visit
          </button>
        </div>

        {/* Book visit form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="bg-card border border-border rounded-2xl p-5 space-y-4 overflow-hidden"
            >
              <h3 className="font-bold text-foreground">📅 Schedule a Visit</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Select PG</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                    value={form.propertyId}
                    onChange={e => {
                      const p = PROPERTIES.find(p => p.id === Number(e.target.value));
                      setForm(f => ({ ...f, propertyId: Number(e.target.value), propertyName: p?.name || "" }));
                    }}
                  >
                    {PROPERTIES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Visitor Name</label>
                  <input placeholder="Name of visitor" value={form.visitorName}
                    onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Phone</label>
                  <input placeholder="10-digit number" value={form.visitorPhone}
                    onChange={e => setForm(f => ({ ...f, visitorPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Date & Time</label>
                  <input type="datetime-local" value={form.scheduledAt}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1 block">Notes (optional)</label>
                  <input placeholder="Any special requests..." value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
              </div>
              <button onClick={handleBook} disabled={!form.visitorName || !form.scheduledAt || submitting}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting ? "Booking..." : "📅 Confirm Visit"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visits list */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}</div>
        ) : visits.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <p className="text-5xl mb-4">🏠</p>
            <p className="font-bold text-foreground">No visits scheduled</p>
            <p className="text-sm text-muted-foreground mt-1">Book a PG site visit for your referrals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit, i) => (
              <motion.div key={visit.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-foreground">{visit.propertyName}</p>
                      <p className="text-sm text-muted-foreground">{visit.visitorName} · {visit.visitorPhone}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${statusColor(visit.status)}`}>
                    {visit.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  {new Date(visit.scheduledAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                {visit.notes && <p className="text-xs text-muted-foreground italic px-1">{visit.notes}</p>}
                {visit.status === "SCHEDULED" && (
                  <button onClick={() => handleCancel(visit.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Cancel visit
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
