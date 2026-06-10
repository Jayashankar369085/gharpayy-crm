import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { seedDemoCompany, clearDemoData, isDemoLoaded, type SeedReport } from "@/lib/demo/seed-30x600";
import { toast } from "sonner";

export const Route = createFileRoute("/demo-load")({
  head: () => ({
    meta: [
      { title: "Demo Load — 18K leads, 30 users" },
      { name: "description", content: "Seed the CRM with a 30-person company and 18,000 segmented leads for war-room testing." },
    ],
  }),
  component: () => <AppShell><DemoLoad /></AppShell>,
});

function DemoLoad() {
  const [report, setReport] = useState<SeedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isDemoLoaded();
  });

  const run = (count: number) => {
    setLoading(true);
    // Yield so the spinner can paint
    setTimeout(() => {
      try {
        const r = seedDemoCompany(count);
        setReport(r);
        setLoaded(true);
        toast.success(`Seeded ${r.leads.toLocaleString()} leads · ${r.tcms} users · ${r.durationMs}ms`);
      } catch (e) {
        toast.error("Seed failed — check console");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 30);
  };

  const clear = () => {
    clearDemoData(false);
    setReport(null);
    setLoaded(false);
    toast.success("Demo data cleared — original baseline restored");
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="border-b border-border pb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-semibold flex items-center gap-1.5">
          <Database className="h-3 w-3" /> War-room simulation
        </div>
        <h1 className="text-2xl font-display font-semibold">Demo Load · 30 users × 600 leads</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Seeds a fake 30-person company (8 Lead Gen · 8 SDR · 5 Visit Coord · 4 Closers · 3 Ops · 2 Managers) and 18,000 leads with realistic segmentation, funnel distribution, duplicates, spam, no-response, refunds.
        </p>
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex gap-2 text-xs">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-warning">One-tap stress test.</div>
          Loading 18K leads exercises every queue, board, and analytic at scale. Browser stays in client state (zustand) so this is honest UI load, not network load. Clear to restore the original demo baseline.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button size="lg" variant="default" className="h-auto py-4 gap-2 flex-col items-start bg-gradient-to-br from-success to-primary" disabled={loading} onClick={() => run(50)}>
          <div className="flex items-center gap-2 w-full"><Sparkles className="h-4 w-4" /><span className="font-semibold">QA · 50</span></div>
          <span className="text-[10px] opacity-80">Feature test — 50 leads across every stage</span>
        </Button>
        <Button size="lg" variant="default" className="h-auto py-4 gap-2 flex-col items-start" disabled={loading} onClick={() => run(1000)}>
          <div className="flex items-center gap-2 w-full"><Sparkles className="h-4 w-4" /><span className="font-semibold">Light · 1K</span></div>
          <span className="text-[10px] opacity-80">Smoke test — 30 users, 1,000 leads</span>
        </Button>
        <Button size="lg" variant="default" className="h-auto py-4 gap-2 flex-col items-start" disabled={loading} onClick={() => run(5000)}>
          <div className="flex items-center gap-2 w-full"><Sparkles className="h-4 w-4" /><span className="font-semibold">Medium · 5K</span></div>
          <span className="text-[10px] opacity-80">Realistic — 30 users, 5,000 leads</span>
        </Button>
        <Button size="lg" variant="default" className="h-auto py-4 gap-2 flex-col items-start bg-gradient-to-br from-accent to-primary" disabled={loading} onClick={() => run(18000)}>
          <div className="flex items-center gap-2 w-full"><Sparkles className="h-4 w-4" /><span className="font-semibold">Full · 18K</span></div>
          <span className="text-[10px] opacity-80">War-room — 30 users, 18,000 leads</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={loaded ? "bg-success/10 text-success border-success/40" : "bg-muted text-muted-foreground"}>
          {loaded ? "Demo loaded" : "Baseline data"}
        </Badge>
        {loaded && (
          <Button size="sm" variant="outline" onClick={clear} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Clear demo
          </Button>
        )}
      </div>

      {loading && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Seeding… this can take a few seconds for 18K.
        </div>
      )}

      {report && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-display font-semibold">Seed complete</div>
            <Badge variant="outline" className="text-[10px]">{report.durationMs}ms</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
            <Stat label="Users"        value={report.tcms} />
            <Stat label="Leads"        value={report.leads} />
            <Stat label="Tours"        value={report.tours} />
            <Stat label="Follow-ups"   value={report.followUps} />
            <Stat label="Quotations"   value={report.quotes} />
          </div>

          <Section title="By segment" data={report.bySegment} />
          <Section title="By stage"   data={report.byStage} />
          <Section title="By team"    data={report.byTeam} />

          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            Now open <a className="text-primary underline" href="/impact">/impact</a>, <a className="text-primary underline" href="/war-room">/war-room</a>, <a className="text-primary underline" href="/funnel">/funnel</a> and <a className="text-primary underline" href="/leaderboard">/leaderboard</a> to feel the load.
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-display font-semibold">{value.toLocaleString()}</div>
    </div>
  );
}

function Section({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, n]) => a + n, 0) || 1;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{title}</div>
      <div className="space-y-1">
        {entries.map(([k, v]) => {
          const pct = Math.round((v / total) * 100);
          return (
            <div key={k} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium">{k}</span>
                <span className="font-mono text-muted-foreground">{v.toLocaleString()} · {pct}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}