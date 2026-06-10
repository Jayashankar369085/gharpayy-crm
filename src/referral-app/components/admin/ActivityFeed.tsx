// @ts-nocheck
import { Activity, Clock, Edit3, UserPlus, Plus } from "lucide-react";
import { getRecentActivity, type LeadLike } from "@/lib/analytics";
import { useLocation } from "wouter";

function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function ActivityFeed({ leads, limit = 12 }: { leads: LeadLike[]; limit?: number }) {
  const [, setLocation] = useLocation();
  const rows = getRecentActivity(leads, limit);
  const iconFor = (k: string) =>
    k === "created" ? Plus : k === "status" ? Edit3 : k === "assign" ? UserPlus : Clock;
  return (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <Activity className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold text-slate-900">Activity</h3>
          <p className="text-xs text-slate-500">Last {limit} events across all leads.</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r, i) => {
            const Icon = iconFor(r.kind);
            return (
              <li
                key={`${r.leadId}-${r.ts}-${i}`}
                className="py-2.5 flex items-start gap-3 cursor-pointer hover:bg-slate-50 -mx-2 px-2 rounded"
                onClick={() => setLocation(`/admin/leads/${r.leadId}`)}
              >
                <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800 truncate">
                    <span className="font-bold">{r.leadName}</span>
                    <span className="text-slate-500"> · {r.text}</span>
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">{timeAgo(r.ts)} ago</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
