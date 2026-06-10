// @ts-nocheck
import { useGetNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/referral-app/api";
import { Layout } from "@/referral-app/components/layout";
import { useAppStore } from "@/referral-app/lib/store";
import { motion } from "framer-motion";
import { Bell, BellOff, CheckCheck, IndianRupee, Trophy, Target, Star, Building2, Users } from "lucide-react";
import { useToast } from "@/referral-app/hooks/use-toast";
import { cn } from "@/referral-app/lib/utils";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  LEAD_VERIFIED: { icon: <CheckCheck className="w-4 h-4" />, color: "bg-green-100 text-green-600" },
  LEAD_BOOKED: { icon: <IndianRupee className="w-4 h-4" />, color: "bg-green-100 text-green-600" },
  PAYOUT_APPROVED: { icon: <IndianRupee className="w-4 h-4" />, color: "bg-orange-100 text-orange-600" },
  PAYOUT_PAID: { icon: <IndianRupee className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
  LEVEL_UP: { icon: <Trophy className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-600" },
  BADGE_EARNED: { icon: <Star className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" },
  CHALLENGE_COMPLETED: { icon: <Target className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" },
  TEAM_INVITE: { icon: <Users className="w-4 h-4" />, color: "bg-indigo-100 text-indigo-600" },
  PROPERTY_VERIFIED: { icon: <Building2 className="w-4 h-4" />, color: "bg-teal-100 text-teal-600" },
  OVERFLOW_LEAD: { icon: <Bell className="w-4 h-4" />, color: "bg-slate-100 text-slate-600" },
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { referrer } = useAppStore();
  const { toast } = useToast();
  const { data: notifications, isLoading, refetch } = useGetNotifications(
    referrer?.id ?? 0,
    { unreadOnly: false },
    { query: { enabled: !!referrer } as any }
  );
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  const unread = (notifications || []).filter(n => !n.isRead);

  const handleMarkAll = async () => {
    if (!referrer) return;
    await markAll.mutateAsync({ referrerId: referrer.id });
    refetch();
    toast({ title: "All notifications cleared" });
  };

  const handleMarkOne = async (id: number) => {
    await markOne.mutateAsync({ notificationId: id });
    refetch();
  };

  if (!referrer) {
    return (
      <Layout>
        <div className="p-6 text-center py-16">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Please register to see notifications</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black font-display text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" /> Notifications
            </h1>
            {unread.length > 0 && <p className="text-sm text-orange-600 font-medium mt-1">{unread.length} unread</p>}
          </div>
          {unread.length > 0 && (
            <button onClick={handleMarkAll} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary font-medium transition-colors">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (notifications || []).length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No notifications yet</p>
            <p className="text-slate-400 text-sm">We'll notify you about payouts, level-ups, and more</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(notifications || []).map((n, i) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.OVERFLOW_LEAD;
              return (
                <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => !n.isRead && handleMarkOne(n.id)}
                  className={cn(
                    "flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-sm",
                    n.isRead ? "bg-white border-slate-100 opacity-70" : "bg-white border-orange-100 shadow-sm",
                  )}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                    <p className="text-slate-500 text-sm leading-snug">{n.message}</p>
                    {n.amount && <p className="text-green-600 font-bold text-sm mt-1">+₹{n.amount}</p>}
                    <p className="text-slate-400 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5 shrink-0" />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
