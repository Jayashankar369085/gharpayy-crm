// @ts-nocheck
import { useAppStore } from "@/referral-app/lib/store";
import { useGetReferrerDashboard, useGetReferrerReferrals } from "@/referral-app/api";
import { useLocation } from "wouter";
import { Layout } from "@/referral-app/components/layout";
import { LEVEL_NAMES, BADGE_ICONS, BADGE_DESCRIPTIONS } from "@/referral-app/lib/constants";
import { motion } from "framer-motion";
import { Skeleton } from "@/referral-app/components/ui/skeleton";
import { Badge as UiBadge } from "@/referral-app/components/ui/badge";
import { format } from "date-fns";
import { MapPin, Calendar, CheckCircle2, Clock, XCircle, Wallet, Share2, Copy, Target, Bell, LogOut, Crown, Magnet, Layers, Map as MapIcon, Building2, Receipt, Wrench, BarChart2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/referral-app/hooks/use-toast";
import { BookingsDB, RentsDB, NotificationsDB, useStore, bookingStats, rentStats } from "@/referral-app/lib/bookos/store";
import { LeadsDB, useLeadsStore } from "@/referral-app/lib/bookos/leads";
import { fmtShort } from "@/referral-app/lib/bookos/format";

export default function ProfilePage() {
  const { persona, referrer, logout } = useAppStore();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!persona) {
    setLocation("/");
    return null;
  }

  if (!referrer) {
    setLocation("/register");
    return null;
  }

  const { data: dashboard, isLoading: isDashboardLoading } = useGetReferrerDashboard(referrer.id);
  const { data: referrals, isLoading: isReferralsLoading } = useGetReferrerReferrals(referrer.id);

  const referralLink = `${window.location.origin}/profile/${referrer.referralCode}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Profile link copied!", description: "Share it to refer people to PGs" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isDashboardLoading || isReferralsLoading || !dashboard) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  const levelName = LEVEL_NAMES[persona]?.[dashboard.referrer.level] || dashboard.referrer.level;
  const progressPercent = Math.min(100, Math.max(0, 
    ((dashboard.referrer.xp - dashboard.currentLevelXp) / 
    (dashboard.nextLevelXp - dashboard.currentLevelXp)) * 100
  ));

  const earnedBadgeIds = dashboard.badges.map(b => b.name);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'BOOKED': return 'bg-green-100 text-green-700 border-green-200';
      case 'VERIFIED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'LOST': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'BOOKED': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'LOST': return <XCircle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        
        {/* Header Profile Section */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl font-bold font-display shadow-inner shrink-0">
            {dashboard.referrer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black font-display text-foreground mb-1">{dashboard.referrer.name}</h1>
            <p className="text-muted-foreground font-medium mb-1">{dashboard.referrer.phone} · {persona}</p>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-slate-600">REF: {referrer.referralCode}</span>
              <button onClick={handleCopyLink} className="flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                {copied ? <><CheckCircle2 className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy profile link</>}
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-muted px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Rank</p>
                <p className="text-xl font-black text-foreground">#{dashboard.rank}</p>
              </div>
              <div className="bg-muted px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Level</p>
                <p className="text-xl font-black text-primary">{levelName}</p>
              </div>
              <div className="bg-muted px-4 py-2 rounded-xl">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Earned</p>
                <p className="text-xl font-black text-green-600">₹{dashboard.referrer.totalEarned}</p>
              </div>
            </div>
          </div>
        </div>

        {persona === "PG_MANAGER" && <OperatorHub setLocation={setLocation} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setLocation("/payout-setup")}
            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all text-left">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Payout Setup</p>
              <p className="text-xs text-slate-500">Add UPI / Bank</p>
            </div>
          </button>
          <button onClick={() => setLocation("/challenges")}
            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all text-left">
            <Target className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Challenges</p>
              <p className="text-xs text-slate-500">Earn XP & bonuses</p>
            </div>
          </button>
          <button onClick={() => setLocation("/teams")}
            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all text-left">
            <Share2 className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-slate-800 text-sm">My Squad</p>
              <p className="text-xs text-slate-500">Join or create a team</p>
            </div>
          </button>
          <button onClick={() => setLocation("/notifications")}
            className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:shadow-sm transition-all text-left">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Notifications</p>
              <p className="text-xs text-slate-500">Payouts & updates</p>
            </div>
          </button>
        </div>

        {/* Level Progress */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-foreground mb-1">Level Progress</h3>
              <p className="text-sm text-muted-foreground">{dashboard.referrer.xp} / {dashboard.nextLevelXp} XP</p>
            </div>
            <span className="text-sm font-bold text-primary">{dashboard.nextLevelXp - dashboard.referrer.xp} XP to go</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
              className="h-full bg-primary rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full skew-x-12 animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
        </div>

        {/* Badges Collection */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold font-display text-foreground">Badges Collection</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {Object.entries(BADGE_ICONS).map(([name, icon], i) => {
              const isEarned = earnedBadgeIds.includes(name);
              return (
                <motion.div 
                  key={name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`
                    flex flex-col items-center p-3 rounded-xl border text-center transition-all
                    ${isEarned 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm' 
                      : 'bg-muted/50 border-transparent opacity-50 grayscale'}
                  `}
                >
                  <span className="text-3xl mb-2">{icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight text-foreground leading-tight">
                    {name}
                  </span>
                  {isEarned && (
                    <span className="text-[9px] text-muted-foreground mt-1">Earned</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Referrals List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold font-display text-foreground">My Referrals</h3>
          
          {referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.map((ref, i) => (
                <motion.div 
                  key={ref.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{ref.referralId}</span>
                      <UiBadge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 border ${getStatusColor(ref.status)}`}>
                        <span className="flex items-center">{getStatusIcon(ref.status)}{ref.status}</span>
                      </UiBadge>
                    </div>
                    <h4 className="font-bold text-foreground text-lg">{ref.leadName}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ref.area || 'Any area'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(ref.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between bg-muted/50 sm:bg-transparent p-3 sm:p-0 rounded-lg">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest sm:mb-1">XP Earned</span>
                    <span className="font-black text-primary text-xl">+{ref.xpEarned}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-2xl border-dashed">
              <p className="text-muted-foreground mb-4">You haven't made any referrals yet.</p>
              <button 
                onClick={() => setLocation("/refer")}
                className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-full hover:bg-primary/90 transition-colors"
              >
                Refer Someone Now
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

      </div>
    </Layout>
  );
}
function OperatorHub({ setLocation }: any) {
  const bookings = useStore(() => BookingsDB.all());
  const rents = useStore(() => RentsDB.all());
  const notifs = useStore(() => NotificationsDB.all());
  const leads = useLeadsStore(() => LeadsDB.all());
  const s = bookingStats();
  const r = rentStats();
  const newLeads = leads.filter((l: any) => l.stage === "new").length;
  const liveOffers = bookings.filter((b: any) => b.status === "approved").length;
  const overdue = rents.filter((x: any) => x.status === "overdue").length;
  const unread = notifs.filter((n: any) => !n.read).length;

  const tiles = [
    { to: "/manager/bookos/command", label: "Command", icon: Crown, accent: true, val: `₹${Math.round(s.tokenRevenue / 1000)}k`, sub: "today’s pulse" },
    { to: "/manager/bookos/leads", label: "Leads", icon: Magnet, val: newLeads, sub: "new in pipeline" },
    { to: "/manager/bookos/bookings", label: "Bookings", icon: Calendar, val: s.pending, sub: `${liveOffers} live offers` },
    { to: "/manager/bookos/rents", label: "Rents", icon: Receipt, val: overdue, sub: `${fmtShort(r.collected)} collected` },
    { to: "/manager/bookos/inventory", label: "Inventory", icon: Layers, val: "—", sub: "rooms · floors · beds" },
    { to: "/manager/bookos/map", label: "Live map", icon: MapIcon, val: "—", sub: "occupancy grid" },
    { to: "/manager/bookos/maintenance", label: "Maintenance", icon: Wrench, val: "—", sub: "open tickets" },
    { to: "/manager/bookos/analytics", label: "Analytics", icon: BarChart2, val: s.conversion + "%", sub: "conversion" },
    { to: "/manager/bookos/notifications", label: "Inbox", icon: Bell, val: unread, sub: "unread" },
    { to: "/owner", label: "Owner view", icon: Building2, val: "→", sub: "read-only portfolio" },
  ];

  return (
    <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/30 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-amber-700">OPERATOR HUB</div>
          <div className="font-serif text-xl text-slate-900" style={{ letterSpacing: "-0.01em" }}>Run your portfolio</div>
        </div>
        <button onClick={() => setLocation("/manager/bookos/command")}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
          Open command <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.to} onClick={() => setLocation(t.to)}
              className={`text-left rounded-2xl border p-3 transition-all hover:shadow-md hover:-translate-y-0.5 ${t.accent ? "border-amber-300 bg-gradient-to-br from-amber-100 to-amber-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${t.accent ? "text-amber-700" : "text-slate-500"}`} />
                <span className={`text-base font-bold ${t.accent ? "text-amber-800" : "text-slate-900"}`}>{t.val}</span>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{t.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{t.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
