// @ts-nocheck
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { ChannelMix } from "@/referral-app/components/admin/ChannelMix";
import { EARN_RULES } from "@/lib/earn-rules";
import { AdminPitch } from "@/referral-app/components/admin/AdminPitch";

export default function AdminChannels() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  useEffect(() => { if (!isAdminAuthenticated) setLocation("/admin"); }, [isAdminAuthenticated, setLocation]);
  const { data } = useAdminGetLeads();
  const leads = data?.leads || [];
  if (!isAdminAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPitch
          eyebrow="Channels · Gharpayy acquisition"
          title="What to scale, what to kill"
          pitch={{
            why: "Gharpayy grows when WhatsApp + Slack + Campus + HR all run together.",
            how: "10 ways to earn · each one a channel with its own ₹ and conversion.",
            next: "Double down on the top-3 by ₹ this week, pause the bottom-2.",
          }}
        />

        <ChannelMix leads={leads} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {EARN_RULES.map((r) => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{r.emoji}</span>
                <div className="font-black text-white text-sm">{r.title}</div>
              </div>
              <div className="text-[11px] text-slate-400">{r.blurb}</div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-center">
                <div><div className="text-xs font-bold text-blue-400">₹{r.payoutOnLead}</div><div className="text-[9px] text-slate-500 uppercase">Lead</div></div>
                <div><div className="text-xs font-bold text-orange-400">₹{r.payoutOnTour}</div><div className="text-[9px] text-slate-500 uppercase">Tour</div></div>
                <div><div className="text-xs font-bold text-green-400">₹{r.payoutOnBooking}</div><div className="text-[9px] text-slate-500 uppercase">Booking</div></div>
              </div>
              {r.topEarner && (
                <div className="text-[10px] text-slate-500 italic pt-1">
                  Top: {r.topEarner.name} · ₹{r.topEarner.monthly.toLocaleString()}/mo
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
