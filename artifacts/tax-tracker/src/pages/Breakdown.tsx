import { PageTransition } from "@/components/PageTransition";
import { useGetBudgetData } from "@workspace/api-client-react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { TaxFlowDiagram } from "@/components/TaxFlowDiagram";
import { useTaxStore } from "@/hooks/use-tax-store";
import { AUSTRALIA_BUDGET } from "@/data/australiaBudget";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, AlertTriangle, Calendar, ChevronDown,
  MapPin, Gamepad2, TrendingUp, ArrowRight, Info,
} from "lucide-react";
import { Link } from "wouter";

// ── Icons & helpers ───────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  social_security_welfare: "👴",
  health:                  "🏥",
  general_public_services: "🏛️",
  education:               "🎓",
  defence:                 "🪖",
  transport_infrastructure:"🛣️",
  other_economic:          "💼",
  environment_culture:     "🌿",
  international_relations: "🌏",
};

function macroPct(key: string): number {
  const macro = AUSTRALIA_BUDGET.find((m) => m.key === key);
  return macro ? macro.micros.reduce((s, m) => s + m.percentage, 0) : 0;
}

function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
}

// Pre-compute $100-budget data (sorted largest first)
const HUNDRED = AUSTRALIA_BUDGET.map((m) => ({
  key:     m.key,
  label:   m.label,
  color:   m.color,
  icon:    CATEGORY_ICONS[m.key] ?? "💰",
  dollars: Math.round(macroPct(m.key) * 100),
})).sort((a, b) => b.dollars - a.dollars);

// ── Main component ────────────────────────────────────────────────────────────

export default function Breakdown() {
  const { data, isLoading, isError } = useGetBudgetData();
  const { result } = useTaxStore();
  const estimatedTax = result?.estimatedTax ?? 0;
  const hasUserTax   = estimatedTax > 0;

  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: string) =>
    setExpanded((prev) => (prev === key ? null : key));

  return (
    <PageTransition>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
          Federal Budget Breakdown
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Every dollar of Australia's $690B federal budget, explained — from the big picture
          down to individual programs and what it means for you.
        </p>
        {!hasUserTax && (
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary border border-primary/30 px-4 py-2 rounded-xl bg-primary/8 hover:bg-primary/15 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            Calculate your tax to see personal contributions
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* ── Loading / error ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p>Loading federal budget data…</p>
        </div>
      )}

      {isError && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-bold mb-2">Failed to load data</h3>
          <p className="text-muted-foreground">We couldn't connect to the backend server. Please try again later.</p>
        </div>
      )}

      {data && (
        <div className="space-y-14">

          {/* ── 1. Main Chart (kept) ──────────────────────────────────────── */}
          <section className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Calendar className="w-4 h-4" />
              Updated: {new Date(data.lastUpdated).toLocaleDateString()}
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12 mt-8 md:mt-0">
              <div className="w-full md:w-1/2 max-w-[380px]">
                <TaxDoughnut
                  categories={data.categories}
                  totalLabel="Total Allocation"
                  totalValue="100%"
                />
              </div>
              <div className="w-full md:w-1/2 space-y-5">
                <h3 className="text-2xl font-display font-semibold">The Big Picture</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  The government distributes tax revenue according to national priorities.
                  Currently,{" "}
                  <span className="text-foreground font-semibold" style={{ color: data.categories[0]?.color }}>
                    {data.categories[0]?.label}
                  </span>{" "}
                  receives the largest share, while{" "}
                  <span className="text-foreground font-semibold" style={{ color: data.categories[data.categories.length - 1]?.color }}>
                    {data.categories[data.categories.length - 1]?.label}
                  </span>{" "}
                  represents the smallest specific allocation.
                </p>
                {hasUserTax ? (
                  <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <span className="text-emerald-400 font-semibold">Your tax: </span>
                    <span className="text-foreground font-bold">${estimatedTax.toLocaleString()}</span>
                    <span className="text-muted-foreground"> — scroll down to see your contribution to each category.</span>
                  </div>
                ) : (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm font-medium">
                    Want to see this applied to your income?{" "}
                    <Link href="/calculator" className="underline hover:text-white transition-colors">
                      Use the Calculator →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── 2. $100 Budget Explainer ─────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-base">💵</div>
              <div>
                <h2 className="text-xl font-display font-semibold">If the Budget Was $100</h2>
                <p className="text-xs text-muted-foreground">A simple way to understand federal spending priorities</p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="space-y-3">
                {HUNDRED.map((item, i) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    {/* Dollar label */}
                    <span className="text-sm font-bold tabular-nums w-12 text-right shrink-0" style={{ color: item.color }}>
                      ${item.dollars}
                    </span>
                    {/* Bar */}
                    <div className="flex-1 h-6 bg-secondary rounded-lg overflow-hidden relative">
                      <motion.div
                        className="h-full rounded-lg flex items-center pl-2 overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.dollars}%` }}
                        transition={{ delay: i * 0.05 + 0.15, duration: 0.5, ease: "easeOut" }}
                        style={{ backgroundColor: `${item.color}CC` }}
                      >
                        {item.dollars >= 6 && (
                          <span className="text-xs font-semibold text-white whitespace-nowrap">
                            {item.icon} {item.label}
                          </span>
                        )}
                      </motion.div>
                      {item.dollars < 6 && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground whitespace-nowrap">
                          {item.icon} {item.label}
                        </span>
                      )}
                    </div>
                    {/* Arrow */}
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-20 truncate">
                      {(item.dollars).toFixed(0)}¢ per $
                    </span>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/50 mt-4 flex items-center gap-1.5">
                <Info className="w-3 h-3 shrink-0" />
                Based on FY2024-25 Budget Statements. Figures rounded to nearest dollar.
              </p>
            </div>
          </section>

          {/* ── 3. Interactive Category Cards ────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-display font-semibold">Spending Categories</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Click any card to expand its internal programs</p>
              </div>
              {hasUserTax && (
                <div className="text-xs text-muted-foreground glass-panel px-3 py-1.5 rounded-lg">
                  Showing your ${estimatedTax.toLocaleString()} contribution
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AUSTRALIA_BUDGET.map((macro, cardIdx) => {
                const pct       = macroPct(macro.key);
                const userAmt   = estimatedTax * pct;
                const isOpen    = expanded === macro.key;
                const icon      = CATEGORY_ICONS[macro.key] ?? "💰";
                const maxMicro  = Math.max(...macro.micros.map((m) => m.percentage));

                return (
                  <motion.div
                    key={macro.key}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: cardIdx * 0.04, duration: 0.3 }}
                    className={`rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      isOpen ? "md:col-span-2 lg:col-span-3" : ""
                    }`}
                    style={{
                      background: isOpen ? `${macro.color}0D` : "rgba(255,255,255,0.03)",
                      borderColor: isOpen ? `${macro.color}40` : "rgba(255,255,255,0.07)",
                      boxShadow:   isOpen ? `0 0 24px ${macro.color}18` : "none",
                    }}
                    onClick={() => toggle(macro.key)}
                  >
                    {/* Card header */}
                    <div className="p-5 flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5"
                        style={{ background: `${macro.color}18` }}
                      >
                        {icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display font-semibold text-base leading-tight truncate">{macro.label}</h3>
                          <ChevronDown
                            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                        <p className="text-sm font-bold mt-1" style={{ color: macro.color }}>
                          {Math.round(pct * 100)}% of budget
                        </p>
                        {hasUserTax ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Your contribution:{" "}
                            <span className="font-semibold text-foreground">{fmt(userAmt)}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ${(pct * 690).toFixed(0)}B of $690B total
                          </p>
                        )}

                        {/* Percentage bar */}
                        <div className="mt-2.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct * 100 / 0.36 * 100}%`, backgroundColor: macro.color, maxWidth: "100%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expanded micro breakdown */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-5 pb-5 border-t" style={{ borderColor: `${macro.color}25` }}>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-3">
                              Programs & line items
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {macro.micros.map((micro, i) => {
                                const microUser  = estimatedTax * micro.percentage;
                                const barPct     = (micro.percentage / maxMicro) * 100;
                                return (
                                  <motion.div
                                    key={micro.key}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.2 }}
                                    className="rounded-xl p-3.5 border border-white/6 hover:border-white/12 transition-colors"
                                    style={{ background: "rgba(0,0,0,0.2)" }}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <p className="text-sm font-semibold leading-tight">{micro.label}</p>
                                      <span
                                        className="text-xs font-bold shrink-0 px-1.5 py-0.5 rounded-md"
                                        style={{ color: macro.color, background: `${macro.color}15` }}
                                      >
                                        {(micro.percentage * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{micro.description}</p>
                                    <div className="h-1 bg-secondary rounded-full overflow-hidden mb-1.5">
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${barPct}%`, backgroundColor: macro.color }}
                                      />
                                    </div>
                                    {hasUserTax && (
                                      <p className="text-[10px] text-muted-foreground">
                                        Your share: <span className="font-semibold" style={{ color: macro.color }}>{fmt(microUser)}</span>
                                      </p>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ── 4. Tax Flow Diagram (kept) ───────────────────────────────── */}
          <section className="glass-panel rounded-3xl p-6 md:p-8">
            <TaxFlowDiagram />
          </section>

          {/* ── 5. Next Step Buttons ─────────────────────────────────────── */}
          <section>
            <h2 className="text-lg font-display font-semibold mb-4 text-muted-foreground">Explore Further</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/money-map"
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-white/8 hover:border-cyan-500/30 bg-white/2 hover:bg-cyan-500/6 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/12 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Explore on Money Map</p>
                  <p className="text-xs text-muted-foreground mt-0.5">See where your tax funds real facilities across Australia</p>
                </div>
                <ArrowRight className="w-4 h-4 text-cyan-400 mt-auto group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/run-the-country"
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-white/8 hover:border-violet-500/30 bg-white/2 hover:bg-violet-500/6 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/12 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Gamepad2 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Run the Country</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Play treasurer and allocate the $690B budget yourself</p>
                </div>
                <ArrowRight className="w-4 h-4 text-violet-400 mt-auto group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/lifetime"
                className="group flex flex-col gap-3 p-5 rounded-2xl border border-white/8 hover:border-emerald-500/30 bg-white/2 hover:bg-emerald-500/6 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/12 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">View Lifetime Taxes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">See how much you'll contribute over your working life</p>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 mt-auto group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

        </div>
      )}
    </PageTransition>
  );
}
