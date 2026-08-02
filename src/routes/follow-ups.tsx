import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ConfidenceBar, IntentChip } from "@/components/atoms";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import { useMountedNow } from "@/hooks/use-now";
import * as apiClient from "@/lib/crm-api-client";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [{ title: "Follow-ups — Gharpayy" }, { name: "description", content: "Daily follow-up queue ranked by deal probability and urgency." }],
  }),
  component: FollowUpsPage,
});

function FollowUpsPage() {
  const { followUps, leads, selectLead } = useApp();
  const [, mounted] = useMountedNow();
  const [followUpsData, setFollowUpsData] = useState<typeof followUps>(followUps);
  const [leadsData, setLeadsData] = useState<typeof leads>(leads);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Load data from API on mount
  useEffect(() => {
    loadDataFromAPI();
  }, []);

  const loadDataFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fus, leads_] = await Promise.all([
        apiClient.getFollowUps(),
        apiClient.getLeads()
      ]);
      setFollowUpsData(fus);
      setLeadsData(leads_);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      toast.error('Failed to load follow-ups: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    setCompletingId(followUpId);
    try {
      await apiClient.completeFollowUp(followUpId);
      // Remove from local state
      setFollowUpsData(prev => prev.filter(f => f.id !== followUpId));
      toast.success("Follow-up marked done");
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete follow-up';
      toast.error('Error: ' + message);
    } finally {
      setCompletingId(null);
    }
  };

  const enriched = useMemo(() => {
    return followUpsData
      .filter((f) => !f.done)
      .map((f) => ({ f, lead: leadsData.find((l) => l.id === f.leadId) }))
      .filter((x) => x.lead);
  }, [followUpsData, leadsData]);

  const overdue = enriched.filter((x) => isPast(new Date(x.f.dueAt)) && !isToday(new Date(x.f.dueAt)));
  const today = enriched.filter((x) => isToday(new Date(x.f.dueAt)));
  const upcoming = enriched.filter((x) => !isPast(new Date(x.f.dueAt)) && !isToday(new Date(x.f.dueAt)));
  const hot = enriched.filter((x) => x.lead!.intent === "hot");

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading follow-ups from API...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive mb-3">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button onClick={loadDataFromAPI} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Follow-up queue</h1>
          <p className="text-sm text-muted-foreground">
            {overdue.length} overdue · {today.length} today · {upcoming.length} upcoming · {hot.length} hot
          </p>
        </header>

        <Bucket
          title="Overdue" tone="destructive" items={overdue}
          mounted={mounted}
          onDone={(id) => handleCompleteFollowUp(id)}
          onOpen={selectLead}
          completing={completingId}
        />
        <Bucket
          title="Today" tone="accent" items={today}
          mounted={mounted}
          onDone={(id) => handleCompleteFollowUp(id)}
          onOpen={selectLead}
          completing={completingId}
        />
        <Bucket
          title="Upcoming" items={upcoming}
          mounted={mounted}
          onDone={(id) => handleCompleteFollowUp(id)}
          onOpen={selectLead}
          completing={completingId}
        />
      </div>
    </AppShell>
  );
}

function Bucket({
  title, items, tone = "default", mounted, onDone, onOpen, completing,
}: {
  title: string;
  items: { f: import("@/lib/types").FollowUp; lead?: import("@/lib/types").Lead }[];
  tone?: "default" | "accent" | "destructive";
  mounted: boolean;
  onDone: (id: string) => void;
  onOpen: (id: string) => void;
  completing?: string | null;
}) {
  const toneCls = {
    default: "border-border",
    accent: "border-accent/30",
    destructive: "border-destructive/30",
  }[tone];
  const titleCls = {
    default: "text-foreground",
    accent: "text-accent",
    destructive: "text-destructive",
  }[tone];

  return (
    <section>
      <h2 className={`font-display text-sm font-semibold mb-2 ${titleCls}`}>{title} <span className="text-muted-foreground font-normal">({items.length})</span></h2>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Nothing here.
        </div>
      ) : (
        <div className={`rounded-xl border ${toneCls} bg-card overflow-hidden divide-y divide-border`}>
          {items.map(({ f, lead }) => (
            <div key={f.id} className="grid grid-cols-12 px-4 py-3 items-center gap-2 hover:bg-accent/5 transition-colors">
              <button onClick={() => onOpen(lead!.id)} className="col-span-3 text-left">
                <div className="font-medium text-sm">{lead!.name}</div>
                <div className="text-[11px] text-muted-foreground">{lead!.phone}</div>
              </button>
              <div className="col-span-2 flex items-center gap-2">
                <IntentChip intent={lead!.intent} />
              </div>
              <div className="col-span-2"><ConfidenceBar value={lead!.confidence} /></div>
              <div className="col-span-3 text-xs">
                <div>{f.reason}</div>
                <div className="text-muted-foreground text-[11px]">{format(new Date(f.dueAt), "MMM d, p")} · {mounted ? formatDistanceToNow(new Date(f.dueAt), { addSuffix: true }) : "—"}</div>
              </div>
              <div className="col-span-2 flex justify-end gap-1.5">
                <Button size="sm" variant="outline" className="h-8" onClick={() => onOpen(lead!.id)}>Open</Button>
                <Button 
                  size="sm" 
                  className="h-8" 
                  onClick={() => onDone(f.id)}
                  disabled={completing === f.id}
                >
                  {completing === f.id ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  {completing === f.id ? 'Saving...' : 'Done'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
