import { PageTransition } from "@/components/PageTransition";
import { useTaxStore } from "@/hooks/use-tax-store";
import { useCalculateTax } from "@workspace/api-client-react";
import { useState, useMemo, useEffect } from "react";
import { useMarkExplored } from "@/hooks/use-explore-tracker";
import {
  DollarSign, ArrowRight, Loader2, Download, PieChart,
  TrendingUp, TrendingDown, Minus, MapPin, Home, Heart,
} from "lucide-react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { CategoryCard } from "@/components/CategoryCard";
import { InsightPanel } from "@/components/InsightPanel";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

// ── Australian Tax Brackets FY2024-25 ────────────────────────────────────────
const BRACKETS = [
  { min: 0,      max: 18200,   rate: 0,     label: "$0 – $18,200",       color: "#6B7280" },
  { min: 18200,  max: 45000,   rate: 0.19,  label: "$18,201 – $45,000",  color: "#06B6D4" },
  { min: 45000,  max: 120000,  rate: 0.325, label: "$45,001 – $120,000", color: "#3B82F6" },
  { min: 120000, max: 180000,  rate: 0.37,  label: "$120,001 – $180,000",color: "#F97316" },
  { min: 180000, max: Infinity,rate: 0.45,  label: "$180,001+",           color: "#EF4444" },
];

const INCOME_PRESETS   = [40_000, 60_000, 80_000, 100_000, 150_000];
const AVG_INCOME       = 79_000;
const MEDICARE_RATE    = 0.02;

// Low Income Tax Offset (FY2024-25)
function computeLITO(income: number): number {
  if (income <= 37_500) return 700;
  if (income <= 45_000) return 700 - 0.05 * (income - 37_500);
  if (income <= 66_667) return 325 - 0.015 * (income - 45_000);
  return 0;
}

function computeBrackets(income: number) {
  if (income <= 0) return [];
  return BRACKETS.flatMap((b) => {
    if (income <= b.min) return [];
    const upper     = b.max === Infinity ? income : b.max;
    const taxable   = Math.min(income, upper) - b.min;
    const bWidth    = b.max === Infinity ? taxable : b.max - b.min;
    const fillPct   = bWidth > 0 ? Math.min(100, (taxable / bWidth) * 100) : 0;
    return [{ label: b.label, rate: b.rate * 100, taxable, fillPct, tax: taxable * b.rate, color: b.color }];
  });
}

function computeRawTax(income: number): number {
  const brackets = computeBrackets(income);
  return brackets.reduce((s, b) => s + b.tax, 0);
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { maximumFractionDigits: 0 });
}

function fmtCurrency(n: number) { return `$${fmt(n)}`; }

function getPercentileLabel(income: number): string {
  if (income > 250_000) return "top 3%";
  if (income > 180_000) return "top 5%";
  if (income > 120_000) return "top 10%";
  if (income > 100_000) return "top 16%";
  if (income >  79_000) return "top 33%";
  if (income >  60_000) return "top 45%";
  if (income >  45_000) return "top 53%";
  return "lower half";
}

function getMarginalRate(income: number): number {
  return [...BRACKETS].reverse().find((b) => income > b.min)?.rate ?? 0;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Calculator() {
  useMarkExplored("calculator");
  const { setInput, result, setResult } = useTaxStore();
  const [incomeStr, setIncomeStr]       = useState("");
  const [isAdvanced, setIsAdvanced]     = useState(false);
  const [taxPaidStr, setTaxPaidStr]     = useState("");
  const [localError, setLocalError]     = useState("");

  const calculateMutation = useCalculateTax();

  const income      = Number(incomeStr) || 0;
  const brackets    = useMemo(() => computeBrackets(income), [income]);
  const rawTax      = useMemo(() => computeRawTax(income), [income]);
  const lito        = useMemo(() => computeLITO(income), [income]);
  const estimatedIT = useMemo(() => Math.max(0, rawTax - lito), [rawTax, lito]);
  const medicare    = useMemo(() => Math.round(income * MEDICARE_RATE), [income]);
  const liveTotal   = estimatedIT + medicare;

  const incomeDiff  = income - AVG_INCOME;

  const handlePreset = (val: number) => {
    setIncomeStr(String(val));
    setResult(null);
    setLocalError("");
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setResult(null);
    if (!income || income <= 0) { setLocalError("Please enter a valid annual income."); return; }
    const payload: { income?: number; taxPaid?: number } = { income };
    if (isAdvanced && taxPaidStr) payload.taxPaid = Number(taxPaidStr);
    try {
      const res = await calculateMutation.mutateAsync({ data: payload });
      setInput(payload);
      setResult(res);
    } catch (err: any) {
      setLocalError(err?.message || "Failed to calculate taxes. Please try again.");
    }
  };

  // Derived result values
  const resultMedicare = result ? Math.round(result.income * MEDICARE_RATE) : 0;
  const resultIT       = result ? Math.max(0, result.estimatedTax - resultMedicare) : 0;
  const takeHome       = result ? result.income - result.estimatedTax : 0;

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* ── LEFT COLUMN: Form + Live Preview ─────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Tax Calculator</h1>
            <p className="text-muted-foreground text-sm">Find out exactly where your money goes.</p>
          </div>

          {/* ── Income Presets ── */}
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {INCOME_PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => handlePreset(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    income === v
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                      : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                  }`}
                >
                  {v >= 1000 ? `$${v / 1000}k` : fmtCurrency(v)}
                </button>
              ))}
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleCalculate} className="glass-panel p-5 rounded-2xl space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Income</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  value={incomeStr}
                  onChange={(e) => { setIncomeStr(e.target.value); setResult(null); }}
                  placeholder="e.g. 85,000"
                  className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>

              {/* Average comparison */}
              {income > 0 && (
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border mt-1 ${
                  incomeDiff > 0
                    ? "bg-green-500/8 border-green-500/20 text-green-400"
                    : incomeDiff < 0
                    ? "bg-yellow-500/8 border-yellow-500/20 text-yellow-400"
                    : "bg-white/5 border-white/10 text-muted-foreground"
                }`}>
                  {incomeDiff > 0 ? <TrendingUp className="w-3 h-3 shrink-0" />
                    : incomeDiff < 0 ? <TrendingDown className="w-3 h-3 shrink-0" />
                    : <Minus className="w-3 h-3 shrink-0" />}
                  {incomeDiff === 0
                    ? "Exactly at the Australian average ($79K)"
                    : incomeDiff > 0
                    ? `${fmtCurrency(incomeDiff)} above the Australian average ($79K)`
                    : `${fmtCurrency(Math.abs(incomeDiff))} below the Australian average ($79K)`}
                </div>
              )}
            </div>

            {/* Advanced mode */}
            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={isAdvanced}
                  onChange={(e) => setIsAdvanced(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                />
                <span className="text-sm text-muted-foreground">I know how much tax I paid</span>
              </label>
              {isAdvanced && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-medium">Total Tax Paid</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="number"
                      value={taxPaidStr}
                      onChange={(e) => setTaxPaidStr(e.target.value)}
                      placeholder="e.g. 15,000"
                      className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {localError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{localError}</div>
            )}

            <button
              type="submit"
              disabled={calculateMutation.isPending}
              className="w-full py-3.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {calculateMutation.isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" />Calculating...</>
              ) : (
                <>Show Breakdown<ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* ── Live Tax Bracket Breakdown ── */}
          <AnimatePresence>
            {income > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="glass-panel rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-semibold text-sm">Tax Bracket Breakdown</h3>
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">FY2024–25</span>
                </div>

                {brackets.map((b) => (
                  <div key={b.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground tabular-nums font-mono">{b.label}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-bold" style={{ color: b.color }}>{b.rate}%</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {b.tax < 1 ? "$0" : fmtCurrency(Math.round(b.tax))}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${b.fillPct}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{ backgroundColor: b.color }}
                      />
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Income tax (est. before LITO)</span>
                    <span className="tabular-nums">{fmtCurrency(Math.round(rawTax))}</span>
                  </div>
                  {lito > 0 && (
                    <div className="flex justify-between text-xs text-green-400">
                      <span>Low Income Tax Offset</span>
                      <span className="tabular-nums">−{fmtCurrency(Math.round(lito))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Medicare Levy (2%)</span>
                    <span className="tabular-nums">{fmtCurrency(medicare)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-border/40">
                    <span>Estimated Total Tax</span>
                    <span className="text-primary tabular-nums">{fmtCurrency(Math.round(liveTotal))}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 pt-0.5">
                    Estimate only — press "Show Breakdown" for personalised result.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT COLUMN: Results ─────────────────────────────────── */}
        <div className="lg:col-span-8">

          {/* Empty state */}
          {!result && !calculateMutation.isPending && (
            <div className="h-full min-h-[280px] sm:min-h-[400px] border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/20">
              <PieChart className="w-16 h-16 mb-4 text-border" />
              <h3 className="text-xl font-medium mb-2 text-foreground">Awaiting Input</h3>
              <p className="text-sm max-w-xs">Enter your income on the left to see your personalised tax breakdown and take-home pay.</p>
            </div>
          )}

          {/* Loading */}
          {calculateMutation.isPending && (
            <div className="h-full min-h-[280px] sm:min-h-[400px] rounded-3xl flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-medium animate-pulse">Crunching the numbers…</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* ── Take-Home Pay Card ── */}
              <div className="glass-panel rounded-3xl overflow-hidden">
                {/* Top strip */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

                <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8">
                  {/* Numbers column */}
                  <div className="flex-1 space-y-3">
                    <h2 className="font-display font-semibold text-base text-muted-foreground">Your Annual Finances</h2>

                    {/* Income row */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center">
                          <TrendingUp className="w-3.5 h-3.5 text-foreground" />
                        </div>
                        <span className="text-sm">Gross Income</span>
                      </div>
                      <span className="font-bold tabular-nums text-lg">{fmtCurrency(result.income)}</span>
                    </div>

                    {/* Income tax row */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm">Income Tax</p>
                          <p className="text-[10px] text-muted-foreground">after LITO where applicable</p>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums text-red-400 text-lg">−{fmtCurrency(resultIT)}</span>
                    </div>

                    {/* Medicare row */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-500/8 flex items-center justify-center">
                          <Heart className="w-3.5 h-3.5 text-red-300" />
                        </div>
                        <div>
                          <p className="text-sm">Medicare Levy</p>
                          <p className="text-[10px] text-muted-foreground">2% of taxable income</p>
                        </div>
                      </div>
                      <span className="font-bold tabular-nums text-red-300 text-lg">−{fmtCurrency(resultMedicare)}</span>
                    </div>

                    {/* Take-home */}
                    <div
                      className="flex items-center justify-between py-3 px-4 rounded-2xl mt-1"
                      style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.08))", border: "1px solid rgba(6,182,212,0.2)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                          <Home className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">Take-Home Pay</p>
                          <p className="text-[10px] text-muted-foreground">
                            {fmtCurrency(Math.round(takeHome / 12))}/month · {fmtCurrency(Math.round(takeHome / 26))}/fortnight
                          </p>
                        </div>
                      </div>
                      <span className="font-display font-bold tabular-nums text-2xl text-primary">{fmtCurrency(takeHome)}</span>
                    </div>

                    {/* Effective rate pill */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 font-semibold text-foreground">
                        {(result.effectiveRate * 100).toFixed(1)}% effective rate
                      </span>
                      <span>·</span>
                      <span>{fmtCurrency(result.estimatedTax)} total tax (incl. Medicare)</span>
                    </div>
                  </div>

                  {/* Doughnut column */}
                  <div className="w-full md:w-52 shrink-0 flex flex-col items-center justify-center">
                    <TaxDoughnut categories={result.breakdown} hideLegend={true} />
                    <p className="text-[10px] text-muted-foreground text-center mt-2">Spending breakdown</p>
                  </div>
                </div>
              </div>

              {/* ── Average Income Comparison ── */}
              {(() => {
                const diff = result.income - AVG_INCOME;
                const isAbove = diff > 0;
                const isEqual = diff === 0;
                return (
                  <div className={`rounded-2xl px-5 py-3.5 flex items-center gap-3 text-sm border ${
                    isAbove
                      ? "bg-green-500/6 border-green-500/15 text-green-400"
                      : isEqual
                      ? "bg-white/5 border-white/10 text-muted-foreground"
                      : "bg-yellow-500/6 border-yellow-500/15 text-yellow-400"
                  }`}>
                    {isAbove ? <TrendingUp className="w-4 h-4 shrink-0" />
                      : isEqual ? <Minus className="w-4 h-4 shrink-0" />
                      : <TrendingDown className="w-4 h-4 shrink-0" />}
                    <span>
                      {isEqual
                        ? "Your income matches the Australian average of $79,000."
                        : isAbove
                        ? <>Your income is <strong>{fmtCurrency(diff)}</strong> above the Australian average of $79,000 — placing you in the top earning bracket.</>
                        : <>Your income is <strong>{fmtCurrency(Math.abs(diff))}</strong> below the Australian average of $79,000.</>}
                    </span>
                  </div>
                );
              })()}

              {/* ── Spending Preview ── */}
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-base">Where Your Tax Goes</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your {fmtCurrency(result.estimatedTax)} distributed across government services
                    </p>
                  </div>
                  <Link
                    href="/money-map"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Money Map
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {result.breakdown
                    .slice()
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map((cat, i) => {
                      const maxAmount = result.breakdown[0]?.amount ?? 1;
                      const barPct = (cat.amount / Math.max(...result.breakdown.map((c) => c.amount))) * 100;
                      return (
                        <motion.div
                          key={cat.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.3 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-32 shrink-0 text-xs text-muted-foreground truncate">{cat.label}</div>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ delay: i * 0.06 + 0.1, duration: 0.5, ease: "easeOut" }}
                              style={{ backgroundColor: cat.color }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums shrink-0 w-20 text-right" style={{ color: cat.color }}>
                            {fmtCurrency(Math.round(cat.amount))}
                          </span>
                        </motion.div>
                      );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/money-map"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    <MapPin className="w-4 h-4" />
                    Explore on Money Map
                  </Link>
                  <Link
                    href="/breakdown"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground font-semibold text-sm hover:bg-white/10 transition-colors"
                  >
                    View Full Breakdown
                  </Link>
                </div>
              </div>

              {/* ── Insight Panel ── */}
              <InsightPanel
                insights={[
                  {
                    text: (
                      <>
                        Your income of{" "}
                        <strong className="text-foreground">{fmtCurrency(result.income)}</strong>{" "}
                        places you in the{" "}
                        <strong className="text-foreground">{getPercentileLabel(result.income)}</strong>{" "}
                        of Australian income earners, based on ATO data.
                      </>
                    ),
                  },
                  {
                    text: (
                      <>
                        Your effective rate of{" "}
                        <strong className="text-foreground">
                          {(result.effectiveRate * 100).toFixed(1)}%
                        </strong>{" "}
                        is well below your marginal rate of{" "}
                        <strong className="text-foreground">
                          {(getMarginalRate(result.income) * 100).toFixed(0)}%
                        </strong>{" "}
                        — only income above each threshold is taxed at the higher rate.
                      </>
                    ),
                  },
                ]}
              />

              {/* ── Dashboard CTA banner ── */}
              <div className="rounded-2xl border border-primary/20 bg-primary/8 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">Your personalised dashboard is ready</p>
                  <p className="text-xs text-muted-foreground">See all your tax insights in one place — contribution breakdown, national budget, sentiment & more.</p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all shrink-0 shadow-lg shadow-primary/20"
                >
                  View Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* ── Action Bar ── */}
              <div className="flex justify-end gap-3">
                <Link
                  href="/share"
                  className="px-5 py-2.5 rounded-xl font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-foreground transition-all flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Create Share Card
                </Link>
              </div>

              {/* ── Category Cards Grid ── */}
              <div>
                <h3 className="font-display font-semibold text-base mb-4 text-muted-foreground">Full Spending Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.breakdown.map((cat) => (
                    <CategoryCard key={cat.key} category={cat} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
