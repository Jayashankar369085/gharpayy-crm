import { useMemo, useState, useEffect } from "react";
import { useCRM10x } from "@/lib/crm10x/store";
import {
  renderTemplate,
  waLink,
  WA_TEMPLATES,
  type TemplateStage,
  type TemplateGroup,
} from "@/lib/crm10x/templates";
import { useApp, getProperty } from "@/lib/store";
import type { Lead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  MessageSquare,
  Languages,
  Search,
  Copy,
  Star,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const GROUP_LABEL: Record<TemplateGroup, string> = {
  core: "Core",
  "non-responder": "Non-responder",
  scenario: "Scenario",
  revival: "Revival",
};
const GROUPS: ("all" | TemplateGroup)[] = ["all", "core", "non-responder", "scenario", "revival"];
const RECENT_KEY = "gharpayy.wa.recent.v1";
const FAV_KEY = "gharpayy.wa.fav.v1";

function loadList(k: string): TemplateStage[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(k) || "[]"); } catch { return []; }
}
function saveList(k: string, list: TemplateStage[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(k, JSON.stringify(list.slice(0, 8))); } catch { /* */ }
}

export function WaTemplatePicker({ lead }: { lead: Lead }) {
  const profile = useCRM10x((s) => s.profiles[lead.id]);
  const allTours = useApp((s) => s.tours);
  const properties = useApp((s) => s.properties);
  const tcms = useApp((s) => s.tcms);
  const sendMessage = useApp((s) => s.sendMessage);

  const [stage, setStage] = useState<TemplateStage>("follow-up");
  const [lang, setLang] = useState<"english" | "hindi">(
    profile?.language === "hindi" ? "hindi" : "english",
  );
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | TemplateGroup>("all");
  const [edited, setEdited] = useState<string | null>(null);
  const [recent, setRecent] = useState<TemplateStage[]>([]);
  const [favs, setFavs] = useState<TemplateStage[]>([]);

  useEffect(() => {
    setRecent(loadList(RECENT_KEY));
    setFavs(loadList(FAV_KEY));
  }, []);

  const tours = useMemo(() => allTours.filter((t) => t.leadId === lead.id), [allTours, lead.id]);
  const tour = tours[0];
  const prop = tour ? getProperty(tour.propertyId, properties) : undefined;
  const agent = tcms.find((t) => t.id === lead.assignedTcmId);

  const rendered = useMemo(
    () =>
      renderTemplate(stage, lang, {
        name: lead.name.split(" ")[0],
        agent: agent?.name ?? "Gharpayy",
        area: lead.preferredArea,
        budget: Math.round(lead.budget / 1000) + "k",
        property: prop?.name ?? "the property",
        date: tour ? new Date(tour.scheduledAt).toLocaleDateString() : "",
        time: tour ? new Date(tour.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        price: prop?.pricePerBed ?? lead.budget,
        phone: lead.phone,
      }),
    [stage, lang, lead, agent, prop, tour],
  );

  // Reset edits when stage/lang changes
  useEffect(() => { setEdited(null); }, [stage, lang]);

  const finalMessage = edited ?? rendered;

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (Object.entries(WA_TEMPLATES) as [TemplateStage, typeof WA_TEMPLATES[TemplateStage]][])
      .filter(([, v]) => group === "all" || v.group === group)
      .filter(([, v]) => !q || v.label.toLowerCase().includes(q) || v.body.en.toLowerCase().includes(q));
  }, [query, group]);

  const toggleFav = (s: TemplateStage) => {
    const next = favs.includes(s) ? favs.filter((x) => x !== s) : [s, ...favs];
    setFavs(next);
    saveList(FAV_KEY, next);
  };

  const sendNow = () => {
    window.open(waLink(lead.phone, finalMessage), "_blank", "noopener,noreferrer");
    sendMessage(lead.id, `[${WA_TEMPLATES[stage].label} · ${lang}] sent`);
    const next = [stage, ...recent.filter((x) => x !== stage)];
    setRecent(next);
    saveList(RECENT_KEY, next);
    toast.success("WhatsApp opened");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(finalMessage);
    toast.success("Copied");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" /> Templates
        </div>
        <div className="flex items-center gap-1">
          {(["english", "hindi"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`text-[10px] px-2 py-0.5 rounded border ${
                lang === l ? "bg-primary text-primary-foreground border-primary" : "border-border"
              }`}
            >
              <Languages className="h-2.5 w-2.5 inline mr-0.5" />
              {l === "english" ? "EN" : "हि"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          className="h-7 pl-7 text-xs"
          placeholder="Search templates…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`text-[10px] px-2 py-0.5 rounded border ${
              group === g ? "bg-accent/20 border-accent text-accent" : "border-border text-muted-foreground"
            }`}
          >
            {g === "all" ? "All" : GROUP_LABEL[g]}
          </button>
        ))}
      </div>

      {/* Favs + recent chips */}
      {(favs.length > 0 || recent.length > 0) && (
        <div className="space-y-1">
          {favs.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Star className="h-2.5 w-2.5 text-warning" />
              {favs.map((s) => (
                <button key={s} onClick={() => setStage(s)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${stage === s ? "bg-primary/15 border-primary" : "border-border"}`}>
                  {WA_TEMPLATES[s].label}
                </button>
              ))}
            </div>
          )}
          {recent.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              {recent.slice(0, 4).map((s) => (
                <button key={s} onClick={() => setStage(s)}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${stage === s ? "bg-primary/15 border-primary" : "border-border text-muted-foreground"}`}>
                  {WA_TEMPLATES[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template list */}
      <div className="max-h-32 overflow-y-auto space-y-0.5 border border-border rounded">
        {filteredEntries.length === 0 && (
          <div className="text-[11px] text-muted-foreground italic p-2">No matches.</div>
        )}
        {filteredEntries.map(([key, v]) => (
          <button
            key={key}
            onClick={() => setStage(key)}
            className={`w-full text-left text-xs px-2 py-1 flex items-center justify-between ${
              stage === key ? "bg-primary/10" : "hover:bg-muted/40"
            }`}
          >
            <span className="truncate">{v.label}</span>
            <span className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className="text-[9px] px-1 py-0">{v.group}</Badge>
              <Star
                className={`h-2.5 w-2.5 ${favs.includes(key) ? "text-warning fill-warning" : "text-muted-foreground"}`}
                onClick={(e) => { e.stopPropagation(); toggleFav(key); }}
              />
            </span>
          </button>
        ))}
      </div>

      {/* Editable preview */}
      <Textarea
        value={finalMessage}
        onChange={(e) => setEdited(e.target.value)}
        rows={4}
        className="text-xs resize-none"
      />
      {edited !== null && (
        <button
          onClick={() => setEdited(null)}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Reset to template
        </button>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5" onClick={copy}>
          <Copy className="h-3 w-3" /> Copy
        </Button>
        <Button size="sm" className="flex-1 h-8 text-xs gap-1.5" onClick={sendNow}>
          <ExternalLink className="h-3 w-3" /> WhatsApp
        </Button>
      </div>
    </div>
  );
}
