// @ts-nocheck
// Manager root → Booking OS Command is the operator's home base.
// We no longer show a separate "Open BookOS" card — BookOS *is* the manager surface.
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAppStore } from "@/referral-app/lib/store";

export default function ManagerDashPage() {
  const { referrer, persona } = useAppStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!referrer) { setLocation("/register"); return; }
    if (persona !== "PG_MANAGER") { setLocation("/home"); return; }
    setLocation("/manager/bookos/command");
  }, [referrer, persona, setLocation]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 via-amber-50/40 to-slate-50">
      <div className="text-center">
        <div className="text-[10px] font-bold tracking-[0.3em] text-amber-700">GHARPAYY</div>
        <div className="font-serif text-2xl text-slate-900 mt-1">Opening your command center…</div>
      </div>
    </div>
  );
}
