// @ts-nocheck
import { AlertTriangle, MessageCircle } from "lucide-react";
import { getSlaBreaches, type LeadLike } from "@/lib/analytics";
import { useLocation } from "wouter";
import { CAPTAINS, captainForArea, captainWaLink, CAPTAIN_BY_ID } from "@/lib/captains";

export function SlaAlerts({ leads }: { leads: LeadLike[] }) {
  const [, setLocation] = useLocation();
  const breaches = getSlaBreaches(leads, 24);
  return (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-red-200 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-50 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base md:text-lg font-bold text-slate-900">
            SLA alerts <span className="text-red-600">{breaches.length > 0 ? `· ${breaches.length}` : ""}</span>
          </h3>
          <p className="text-xs text-slate-500">Open leads with no expert follow-up in 24h.</p>
        </div>
      </div>
      {breaches.length === 0 ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 font-semibold">
          🎯 All caught up. Every open lead is within SLA.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {breaches.slice(0, 6).map((l: any) => {
            const expert = (l.captainId && CAPTAIN_BY_ID[l.captainId]) || captainForArea(l.area);
            return (
              <li key={l.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  onClick={() => setLocation(`/admin/leads/${l.id}`)}
                  className="flex-1 text-left min-w-0 hover:underline"
                >
                  <p className="font-bold text-sm text-slate-900 truncate">{l.leadName} · {l.status}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {l.area || "no area"} · {l.captainName || expert.name} · created {Math.round((Date.now() - new Date(l.createdAt).getTime()) / 3600000)}h ago
                  </p>
                </button>
                <a
                  href={captainWaLink(expert, `Hey ${expert.name}, lead "${l.leadName}" (${l.referralId}) has been waiting 24h+. Please reach out today.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-[#25D366] text-white text-xs font-bold shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Nudge
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
