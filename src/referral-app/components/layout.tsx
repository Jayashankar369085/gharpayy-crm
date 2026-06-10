// @ts-nocheck
import { Link, useLocation } from "wouter";
import { useAppStore } from "@/referral-app/lib/store";
import { Home, PlusCircle, Trophy, User, LogOut, Building2, Users, Target, Bell, Calculator, MapPin, BarChart2, Flame, Zap, GitBranch, Activity, Share2, TrendingUp, Calendar, SwitchCamera } from "lucide-react";
import { cn } from "@/referral-app/lib/utils";
import { RoleSwitcher } from "./role-switcher";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { persona, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isGuard = persona === "GUARD";
  const isStudent = persona === "STUDENT";
  const isEarner = persona === "EARNER";
  const isManager = persona === "PG_MANAGER";
  const isBroker = persona === "BROKER";
  const isInfluencer = persona === "INFLUENCER";
  const isCorporate = persona === "CORPORATE_HR";

  const themeClass = cn({
    "bg-zinc-900 text-white min-h-screen": isGuard,
    "bg-[#FDF8F5] text-slate-900 min-h-screen": isStudent,
    "bg-[#F0F4FF] text-slate-900 min-h-screen": isManager,
    "bg-[#FBFBFC] text-slate-900 min-h-screen": isEarner || !persona,
    "bg-slate-900 text-white min-h-screen": isBroker,
    "bg-purple-50 text-purple-950 min-h-screen": isInfluencer,
    "bg-indigo-50 text-indigo-950 min-h-screen": isCorporate,
  });

  if (!persona) {
    return <div className="min-h-[100dvh] bg-[#FBFBFC] w-full">{children}</div>;
  }

  const navItems = isManager ? [
    { href: "/manager", icon: BarChart2, label: "Dashboard" },
    { href: "/manager/properties", icon: Building2, label: "Properties" },
    { href: "/pg", icon: MapPin, label: "Browse" },
    { href: "/refer", icon: PlusCircle, label: "Add Lead" },
    { href: "/me", icon: User, label: "Profile" },
  ] : isBroker ? [
    { href: "/broker", icon: BarChart2, label: "Dashboard" },
    { href: "/refer", icon: PlusCircle, label: "New Lead" },
    { href: "/pg", icon: Building2, label: "Homes" },
    { href: "/flash", icon: Zap, label: "Flash Deals" },
    { href: "/me", icon: User, label: "Profile" },
  ] : isInfluencer ? [
    { href: "/influencer", icon: Share2, label: "Creator Hub" },
    { href: "/refer", icon: PlusCircle, label: "Refer" },
    { href: "/chain", icon: GitBranch, label: "My Chain" },
    { href: "/leaderboard", icon: Trophy, label: "Rankings" },
    { href: "/me", icon: User, label: "Profile" },
  ] : isCorporate ? [
    { href: "/corporate", icon: BarChart2, label: "HR Hub" },
    { href: "/refer", icon: PlusCircle, label: "Add Employee" },
    { href: "/pg", icon: Building2, label: "Find Homes" },
    { href: "/areas", icon: MapPin, label: "Areas" },
    { href: "/me", icon: User, label: "Profile" },
  ] : [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/refer", icon: PlusCircle, label: "Refer" },
    { href: "/pg", icon: Building2, label: "Homes" },
    { href: "/leaderboard", icon: Trophy, label: "Rankings" },
    { href: "/me", icon: User, label: "Me" },
  ];

  const extraNavBase = [
    { href: "/challenges", icon: Target, label: "Challenges" },
    { href: "/teams", icon: Users, label: "Teams" },
    { href: "/squad-battles", icon: Zap, label: "Battles" },
    { href: "/streak", icon: Flame, label: "Streak" },
    { href: "/lucky-draw", icon: Target, label: "Lucky Draw" },
    { href: "/flash", icon: Zap, label: "Flash Deals" },
    { href: "/earnings", icon: TrendingUp, label: "Earnings" },
    { href: "/visits", icon: Calendar, label: "Visits" },
    { href: "/chain", icon: GitBranch, label: "My Chain" },
    { href: "/activity", icon: Activity, label: "Activity" },
    { href: "/calculator", icon: Calculator, label: "Calculator" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/areas", icon: MapPin, label: "Areas" },
  ];

  const mobileNav = navItems.slice(0, 5);

  return (
    <div className={cn("min-h-[100dvh] w-full flex flex-col pb-16 md:pb-0 md:flex-row", themeClass)}>
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/10 bg-card/50 backdrop-blur shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏘️</span>
            <div>
              <h1 className="text-xl font-black font-display text-primary leading-none">Gharpayy</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Homes</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">{persona}</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
              active={location === item.href || location.startsWith(item.href + "/")} isGuard={isGuard || isBroker} />
          ))}
          <div className="pt-4 pb-2 px-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">More</p>
          </div>
          {extraNavBase.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
              active={location === item.href} isGuard={isGuard || isBroker} />
          ))}
        </nav>
        <div className="p-4 border-t border-border/10 space-y-1">
          <button
            onClick={() => {}}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
            title="Switch Role"
          >
            <SwitchCamera className="w-4 h-4" />
            Switch Role
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-sm font-medium text-muted-foreground hover:text-destructive transition-colors rounded-md"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto overflow-y-auto">
        {/* Mobile Top Bar */}
        <div className={cn(
          "md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-10 border-b",
          isGuard || isBroker
            ? "bg-zinc-900/90 border-zinc-700/30 backdrop-blur"
            : "bg-background/90 border-border/10 backdrop-blur"
        )}>
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🏘️</span>
            <div>
              <span className={cn("text-base font-black font-display leading-none", isGuard || isBroker ? "text-orange-400" : "text-primary")}>Gharpayy</span>
              <span className={cn("text-[9px] font-bold ml-1 opacity-60 uppercase tracking-widest", isGuard || isBroker ? "text-white" : "text-foreground")}>Homes</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/streak">
              <Flame className={cn("w-5 h-5", isGuard || isBroker ? "text-orange-400" : "text-orange-500")} />
            </Link>
            <Link href="/notifications">
              <Bell className={cn("w-5 h-5", isGuard || isBroker ? "text-zinc-400" : "text-muted-foreground")} />
            </Link>
            <button onClick={handleLogout} title="Log out">
              <LogOut className={cn("w-5 h-5", isGuard || isBroker ? "text-zinc-400 hover:text-red-400" : "text-muted-foreground hover:text-destructive")} />
            </button>
          </div>
        </div>
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border/10 flex items-center justify-around px-2 z-50">
        {mobileNav.map(item => (
          <MobileNavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
            active={location === item.href || (item.href !== "/" && location.startsWith(item.href))} />
        ))}
      </nav>

      {/* Floating Role Switcher */}
      <RoleSwitcher />
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active, isGuard }: { href: string; icon: any; label: string; active: boolean; isGuard: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
      active ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground",
      isGuard && "text-base font-bold"
    )}>
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function MobileNavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link href={href} className={cn(
      "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    )}>
      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
