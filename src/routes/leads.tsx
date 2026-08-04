import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { ConfidenceBar, IntentChip, StageBadge } from "@/components/atoms";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import type { LeadStage } from "@/lib/types";
import { useMountedNow } from "@/hooks/use-now";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import * as apiClient from "@/lib/crm-api-client";
import { toast } from "sonner";
import { AddLeadModal } from "@/components/leads/AddLeadModal";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [{ title: "Leads — Gharpayy" }, { name: "description", content: "Every lead, ranked by deal probability, one click into the control panel." }],
  }),
  component: LeadsPage,
});

function LeadsPage() {
  const { leads, tcms, selectLead, leads: storeLeads } = useApp();
  const [, mounted] = useMountedNow();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"confidence" | "moveIn" | "updated">("confidence");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Load leads from API on mount
  useEffect(() => {
    loadLeadsFromAPI();
  }, []);

  const loadLeadsFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const leadsData = await apiClient.getLeads();
      // Update local state with API data
      setLeadsData(leadsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load leads';
      setError(message);
      toast.error('Failed to load leads: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const [leadsData, setLeadsData] = useState<typeof leads>(leads);

  const filtered = useMemo(() => {
    const list = leadsData.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q.toLowerCase()) && !l.phone.includes(q)) return false;
      if (stage !== "all" && l.stage !== stage) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sortBy === "confidence") return b.confidence - a.confidence;
      if (sortBy === "moveIn") return +new Date(a.moveInDate) - +new Date(b.moveInDate);
      return +new Date(b.updatedAt) - +new Date(a.updatedAt);
    });
    return list;
  }, [leadsData, q, stage, sortBy]);

  return (
    <AppShell>
      <div className="space-y-4">
        <header className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Leads</h1>
            {loading ? (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading from API...
              </p>
            ) : error ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{filtered.length} of {leadsData.length} · ranked by deal probability</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setShowAddLeadModal(true)}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone…" className="h-9 w-56 text-sm" />
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {(["new","contacted","tour-scheduled","tour-done","negotiation","booked","dropped"] as LeadStage[]).map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace("-", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confidence">Sort: Confidence</SelectItem>
                <SelectItem value="moveIn">Sort: Move-in date</SelectItem>
                <SelectItem value="updated">Sort: Last updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {loading ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Fetching leads from API...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
            <Button onClick={loadLeadsFromAPI} variant="outline" size="sm" className="mt-3">
              Retry
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border bg-muted/40">
              <div className="col-span-3">Lead</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">Intent · score</div>
              <div className="col-span-2">Area · budget</div>
              <div className="col-span-2">Assigned</div>
              <div className="col-span-1 text-right">Updated</div>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((l) => {
                const tcm = tcms.find((t) => t.id === l.assignedTcmId);
                return (
                  <div key={l.id}>
                    <button
                      onClick={() => selectLead(l.id)}
                      className="w-full text-left grid grid-cols-12 px-4 py-3 items-center hover:bg-accent/5 transition-colors"
                    >
                      <div className="col-span-3">
                        <div className="font-medium text-sm">{l.name}</div>
                        <div className="text-[11px] text-muted-foreground">{l.phone} · {l.source}</div>
                      </div>
                      <div className="col-span-2"><StageBadge stage={l.stage} /></div>
                      <div className="col-span-2 flex items-center gap-2">
                        <IntentChip intent={l.intent} />
                        <ConfidenceBar value={l.confidence} />
                      </div>
                      <div className="col-span-2 text-xs">
                        <div>{l.preferredArea}</div>
                        <div className="text-muted-foreground">₹{(l.budget / 1000).toFixed(0)}k</div>
                      </div>
                      <div className="col-span-2">
  <Select
    value={l.assignedTcmId ?? ""}
    onValueChange={async (value) => {
      try {
        await apiClient.updateLead(l.id, {
          assignedTcmId: value,
        });

        await loadLeadsFromAPI();
        toast.success("TCM updated");
      } catch {
        toast.error("Failed to update TCM");
      }
    }}
  >
    <SelectTrigger className="h-8 w-40">
      <SelectValue placeholder="Assign TCM" />
    </SelectTrigger>

    <SelectContent>
      {tcms.map((t) => (
        <SelectItem key={t.id} value={t.id}>
          {t.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
                      <div className="col-span-1 text-right text-[11px] text-muted-foreground">
                        {mounted ? formatDistanceToNow(new Date(l.updatedAt), { addSuffix: true }) : "—"}
                      </div>
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">No leads match.</div>
              )}
            </div>
          </div>
        )}

        <AddLeadModal
          open={showAddLeadModal}
          onClose={() => setShowAddLeadModal(false)}
          onSuccess={loadLeadsFromAPI}
        />
      </div>
    </AppShell>
  );
}
