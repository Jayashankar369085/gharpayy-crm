import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { buildDayReport, buildVisitReport, isClosedOut } from "@/lib/visits/report";
import type { VisitRecord } from "@/lib/visits/war-store";

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copied`),
    () => toast.error("Copy failed"),
  );
}

/** End-of-day roll-up + the auto report generated for every visit. */
export function DayReportPanel({ visits, dayStart }: { visits: VisitRecord[]; dayStart: number }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const day = useMemo(
    () => visits
      .filter((v) => v.scheduledAt >= dayStart && v.scheduledAt < dayStart + 24 * 3600_000)
      .sort((a, b) => a.scheduledAt - b.scheduledAt),
    [visits, dayStart],
  );
  const dayText = useMemo(() => buildDayReport(visits, dayStart), [visits, dayStart]);

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">End-of-day report</h3>
          <Badge variant="outline" className="text-[10px]">auto-generated</Badge>
          <Button size="sm" variant="outline" className="ml-auto h-7 gap-1.5 text-[11px]"
                  onClick={() => copy(dayText, "Day report")}>
            <Copy className="h-3 w-3" /> Copy
          </Button>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground max-h-72 overflow-y-auto">
          {dayText}
        </pre>
      </Card>

      <div className="space-y-2">
        {day.length === 0 && (
          <Card className="p-6 text-center text-xs text-muted-foreground">No visits today yet.</Card>
        )}
        {day.map((v) => {
          const text = v.report?.text ?? buildVisitReport(v);
          const open = openId === v.tourId;
          return (
            <Card key={v.tourId} className="p-3">
              <div className="flex items-center gap-2">
                {isClosedOut(v)
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  : <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />}
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">
                    {v.leadName} · {v.propertyName}
                    {v.walkIn && <Badge variant="outline" className="ml-1.5 text-[9px] border-accent/40 text-accent">walk-in</Badge>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(v.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    {v.report ? " · report ready" : " · live, report updates automatically"}
                  </div>
                </div>
                <div className="ml-auto flex gap-1.5">
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                          onClick={() => setOpenId(open ? null : v.tourId)}>
                    {open ? "Hide" : "View"}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]"
                          onClick={() => copy(text, "Visit report")}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                </div>
              </div>
              {open && (
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-foreground border-t pt-2">
                  {text}
                </pre>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
