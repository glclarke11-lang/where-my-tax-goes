import "leaflet/dist/leaflet.css";
import { PageTransition } from "@/components/PageTransition";
import { useTaxStore } from "@/hooks/use-tax-store";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMapEvents } from "react-leaflet";
import { useState, useCallback, useEffect } from "react";
import { useMarkExplored } from "@/hooks/use-explore-tracker";
import {
  MAP_LOCATIONS,
  CATEGORY_CONFIG,
  type MapLocation,
  type MapCategory,
} from "@/data/moneyMapData";
import { AUSTRALIA_BUDGET, TOTAL_BUDGET_BILLIONS_AUD } from "@/data/australiaBudget";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  MapPin, X, Calculator, DollarSign, Building2, Filter,
  ChevronRight, Layers, TrendingUp, Zap,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: MapCategory[] = [
  "Healthcare", "Education", "Defence", "Infrastructure", "Environment",
];

// ── Static map data ──────────────────────────────────────────────────────────

const CANBERRA: [number, number] = [-35.28, 149.13];

// Heatmap blobs — one per major region, colour-scaled by spending intensity
type HeatWeights = { all: number } & Record<MapCategory, number>;

interface HeatRegion {
  name: string;
  lat: number;
  lng: number;
  weights: HeatWeights;
}

const HEATMAP_REGIONS: HeatRegion[] = [
  { name: "Sydney",       lat: -33.87,  lng: 151.21,  weights: { all: 0.92, Healthcare: 0.90, Education: 0.90, Defence: 0.80, Infrastructure: 0.95, Environment: 0.30 } },
  { name: "Melbourne",    lat: -37.81,  lng: 144.96,  weights: { all: 0.87, Healthcare: 0.85, Education: 0.92, Defence: 0.65, Infrastructure: 0.90, Environment: 0.45 } },
  { name: "Canberra",     lat: -35.28,  lng: 149.13,  weights: { all: 0.96, Healthcare: 0.60, Education: 0.90, Defence: 0.95, Infrastructure: 0.50, Environment: 0.85 } },
  { name: "Brisbane",     lat: -27.47,  lng: 153.02,  weights: { all: 0.72, Healthcare: 0.72, Education: 0.75, Defence: 0.68, Infrastructure: 0.78, Environment: 0.60 } },
  { name: "Gold Coast",   lat: -27.99,  lng: 153.40,  weights: { all: 0.52, Healthcare: 0.65, Education: 0.38, Defence: 0.28, Infrastructure: 0.60, Environment: 0.38 } },
  { name: "Perth",        lat: -31.95,  lng: 115.86,  weights: { all: 0.62, Healthcare: 0.60, Education: 0.65, Defence: 0.78, Infrastructure: 0.70, Environment: 0.42 } },
  { name: "Adelaide",     lat: -34.93,  lng: 138.60,  weights: { all: 0.56, Healthcare: 0.55, Education: 0.55, Defence: 0.82, Infrastructure: 0.60, Environment: 0.32 } },
  { name: "Darwin",       lat: -12.46,  lng: 130.84,  weights: { all: 0.42, Healthcare: 0.40, Education: 0.35, Defence: 0.88, Infrastructure: 0.45, Environment: 0.52 } },
  { name: "Hobart",       lat: -42.88,  lng: 147.33,  weights: { all: 0.30, Healthcare: 0.34, Education: 0.35, Defence: 0.22, Infrastructure: 0.25, Environment: 0.62 } },
  { name: "Townsville",   lat: -19.26,  lng: 146.82,  weights: { all: 0.40, Healthcare: 0.34, Education: 0.30, Defence: 0.88, Infrastructure: 0.40, Environment: 0.44 } },
  { name: "Cairns",       lat: -16.92,  lng: 145.78,  weights: { all: 0.35, Healthcare: 0.28, Education: 0.24, Defence: 0.28, Infrastructure: 0.35, Environment: 0.78 } },
  { name: "Newcastle",    lat: -32.93,  lng: 151.78,  weights: { all: 0.50, Healthcare: 0.50, Education: 0.44, Defence: 0.72, Infrastructure: 0.54, Environment: 0.28 } },
  { name: "Wollongong",   lat: -34.42,  lng: 150.89,  weights: { all: 0.44, Healthcare: 0.42, Education: 0.38, Defence: 0.35, Infrastructure: 0.58, Environment: 0.25 } },
  { name: "Sunshine Coast",lat: -26.65, lng: 153.07,  weights: { all: 0.38, Healthcare: 0.50, Education: 0.30, Defence: 0.22, Infrastructure: 0.40, Environment: 0.35 } },
];

// Revenue flows: major cities → Canberra
interface RevFlow { from: [number, number]; label: string; color: string; }
const REVENUE_FLOWS: RevFlow[] = [
  { from: [-33.87, 151.21], label: "Sydney → Federal",    color: "#06B6D4" },
  { from: [-37.81, 144.96], label: "Melbourne → Federal", color: "#8B5CF6" },
  { from: [-27.47, 153.02], label: "Brisbane → Federal",  color: "#F59E0B" },
  { from: [-31.95, 115.86], label: "Perth → Federal",     color: "#F97316" },
  { from: [-34.93, 138.60], label: "Adelaide → Federal",  color: "#10B981" },
];

// Spending flows: Canberra → sectors
interface SpdFlow { to: [number, number]; label: string; color: string; category: MapCategory | "Welfare"; }
const SPENDING_FLOWS: SpdFlow[] = [
  { to: [-33.89, 151.19], label: "→ Healthcare",     color: "#10B981", category: "Healthcare"     },
  { to: [-37.80, 144.96], label: "→ Education",      color: "#3B82F6", category: "Education"      },
  { to: [-32.79, 151.84], label: "→ Defence",        color: "#EF4444", category: "Defence"        },
  { to: [-25.00, 152.50], label: "→ Infrastructure", color: "#F97316", category: "Infrastructure" },
  { to: [-18.00, 147.50], label: "→ Environment",    color: "#22C55E", category: "Environment"    },
  { to: [-32.00, 148.50], label: "→ Welfare",        color: "#8B5CF6", category: "Welfare"        },
];

// State population shares for regional impact
const STATE_SHARES = [
  { state: "NSW", share: 0.319, color: "#06B6D4", name: "New South Wales" },
  { state: "VIC", share: 0.265, color: "#8B5CF6", name: "Victoria"        },
  { state: "QLD", share: 0.205, color: "#F59E0B", name: "Queensland"      },
  { state: "WA",  share: 0.110, color: "#10B981", name: "Western Australia"},
  { state: "SA",  share: 0.071, color: "#F97316", name: "South Australia"  },
  { state: "TAS", share: 0.021, color: "#22C55E", name: "Tasmania"         },
  { state: "ACT", share: 0.017, color: "#3B82F6", name: "ACT"              },
  { state: "NT",  share: 0.010, color: "#EF4444", name: "Northern Territory"},
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUserContribution(estimatedTax: number, location: MapLocation): number {
  const totalBudgetAUD = TOTAL_BUDGET_BILLIONS_AUD * 1_000_000_000;
  return (estimatedTax / totalBudgetAUD) * location.annual_budget;
}

function getCategoryTotal(category: MapCategory): number {
  const budgetKey = CATEGORY_CONFIG[category].budgetKey;
  const macro = AUSTRALIA_BUDGET.find((m) => m.key === budgetKey);
  if (!macro) return 0;
  return macro.micros.reduce((s, m) => s + m.percentage, 0) * TOTAL_BUDGET_BILLIONS_AUD;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000)         return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(2)}`;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const p = (c: string) => ({ r: parseInt(c.slice(1,3),16), g: parseInt(c.slice(3,5),16), b: parseInt(c.slice(5,7),16) });
  const a = p(c1), b = p(c2);
  return `rgb(${Math.round(a.r+(b.r-a.r)*t)},${Math.round(a.g+(b.g-a.g)*t)},${Math.round(a.b+(b.b-a.b)*t)})`;
}

function intensityToColor(v: number): string {
  if (v < 0.33) return lerpColor("#2563EB", "#10B981", v / 0.33);
  if (v < 0.66) return lerpColor("#10B981", "#F59E0B", (v - 0.33) / 0.33);
  return lerpColor("#F59E0B", "#EF4444", (v - 0.66) / 0.34);
}

function bezierPath(
  from: [number, number],
  to:   [number, number],
  segments = 48,
): [number, number][] {
  const midLat = (from[0] + to[0]) / 2;
  const midLng = (from[1] + to[1]) / 2;
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const cp: [number, number] = [midLat - dx * 0.18, midLng + dy * 0.18];
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, mt = 1 - t;
    pts.push([
      mt*mt*from[0] + 2*mt*t*cp[0] + t*t*to[0],
      mt*mt*from[1] + 2*mt*t*cp[1] + t*t*to[1],
    ]);
  }
  return pts;
}

// ── Map sub-components ───────────────────────────────────────────────────────

function MapClickClear({ onClear }: { onClear: () => void }) {
  useMapEvents({ click: onClear });
  return null;
}

function HeatmapLayer({ activeCategories }: { activeCategories: Set<MapCategory> }) {
  const allActive = activeCategories.size === ALL_CATEGORIES.length;
  return (
    <>
      {HEATMAP_REGIONS.map((region) => {
        const intensity = allActive
          ? region.weights.all
          : [...activeCategories].reduce((sum, c) => sum + (region.weights[c] ?? 0), 0) / activeCategories.size;
        const color = intensityToColor(intensity);
        return (
          <CircleMarker
            key={`heat-${region.name}`}
            center={[region.lat, region.lng]}
            radius={70 + intensity * 55}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.14 + intensity * 0.12,
              color: color,
              opacity: 0,
              weight: 0,
            }}
          />
        );
      })}
    </>
  );
}

function FlowCurrentsLayer({
  activeCategories,
}: {
  activeCategories: Set<MapCategory>;
}) {
  return (
    <>
      {/* Revenue flows: cities → Canberra */}
      {REVENUE_FLOWS.map((flow, i) => {
        const path = bezierPath(flow.from, CANBERRA);
        return (
          <span key={`rev-${i}`}>
            {/* glow track */}
            <Polyline positions={path} pathOptions={{ color: flow.color, weight: 6, opacity: 0.10, dashArray: "10 12", className: "lf-rev-glow" }} />
            {/* animated particles */}
            <Polyline positions={path} pathOptions={{ color: flow.color, weight: 2, opacity: 0.85, dashArray: "7 15", className: "lf-rev-core" }} />
          </span>
        );
      })}

      {/* Spending flows: Canberra → sectors */}
      {SPENDING_FLOWS.map((flow, i) => {
        if (flow.category !== "Welfare" && !activeCategories.has(flow.category as MapCategory)) return null;
        const path = bezierPath(CANBERRA, flow.to);
        return (
          <span key={`spd-${i}`}>
            {/* glow track */}
            <Polyline positions={path} pathOptions={{ color: flow.color, weight: 6, opacity: 0.10, dashArray: "8 14", className: "lf-spd-glow" }} />
            {/* animated particles */}
            <Polyline positions={path} pathOptions={{ color: flow.color, weight: 2, opacity: 0.80, dashArray: "5 17", className: "lf-spd-core" }} />
          </span>
        );
      })}
    </>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function FollowTheMoney() {
  useMarkExplored("money-map");
  const { result } = useTaxStore();
  const estimatedTax = result?.estimatedTax ?? 18_000;
  const isDemoMode = !result?.estimatedTax;

  const [activeCategories, setActiveCategories] = useState<Set<MapCategory>>(
    new Set(ALL_CATEGORIES)
  );
  const [selected, setSelected]         = useState<MapLocation | null>(null);
  const [showHeatmap, setShowHeatmap]   = useState(false);
  const [showFlows, setShowFlows]       = useState(false);
  const [showMarkers, setShowMarkers]   = useState(true);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);

  const toggleCategory = (cat: MapCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size === 1) return next;
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
    setSelected(null);
  };

  const handleMarkerClick = useCallback((loc: MapLocation) => {
    setSelected(loc);
  }, []);

  const visibleLocations = MAP_LOCATIONS.filter((loc) =>
    activeCategories.has(loc.category)
  );

  const totalUserMapped = visibleLocations.reduce(
    (sum, loc) => sum + getUserContribution(estimatedTax, loc),
    0
  );

  const userContrib = selected ? getUserContribution(estimatedTax, selected) : 0;
  const catConfig   = selected ? CATEGORY_CONFIG[selected.category] : null;

  const activeLayers = [showHeatmap, showFlows, showMarkers].filter(Boolean).length;

  return (
    <PageTransition>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2">Follow the Money Map</h1>
          <p className="text-muted-foreground">
            See where your taxes fund real infrastructure and services across Australia.{" "}
            {isDemoMode && (
              <span className="text-primary/80">
                Showing example contribution (
                <Link href="/calculator" className="underline underline-offset-2 hover:text-primary transition-colors">
                  calculate yours
                </Link>
                ).
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="glass-panel rounded-xl px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Your tax: </span>
            <span className="font-bold text-primary">{formatCurrency(estimatedTax)}</span>
            {isDemoMode && <span className="text-muted-foreground text-xs ml-1">(demo)</span>}
          </div>
          <div className="glass-panel rounded-xl px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Mapped: </span>
            <span className="font-bold text-accent">{formatCurrency(totalUserMapped)}</span>
          </div>
        </div>
      </div>

      {/* ── Category Filters ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {ALL_CATEGORIES.map((cat) => {
          const cfg     = CATEGORY_CONFIG[cat];
          const isActive = activeCategories.has(cat);
          const count   = MAP_LOCATIONS.filter((l) => l.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                isActive
                  ? "border-transparent text-white shadow-md"
                  : "border-white/10 text-muted-foreground bg-transparent hover:border-white/20"
              }`}
              style={isActive ? { backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}55` } : {}}
            >
              <span>{cfg.icon}</span>
              {cat}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-white/10 text-muted-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {visibleLocations.length} locations
        </span>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-[55vh] sm:h-[calc(100vh-20rem)] min-h-[300px] sm:min-h-[460px]"
      >
        <MapContainer
          center={[-25.2744, 133.7751]}
          zoom={4}
          style={{ height: "100%", width: "100%", background: "#0d1117" }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          <MapClickClear onClear={() => setSelected(null)} />

          {/* ── Heatmap layer ── */}
          {showHeatmap && <HeatmapLayer activeCategories={activeCategories} />}

          {/* ── Flow currents layer ── */}
          {showFlows && <FlowCurrentsLayer activeCategories={activeCategories} />}

          {/* ── Site markers ── */}
          {showMarkers && visibleLocations.map((loc) => {
            const cfg        = CATEGORY_CONFIG[loc.category];
            const isSelected = selected?.id === loc.id;
            return (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={isSelected ? 14 : 9}
                pathOptions={{
                  fillColor: cfg.color,
                  fillOpacity: isSelected ? 1 : 0.82,
                  color: isSelected ? "#ffffff" : cfg.color,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(loc);
                  },
                  mouseover: (e) => { e.target.setStyle({ radius: isSelected ? 14 : 11, fillOpacity: 1 }); },
                  mouseout:  (e) => { e.target.setStyle({ radius: isSelected ? 14 : 9,  fillOpacity: isSelected ? 1 : 0.82 }); },
                }}
              />
            );
          })}
        </MapContainer>

        {/* ── Layer control panel ─────────────────────────────────────── */}
        <div
          className="absolute top-3 right-3 z-[1000] rounded-xl overflow-hidden"
          style={{ background: "rgba(13,17,26,0.94)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => setLayerPanelOpen((p) => !p)}
            className="flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-white/5 transition-colors w-full"
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Layers</span>
            {activeLayers < 3 && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                {activeLayers}
              </span>
            )}
          </button>

          <AnimatePresence>
            {layerPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden border-t border-white/8"
              >
                <div className="px-3 py-2.5 space-y-1 min-w-[170px]">
                  {[
                    { label: "Spending Sites",  icon: "📍", value: showMarkers,  set: setShowMarkers  },
                    { label: "Spending Heatmap",icon: "🌡️", value: showHeatmap,  set: setShowHeatmap  },
                    { label: "Money Flows",     icon: "⚡", value: showFlows,    set: setShowFlows    },
                  ].map((layer) => (
                    <button
                      key={layer.label}
                      onClick={() => layer.set((v) => !v)}
                      className={`flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        layer.value
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-white/5"
                      }`}
                    >
                      <span className="text-sm">{layer.icon}</span>
                      {layer.label}
                      <span
                        className={`ml-auto w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-colors ${
                          layer.value ? "bg-primary border-primary" : "border-white/25"
                        }`}
                      >
                        {layer.value && <span className="text-primary-foreground text-[8px] font-bold">✓</span>}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Flow legend */}
                {showFlows && (
                  <div className="px-3 py-2 border-t border-white/8 space-y-1">
                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5">Active flows</p>
                    {REVENUE_FLOWS.map((f) => (
                      <div key={f.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-4 h-0.5 rounded-full" style={{ background: f.color }} />
                        {f.label}
                      </div>
                    ))}
                    {SPENDING_FLOWS.filter((f) => f.category === "Welfare" || activeCategories.has(f.category as MapCategory)).map((f) => (
                      <div key={f.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-4 h-0.5 rounded-full" style={{ background: f.color }} />
                        {f.label}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Category legend (top-left) ───────────────────────────────── */}
        <div
          className="absolute top-3 left-3 z-[1000] rounded-xl p-2.5 text-[11px] space-y-1.5"
          style={{ background: "rgba(13,17,26,0.90)", backdropFilter: "blur(8px)" }}
        >
          {ALL_CATEGORIES.filter((c) => activeCategories.has(c)).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const userCatAlloc =
              (estimatedTax / (TOTAL_BUDGET_BILLIONS_AUD * 1e9)) *
              MAP_LOCATIONS.filter((l) => l.category === cat).reduce((s, l) => s + l.annual_budget, 0);
            return (
              <div key={cat} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}88` }} />
                <span className="text-muted-foreground">{cat}</span>
                <span className="ml-auto font-medium tabular-nums pl-4" style={{ color: cfg.color }}>
                  {formatCurrency(userCatAlloc)}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Heatmap colour scale legend ──────────────────────────────── */}
        {showHeatmap && (
          <div
            className="absolute bottom-10 left-3 z-[1000] rounded-xl p-2.5 text-[10px]"
            style={{ background: "rgba(13,17,26,0.90)", backdropFilter: "blur(8px)" }}
          >
            <p className="text-muted-foreground/60 uppercase tracking-wider mb-1.5 font-semibold">Spending Intensity</p>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-28 rounded-full"
                style={{ background: "linear-gradient(to right, #2563EB, #10B981, #F59E0B, #EF4444)" }}
              />
            </div>
            <div className="flex justify-between mt-0.5 text-muted-foreground/50">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        )}

        {/* ── Selected Location Detail Card ────────────────────────────── */}
        <AnimatePresence>
          {selected && catConfig && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[360px] z-[1000]"
            >
              <div
                className="rounded-2xl overflow-hidden shadow-2xl border"
                style={{
                  background: "rgba(15,17,26,0.97)",
                  borderColor: `${catConfig.color}55`,
                  boxShadow: `0 0 30px ${catConfig.color}22`,
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="h-1.5 w-full" style={{ background: catConfig.color }} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl shrink-0">{catConfig.icon}</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base leading-tight truncate">{selected.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${catConfig.color}22`, color: catConfig.color }}
                          >
                            {selected.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{selected.state}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{selected.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground font-medium">Annual Funding</span>
                      </div>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(selected.annual_budget)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">AUD total budget</p>
                    </div>
                    <div
                      className="rounded-xl p-3"
                      style={{ background: `${catConfig.color}18`, border: `1px solid ${catConfig.color}33` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5" style={{ color: catConfig.color }} />
                        <span className="text-[11px] font-medium" style={{ color: catConfig.color }}>Your Contribution</span>
                      </div>
                      <p className="text-lg font-bold tabular-nums" style={{ color: catConfig.color }}>
                        {formatCurrency(userContrib)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">of your {formatCurrency(estimatedTax)} tax</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                    Calculated as your tax ÷ total federal budget × this facility's allocation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tap hint ─────────────────────────────────────────────────── */}
        {!selected && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[999] px-3 py-1.5 rounded-full text-xs text-muted-foreground flex items-center gap-1.5 pointer-events-none"
            style={{ background: "rgba(13,17,26,0.80)", backdropFilter: "blur(8px)" }}
          >
            <MapPin className="w-3 h-3" />
            Click any marker to see your contribution
          </div>
        )}
      </div>

      {/* ── Regional Impact Panel ────────────────────────────────────────── */}
      <div className="mt-6 glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm">Your Tax by State</h3>
            <p className="text-xs text-muted-foreground">
              Estimated contribution based on population share
              {isDemoMode && " · using $18,000 demo figure"}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(estimatedTax)}</p>
            <p className="text-[10px] text-muted-foreground">total annual tax</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATE_SHARES.map(({ state, share, color, name }) => {
            const contribution = estimatedTax * share;
            const barPct = (share / 0.319) * 100;
            return (
              <div
                key={state}
                className="rounded-xl p-3 border border-white/6 transition-all hover:border-white/15"
                style={{ background: `${color}08` }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-sm" style={{ color }}>{state}</span>
                  <span className="text-[10px] text-muted-foreground">{(share * 100).toFixed(1)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 truncate">{name}</p>
                <p className="text-base font-bold tabular-nums" style={{ color }}>
                  {formatCurrency(contribution)}
                </p>
                <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-3">
          Estimates based on population share. Actual federal allocation varies by need, grants, and policy priorities.
        </p>
      </div>

      {/* ── Summary Grid ─────────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const cfg   = CATEGORY_CONFIG[cat];
          const locs  = MAP_LOCATIONS.filter((l) => l.category === cat);
          const totalUserForCat = locs.reduce((s, l) => s + getUserContribution(estimatedTax, l), 0);
          const isActive = activeCategories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`rounded-xl p-3 text-left transition-all duration-200 border ${
                isActive ? "border-transparent" : "border-white/5 opacity-40"
              }`}
              style={
                isActive
                  ? { background: `${cfg.color}12`, borderColor: `${cfg.color}30` }
                  : { background: "rgba(255,255,255,0.02)" }
              }
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{cfg.icon}</span>
                <span className="text-xs font-semibold" style={{ color: isActive ? cfg.color : undefined }}>{cat}</span>
              </div>
              <p className="text-base font-bold tabular-nums">{formatCurrency(totalUserForCat)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">across {locs.length} sites</p>
            </button>
          );
        })}
      </div>

      {/* ── "Enable Money Flows" prompt ──────────────────────────────────── */}
      {!showFlows && (
        <div
          className="mt-4 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.18)" }}
        >
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">See Money Flows in Action</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable the <span className="font-medium text-cyan-400">Money Flows</span> layer to watch animated economic currents travel from major cities to Canberra and out to each spending sector.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowFlows(true); setLayerPanelOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/20 transition-colors shrink-0"
          >
            <Zap className="w-4 h-4" />
            Show Flows
          </button>
        </div>
      )}

      {/* ── Calculator CTA ──────────────────────────────────────────────── */}
      {isDemoMode && (
        <div
          className="mt-4 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: "rgba(var(--primary-rgb),0.08)", border: "1px solid rgba(var(--primary-rgb),0.2)" }}
        >
          <div className="flex items-start gap-3">
            <Calculator className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Using demo data ($18,000 tax)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter your income in the calculator to see your real tax contribution mapped to each facility.
              </p>
            </div>
          </div>
          <Link
            href="/calculator"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
          >
            Calculate My Tax
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </PageTransition>
  );
}
