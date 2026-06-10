// @ts-nocheck
import { CAPTAINS } from "@/lib/captains";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/referral-app/components/ui/sheet";

export function ReassignSheet({
  open,
  onOpenChange,
  count,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onPick: (captainId: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90%] sm:w-[420px] p-0 overflow-y-auto">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle>Reassign {count} lead{count === 1 ? "" : "s"}</SheetTitle>
          <p className="text-sm text-slate-500">Pick the expert who should own these leads.</p>
        </SheetHeader>
        <div className="p-3 flex flex-col gap-2">
          {CAPTAINS.map((c) => (
            <button
              key={c.id}
              onClick={() => { onPick(c.id); onOpenChange(false); }}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-left transition"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black">
                {c.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-500 truncate">{c.title}</p>
                <p className="text-[11px] text-slate-400 truncate">{c.responseSla}</p>
              </div>
              <span className="text-orange-600 font-bold text-sm">→</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
