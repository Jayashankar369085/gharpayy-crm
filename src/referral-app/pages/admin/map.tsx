// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAdminStore } from "@/referral-app/lib/store";
import { useAdminGetLeads } from "@/referral-app/api";
import { AdminLayout } from "@/referral-app/components/admin-layout";
import { GHARPAYY_ZONES, zoneForLead } from "@/lib/gharpayy-zones";
import { CAPTAIN_BY_ID } from "@/lib/captains";
import { TIER_BY_ID } from "@/lib/pricing-tiers";
import { Map as MapIcon, Phone, MessageCircle, ExternalLink, X, Flame, Layers as LayersIcon } from "lucide-react";
import { AdminPitch } from "@/referral-app/components/admin/AdminPitch";

const STATUS_COLOR: Record<string, string> = {
  NEW: "#3B82F6",
  CONTACTED: "#6366F1",
  VERIFIED: "#F59E0B",
  MATCHED: "#A855F7",
  VISIT: "#EC4899",
  BOOKED: "#10B981",
  CLOSED: "#059669",
  LOST: "#EF4444",
};

const TILES = {
  dark: { url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", attribution: "&copy; OSM · CARTO", label: "Dark" },
  voyager: { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", attribution: "&copy; OSM · CARTO", label: "Streets" },
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "&copy; Esri", label: "Satellite" },
} as const;

export default function AdminMap() {
  const [, setLocation] = useLocation();
  const { isAdminAuthenticated } = useAdminStore();
  useEffect(() => { if (!isAdminAuthenticated) setLocation("/admin"); }, [isAdminAuthenticated, setLocation]);

  const { data } = useAdminGetLeads();
  const leads = data?.leads || [];

  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [tile, setTile] = useState<keyof typeof TILES>("dark");
  const [layers, setLayers] = useState({ leads: true, zones: true, hot: true });
  const [active, setActive] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() => leads.filter((l: any) => {
    if (zoneFilter !== "ALL" && zoneForLead(l)?.slug !== zoneFilter) return false;
    if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
    return true;
  }), [leads, zoneFilter, statusFilter]);

  const pins = useMemo(() => filtered.map((l: any, i: number) => {
    const z = zoneForLead(l) || GHARPAYY_ZONES[i % GHARPAYY_ZONES.length];
    const hash = (typeof l.id === "number" ? l.id : i) % 64;
    const dx = ((hash % 8) - 4) * 0.005;
    const dy = ((Math.floor(hash / 8)) - 4) * 0.005;
    return { lead: l, lat: z.lat + dy, lng: z.lng + dx, color: STATUS_COLOR[l.status] || "#94A3B8", zone: z };
  }), [filtered]);

  const zoneAggs = useMemo(() => {
    return GHARPAYY_ZONES.map((z) => {
      const zLeads = leads.filter((l: any) => zoneForLead(l)?.slug === z.slug);
      const open = zLeads.filter((l: any) => !["BOOKED", "CLOSED", "LOST"].includes(l.status)).length;
      const booked = zLeads.filter((l: any) => ["BOOKED", "CLOSED"].includes(l.status)).length;
      return { zone: z, open, booked, total: zLeads.length };
    });
  }, [leads]);

  if (!isAdminAuthenticated) return null;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <AdminPitch
          eyebrow="Live map · Gharpayy ops"
          title="The whole city, one screen"
          pitch={{
            why: "5 hero zones from gharpayy.com, drawn on the map you already trust.",
            how: "Every lead pin + zone heat ring. Click any pin → call · WhatsApp · open lead.",
            next: "Hover the hottest zone, then reassign breached leads to the on-duty expert.",
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4">
          {/* Map */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden" style={{ height: "min(78vh, 720px)" }}>
            {mounted ? <LeafletMap pins={pins} zoneAggs={zoneAggs} tile={tile} layers={layers} onPin={setActive} /> : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Loading map…</div>
            )}

            {/* Top bar overlay */}
            <div className="absolute top-3 left-3 right-3 z-[400] flex items-center gap-2 flex-wrap pointer-events-none">
              <div className="pointer-events-auto bg-black/80 backdrop-blur border border-slate-700 rounded-xl p-1.5 flex items-center gap-1">
                {(Object.keys(TILES) as (keyof typeof TILES)[]).map((k) => (
                  <button key={k} onClick={() => setTile(k)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                      tile === k ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"
                    }`}>{TILES[k].label}</button>
                ))}
              </div>
              <div className="pointer-events-auto bg-black/80 backdrop-blur border border-slate-700 rounded-xl px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                <LayersIcon className="w-3 h-3 text-slate-400" />
                <Toggle on={layers.leads} onClick={() => setLayers((s) => ({ ...s, leads: !s.leads }))} label="Leads" />
                <Toggle on={layers.zones} onClick={() => setLayers((s) => ({ ...s, zones: !s.zones }))} label="Zones" />
                <Toggle on={layers.hot} onClick={() => setLayers((s) => ({ ...s, hot: !s.hot }))} label="Heat" />
              </div>
              <div className="pointer-events-auto ml-auto bg-orange-500 text-white rounded-xl px-3 py-1.5 text-xs font-black flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> {pins.length} live pins
              </div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[400] bg-black/80 backdrop-blur border border-slate-700 rounded-xl p-2 text-[10px] text-white pointer-events-none">
              <div className="font-black uppercase tracking-widest mb-1 text-slate-400">Status</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {Object.entries(STATUS_COLOR).slice(0, 8).map(([s, c]) => (
                  <div key={s} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: c }} /> {s}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">Filter</div>
              <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="w-full bg-slate-800 text-slate-100 text-xs font-bold rounded-lg px-2 py-2 border border-slate-700">
                <option value="ALL">All 5 zones</option>
                {GHARPAYY_ZONES.map((z) => <option key={z.slug} value={z.slug}>{z.display}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-slate-800 text-slate-100 text-xs font-bold rounded-lg px-2 py-2 border border-slate-700">
                <option value="ALL">Any status</option>
                {Object.keys(STATUS_COLOR).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Zone heat (click to focus)</div>
              <div className="space-y-1.5">
                {zoneAggs.sort((a, b) => b.open - a.open).map(({ zone, open, booked, total }) => (
                  <button key={zone.slug} onClick={() => setZoneFilter(zone.slug)}
                    className={`w-full text-left flex items-center gap-2 p-2 rounded-lg border transition ${
                      zoneFilter === zone.slug ? "border-orange-500 bg-orange-500/10" : "border-slate-800 hover:border-slate-600 bg-slate-950"
                    }`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: zone.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{zone.display}</div>
                      <div className="text-[10px] text-slate-500 truncate">{zone.tagline}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-blue-400 leading-none">{open}</div>
                      <div className="text-[9px] uppercase text-slate-500 tracking-wider">open</div>
                    </div>
                    <div className="text-right shrink-0 ml-1">
                      <div className="text-sm font-black text-emerald-400 leading-none">{booked}</div>
                      <div className="text-[9px] uppercase text-slate-500 tracking-wider">won</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer */}
        {active && (
          <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/70" onClick={() => setActive(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 m-0 md:m-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-black text-orange-400 tracking-widest">{active.zone.display}</div>
                  <div className="text-lg font-black text-white truncate">{active.lead.leadName}</div>
                  <div className="text-xs text-slate-400 truncate">{active.lead.area} · {active.lead.personaId || "-"} · {(active.lead.tier && TIER_BY_ID[active.lead.tier]?.name) || "Classics"}</div>
                </div>
                <button onClick={() => setActive(null)} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: STATUS_COLOR[active.lead.status] }}>{active.lead.status}</span>
                <span className="text-[11px] text-slate-500">{new Date(active.lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a href={`tel:${active.lead.leadPhone}`} className="px-2 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-black text-center inline-flex items-center justify-center gap-1.5"><Phone className="w-3 h-3" /> Call</a>
                <a href={`https://wa.me/${(active.lead.leadPhone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="px-2 py-2.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-black text-center inline-flex items-center justify-center gap-1.5"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
                <button onClick={() => setLocation(`/admin/leads/${active.lead.id}`)} className="px-2 py-2.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-black inline-flex items-center justify-center gap-1.5"><ExternalLink className="w-3 h-3" /> Open</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Toggle({ on, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-2 py-0.5 rounded-md transition ${on ? "bg-orange-500 text-white" : "text-slate-500 hover:text-slate-200"}`}>{label}</button>
  );
}

// Lazy-loaded leaflet so it never executes during SSR
function LeafletMap({ pins, zoneAggs, tile, layers, onPin }: any) {
  const [RL, setRL] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([import("react-leaflet"), import("leaflet"), import("leaflet/dist/leaflet.css") as any])
      .then(([rl, leaflet]) => { if (alive) { setRL(rl); setL(leaflet.default || leaflet); } });
    return () => { alive = false; };
  }, []);

  if (!RL || !L) return <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">Loading Bengaluru…</div>;

  const { MapContainer, TileLayer, CircleMarker, Circle, Tooltip, Popup, LayerGroup, useMap } = RL;
  const tileCfg = TILES[tile];
  const maxOpen = Math.max(1, ...zoneAggs.map((z: any) => z.open || 0));

  function Sizer() {
    const map = useMap();
    useEffect(() => { const t = setTimeout(() => map.invalidateSize(), 80); return () => clearTimeout(t); }, [map]);
    return null;
  }

  return (
    <MapContainer center={[12.97, 77.64]} zoom={11} style={{ height: "100%", width: "100%", background: "#0f172a" }} preferCanvas>
      <Sizer />
      <TileLayer url={tileCfg.url} attribution={tileCfg.attribution} />

      {layers.zones && (
        <LayerGroup>
          {zoneAggs.map(({ zone, open, booked, total }: any) => (
            <Circle key={zone.slug} center={[zone.lat, zone.lng]} radius={1700}
              pathOptions={{ color: zone.color, weight: 2, fillColor: zone.color, fillOpacity: 0.08 }}>
              <Tooltip permanent direction="center" className="!bg-transparent !border-0 !shadow-none">
                <div style={{ background: "rgba(0,0,0,0.78)", border: `1px solid ${zone.color}`, borderRadius: 12, padding: "4px 8px", color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>
                  {zone.display}
                </div>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: zone.color, letterSpacing: 2 }}>{zone.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{zone.tagline}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{zone.amenity}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11 }}><b>{open}</b> open</span>
                    <span style={{ fontSize: 11 }}><b>{booked}</b> won</span>
                    <span style={{ fontSize: 11 }}><b>{total}</b> total</span>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}
        </LayerGroup>
      )}

      {layers.hot && (
        <LayerGroup>
          {zoneAggs.map(({ zone, open }: any) => {
            const r = 600 + (open / maxOpen) * 2400;
            return (
              <Circle key={zone.slug + "-heat"} center={[zone.lat, zone.lng]} radius={r}
                pathOptions={{ stroke: false, fillColor: "#FB923C", fillOpacity: 0.12 + (open / maxOpen) * 0.18 }} />
            );
          })}
        </LayerGroup>
      )}

      {layers.leads && (
        <LayerGroup>
          {pins.map((p: any, i: number) => (
            <CircleMarker key={(p.lead.id || "") + "-" + i}
              center={[p.lat, p.lng]} radius={6}
              pathOptions={{ color: "#fff", weight: 1.5, fillColor: p.color, fillOpacity: 0.95 }}
              eventHandlers={{ click: () => onPin(p) }}>
              <Tooltip>{p.lead.leadName} · {p.lead.status}</Tooltip>
            </CircleMarker>
          ))}
        </LayerGroup>
      )}
    </MapContainer>
  );
}
