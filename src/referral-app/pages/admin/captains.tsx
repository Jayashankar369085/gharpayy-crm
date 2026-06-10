// @ts-nocheck
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { CAPTAINS, captainWaLink } from "@/lib/captains";
import { getSlaBreaches, getAvgFirstResponseHours } from "@/lib/analytics";
import { MessageCircle } from "lucide-react";
import { AdminPitch } from "@/referral-app/components/admin/AdminPitch";

export default function AdminCaptains() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  useEffect(() => { if (!isAdminAuthenticated) setLocation("/admin"); }, [isAdminAuthenticated, setLocation]);
  const { data } = useAdminGetLeads();
  const leads = data?.leads || [];

  const rows = useMemo(() => CAPTAINS.map((c) => {
    const matched = leads.filter((l: any) =>
      (l.captainId && l.captainId === c.id) ||
      (l.assignedAgentName && l.assignedAgentName.toLowerCase().includes(c.name.toLowerCase()))
    );
    const open = matched.filter((l: any) => !["BOOKED", "CLOSED", "LOST"].includes(l.status)).length;
    const booked = matched.filter((l: any) => ["BOOKED", "CLOSED"].includes(l.status)).length;
    const breaches = getSlaBreaches(matched, 24).length;
    const reply = getAvgFirstResponseHours(matched);
    const winRate = matched.length ? Math.round((booked / matched.length) * 100) : 0;
    return { expert: c, open, booked, breaches, reply, total: matched.length, winRate };
  }), [leads]);

  if (!isAdminAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPitch
          eyebrow="Experts · Gharpayy field team"
          title="Are your zone experts okay?"
          pitch={{
            why: "Every Gharpayy lead lives or dies by the zone expert behind it.",
            how: "SLA, win rate, workload, payout owed · one row per expert.",
            next: "Open the lowest win-rate expert and reassign their breached leads.",
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map(({ expert, open, booked, breaches, reply, total, winRate }) => (
            <div key={expert.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 text-white flex items-center justify-center text-lg font-black">{expert.initial}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white">{expert.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{expert.title}</div>
                  <div className="text-[10px] text-slate-500">{expert.responseSla}</div>
                </div>
                <a href={captainWaLink(expert, `Hi ${expert.name}, quick check-in.`)} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Cell value={open} label="Open" tone="blue" />
                <Cell value={booked} label="Booked" tone="green" />
                <Cell value={`${winRate}%`} label="Win" tone="orange" />
                <Cell value={breaches} label="SLA" tone={breaches > 0 ? "red" : "slate"} />
              </div>
              <div className="text-[11px] text-slate-500 italic border-t border-slate-800 pt-2">
                "{expert.quote}"
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Hubs: {expert.hubs.slice(0, 3).join(", ")}{expert.hubs.length > 3 ? "…" : ""}</span>
                <span>Reply avg: {reply ? `${reply}h` : "-"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function Cell({ value, label, tone }: any) {
  const map: any = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    orange: "bg-orange-500/10 text-orange-400",
    red: "bg-red-500/10 text-red-400",
    slate: "bg-slate-800 text-slate-300",
  };
  return (
    <div className={`rounded-lg py-2 ${map[tone]}`}>
      <div className="text-base font-black leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">{label}</div>
    </div>
  );
}
