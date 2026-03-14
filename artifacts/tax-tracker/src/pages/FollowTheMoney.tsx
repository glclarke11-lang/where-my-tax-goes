import "leaflet/dist/leaflet.css";
import { PageTransition } from "@/components/PageTransition";
import { useTaxStore } from "@/hooks/use-tax-store";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import { useState, useCallback } from "react";
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
  MapPin,
  X,
  Calculator,
  DollarSign,
  Building2,
  Filter,
  ChevronRight,
} from "lucide-react";

const ALL_CATEGORIES: MapCategory[] = [
  "Healthcare",
  "Education",
  "Defence",
  "Infrastructure",
  "Environment",
];

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
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(2)}`;
}

function MapClickClear({ onClear }: { onClear: () => void }) {
  useMapEvents({ click: onClear });
  return null;
}

export default function FollowTheMoney() {
  const { result } = useTaxStore();
  const estimatedTax = result?.estimatedTax ?? 18_000;
  const isDemoMode = !result?.estimatedTax;

  const [activeCategories, setActiveCategories] = useState<Set<MapCategory>>(
    new Set(ALL_CATEGORIES)
  );
  const [selected, setSelected] = useState<MapLocation | null>(null);

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
  const catConfig = selected ? CATEGORY_CONFIG[selected.category] : null;

  return (
    <PageTransition>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Follow the Money Map</h1>
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
        <div className="flex items-center gap-3 shrink-0">
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

      {/* ── Category Filters ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {ALL_CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const isActive = activeCategories.has(cat);
          const count = MAP_LOCATIONS.filter((l) => l.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                isActive
                  ? "border-transparent text-white shadow-md"
                  : "border-white/10 text-muted-foreground bg-transparent hover:border-white/20"
              }`}
              style={
                isActive
                  ? { backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}55` }
                  : {}
              }
            >
              <span>{cfg.icon}</span>
              {cat}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-white/10 text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted-foreground">
          {visibleLocations.length} locations
        </span>
      </div>

      {/* ── Map ──────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
           style={{ height: "calc(100vh - 20rem)", minHeight: "420px" }}>
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

          {visibleLocations.map((loc) => {
            const cfg = CATEGORY_CONFIG[loc.category];
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
                  mouseover: (e) => {
                    e.target.setStyle({ radius: isSelected ? 14 : 11, fillOpacity: 1 });
                  },
                  mouseout: (e) => {
                    e.target.setStyle({ radius: isSelected ? 14 : 9, fillOpacity: isSelected ? 1 : 0.82 });
                  },
                }}
              />
            );
          })}
        </MapContainer>

        {/* ── Selected Location Detail Card ───────────────────── */}
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
                {/* Card top strip */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: catConfig.color }}
                />
                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl shrink-0">{catConfig.icon}</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base leading-tight truncate">
                          {selected.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${catConfig.color}22`, color: catConfig.color }}
                          >
                            {selected.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {selected.state}
                          </span>
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

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {selected.description}
                  </p>

                  {/* Budget + Contribution stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Annual Funding
                        </span>
                      </div>
                      <p className="text-lg font-bold tabular-nums">
                        {formatCurrency(selected.annual_budget)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">AUD total budget</p>
                    </div>

                    <div
                      className="rounded-xl p-3"
                      style={{ background: `${catConfig.color}18`, border: `1px solid ${catConfig.color}33` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="w-3.5 h-3.5" style={{ color: catConfig.color }} />
                        <span className="text-[11px] font-medium" style={{ color: catConfig.color }}>
                          Your Contribution
                        </span>
                      </div>
                      <p className="text-lg font-bold tabular-nums" style={{ color: catConfig.color }}>
                        {formatCurrency(userContrib)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        of your {formatCurrency(estimatedTax)} tax
                      </p>
                    </div>
                  </div>

                  {/* How it's calculated */}
                  <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                    Calculated as your tax ÷ total federal budget × this facility's allocation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Legend ─────────────────────────────────────────────── */}
        <div
          className="absolute top-3 left-3 z-[1000] rounded-xl p-2.5 text-[11px] space-y-1.5"
          style={{ background: "rgba(13,17,26,0.90)", backdropFilter: "blur(8px)" }}
        >
          {ALL_CATEGORIES.filter((c) => activeCategories.has(c)).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const catTotal = getCategoryTotal(cat);
            const userCatAlloc = (estimatedTax / (TOTAL_BUDGET_BILLIONS_AUD * 1e9)) *
              MAP_LOCATIONS.filter((l) => l.category === cat)
                .reduce((s, l) => s + l.annual_budget, 0);
            return (
              <div key={cat} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}88` }}
                />
                <span className="text-muted-foreground">{cat}</span>
                <span className="ml-auto font-medium tabular-nums pl-4" style={{ color: cfg.color }}>
                  {formatCurrency(userCatAlloc)}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Tap hint (mobile) ───────────────────────────────────── */}
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

      {/* ── Summary Grid ─────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {ALL_CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const locs = MAP_LOCATIONS.filter((l) => l.category === cat);
          const totalUserForCat = locs.reduce(
            (s, l) => s + getUserContribution(estimatedTax, l),
            0
          );
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
                <span className="text-xs font-semibold" style={{ color: isActive ? cfg.color : undefined }}>
                  {cat}
                </span>
              </div>
              <p className="text-base font-bold tabular-nums">
                {formatCurrency(totalUserForCat)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                across {locs.length} sites
              </p>
            </button>
          );
        })}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {isDemoMode && (
        <div className="mt-6 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
             style={{ background: "rgba(var(--primary-rgb),0.08)", border: "1px solid rgba(var(--primary-rgb),0.2)" }}>
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
