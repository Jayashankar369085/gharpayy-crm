// @ts-nocheck
import { Bell, CheckCircle2 } from "lucide-react";
import BookOSShell, { KPI, EmptyState, OutlineBtn } from "@/referral-app/components/bookos/Shell";
import { NotificationsDB, useStore } from "@/referral-app/lib/bookos/store";
import { timeAgo } from "@/referral-app/lib/bookos/format";

export default function NotifsPage() {
  const all = useStore(() => NotificationsDB.all());
  const unread = all.filter((n: any) => !n.read).length;
  return (
    <BookOSShell eyebrow="INBOX" title="Notifications"
      actions={<OutlineBtn onClick={() => all.forEach((n: any) => !n.read && NotificationsDB.update(n.id, { read: true }))}><CheckCircle2 className="w-4 h-4"/> Mark all read</OutlineBtn>}>
      <div className="grid grid-cols-2 gap-3 mb-5"><KPI label="Total" value={all.length}/><KPI accent label="Unread" value={unread}/></div>
      <div className="rounded-2xl border border-amber-200 bg-white/80 divide-y divide-slate-100">
        {!all.length ? <EmptyState title="No notifications"/> : all.map((n: any) => (
          <button key={n.id} onClick={() => NotificationsDB.update(n.id, { read: true })} className={"w-full text-left flex items-start gap-3 p-4 " + (n.read ? "opacity-60" : "bg-amber-50/30")}>
            <Bell className={"w-4 h-4 mt-0.5 " + (n.kind === "danger" || n.kind === "warn" ? "text-amber-600" : "text-slate-500")}/>
            <div className="flex-1"><div className="font-semibold text-sm">{n.title}</div>{n.body && <div className="text-xs text-slate-500">{n.body}</div>}</div>
            <div className="text-xs text-slate-400">{timeAgo(n.createdAt)}</div>
          </button>
        ))}
      </div>
    </BookOSShell>
  );
}