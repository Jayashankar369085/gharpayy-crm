import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Siren, Check } from "lucide-react";
import type { LiveAlert } from "@/lib/visits/live-types";
import { useLiveVisits } from "@/lib/visits/live-store";

const TONE: Record<LiveAlert["severity"], string> = {
  critical: "border-destructive/50 bg-destructive/5 text-destructive",
  warn: "border-warning/50 bg-warning/5 text-warning-foreground",
  info: "border-border bg-card text-muted-foreground",
};

export function AlertRail({ alerts, onOpen }: { alerts: LiveAlert[]; onOpen: (visitId: string) => void }) {
  const { resolveAlert } = useLiveVisits();
  const open = alerts.filter((a) => !a.resolvedAt);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Siren className="h-4 w-4 text-destructive" />
        <h2 className="text-sm font-semibold">Control Tower alerts</h2>
        <Badge variant="outline" className="text-[10px]">{open.length} open</Badge>
      </div>
      {open.length === 0 ? (
        <p className="text-xs text-muted-foreground">No open alerts. Every active visit is inside SLA.</p>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {open.map((a) => (
            <div key={a.id} className={cn("rounded-lg border p-2 flex items-start gap-2", TONE[a.severity])}>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-medium leading-snug">{a.message}</p>
                <p className="text-[10px] opacity-70">
                  {a.kind.replace(/-/g, " ")} · {new Date(a.ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => onOpen(a.visitId)}>Open</Button>
                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]" onClick={() => resolveAlert(a.id)}>
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
