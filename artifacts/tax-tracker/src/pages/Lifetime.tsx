import { useState, useMemo } from "react";
import { PageTransition } from "@/components/PageTransition";
import { useCalculateLifetimeTax } from "@workspace/api-client-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  BarElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Loader2, TrendingUp, DollarSign, Calculator,
  Share2, Heart, ShieldCheck, GraduationCap, Landmark,
  Bus, Trees, Users, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { AUSTRALIA_BUDGET } from "@/data/australiaBudget";

ChartJS.register(
  LineElement, PointElement, BarElement,
  LinearScale, CategoryScale, Title, Tooltip, Legend, Filler
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(decimals === 0 ? 1 : decimals)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(decimals === 0 ? 0 : decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#A1A1AA", font: { size: 11 } } },
    tooltip: {
      backgroundColor: "#18181B",
      titleColor: "#FFFFFF",
      bodyColor: "#A1A1AA",
      borderColor: "#3F3F46",
      borderWidth: 1,
      callbacks: {
        label: (ctx: any) =>
          ` ${ctx.dataset.label}: ${fmt(ctx.raw as number)}`,
      },
    },
  },
  scales: {
    x: { ticks: { color: "#71717A", font: { size: 11 } }, grid: { color: "#27272A" } },
    y: {
      ticks: { color: "#71717A", font: { size: 11 }, callback: (v: any) => fmt(v) },
      grid: { color: "#27272A" },
    },
  },
};

// Retirement benefits catalogue
const RETIREMENT_BENEFITS = [
  {
    icon: Heart,
    color: "#10B981",
    title: "Medicare",
    subtitle: "Universal healthcare",
    description:
      "Subsidised GP visits, specialist referrals, PBS medicines, and public hospital care throughout your life — and into retirement.",
    category: "health",
  },
  {
    icon: Users,
    color: "#8B5CF6",
    title: "Age Pension",
    subtitle: "Retirement income",
    description:
      "Up to ~$28,500/year (couples) for eligible Australians aged 67+. Currently around 2.7 million Australians receive this.",
    category: "social_security_welfare",
  },
  {
    icon: GraduationCap,
    color: "#3B82F6",
    title: "Public Education",
    subtitle: "K-12 through university",
    description:
      "Publicly funded schools, subsidised HECS university degrees, and TAFE/VET training for you and your family.",
    category: "education",
  },
  {
    icon: Bus,
    color: "#F97316",
    title: "Infrastructure",
    subtitle: "Roads, rail & NBN",
    description:
      "The highways you drive, the rail networks you ride, and the NBN that connects your home and business.",
    category: "transport_infrastructure",
  },
  {
    icon: ShieldCheck,
    color: "#EF4444",
    title: "National Defence",
    subtitle: "Security & sovereignty",
    description:
      "ADF forces, AUKUS partnerships, intelligence services, and border protection keeping Australia safe.",
    category: "defence",
  },
  {
    icon: Trees,
    color: "#22C55E",
    title: "Environment & ABC",
    subtitle: "Public goods",
    description:
      "National parks, Great Barrier Reef protection, CSIRO research, and ABC/SBS public broadcasting.",
    category: "environment_culture",
  },
];

const GROWTH_PRESETS = [2, 3, 5];

// ── Main component ─────────────────────────────────────────────────────────────

export default function Lifetime() {
  const [currentAge,      setCurrentAge]      = useState(30);
  const [retirementAge,   setRetirementAge]   = useState(65);
  const [startingSalary,  setStartingSalary]  = useState(50_000);
  const [currentSalary,   setCurrentSalary]   = useState(80_000);
  const [annualGrowthRate,setAnnualGrowthRate] = useState(3);

  const { mutate, data, isPending } = useCalculateLifetimeTax();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      data: {
        currentAge,
        retirementAge,
        startingSalary,
        currentSalary,
        annualGrowthRate: annualGrowthRate / 100,
      },
    });
  };

  // ── Chart datasets ───────────────────────────────────────────────────────
  const cumulativeTax = useMemo(() => {
    if (!data?.yearlyData) return [];
    return data.yearlyData.reduce((acc: number[], d, i) => {
      acc.push((acc[i - 1] ?? 0) + d.tax);
      return acc;
    }, []);
  }, [data]);

  const timelineChartData = data?.yearlyData
    ? {
        labels: data.yearlyData.map((d) => `Age ${d.age}`),
        datasets: [
          {
            type:  "line" as const,
            label: "Cumulative Tax",
            data:  cumulativeTax,
            borderColor:      "#06B6D4",
            backgroundColor:  "rgba(6,182,212,0.12)",
            borderWidth: 2.5,
            pointRadius: 3,
            pointBackgroundColor: "#06B6D4",
            fill: true,
            tension: 0.45,
            yAxisID: "yCumulative",
            order: 1,
          },
          {
            type:  "bar" as const,
            label: "Annual Tax",
            data:  data.yearlyData.map((d) => d.tax),
            backgroundColor: "rgba(139,92,246,0.55)",
            borderRadius: 3,
            yAxisID: "yAnnual",
            order: 2,
          },
        ],
      }
    : null;

  const timelineOptions = {
    ...CHART_DEFAULTS,
    scales: {
      x: CHART_DEFAULTS.scales.x,
      yCumulative: {
        type: "linear" as const,
        position: "left"  as const,
        ticks: { color: "#06B6D4", font: { size: 10 }, callback: (v: any) => fmt(v) },
        grid: { color: "#27272A" },
        title: { display: true, text: "Cumulative", color: "#06B6D4", font: { size: 10 } },
      },
      yAnnual: {
        type: "linear" as const,
        position: "right" as const,
        ticks: { color: "#8B5CF6", font: { size: 10 }, callback: (v: any) => fmt(v) },
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Annual", color: "#8B5CF6", font: { size: 10 } },
      },
    },
  };

  const barChartData = data?.decadeBreakdown
    ? {
        labels: data.decadeBreakdown.map((d) => d.decade),
        datasets: [
          {
            label: "Tax by Decade",
            data:  data.decadeBreakdown.map((d) => d.totalTax),
            backgroundColor: data.decadeBreakdown.map((_, i) =>
              ["#3B82F6","#8B5CF6","#EC4899","#F97316","#22C55E"][i % 5]
            ),
            borderRadius: 6,
          },
        ],
      }
    : null;

  // Spending impact — sort category breakdown by amount
  const spendingImpact = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    return [...data.categoryBreakdown].sort((a, b) => b.amount - a.amount);
  }, [data]);

  const maxImpactAmount = spendingImpact[0]?.amount ?? 1;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">Lifetime Tax Dashboard</h1>
        <p className="text-muted-foreground">Project your total career tax contribution and understand your lifetime impact on Australia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── LEFT: Form ────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          <form onSubmit={handleCalculate} className="glass-panel p-6 rounded-3xl space-y-5">
            <h2 className="text-lg font-display font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Your Trajectory
            </h2>

            {/* Age inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Age</label>
                <input
                  type="number" min="18" max="64" required value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Retirement Age</label>
                <input
                  type="number" min={currentAge + 1} max="80" required value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {/* Salary inputs */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Starting Salary</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number" min="0" required value={startingSalary}
                  onChange={(e) => setStartingSalary(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Salary</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number" min="0" required value={currentSalary}
                  onChange={(e) => setCurrentSalary(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            {/* ── Salary Growth Control ── */}
            <div className="space-y-3 pt-1 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Annual Salary Growth
                </label>
                <span className="text-sm font-bold text-primary tabular-nums">{annualGrowthRate}%</span>
              </div>

              {/* Preset buttons */}
              <div className="flex gap-2">
                {GROWTH_PRESETS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setAnnualGrowthRate(rate)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      annualGrowthRate === rate
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                        : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>

              {/* Slider */}
              <input
                type="range" min="0" max="10" step="0.5"
                value={annualGrowthRate}
                onChange={(e) => setAnnualGrowthRate(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-secondary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/50">
                <span>0% (flat)</span>
                <span>5% (avg)</span>
                <span>10% (high)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Calculating…</>
              ) : (
                "Calculate Lifetime Tax"
              )}
            </button>
          </form>

          {/* Explanation card */}
          <div className="glass-panel rounded-2xl p-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
            <p className="font-semibold text-foreground text-sm">How it works</p>
            <p>We simulate your salary growth year-by-year from starting salary to retirement, applying Australian income tax brackets and Medicare levy at each step.</p>
            <p>Lifetime contribution is then split across spending categories at the same proportions as the federal budget.</p>
          </div>
        </div>

        {/* ── RIGHT: Results ────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-8">

          {/* Empty state */}
          {!data && !isPending && (
            <div className="h-full min-h-[480px] glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <TrendingUp className="w-10 h-10 text-primary/60" />
              </div>
              <h3 className="text-2xl font-display font-semibold mb-2">Ready to see your lifetime impact?</h3>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                Enter your career details and adjust the salary growth slider to project your total lifetime tax contribution and how it funds Australia.
              </p>
            </div>
          )}

          {/* Loading */}
          {isPending && (
            <div className="h-full min-h-[480px] glass-panel rounded-3xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse text-sm">Projecting your career…</p>
            </div>
          )}

          {/* Results */}
          <AnimatePresence>
            {data && !isPending && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="space-y-8"
              >
                {/* ── Summary Stats ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Lifetime Tax</p>
                    <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-primary">
                      {fmt(data.totalLifetimeTax)}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-2">
                      over {data.yearsWorking} working years · avg effective rate {(data.averageEffectiveRate * 100).toFixed(1)}%
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60 rounded-b-2xl" />
                  </div>
                  <div className="grid grid-rows-2 gap-4">
                    <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Years Working</p>
                      <p className="text-2xl font-bold">{data.yearsWorking}</p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Avg Effective Rate</p>
                      <p className="text-2xl font-bold">{(data.averageEffectiveRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* ── Lifetime Timeline Chart (primary, full width) ── */}
                <div className="glass-panel p-6 rounded-3xl">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-display font-semibold">Lifetime Tax Timeline</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cumulative total (cyan line) vs annual contribution (purple bars) by age
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-cyan-400 rounded inline-block" />
                        Cumulative
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-violet-500/60 rounded-sm inline-block" />
                        Annual
                      </span>
                    </div>
                  </div>
                  <div className="h-[280px]">
                    {timelineChartData && (
                      <Bar
                        data={timelineChartData as any}
                        options={timelineOptions as any}
                      />
                    )}
                  </div>
                  {/* Milestone callouts */}
                  {cumulativeTax.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        { label: "At 40", idx: Math.max(0, 40 - currentAge - 1) },
                        { label: "At 50", idx: Math.max(0, 50 - currentAge - 1) },
                        { label: "At retirement", idx: cumulativeTax.length - 1 },
                      ].filter(m => m.idx < cumulativeTax.length).map((m) => (
                        <div
                          key={m.label}
                          className="px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}
                        >
                          <span className="text-muted-foreground">{m.label}: </span>
                          <span className="font-bold text-cyan-400">{fmt(cumulativeTax[m.idx] ?? 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Secondary Charts Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Annual per year (kept) */}
                  <div className="glass-panel p-5 rounded-3xl h-[240px] flex flex-col">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tax Paid Per Year</h3>
                    <div className="flex-1 min-h-0">
                      {data?.yearlyData && (
                        <Line
                          data={{
                            labels: data.yearlyData.map((d) => d.age),
                            datasets: [{
                              label: "Tax Paid Per Year",
                              data: data.yearlyData.map((d) => d.tax),
                              borderColor: "#22c55e",
                              backgroundColor: "rgba(34,197,94,0.15)",
                              fill: true, tension: 0.4,
                            }],
                          }}
                          options={CHART_DEFAULTS as any}
                        />
                      )}
                    </div>
                  </div>

                  {/* Decade bar (kept) */}
                  <div className="glass-panel p-5 rounded-3xl h-[240px] flex flex-col">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Tax by Decade</h3>
                    <div className="flex-1 min-h-0">
                      {barChartData && <Bar data={barChartData} options={CHART_DEFAULTS as any} />}
                    </div>
                  </div>
                </div>

                {/* ── Spending Impact ── */}
                <div className="glass-panel rounded-3xl p-6">
                  <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-display font-semibold">Lifetime Spending Impact</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your {fmt(data.totalLifetimeTax)} distributed across government services over {data.yearsWorking} years
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {spendingImpact.map((cat, i) => {
                      const barPct = (cat.amount / maxImpactAmount) * 100;
                      return (
                        <motion.div
                          key={cat.key}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.3 }}
                        >
                          <div className="w-36 shrink-0 text-xs text-muted-foreground truncate">{cat.label}</div>
                          <div className="flex-1 h-7 bg-secondary rounded-lg overflow-hidden relative">
                            <motion.div
                              className="h-full rounded-lg flex items-center pl-2 overflow-hidden"
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ delay: i * 0.06 + 0.15, duration: 0.6, ease: "easeOut" }}
                              style={{ backgroundColor: `${cat.color}CC` }}
                            >
                              {barPct > 20 && (
                                <span className="text-[11px] font-bold text-white whitespace-nowrap">
                                  {fmt(cat.amount)}
                                </span>
                              )}
                            </motion.div>
                            {barPct <= 20 && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
                                {fmt(cat.amount)}
                              </span>
                            )}
                          </div>
                          <span
                            className="text-xs font-bold tabular-nums w-16 text-right shrink-0"
                            style={{ color: cat.color }}
                          >
                            {(cat.percentage * 100).toFixed(1)}%
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Retirement Benefits Panel ── */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/12 flex items-center justify-center">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-base">What You Get in Return</h3>
                      <p className="text-xs text-muted-foreground">Public services your lifetime contributions help fund</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {RETIREMENT_BENEFITS.map((benefit, i) => {
                      const Icon = benefit.icon;
                      // Find matching category to show lifetime contribution
                      const lifetimeCat = data.categoryBreakdown.find(
                        (c) => c.key === benefit.category
                      );
                      return (
                        <motion.div
                          key={benefit.title}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.3 }}
                          className="rounded-2xl border border-white/6 p-4 hover:border-white/14 transition-colors"
                          style={{ background: `${benefit.color}08` }}
                        >
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `${benefit.color}18` }}
                            >
                              <Icon className="w-4.5 h-4.5" style={{ color: benefit.color, width: "1.1rem", height: "1.1rem" }} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{benefit.title}</p>
                              <p className="text-[10px] text-muted-foreground">{benefit.subtitle}</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                          {lifetimeCat && (
                            <div
                              className="mt-2.5 pt-2.5 border-t flex items-center justify-between"
                              style={{ borderColor: `${benefit.color}20` }}
                            >
                              <span className="text-[10px] text-muted-foreground">Your lifetime contribution</span>
                              <span
                                className="text-xs font-bold tabular-nums"
                                style={{ color: benefit.color }}
                              >
                                {fmt(lifetimeCat.amount)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Share Button ── */}
                <div
                  className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.08))",
                    border: "1px solid rgba(6,182,212,0.2)",
                  }}
                >
                  <div>
                    <p className="font-display font-semibold text-base">Share Your Lifetime Impact</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate a shareable card showing your {fmt(data.totalLifetimeTax)} lifetime contribution
                    </p>
                  </div>
                  <Link
                    href="/share"
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shrink-0 shadow-lg shadow-primary/20"
                  >
                    <Share2 className="w-4 h-4" />
                    Share My Lifetime Impact
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* ── Category cards (kept, below everything) ── */}
                <div>
                  <h3 className="text-base font-display font-semibold text-muted-foreground mb-4">Full Sector Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.categoryBreakdown.map((cat) => {
                      const barPct = (cat.amount / (data.categoryBreakdown[0]?.amount ?? 1)) * 100;
                      return (
                        <div
                          key={cat.key}
                          className="glass-panel rounded-2xl p-4 border border-white/5"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold truncate mr-2">{cat.label}</span>
                            <span
                              className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-md"
                              style={{ color: cat.color, background: `${cat.color}18` }}
                            >
                              {(cat.percentage * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xl font-display font-bold tabular-nums" style={{ color: cat.color }}>
                            {fmt(cat.amount)}
                          </p>
                          <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${barPct}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
