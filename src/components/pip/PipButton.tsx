import { useEffect, useState } from "react";
import { PictureInPicture2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePip } from "./PipProvider";

export function PipButton({ className }: { className?: string }) {
  const { open, close, active, supported } = usePip();
  // PiP API is browser-only; SSR sees supported=false → hydration mismatch
  // unless we wait for mount before reading the real value.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const effSupported = mounted ? supported : true;
  const effActive = mounted ? active : false;

  return (
    <Button
      variant={effActive ? "secondary" : "default"}
      size="sm"
      onClick={() => (effActive ? close() : open())}
      disabled={mounted ? !effSupported && !effActive : false}
      className={cn(
        "gap-1.5 h-8 text-xs font-medium shadow-sm",
        effActive && "bg-primary/15 text-primary hover:bg-primary/20",
        className,
      )}
      title={
        !mounted
          ? "PiP mode"
          : !effSupported
          ? "PiP needs Chrome, Edge, Brave or Opera on desktop"
          : effActive
          ? "Close the floating dashboard window"
          : "Pop the dashboard out as a floating always-on-top window over WhatsApp"
      }
    >
      {effActive ? <X className="h-3.5 w-3.5" /> : <PictureInPicture2 className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{effActive ? "Exit PiP" : "PiP mode"}</span>
    </Button>
  );
}
