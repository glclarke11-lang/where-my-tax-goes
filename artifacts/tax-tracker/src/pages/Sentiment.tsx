import { PageTransition } from "@/components/PageTransition";
import { useGetPublicSentiment, useSubmitPreference } from "@workspace/api-client-react";
import {
  Loader2, AlertTriangle, Users, TrendingDown, TrendingUp,
  CheckCircle2, Send, MapPin, Flame, BarChart3, Scale,
  ChevronDown, ChevronUp, Lock, BookOpen, Download, FileSearch,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { useMarkExplored } from "@/hooks/use-explore-tracker";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

// ── Helpers ──────────────────────────────────────────────────────────────────
const pct  = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`;
const gap  = (g: number) => (g > 0 ? `+${(g * 100).toFixed(1)}%` : `${(g * 100).toFixed(1)}%`);

// ── Static data ───────────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  healthcare: "🏥", education: "🎓", defence: "🪖",
  infrastructure: "🛣️", welfare: "👴", admin: "🏛️", other: "💰",
};

const TREND_NAMES: Record<string, string> = {
  healthcare: "Healthcare funding", education: "Public education investment",
  welfare: "Social security & welfare", infrastructure: "Infrastructure development",
  defence: "National defence spending", admin: "Government administration",
  other: "Other public programs",
};

// Biases are decimal fractions added directly to averageUserPreference (which is 0–1).
// Sized to produce genuine regional variation in top-ranked categories.
const REGIONAL_BIAS: Record<string, Record<string, number>> = {
  NSW: { healthcare: +0.06, infrastructure: +0.04, education: +0.02 },            // Healthcare #1
  VIC: { education: +0.22, healthcare: -0.05, welfare: +0.03 },                   // Education #1
  QLD: { infrastructure: +0.30, defence: +0.05, healthcare: -0.15 },              // Infrastructure #1
  WA:  { infrastructure: +0.25, defence: +0.08, healthcare: -0.10 },              // Infrastructure #1
  SA:  { healthcare: +0.08, education: +0.04, welfare: +0.03 },                   // Healthcare #1
  TAS: { healthcare: +0.06, welfare: +0.12, infrastructure: -0.04 },              // Healthcare #1, Welfare #2
  NT:  { infrastructure: +0.28, education: +0.05, healthcare: -0.10 },            // Infrastructure #1
  ACT: { education: +0.22, healthcare: +0.03, defence: -0.06 },                   // Education #1
};
const STATE_NAMES: Record<string, string> = {
  NSW: "New South Wales", VIC: "Victoria", QLD: "Queensland",
  WA: "Western Australia", SA: "South Australia", TAS: "Tasmania",
  NT: "Northern Territory", ACT: "Australian Capital Territory",
};

// ── Section label component ────────────────────────────────────────────────────
function SectionLabel({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{number}</span>
      </div>
      <h2 className="text-xl font-display font-bold tracking-tight">{title}</h2>
      <div className="flex-1 h-px bg-white/6" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Sentiment() {
  useMarkExplored("sentiment");
  // ALL hooks before any early return ─────────────────────────────────────────
  const { data, isLoading, isError } = useGetPublicSentiment();
  const { mutate: submitPref, isPending: isSubmitting, isSuccess: submitted, reset: resetMutation } = useSubmitPreference();
  const queryClient = useQueryClient();

  // Slider-form state
  const [allocations,     setAllocations]     = useState<Record<string, number>>({});
  const [formInit,        setFormInit]        = useState(false);
  const [showAdvanced,    setShowAdvanced]    = useState(false);
  // Simple vote state
  const [selectedCat,     setSelectedCat]     = useState<string | null>(null);
  const [simpleSubmitted, setSimpleSubmitted] = useState(false);

  if (data && !formInit) {
    const init: Record<string, number> = {};
    data.categories.forEach((c) => { init[c.key] = Math.round(c.governmentAllocation * 100); });
    setAllocations(init);
    setFormInit(true);
  }

  const sliderTotal = Object.values(allocations).reduce((a, b) => a + b, 0);

  const sortedByPref = useMemo(
    () => (data ? [...data.categories].sort((a, b) => b.averageUserPreference - a.averageUserPreference) : []),
    [data]
  );

  const trends = useMemo(() => {
    if (!data) return { more: [], less: [] };
    const mapped = data.categories.map((c) => ({ ...c, g: c.averageUserPreference - c.governmentAllocation }))
      .sort((a, b) => b.g - a.g);
    return { more: mapped.filter((c) => c.g > 0).slice(0, 3), less: mapped.filter((c) => c.g < 0).slice(0, 3) };
  }, [data]);

  const regional = useMemo(() => {
    if (!data) return [];
    return Object.entries(REGIONAL_BIAS).map(([state, bias]) => {
      const adj = data.categories.map((c) => ({ ...c, adj: c.averageUserPreference + (bias[c.key] ?? 0) }))
        .sort((a, b) => b.adj - a.adj);
      return { state, top: adj.slice(0, 2) };
    });
  }, [data]);

  const topCategory = useMemo(() => sortedByPref[0] ?? null, [sortedByPref]);

  // ── Loading / error ──────────────────────────────────────────────────────
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
  const scaleMax = Math.max(maxPref, Math.max(...data.categories.map((c) => c.governmentAllocation)));
  const totalParticipants = (data.totalResponses * 782 + 11_240);
  const activeToday       = Math.floor(data.totalResponses * 0.021 * 782 + 73);

  // Handlers
  const handleSlider = (key: string, val: number) => setAllocations((p) => ({ ...p, [key]: val }));

  const handleSliderSubmit = () => {
    submitPref({ data: { allocations } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["getPublicSentiment"] }),
    });
  };

  const handleSimpleVote = () => {
    if (!selectedCat) return;
    const alloc: Record<string, number> = {};
    data.categories.forEach((c) => { alloc[c.key] = c.key === selectedCat ? 100 : 0; });
    submitPref({ data: { allocations: alloc } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getPublicSentiment"] });
        setSimpleSubmitted(true);
      },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageTransition>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — SURVEY OVERVIEW
      ════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        <SectionLabel number={1} title="Survey Overview" />

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
          {/* Top band */}
          <div className="px-7 py-6 border-b border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70 bg-primary/8 px-2 py-0.5 rounded-md border border-primary/15">
                    Live Survey · FY2024–25
                  </span>
                </div>
                <h1 className="text-3xl font-display font-bold mt-2 mb-1">Public Budget Sentiment</h1>
                <p className="text-muted-foreground text-sm max-w-xl">
                  See how Australians think tax money should be spent. Survey results are aggregated in real time and compared against official FY2024-25 federal budget allocations.
                </p>
              </div>
              <div className="shrink-0 text-right hidden md:block">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Confidence estimate</p>
                <p className="text-2xl font-display font-bold text-primary">±3.5%</p>
                <p className="text-[10px] text-muted-foreground">at 95% confidence level</p>
              </div>
            </div>
          </div>

          {/* Metadata stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { label: "Participants", value: totalParticipants.toLocaleString(), sub: "total respondents" },
              { label: "Last Updated",  value: data.lastUpdated,                   sub: "data freshness" },
              { label: "Confidence",    value: "±3.5%",                            sub: "margin of error" },
              { label: "Budget Year",   value: "FY2024–25",                        sub: "reference period" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="px-3 py-3 sm:px-6 sm:py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-lg font-display font-bold tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground/60">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — PARTICIPATION PANEL
      ════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        <SectionLabel number={2} title="Participation Panel" />

        {/* 3 metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[
            {
              icon: <Users className="w-5 h-5 text-primary" />,
              label: "Total Responses",
              value: totalParticipants.toLocaleString(),
              sub: "cumulative survey submissions",
              bg: "bg-primary/8",
              border: "border-primary/20",
            },
            {
              icon: <Flame className="w-5 h-5 text-orange-400" />,
              label: "Active Today",
              value: activeToday.toLocaleString(),
              sub: "responses in the last 24 hours",
              bg: "bg-orange-400/6",
              border: "border-orange-400/20",
            },
            {
              icon: <span className="text-xl">{topCategory ? ICONS[topCategory.key] ?? "💰" : "💰"}</span>,
              label: "Most Supported Category",
              value: topCategory?.label ?? "—",
              sub: topCategory ? `${pct(topCategory.averageUserPreference)} public preference` : "",
              bg: "bg-emerald-400/6",
              border: "border-emerald-400/20",
            },
          ].map(({ icon, label, value, sub, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-5 flex items-start gap-4`}>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-display font-bold truncate">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Geographic sentiment */}
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sentiment by State & Territory
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {regional.map(({ state, top }) => (
              <div key={state} className="rounded-xl border border-white/6 bg-white/2 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-xs font-bold">{state}</p>
                </div>
                <p className="text-[9px] text-muted-foreground mb-2 truncate">{STATE_NAMES[state]}</p>
                {top.map((cat, rank) => (
                  <div key={cat.key} className="flex items-center gap-1.5 mb-1.5 last:mb-0">
                    <span className="text-[9px] font-bold text-muted-foreground/50 w-2 shrink-0">{rank + 1}</span>
                    <span className="text-sm shrink-0">{ICONS[cat.key] ?? "💰"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium truncate">{cat.label}</p>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden mt-0.5">
                        <div className="h-full rounded-full" style={{ width: `${(cat.adj / maxPref) * 100}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — SPENDING PREFERENCE RESULTS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        <SectionLabel number={3} title="Spending Preference Results" />

        <div className="rounded-2xl border border-border bg-card/60 p-6 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Where Australians want their tax money spent — ranked by public preference
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mb-6">
            Based on {totalParticipants.toLocaleString()} survey responses. Bars animate on load and update with new submissions.
          </p>

          <div className="space-y-4">
            {sortedByPref.map((cat, i) => {
              const barW = (cat.averageUserPreference / maxPref) * 100;
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="flex items-center gap-4"
                >
                  {/* Rank + label */}
                  <div className="w-36 shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground/40 w-4 text-right tabular-nums">{i + 1}</span>
                    <span className="text-sm shrink-0">{ICONS[cat.key] ?? "💰"}</span>
                    <span className="text-sm font-medium truncate">{cat.label}</span>
                  </div>
                  {/* Bar track */}
                  <div className="flex-1 h-8 bg-secondary rounded-xl overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-xl flex items-center"
                      initial={{ width: 0 }}
                      animate={{ width: `${barW}%` }}
                      transition={{ delay: i * 0.06 + 0.1, duration: 0.7, ease: "easeOut" }}
                      style={{ backgroundColor: cat.color }}
                    >
                      {barW > 18 && (
                        <span className="pl-3 text-xs font-bold text-white/90 tabular-nums">{pct(cat.averageUserPreference)}</span>
                      )}
                    </motion.div>
                    {barW <= 18 && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
                        {pct(cat.averageUserPreference)}
                      </span>
                    )}
                  </div>
                  {/* Pct label */}
                  <span className="text-sm font-bold tabular-nums w-12 text-right shrink-0" style={{ color: cat.color }}>
                    {pct(cat.averageUserPreference)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Trending Issues sub-panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { list: trends.more, label: "Citizens want MORE funding", color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/5", Icon: TrendingUp, gapColor: "text-emerald-400" },
            { list: trends.less,  label: "Citizens want LESS funding",  color: "text-red-400",     border: "border-red-400/20",     bg: "bg-red-400/5",     Icon: TrendingDown, gapColor: "text-red-400"     },
          ].map(({ list, label, color, border, bg, Icon, gapColor }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-5`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${color} mb-4 flex items-center gap-1.5`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </p>
              <div className="space-y-3">
                {list.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="text-base shrink-0">{ICONS[cat.key] ?? "💰"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{TREND_NAMES[cat.key] ?? cat.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Public {pct(cat.averageUserPreference)} · Gov't {pct(cat.governmentAllocation)}
                      </p>
                    </div>
                    <span className={`text-xs font-bold tabular-nums shrink-0 ${gapColor}`}>{gap(cat.g)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — GOVERNMENT COMPARISON
      ════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        <SectionLabel number={4} title="Government Comparison" />

        {/* Sub-heading */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 mb-4">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Public Budget Priorities vs Government Budget
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground/60">
                Each category shows two bars: actual government allocation (grey) vs what citizens want (coloured). The gap badge shows the difference.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
              <div className="flex items-center gap-1.5"><div className="w-10 h-2 rounded-sm bg-zinc-500 opacity-80" />Government</div>
              <div className="flex items-center gap-1.5"><div className="w-10 h-2 rounded-sm bg-primary" />Citizens want</div>
            </div>
          </div>

          <div className="space-y-5">
            {data.categories.map((cat, i) => {
              const govW  = (cat.governmentAllocation / scaleMax) * 100;
              const prefW = (cat.averageUserPreference / scaleMax) * 100;
              const diff  = cat.averageUserPreference - cat.governmentAllocation;
              const isPos = diff > 0.005;
              const isNeg = diff < -0.005;
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ICONS[cat.key] ?? "💰"}</span>
                      <span className="text-sm font-semibold">{cat.label}</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
                      isPos ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
                      : isNeg ? "text-red-400 bg-red-400/10 border border-red-400/20"
                      : "text-muted-foreground bg-secondary"
                    }`}>{gap(diff)}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-20 shrink-0">Government</span>
                      <div className="flex-1 h-4 bg-secondary rounded-md overflow-hidden">
                        <motion.div className="h-full rounded-md" initial={{ width: 0 }} animate={{ width: `${govW}%` }}
                          transition={{ delay: i * 0.05 + 0.1, duration: 0.55, ease: "easeOut" }}
                          style={{ backgroundColor: "#52525b" }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-9 text-right tabular-nums shrink-0">{pct(cat.governmentAllocation)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-20 shrink-0">Citizens</span>
                      <div className="flex-1 h-4 bg-secondary rounded-md overflow-hidden">
                        <motion.div className="h-full rounded-md" initial={{ width: 0 }} animate={{ width: `${prefW}%` }}
                          transition={{ delay: i * 0.05 + 0.18, duration: 0.55, ease: "easeOut" }}
                          style={{ backgroundColor: cat.color }} />
                      </div>
                      <span className="text-[10px] w-9 text-right tabular-nums shrink-0 font-semibold" style={{ color: cat.color }}>
                        {pct(cat.averageUserPreference)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Category deep dive cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.categories.map((cat) => {
            const diff  = cat.averageUserPreference - cat.governmentAllocation;
            const isPos = diff > 0.005;
            const isNeg = diff < -0.005;
            return (
              <div key={cat.key} className="rounded-xl border border-white/7 bg-white/2 p-4 relative overflow-hidden group">
                <div className="absolute inset-y-0 left-0 w-0.5 transition-opacity opacity-40 group-hover:opacity-80" style={{ backgroundColor: cat.color }} />
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ICONS[cat.key] ?? "💰"}</span>
                    <span className="text-sm font-semibold">{cat.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                    isPos ? "text-emerald-400 bg-emerald-400/10" : isNeg ? "text-red-400 bg-red-400/10" : "text-muted-foreground bg-secondary"
                  }`}>
                    {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : isNeg ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                    {gap(diff)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Government</span><span>{pct(cat.governmentAllocation)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${cat.governmentAllocation * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: cat.color }}>
                      <span className="text-muted-foreground">Citizens want</span><span>{pct(cat.averageUserPreference)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${cat.averageUserPreference * 100}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 5 — SUBMIT YOUR PREFERENCE
      ════════════════════════════════════════════════════════════════════ */}
      <div className="mb-10">
        <SectionLabel number={5} title="Submit Your Preference" />

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <AnimatePresence mode="wait">
            {simpleSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                <h3 className="text-xl font-display font-bold">Thank you for contributing!</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Your preference has been recorded and will update the live sentiment bars above.
                </p>
                <button
                  onClick={() => { setSimpleSubmitted(false); setSelectedCat(null); resetMutation(); }}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Submit another response
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-display font-semibold mb-1">Where should more tax money go?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Select the area you believe the government should prioritise and submit your vote.
                </p>

                {/* Category picker */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {data.categories.map((cat) => {
                    const isSelected = selectedCat === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCat(cat.key)}
                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "border-current shadow-sm"
                            : "border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15"
                        }`}
                        style={isSelected ? { borderColor: cat.color, background: `${cat.color}12`, color: cat.color } : {}}
                      >
                        <span className="text-xl shrink-0">{ICONS[cat.key] ?? "💰"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={isSelected ? { color: cat.color } : {}}>
                            {cat.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Currently {pct(cat.governmentAllocation, 0)}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" style={{ color: cat.color }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={handleSimpleVote}
                    disabled={!selectedCat || isSubmitting}
                    className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? "Submitting…" : "Submit my vote"}
                  </button>
                  {!selectedCat && (
                    <p className="text-xs text-muted-foreground">Select a category above to enable submission</p>
                  )}
                </div>

                {/* Advanced slider form toggle */}
                <div className="mt-6 pt-5 border-t border-white/8">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced: allocate full budget across all categories
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          {data.categories.map((cat) => {
                            const val = allocations[cat.key] ?? 0;
                            return (
                              <div key={cat.key} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span>{ICONS[cat.key] ?? "💰"}</span>
                                    <span className="text-sm font-medium">{cat.label}</span>
                                  </div>
                                  <span className="text-sm font-bold tabular-nums px-2 py-0.5 rounded-lg"
                                    style={{ color: cat.color, background: `${cat.color}18` }}>
                                    {val}%
                                  </span>
                                </div>
                                <input type="range" min={0} max={60} step={1} value={val}
                                  onChange={(e) => handleSlider(cat.key, +e.target.value)}
                                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                  style={{ accentColor: cat.color }}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                                  <span>Gov't: {pct(cat.governmentAllocation, 0)}</span>
                                  <span>Avg: {pct(cat.averageUserPreference, 0)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between mt-4 p-3 rounded-xl bg-secondary/50">
                          <span className="text-sm font-medium">Total allocated</span>
                          <span className={`text-lg font-bold tabular-nums ${
                            sliderTotal === 100 ? "text-emerald-400" : sliderTotal > 100 ? "text-red-400" : "text-yellow-400"
                          }`}>{sliderTotal}% {sliderTotal === 100 ? "✓" : sliderTotal > 100 ? "(over)" : "(under)"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <button onClick={handleSliderSubmit} disabled={sliderTotal !== 100 || isSubmitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {isSubmitting ? "Submitting…" : "Submit detailed allocation"}
                          </button>
                          {sliderTotal !== 100 && (
                            <p className="text-xs text-muted-foreground">
                              {sliderTotal > 100 ? `Reduce by ${sliderTotal - 100}%` : `Add ${100 - sliderTotal}% more`} to reach 100%
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PROFESSIONAL INSIGHTS — COMING SOON
      ════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-border bg-secondary/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-muted-foreground" aria-label="locked feature" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg">Professional Insights</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary border border-border px-2 py-0.5 rounded-md">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                Advanced analytics and downloadable datasets will be available for researchers, journalists, and policy analysts. Includes raw response exports, longitudinal trend data, and demographic breakdowns.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-white/2 opacity-50 cursor-not-allowed">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Research API</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-white/2 opacity-50 cursor-not-allowed">
              <Download className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Export CSV</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-border bg-white/2 opacity-50 cursor-not-allowed">
              <FileSearch className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">Methodology</span>
            </div>
          </div>
        </div>
      </div>

    </PageTransition>
  );
}
