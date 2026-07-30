import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserPlus, Zap } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { useVisitWar } from "@/lib/visits/war-store";

/**
 * On-site walk-in capture. Two taps and a phone number gets a live visit
 * on the planner — no scheduling, no lead form, no errors.
 */
export function WalkInDialog({ onCreated }: { onCreated?: (tourId: string) => void }) {
  const { properties, tcms, currentTcmId } = useApp();
  const addWalkIn = useVisitWar((s) => s.addWalkIn);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyId, setPropertyId] = useState<string>("");
  const [tcmId, setTcmId] = useState<string>(currentTcmId ?? "");
  const [occupancy, setOccupancy] = useState<"single" | "double" | "triple" | undefined>();
  const [budget, setBudget] = useState("");
  const [startInMin, setStartInMin] = useState(0);

  const phoneDigits = phone.replace(/\D/g, "");
  const valid = name.trim().length >= 2 && phoneDigits.length >= 10 && !!propertyId && !!tcmId;

  function reset() {
    setName(""); setPhone(""); setOccupancy(undefined); setBudget(""); setStartInMin(0);
  }

  function submit() {
    if (!valid) return;
    const prop = properties.find((p) => p.id === propertyId);
    const tcm = tcms.find((m) => m.id === tcmId);
    const rec = addWalkIn({
      leadName: name.trim(),
      leadPhone: phoneDigits,
      propertyId,
      propertyName: prop?.name ?? "Property",
      propertyArea: prop?.area ?? "—",
      tcmId,
      tcmName: tcm?.name ?? "Coordinator",
      occupancy,
      budget: budget ? Number(budget) : undefined,
      startInMin,
    });
    toast.success(`${rec.leadName} added`, {
      description: startInMin === 0
        ? `Live tour at ${rec.propertyName} — timer running`
        : `Slotted in ${startInMin} min at ${rec.propertyName}`,
    });
    onCreated?.(rec.tourId);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 h-9">
          <UserPlus className="h-4 w-4" /> Walk-in
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> Add walk-in visitor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wi-name">Name</Label>
            <Input id="wi-name" value={name} autoFocus className="h-11 text-base"
                   placeholder="Visitor name" onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wi-phone">Phone</Label>
            <Input id="wi-phone" value={phone} inputMode="numeric" className="h-11 text-base font-mono"
                   placeholder="10-digit number" maxLength={14}
                   onChange={(e) => setPhone(e.target.value)} />
            {phone.length > 0 && phoneDigits.length < 10 && (
              <p className="text-[11px] text-destructive">Needs 10 digits</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Property</Label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {properties.map((p) => (
                <button key={p.id} type="button" onClick={() => setPropertyId(p.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs transition",
                    propertyId === p.id ? "border-accent bg-accent/10 text-accent font-semibold" : "hover:bg-muted",
                  )}>
                  {p.name}
                  <span className="ml-1 text-[10px] text-muted-foreground">{p.vacantBeds} free</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Coordinator</Label>
            <div className="flex flex-wrap gap-1.5">
              {tcms.map((m) => (
                <button key={m.id} type="button" onClick={() => setTcmId(m.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs transition",
                    tcmId === m.id ? "border-accent bg-accent/10 text-accent font-semibold" : "hover:bg-muted",
                  )}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sharing</Label>
              <div className="flex gap-1.5">
                {(["single", "double", "triple"] as const).map((o) => (
                  <button key={o} type="button" onClick={() => setOccupancy(occupancy === o ? undefined : o)}
                    className={cn(
                      "flex-1 rounded-md border py-1.5 text-[11px] capitalize transition",
                      occupancy === o ? "border-accent bg-accent/10 text-accent font-semibold" : "hover:bg-muted",
                    )}>
                    {o[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wi-budget">Budget ₹</Label>
              <Input id="wi-budget" value={budget} inputMode="numeric" placeholder="12000"
                     onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Start</Label>
            <div className="flex gap-1.5">
              {[0, 15, 30, 60].map((m) => (
                <button key={m} type="button" onClick={() => setStartInMin(m)}
                  className={cn(
                    "flex-1 rounded-md border py-2 text-xs transition",
                    startInMin === m ? "border-accent bg-accent/10 text-accent font-semibold" : "hover:bg-muted",
                  )}>
                  {m === 0 ? "Now" : `+${m}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Badge variant="outline" className="mr-auto self-center text-[10px]">
            {startInMin === 0 ? "Timer starts immediately" : "Appears on the day planner"}
          </Badge>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!valid} onClick={submit}>Add visit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
