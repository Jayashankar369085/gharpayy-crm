// @ts-nocheck
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/referral-app/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  right?: React.ReactNode;
  dark?: boolean;
}

export function PageHeader({ title, subtitle, backHref, right, dark }: PageHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (backHref) {
      setLocation(backHref);
    } else {
      window.history.back();
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 border-b sticky top-0 z-20 backdrop-blur",
      dark
        ? "bg-zinc-900/90 border-zinc-700/50 text-white"
        : "bg-background/90 border-border/40 text-foreground"
    )}>
      <button
        onClick={handleBack}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0",
          dark ? "bg-white/10 hover:bg-white/20" : "bg-muted hover:bg-muted/80"
        )}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className={cn("font-black font-display text-lg leading-tight truncate", dark ? "text-white" : "text-foreground")}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn("text-xs font-medium truncate", dark ? "text-white/60" : "text-muted-foreground")}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
