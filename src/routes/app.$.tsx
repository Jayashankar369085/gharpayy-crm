import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import "@/referral-app/styles.css";

const ReferralApp = lazy(() => import("@/referral-app/App"));

export const Route = createFileRoute("/app/$")({
  head: () => ({
    meta: [
      { title: "Operator Desk — Gharpayy" },
      { name: "description", content: "Property manager, owner & admin desk: inventory, leads, bookings, payouts, referrals." },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading desk…
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading desk…</div>}>
      <ReferralApp />
    </Suspense>
  );
}
