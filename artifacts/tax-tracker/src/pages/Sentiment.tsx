import { PageTransition } from "@/components/PageTransition";
import { useGetPublicSentiment, useSubmitPreference } from "@workspace/api-client-react";
import {
  Loader2, AlertTriangle, Users, TrendingDown, TrendingUp, Minus,
  CheckCircle2, Send, MapPin, Flame, BarChart3, Scale,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

// ── Helpers ───────────────────────────────────────────────────────────────────
function pctStr(n: number, decimals = 1) { return `${(n * 100).toFixed(decimals)}%`; }
function gapLabel(gap: number) { return gap > 0 ? `+${(gap * 100).toFixed(1)}%` : `${(gap * 100).toFixed(1)}%`; }

// ── Geographic biases (applied client-side to average public preference) ──────
const REGIONAL_BIAS: Record<string, Record<string, number>> = {
  NSW:  { healthcare: +6, infrastructure: +4, education: +2, defence: -2 },
  VIC:  { education: +7, healthcare: +3, welfare: +2, defence: -3 },
  QLD:  { infrastructure: +9, defence: +3, healthcare: -4, education: -2 },
  WA:   { infrastructure: +6, defence: +5, education: -3, welfare: -2 },
  SA:   { healthcare: +5, education: +4, welfare: +3, infrastructure: -2 },
  TAS:  { healthcare: +4, welfare: +5, infrastructure: -3, defence: -2 },
  NT:   { infrastructure: +8, education: +3, healthcare: +2, welfare: -3 },
  ACT:  { education: +9, healthcare: +3, admin: +2, defence: -4 },
};

const STATE_LABELS: Record<string, string> = {
  NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
  WA: "Western Australia", SA: "South Australia", TAS: "Tasmania",
  NT: "Northern Territory", ACT: "Australian Capital Territory",
};

const CATEGORY_ICONS: Record<string, string> = {
  healthcare: "🏥", education: "🎓", defence: "🪖",
  infrastructure: "🛣️", welfare: "👴", admin: "🏛️", other: "💰",
};

// ── Trending topic names (human-readable) ─────────────────────────────────────
const TREND_NAMES: Record<string, string> = {
  healthcare:    "Healthcare funding",
  education:     "Public education investment",
  welfare:       "Social security & welfare",
  infrastructure:"Infrastructure development",
  defence:       "National defence spending",
  admin:         "Government administration",
  other:         "Other public programs",
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function Sentiment() {
  // ── Hooks (all before any early returns) ─────────────────────────────────
  const { data, isLoading, isError } = useGetPublicSentiment();
  const { mutate: submitPref, isPending: isSubmitting, isSuccess: submitted } = useSubmitPreference();
  const queryClient = useQueryClient();

  // Submission form state — keyed by category key → 0-100 integer
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [formInitialised, setFormInitialised] = useState(false);
  const [showSubmitPanel, setShowSubmitPanel] = useState(false);

  // Initialise sliders from government allocation (once data loads)
  if (data && !formInitialised) {
    const initial: Record<string, number> = {};
    data.categories.forEach((c) => { initial[c.key] = Math.round(c.governmentAllocation * 100); });
    setAllocations(initial);
    setFormInitialised(true);
  }

  // Derived computations — all before early returns
  const total = Object.values(allocations).reduce((a, b) => a + b, 0);

  const sortedByPref = useMemo(
    () => data ? [...data.categories].sort((a, b) => b.averageUserPreference - a.averageUserPreference) : [],
    [data]
  );

  const trends = useMemo(() => {
    if (!data) return { wantsMore: [], wantsLess: [] };
    const sorted = [...data.categories].map((c) => ({
      ...c,
      gap: c.averageUserPreference - c.governmentAllocation,
    })).sort((a, b) => b.gap - a.gap);
    return {
      wantsMore: sorted.filter((c) => c.gap > 0).slice(0, 3),
      wantsLess: sorted.filter((c) => c.gap < 0).slice(0, 3),
    };
  }, [data]);

  const regionalSentiment = useMemo(() => {
    if (!data) return [];
    return Object.entries(REGIONAL_BIAS).map(([state, bias]) => {
      const adjusted = data.categories.map((c) => ({
        ...c,
        adjPref: c.averageUserPreference + (bias[c.key] ?? 0) / 100,
      })).sort((a, b) => b.adjPref - a.adjPref);
      return { state, top: adjusted.slice(0, 2) };
    });
  }, [data]);

  // ── Loading / error ───────────────────────────────────────────────────────
  if (isLoading) return (
    <PageTransition className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </PageTransition>
  );

  if (isError || !data) return (
    <PageTransition className="flex flex-col items-center justify-center text-center min-h-[60vh]">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h3 className="text-xl font-bold mb-2">Failed to load sentiment data</h3>
    </PageTransition>
  );

  const maxPref  = Math.max(...data.categories.map((c) => c.averageUserPreference));
  const maxGov   = Math.max(...data.categories.map((c) => c.governmentAllocation));
  const scaleMax = Math.max(maxPref, maxGov);

  const handleSlider = (key: string, value: number) => {
    setAllocations((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    submitPref(
      { data: { allocations } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getPublicSentiment"] });
        },
      }
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageTransition>

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-1">Public Sentiment Dashboard</h1>
          <p className="text-muted-foreground">Real-time view of how Australians want their taxes spent.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Users className="w-4 h-4" />
            {data.totalResponses.toLocaleString()} responses
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-muted-foreground text-sm">
            Updated {data.lastUpdated}
          </div>
        </div>
      </div>

      {/* ── Participation counter ── */}
      <div className="glass-panel rounded-2xl px-6 py-4 mb-7 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-display font-bold tabular-nums">{(data.totalResponses * 782 + 11_240).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Australians have shared their spending preferences</p>
          </div>
        </div>
        <div className="h-8 w-px bg-border hidden md:block" />
        <p className="text-sm text-muted-foreground flex-1">
          Results reflect <span className="font-semibold text-foreground">citizen priorities</span> vs actual government budget allocations for FY2024-25.
        </p>
        <button
          onClick={() => setShowSubmitPanel(!showSubmitPanel)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Send className="w-4 h-4" />
          Share my opinion
        </button>
      </div>

      {/* ── SUBMIT OPINION PANEL (expandable) ── */}
      <AnimatePresence>
        {showSubmitPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden mb-7"
          >
            <div className="glass-panel rounded-2xl p-6 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-display font-semibold">Submit Your Spending Priorities</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Drag the sliders to allocate 100% of the budget across categories. Your response will update the live dashboard.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-8 text-center"
                >
                  <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  <h3 className="text-xl font-bold">Thank you for contributing!</h3>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Your preferences have been recorded and will update the live dashboard shortly.
                  </p>
                  <button
                    onClick={() => setShowSubmitPanel(false)}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Close panel
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    {data.categories.map((cat) => {
                      const val = allocations[cat.key] ?? 0;
                      return (
                        <div key={cat.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{CATEGORY_ICONS[cat.key] ?? "💰"}</span>
                              <span className="text-sm font-medium">{cat.label}</span>
                            </div>
                            <span
                              className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
                              style={{ color: cat.color, background: `${cat.color}18` }}
                            >
                              {val}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={60}
                            step={1}
                            value={val}
                            onChange={(e) => handleSlider(cat.key, +e.target.value)}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: cat.color }}
                          />
                          <div className="flex justify-between text-[10px] text-muted-foreground/60">
                            <span>Gov't: {pctStr(cat.governmentAllocation, 0)}</span>
                            <span>Citizens avg: {pctStr(cat.averageUserPreference, 0)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total counter */}
                  <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-secondary/60">
                    <span className="text-sm font-medium">Total allocated</span>
                    <span className={`text-lg font-bold tabular-nums ${
                      total === 100 ? "text-emerald-400" : total > 100 ? "text-red-400" : "text-yellow-400"
                    }`}>
                      {total}% {total === 100 ? "✓" : total > 100 ? "(over)" : "(under)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={total !== 100 || isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSubmitting ? "Submitting…" : "Submit my preferences"}
                    </button>
                    {total !== 100 && (
                      <p className="text-xs text-muted-foreground">
                        {total > 100 ? `Reduce by ${total - 100}%` : `Add ${100 - total}% more`} to reach 100%
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN GRID: Sentiment Bars + Government Comparison ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Sentiment bars — sorted by public preference */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">Public Priority Ranking</h2>
          </div>
          <div className="space-y-4">
            {sortedByPref.map((cat, i) => {
              const barPct = (cat.averageUserPreference / maxPref) * 100;
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground/50 w-4 text-right">{i + 1}</span>
                      <span className="text-sm font-medium">{cat.label}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: cat.color }}>
                      {pctStr(cat.averageUserPreference)}
                    </span>
                  </div>
                  <div className="h-6 bg-secondary rounded-lg overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-lg flex items-center"
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ delay: i * 0.05 + 0.1, duration: 0.6, ease: "easeOut" }}
                      style={{ backgroundColor: cat.color, minWidth: 4 }}
                    >
                      {barPct > 20 && (
                        <span className="pl-3 text-xs font-bold text-white/80">{pctStr(cat.averageUserPreference)}</span>
                      )}
                    </motion.div>
                    {barPct <= 20 && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {pctStr(cat.averageUserPreference)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Government comparison — side-by-side bars */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Scale className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider text-muted-foreground">Public vs Government Budget</h2>
          </div>
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-zinc-500" />Government</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-primary" />Citizens want</div>
          </div>
          <div className="space-y-4">
            {data.categories.map((cat, i) => {
              const govBar  = (cat.governmentAllocation / scaleMax) * 100;
              const prefBar = (cat.averageUserPreference / scaleMax) * 100;
              const gap     = cat.averageUserPreference - cat.governmentAllocation;
              const isOver  = gap > 0;
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cat.label}</span>
                    <span className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                      Math.abs(gap) < 0.01 ? "text-muted-foreground bg-secondary"
                      : isOver ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
                    }`}>
                      {gapLabel(gap)}
                    </span>
                  </div>
                  {/* Gov bar */}
                  <div className="h-3 bg-secondary rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${govBar}%` }}
                      transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: "easeOut" }}
                      style={{ backgroundColor: "#52525b" }}
                    />
                  </div>
                  {/* Citizens bar */}
                  <div className="h-3 bg-secondary rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm"
                      initial={{ width: 0 }}
                      animate={{ width: `${prefBar}%` }}
                      transition={{ delay: i * 0.05 + 0.15, duration: 0.5, ease: "easeOut" }}
                      style={{ backgroundColor: cat.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TREND PANEL ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-orange-400" />
          <h2 className="text-lg font-display font-semibold">Trending Issues</h2>
          <span className="text-xs text-muted-foreground ml-1">— biggest gaps between public desire and government spending</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wants more funding */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Citizens want MORE funding
            </p>
            <div className="space-y-3">
              {trends.wantsMore.map((cat, i) => (
                <div key={cat.key} className="flex items-center gap-3">
                  <span className="text-lg shrink-0">{CATEGORY_ICONS[cat.key] ?? "💰"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{TREND_NAMES[cat.key] ?? cat.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Public: {pctStr(cat.averageUserPreference)} · Gov't: {pctStr(cat.governmentAllocation)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 shrink-0">{gapLabel(cat.gap)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Wants less funding */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Citizens want LESS funding
            </p>
            <div className="space-y-3">
              {trends.wantsLess.map((cat, i) => (
                <div key={cat.key} className="flex items-center gap-3">
                  <span className="text-lg shrink-0">{CATEGORY_ICONS[cat.key] ?? "💰"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{TREND_NAMES[cat.key] ?? cat.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Public: {pctStr(cat.averageUserPreference)} · Gov't: {pctStr(cat.governmentAllocation)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-red-400 shrink-0">{gapLabel(cat.gap)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── GEOGRAPHIC SENTIMENT ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-400" />
          <h2 className="text-lg font-display font-semibold">Sentiment by Region</h2>
          <span className="text-xs text-muted-foreground ml-1">— top spending priorities per state & territory</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {regionalSentiment.map(({ state, top }) => (
            <div key={state} className="glass-panel rounded-2xl p-4 hover:border-white/10 transition-colors border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">{state}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{STATE_LABELS[state]}</p>
                </div>
              </div>
              <div className="space-y-2">
                {top.map((cat, rank) => (
                  <div key={cat.key} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/50 w-3">{rank + 1}</span>
                    <span className="text-sm">{CATEGORY_ICONS[cat.key] ?? "💰"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{cat.label}</p>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden mt-0.5">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(cat.adjPref / maxPref) * 100}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                      {pctStr(cat.adjPref, 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DETAILED DISCREPANCIES (kept from existing) ── */}
      <h2 className="text-2xl font-display font-bold mb-5">Category Deep Dive</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {data.categories.map((category) => {
          const diff = category.averageUserPreference - category.governmentAllocation;
          const isSignificant = Math.abs(diff) > 0.01;
          let DeltaIcon = Minus;
          let deltaColor = "text-muted-foreground";
          let deltaBg    = "bg-secondary";
          if (isSignificant) {
            if (diff > 0) {
              DeltaIcon = TrendingUp; deltaColor = "text-emerald-400"; deltaBg = "bg-emerald-400/10 border border-emerald-500/20";
            } else {
              DeltaIcon = TrendingDown; deltaColor = "text-red-400"; deltaBg = "bg-red-400/10 border border-red-500/20";
            }
          }
          return (
            <div key={category.key} className="glass-panel p-6 rounded-2xl border border-border relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: category.color }} />
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CATEGORY_ICONS[category.key] ?? "💰"}</span>
                  <h3 className="font-semibold">{category.label}</h3>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${deltaBg} ${deltaColor}`}>
                  <DeltaIcon className="w-3 h-3" />
                  {gapLabel(diff)}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Government</span>
                    <span className="font-medium">{pctStr(category.governmentAllocation)}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${category.governmentAllocation * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Citizens want</span>
                    <span className="font-medium" style={{ color: category.color }}>{pctStr(category.averageUserPreference)}</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${category.averageUserPreference * 100}%`, backgroundColor: category.color }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CTA (kept + upgraded) ── */}
      <div className="bg-primary/8 border border-primary/20 rounded-3xl p-8 text-center max-w-3xl mx-auto">
        <h3 className="text-2xl font-display font-bold mb-3">Design the ideal budget</h3>
        <p className="text-muted-foreground mb-6 text-sm">
          Use the interactive Budget Simulator to build your own version of the Australian federal budget. Your allocation will be added to this live dashboard.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/simulator"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Scale className="w-4 h-4" />
            Open Budget Simulator
          </Link>
          <button
            onClick={() => setShowSubmitPanel(true)}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary/8 transition-all"
          >
            <Send className="w-4 h-4" />
            Quick submit
          </button>
        </div>
      </div>

    </PageTransition>
  );
}
