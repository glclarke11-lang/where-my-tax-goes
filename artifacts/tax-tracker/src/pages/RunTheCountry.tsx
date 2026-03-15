import { useState, useMemo } from "react";
import { PageTransition } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Heart,
  GraduationCap,
  Shield,
  Leaf,
  Landmark,
  Building2,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  SmilePlus,
  Zap,
  Info,
} from "lucide-react";
import type { ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────

interface SpendingCategory {
  key: string;
  label: string;
  color: string;
  baselineB: number;
  minB: number;
  maxB: number;
  approvalPerB: number;
  icon: ReactNode;
  description: string;
}

interface RevenueSource {
  key: string;
  label: string;
  color: string;
  baselineB: number;
  minB: number;
  maxB: number;
  approvalPerB: number;
  description: string;
}

// ── Static Data ───────────────────────────────────────────────────────────
// Spending sums to $690B (matches TOTAL_BUDGET_BILLIONS_AUD)
// Revenue sums to $650B → baseline deficit $40B

const SPENDING_CATS: SpendingCategory[] = [
  {
    key: "welfare",
    label: "Welfare",
    color: "#8B5CF6",
    baselineB: 248,
    minB: 50,
    maxB: 400,
    approvalPerB: 0.08,
    icon: <Users className="w-4 h-4" />,
    description: "Social security, age pension, disability support & family payments.",
  },
  {
    key: "healthcare",
    label: "Healthcare",
    color: "#10B981",
    baselineB: 110,
    minB: 20,
    maxB: 250,
    approvalPerB: 0.20,
    icon: <Heart className="w-4 h-4" />,
    description: "Public hospitals, Medicare, PBS, aged care & mental health.",
  },
  {
    key: "administration",
    label: "Administration",
    color: "#6B7280",
    baselineB: 152,
    minB: 30,
    maxB: 250,
    approvalPerB: -0.05,
    icon: <Building2 className="w-4 h-4" />,
    description: "Government services, public debt interest, ATO & international relations.",
  },
  {
    key: "education",
    label: "Education",
    color: "#3B82F6",
    baselineB: 55,
    minB: 10,
    maxB: 150,
    approvalPerB: 0.15,
    icon: <GraduationCap className="w-4 h-4" />,
    description: "Schools, universities, TAFE, HECS & early childhood education.",
  },
  {
    key: "defence",
    label: "Defence",
    color: "#EF4444",
    baselineB: 55,
    minB: 5,
    maxB: 150,
    approvalPerB: 0.05,
    icon: <Shield className="w-4 h-4" />,
    description: "ADF, AUKUS, intelligence, cyber security & veteran services.",
  },
  {
    key: "infrastructure",
    label: "Infrastructure",
    color: "#F97316",
    baselineB: 42,
    minB: 5,
    maxB: 120,
    approvalPerB: 0.10,
    icon: <Landmark className="w-4 h-4" />,
    description: "Roads, rail, NBN, ports, airports & water infrastructure.",
  },
  {
    key: "environment",
    label: "Environment",
    color: "#22C55E",
    baselineB: 28,
    minB: 0,
    maxB: 100,
    approvalPerB: 0.18,
    icon: <Leaf className="w-4 h-4" />,
    description: "Climate action, national parks, clean energy & emissions reduction.",
  },
];

const REVENUE_SOURCES: RevenueSource[] = [
  {
    key: "income_tax",
    label: "Income Tax",
    color: "#06B6D4",
    baselineB: 295,
    minB: 0,
    maxB: 500,
    approvalPerB: -0.20,
    description: "Personal income tax on individuals, collected by the ATO.",
  },
  {
    key: "company_tax",
    label: "Company Tax",
    color: "#8B5CF6",
    baselineB: 130,
    minB: 0,
    maxB: 300,
    approvalPerB: -0.05,
    description: "30% corporate income tax on business profits.",
  },
  {
    key: "gst",
    label: "GST",
    color: "#F59E0B",
    baselineB: 90,
    minB: 0,
    maxB: 200,
    approvalPerB: -0.18,
    description: "10% Goods and Services Tax, distributed to the states.",
  },
  {
    key: "excise",
    label: "Excise Taxes",
    color: "#EF4444",
    baselineB: 35,
    minB: 0,
    maxB: 100,
    approvalPerB: -0.08,
    description: "Fuel, tobacco, alcohol & luxury excise duties.",
  },
  {
    key: "resource_taxes",
    label: "Resource Taxes",
    color: "#10B981",
    baselineB: 25,
    minB: 0,
    maxB: 150,
    approvalPerB: 0.10,
    description: "PRRT, minerals royalties & resource rent taxes on mining.",
  },
  {
    key: "other_revenue",
    label: "Other Revenue",
    color: "#6B7280",
    baselineB: 75,
    minB: 0,
    maxB: 200,
    approvalPerB: 0,
    description: "Dividends, fees, levies & non-tax government income.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

const BASE_APPROVAL = 52;

const initSpending = () =>
  Object.fromEntries(SPENDING_CATS.map((c) => [c.key, c.baselineB]));
const initRevenue = () =>
  Object.fromEntries(REVENUE_SOURCES.map((s) => [s.key, s.baselineB]));

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function fmtB(b: number, decimals = 0) {
  return `$${Math.abs(b).toLocaleString("en-AU", { maximumFractionDigits: decimals })}B`;
}

function computeApproval(
  spending: Record<string, number>,
  revenue: Record<string, number>,
  balance: number
): number {
  let delta = 0;
  SPENDING_CATS.forEach((c) => {
    delta += (spending[c.key] - c.baselineB) * c.approvalPerB;
  });
  REVENUE_SOURCES.forEach((s) => {
    delta += (revenue[s.key] - s.baselineB) * s.approvalPerB;
  });
  // Deficit effect on approval
  const deficitB = -balance;
  if (deficitB < 0) delta += 3; // surplus bonus
  else if (deficitB > 100) delta -= 12;
  else if (deficitB > 50) delta -= 6;
  else if (deficitB > 20) delta -= 2;
  return clamp(Math.round(BASE_APPROVAL + delta), 5, 95);
}

interface ApprovalFactor {
  label: string;
  delta: number;
  color: string;
}

function computeFactors(
  spending: Record<string, number>,
  revenue: Record<string, number>,
  balance: number
): ApprovalFactor[] {
  const factors: ApprovalFactor[] = [];
  SPENDING_CATS.forEach((c) => {
    const d = (spending[c.key] - c.baselineB) * c.approvalPerB;
    if (Math.abs(d) > 0.5) factors.push({ label: c.label, delta: d, color: c.color });
  });
  REVENUE_SOURCES.forEach((s) => {
    const d = (revenue[s.key] - s.baselineB) * s.approvalPerB;
    if (Math.abs(d) > 0.5) factors.push({ label: s.label, delta: d, color: s.color });
  });
  // Add deficit factor if significant
  const deficitB = -balance;
  if (deficitB < 0) factors.push({ label: "Budget Surplus", delta: 3, color: "#22C55E" });
  else if (deficitB > 20) {
    const dd = deficitB > 100 ? -12 : deficitB > 50 ? -6 : -2;
    factors.push({ label: "Budget Deficit", delta: dd, color: "#EF4444" });
  }
  return factors.sort((a, b) => b.delta - a.delta);
}

interface Alert {
  id: string;
  message: string;
  severity: "critical" | "warning" | "good";
}

function computeAlerts(
  spending: Record<string, number>,
  revenue: Record<string, number>,
  balance: number,
  approval: number
): Alert[] {
  const alerts: Alert[] = [];
  if (spending.healthcare < 60) alerts.push({ id: "hc-crisis", message: "Healthcare Crisis — Hospitals overwhelmed, wait times soaring.", severity: "critical" });
  else if (spending.healthcare > 180) alerts.push({ id: "hc-great", message: "World-class healthcare! Medical outcomes are improving dramatically.", severity: "good" });
  if (spending.education < 25) alerts.push({ id: "edu-crisis", message: "Education Crisis — School closures, falling literacy rates nationwide.", severity: "critical" });
  if (spending.welfare < 120) alerts.push({ id: "welfare-crisis", message: "Welfare Crisis — Poverty soaring, food banks at capacity.", severity: "critical" });
  if (spending.defence < 20) alerts.push({ id: "def-warn", message: "Defence Warning — ADF capability severely compromised.", severity: "warning" });
  if (spending.environment < 8) alerts.push({ id: "env-crisis", message: "Environmental Disaster — Climate targets abandoned, international backlash.", severity: "critical" });
  if (-balance > 150) alerts.push({ id: "debt-crisis", message: "Debt Crisis! Bond markets are downgrading Australia's credit rating.", severity: "critical" });
  else if (balance > 0) alerts.push({ id: "surplus", message: `Budget Surplus of ${fmtB(balance)}! Fiscal position is excellent.`, severity: "good" });
  if (revenue.income_tax > 420) alerts.push({ id: "tax-revolt", message: "Tax Revolt! High-income earners are relocating to lower-tax jurisdictions.", severity: "warning" });
  if (approval >= 70) alerts.push({ id: "mandate", message: "Strong Mandate! Your policies are overwhelmingly popular.", severity: "good" });
  else if (approval < 30) alerts.push({ id: "crisis", message: "Crisis of Confidence! The public has lost faith in your government.", severity: "critical" });
  return alerts.slice(0, 5);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  subtext,
  icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: ReactNode;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/8 p-5 flex items-start gap-4 transition-all ${bgClass}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass} bg-opacity-10`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-2xl font-display font-bold tabular-nums ${colorClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  color,
  icon,
  value,
  baseline,
  min,
  max,
  description,
  onChange,
}: {
  label: string;
  color: string;
  icon: ReactNode;
  value: number;
  baseline: number;
  min: number;
  max: number;
  description: string;
  onChange: (v: number) => void;
}) {
  const delta = value - baseline;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="group">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color }} className="shrink-0">
            {icon}
          </span>
          <span className="font-medium text-sm truncate">{label}</span>
          <span className="text-xs text-muted-foreground/50 hidden sm:inline truncate max-w-[180px]">
            {description}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {delta !== 0 && (
            <span
              className={`text-xs font-bold tabular-nums ${
                delta > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {fmtB(delta)}
            </span>
          )}
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {fmtB(value)}
          </span>
        </div>
      </div>
      <div className="relative">
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-0.5">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
          style={{ accentColor: color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/40 mt-0.5">
        <span>{fmtB(min)}</span>
        <span>{fmtB(max)}</span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function RunTheCountry() {
  const [spending, setSpending] = useState<Record<string, number>>(initSpending);
  const [revenue, setRevenue] = useState<Record<string, number>>(initRevenue);
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);

  const spendingTotal = useMemo(
    () => Object.values(spending).reduce((a, b) => a + b, 0),
    [spending]
  );
  const revenueTotal = useMemo(
    () => Object.values(revenue).reduce((a, b) => a + b, 0),
    [revenue]
  );
  const balance = revenueTotal - spendingTotal;
  const approval = useMemo(
    () => computeApproval(spending, revenue, balance),
    [spending, revenue, balance]
  );
  const factors = useMemo(
    () => computeFactors(spending, revenue, balance),
    [spending, revenue, balance]
  );
  const alerts = useMemo(
    () => computeAlerts(spending, revenue, balance, approval),
    [spending, revenue, balance, approval]
  );

  const handleReset = () => {
    setSpending(initSpending());
    setRevenue(initRevenue());
  };

  // Balance indicator: range −$200B (deficit) to +$100B (surplus)
  // indicator position: 0% = surplus $100B, 100% = deficit $200B
  const SURPLUS_MAX = 100;
  const DEFICIT_MAX = 200;
  const RANGE = SURPLUS_MAX + DEFICIT_MAX;
  const indicatorPct = clamp(((SURPLUS_MAX - balance) / RANGE) * 100, 0, 100);

  const balanceColor =
    balance > 0
      ? "text-green-400"
      : balance > -15
      ? "text-yellow-400"
      : "text-red-400";
  const balanceBgClass =
    balance > 0
      ? "bg-green-500/5 border-green-500/10"
      : balance > -15
      ? "bg-yellow-500/5 border-yellow-500/10"
      : "bg-red-500/5 border-red-500/10";
  const approvalColor =
    approval >= 60 ? "text-green-400" : approval >= 40 ? "text-yellow-400" : "text-red-400";
  const approvalBgClass =
    approval >= 60
      ? "bg-green-500/5 border-green-500/10"
      : approval >= 40
      ? "bg-yellow-500/5 border-yellow-500/10"
      : "bg-red-500/5 border-red-500/10";

  return (
    <PageTransition>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2 flex items-center gap-3">
            <span
              className="inline-flex w-10 h-10 rounded-xl items-center justify-center text-primary-foreground text-lg"
              style={{ background: "linear-gradient(135deg, hsl(189 94% 43%), hsl(262 83% 58%))" }}
            >
              🏛️
            </span>
            Run the Country
          </h1>
          <p className="text-muted-foreground">
            You are Australia's Treasurer. Balance revenue &amp; spending, manage the deficit, and
            keep the public on your side.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-white/10 text-sm font-medium transition-colors self-start sm:self-end shrink-0"
        >
          <RefreshCcw className="w-4 h-4" />
          Reset to Baseline
        </button>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Revenue"
          value={fmtB(revenueTotal)}
          subtext="Total government income"
          icon={<TrendingUp className="w-5 h-5" />}
          colorClass="text-cyan-400"
          bgClass="bg-cyan-500/5 border-cyan-500/10"
        />
        <MetricCard
          label="Spending"
          value={fmtB(spendingTotal)}
          subtext="Total government outlays"
          icon={<DollarSign className="w-5 h-5" />}
          colorClass="text-foreground"
          bgClass="bg-white/3 border-white/8"
        />
        <MetricCard
          label={balance >= 0 ? "Surplus" : "Deficit"}
          value={fmtB(balance)}
          subtext={balance >= 0 ? "Budget surplus — well done!" : "Below revenue line"}
          icon={
            balance > 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : balance > -15 ? (
              <Minus className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )
          }
          colorClass={balanceColor}
          bgClass={balanceBgClass}
        />
        <MetricCard
          label="Public Approval"
          value={`${approval}%`}
          subtext={
            approval >= 65
              ? "Strong mandate"
              : approval >= 45
              ? "Moderate support"
              : "Under pressure"
          }
          icon={<SmilePlus className="w-5 h-5" />}
          colorClass={approvalColor}
          bgClass={approvalBgClass}
        />
      </div>

      {/* ── Two-column sliders ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Panel */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-base">Spending Controls</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total: <span className="font-bold text-foreground">{fmtB(spendingTotal)}</span>
                <span className="ml-2 text-muted-foreground/60">
                  ({spendingTotal > 690 ? "+" : ""}{Math.round(spendingTotal - 690)}B vs baseline)
                </span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-lg bg-secondary">
              7 categories
            </span>
          </div>
          <div className="p-6 space-y-5">
            {SPENDING_CATS.map((cat) => (
              <SliderRow
                key={cat.key}
                label={cat.label}
                color={cat.color}
                icon={cat.icon}
                value={spending[cat.key]}
                baseline={cat.baselineB}
                min={cat.minB}
                max={cat.maxB}
                description={cat.description}
                onChange={(v) => setSpending((prev) => ({ ...prev, [cat.key]: v }))}
              />
            ))}
          </div>
        </div>

        {/* Revenue Panel */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-base">Revenue Controls</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total: <span className="font-bold text-foreground">{fmtB(revenueTotal)}</span>
                <span className="ml-2 text-muted-foreground/60">
                  ({revenueTotal > 650 ? "+" : ""}{Math.round(revenueTotal - 650)}B vs baseline)
                </span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-lg bg-secondary">
              6 sources
            </span>
          </div>
          <div className="p-6 space-y-5">
            {REVENUE_SOURCES.map((src) => (
              <SliderRow
                key={src.key}
                label={src.label}
                color={src.color}
                icon={
                  <span
                    className="w-4 h-4 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: src.color }}
                  />
                }
                value={revenue[src.key]}
                baseline={src.baselineB}
                min={src.minB}
                max={src.maxB}
                description={src.description}
                onChange={(v) => setRevenue((prev) => ({ ...prev, [src.key]: v }))}
              />
            ))}

            {/* Revenue breakdown mini-bars */}
            <div className="pt-4 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Revenue Mix
              </p>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                {REVENUE_SOURCES.map((src) => (
                  <div
                    key={src.key}
                    className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${(revenue[src.key] / revenueTotal) * 100}%`,
                      backgroundColor: src.color,
                    }}
                    title={`${src.label}: ${fmtB(revenue[src.key])}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {REVENUE_SOURCES.map((src) => (
                  <span key={src.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: src.color }} />
                    {src.label} ({Math.round((revenue[src.key] / revenueTotal) * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Budget Balance Bar ───────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-base">Budget Balance</h3>
          <span className={`text-lg font-display font-bold tabular-nums ${balanceColor}`}>
            {balance >= 0 ? "+" : ""}
            {fmtB(balance)} {balance >= 0 ? "Surplus" : "Deficit"}
          </span>
        </div>

        <div className="relative">
          {/* Gradient bar */}
          <div
            className="w-full h-4 rounded-full relative overflow-hidden"
            style={{
              background:
                "linear-gradient(to right, #22C55E 0%, #84CC16 25%, #EAB308 40%, #F97316 60%, #EF4444 80%, #991B1B 100%)",
            }}
          >
            {/* Balanced zone indicator */}
            <div
              className="absolute top-0 h-full w-px bg-white/30"
              style={{ left: `${(SURPLUS_MAX / RANGE) * 100}%` }}
            />
            {/* Current position thumb */}
            <motion.div
              className="absolute top-0 h-full w-1 rounded-full bg-white shadow-lg"
              style={{ left: `calc(${indicatorPct}% - 2px)` }}
              animate={{ left: `calc(${indicatorPct}% - 2px)` }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-2">
            <span className="text-xs text-green-400 font-medium">← Surplus</span>
            <span className="text-xs text-muted-foreground">Balanced</span>
            <span className="text-xs text-red-400 font-medium">Deficit →</span>
          </div>
        </div>

        {/* Balance stats row */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/40">
          <div className="text-center">
            <p className="text-2xl font-display font-bold tabular-nums text-cyan-400">{fmtB(revenueTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-display font-bold tabular-nums ${balanceColor}`}>
              {balance >= 0 ? "+" : ""}{fmtB(balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{balance >= 0 ? "Surplus" : "Deficit"}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold tabular-nums text-foreground">{fmtB(spendingTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Spending</p>
          </div>
        </div>
      </div>

      {/* ── Bottom row: Approval + Alerts ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Breakdown */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base">Public Approval</h3>
            <span className={`text-3xl font-display font-bold tabular-nums ${approvalColor}`}>
              {approval}%
            </span>
          </div>

          {/* Approval bar */}
          <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-5">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  approval >= 60
                    ? "linear-gradient(90deg, #22C55E, #10B981)"
                    : approval >= 40
                    ? "linear-gradient(90deg, #EAB308, #F97316)"
                    : "linear-gradient(90deg, #EF4444, #991B1B)",
              }}
              animate={{ width: `${approval}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          {/* Factors */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Key Factors
          </p>
          {factors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No significant changes from baseline.
            </p>
          ) : (
            <div className="space-y-2.5">
              {factors.slice(0, 7).map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: f.delta > 0 ? "#22C55E" : "#EF4444" }}
                  />
                  <span className="flex-1 text-sm text-muted-foreground truncate">{f.label}</span>
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ${
                      f.delta > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {f.delta > 0 ? "+" : ""}
                    {Math.round(f.delta)}pp
                  </span>
                  <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(Math.abs(f.delta) * 5, 100)}%`,
                        backgroundColor: f.delta > 0 ? "#22C55E" : "#EF4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Approval insight */}
          <div className="mt-5 p-3 rounded-xl bg-white/3 border border-white/6 text-xs text-muted-foreground leading-relaxed">
            <Zap className="w-3.5 h-3.5 inline mr-1.5 text-yellow-400" />
            {approval >= 65
              ? "Australians strongly support your fiscal policy. Early election would deliver a landslide."
              : approval >= 50
              ? "Majority still backs you, but some unpopular decisions are eroding your support base."
              : approval >= 35
              ? "Your government faces a confidence crisis. Consider reversing unpopular tax or spending changes."
              : "Approval is dangerously low. Opposition is calling for a no-confidence vote."}
          </div>
        </div>

        {/* Alerts & Events */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-display font-semibold text-base">Events &amp; Alerts</h3>
            {alerts.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {alerts.length} active
              </span>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div
                key="no-alerts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <CheckCircle className="w-10 h-10 text-green-400/40 mb-3" />
                <p className="text-muted-foreground text-sm">
                  No major alerts. Australia is running smoothly.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-start gap-3 p-3.5 rounded-xl text-sm border ${
                      alert.severity === "critical"
                        ? "bg-red-500/8 border-red-500/20 text-red-300"
                        : alert.severity === "warning"
                        ? "bg-yellow-500/8 border-yellow-500/20 text-yellow-300"
                        : "bg-green-500/8 border-green-500/20 text-green-300"
                    }`}
                  >
                    {alert.severity === "critical" ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : alert.severity === "warning" ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <p className="leading-snug">{alert.message}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Spending composition mini overview */}
          <div className="mt-5 pt-4 border-t border-border/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Spending Mix
            </p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {SPENDING_CATS.map((cat) => (
                <div
                  key={cat.key}
                  className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${(spending[cat.key] / spendingTotal) * 100}%`,
                    backgroundColor: cat.color,
                  }}
                  title={`${cat.label}: ${fmtB(spending[cat.key])}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {SPENDING_CATS.map((cat) => (
                <span key={cat.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.label} ({Math.round((spending[cat.key] / spendingTotal) * 100)}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
