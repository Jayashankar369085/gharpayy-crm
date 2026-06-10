// @ts-nocheck
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "slate",
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "slate" | "blue" | "amber" | "green" | "orange" | "red" | "primary";
}) {
  const toneMap: Record<string, { bg: string; fg: string }> = {
    slate: { bg: "bg-slate-50", fg: "text-slate-600" },
    blue: { bg: "bg-blue-50", fg: "text-blue-600" },
    amber: { bg: "bg-amber-50", fg: "text-amber-600" },
    green: { bg: "bg-green-50", fg: "text-green-600" },
    orange: { bg: "bg-orange-50", fg: "text-orange-600" },
    red: { bg: "bg-red-50", fg: "text-red-600" },
    primary: { bg: "bg-primary/10", fg: "text-primary" },
  };
  const t = toneMap[tone] || toneMap.slate;
  return (
    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
      {Icon && (
        <div className={`p-2.5 rounded-xl ${t.bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${t.fg}`} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl md:text-[28px] font-black text-slate-900 leading-tight tracking-tight mt-0.5">{value}</p>
        {hint && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{hint}</p>}
      </div>
    </div>
  );
}
