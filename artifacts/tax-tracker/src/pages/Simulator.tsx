import { PageTransition } from "@/components/PageTransition";
import { useGetBudgetData, useSubmitPreference } from "@workspace/api-client-react";
import { useState, useMemo, useEffect } from "react";
import { useMarkExplored } from "@/hooks/use-explore-tracker";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import {
  Loader2,
  AlertTriangle,
  RefreshCcw,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Info,
} from "lucide-react";
import { useTaxStore } from "@/hooks/use-tax-store";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  AUSTRALIA_BUDGET,
  TOTAL_BUDGET_BILLIONS_AUD,
  FISCAL_YEAR,
  type MacroCategory,
} from "@/data/australiaBudget";

export default function Simulator() {
  useMarkExplored("simulator");
  const { data, isLoading, isError } = useGetBudgetData();
  const [budget, setBudget] = useState<MacroCategory[]>(AUSTRALIA_BUDGET);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [tooltipKey, setTooltipKey] = useState<string | null>(null);
  const { mutate: submitPreference, isPending: isSubmitting } = useSubmitPreference();
  const { toast } = useToast();
  const { result: taxResult } = useTaxStore();
  const estimatedTax = taxResult?.estimatedTax ?? 0;

  const macroTotals = useMemo(
    () => budget.map((macro) => ({
      ...macro,
      percentage: macro.micros.reduce((sum, m) => sum + m.percentage, 0),
    })),
    [budget]
  );

  const grandTotal = useMemo(
    () => macroTotals.reduce((sum, m) => sum + m.percentage, 0),
    [macroTotals]
  );

  const totalPct = grandTotal * 100;
  const isOver = totalPct > 100.05;
  const isUnder = totalPct < 99.95;
  const isValid = !isOver && !isUnder;
  const delta = totalPct - 100;
  const deltaB = (Math.abs(delta) / 100) * TOTAL_BUDGET_BILLIONS_AUD;

  const activeMacro = budget.find((m) => m.key === activeKey) ?? null;
  const activeMacroTotal = activeMacro
    ? activeMacro.micros.reduce((s, m) => s + m.percentage, 0)
    : 0;
  const activeMacroColor = macroTotals.find((m) => m.key === activeKey)?.color ?? "#fff";

  const doughnutCategories = macroTotals.map((m) => ({
    key: m.key,
    label: m.label,
    percentage: m.percentage,
    amount: m.percentage * TOTAL_BUDGET_BILLIONS_AUD,
    color: m.color,
    description: "",
  }));

  const handleMicroChange = (macroKey: string, microKey: string, newPct: number) => {
    setBudget((prev) =>
      prev.map((macro) =>
        macro.key !== macroKey
          ? macro
          : {
              ...macro,
              micros: macro.micros.map((m) =>
                m.key === microKey ? { ...m, percentage: newPct / 100 } : m
              ),
            }
      )
    );
  };

  const handleReset = () => {
    setBudget(JSON.parse(JSON.stringify(AUSTRALIA_BUDGET)));
  };

  const handleSubmit = () => {
    const allocations: Record<string, number> = {};
    macroTotals.forEach((cat) => {
      allocations[cat.key] = cat.percentage * 100;
    });
    submitPreference(
      { data: { allocations } },
      {
        onSuccess: () =>
          toast({
            title: "Preferences Saved!",
            description: "Your voice has been added to our public sentiment analytics.",
          }),
        onError: () =>
          toast({
            title: "Error",
            description: "Failed to submit preferences. Please try again.",
            variant: "destructive",
          }),
      }
    );
  };

  if (isLoading) {
    return (
      <PageTransition className="flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </PageTransition>
    );
  }

  if (isError || !data) {
    return (
      <PageTransition className="flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-xl font-bold mb-2">Failed to load baseline data</h3>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Budget Simulator</h1>
          <p className="text-muted-foreground">
            Australian Federal Budget FY{FISCAL_YEAR} · AUD ${TOTAL_BUDGET_BILLIONS_AUD}B total outlays · Adjust micro spending, macro totals update live.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4" /> Reset All
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!isValid && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  Budget {isOver ? "Overspend" : "Shortfall"} — {Math.abs(delta).toFixed(2)}%
                </p>
                <p className="text-destructive/80 mt-1">
                  {isOver
                    ? `Your budget exceeds 100% by ${Math.abs(delta).toFixed(2)}%. This would require an AUD $${deltaB.toFixed(0)}B tax increase or equivalent cuts elsewhere.`
                    : `Your budget is ${Math.abs(delta).toFixed(2)}% short. AUD $${deltaB.toFixed(0)}B remains unallocated — adjust sliders to reach exactly 100%.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold">Live Overview</h3>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full tabular-nums transition-colors ${
                  isValid
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {totalPct.toFixed(2)}% allocated
              </span>
            </div>
            <div style={{ height: 260 }}>
              <TaxDoughnut categories={doughnutCategories} hideLegend={true} />
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Click a category to drill down
              </p>
            </div>
            <div className="p-2 space-y-1">
              {macroTotals.map((macro) => {
                const pct = macro.percentage * 100;
                const isActive = activeKey === macro.key;
                return (
                  <button
                    key={macro.key}
                    onClick={() => setActiveKey(macro.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left group ${
                      isActive ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: macro.color }}
                    />
                    <span className="flex-1 font-medium text-sm">{macro.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: macro.color,
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums w-10 text-right"
                        style={{ color: macro.color }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!activeMacro ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="glass-panel rounded-3xl flex flex-col items-center justify-center text-center min-h-[460px] p-8"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <ChevronRight className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">Select a Category</h3>
                <p className="text-muted-foreground max-w-xs">
                  Click any spending category on the left to reveal its sub-items and adjust individual allocations.
                </p>
                {estimatedTax > 0 && (
                  <div className="mt-6 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-sm text-primary">
                    Your tax: <span className="font-bold">${estimatedTax.toLocaleString()}</span> — personal contributions will show per line item.
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={activeMacro.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="glass-panel rounded-3xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <nav className="flex items-center gap-1.5 text-sm">
                    <button
                      onClick={() => setActiveKey(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      Budget
                    </button>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-semibold" style={{ color: activeMacroColor }}>
                      {activeMacro.label}
                    </span>
                  </nav>
                  <button
                    onClick={() => setActiveKey(null)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-white/10 text-xs font-medium transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                </div>

                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeMacroColor }}
                    />
                    <span className="font-display font-semibold text-lg">{activeMacro.label}</span>
                    <span className="text-muted-foreground text-sm">macro total</span>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-display font-bold tabular-nums"
                      style={{ color: activeMacroColor }}
                    >
                      {(activeMacroTotal * 100).toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      AUD ${(activeMacroTotal * TOTAL_BUDGET_BILLIONS_AUD).toFixed(1)}B
                      {estimatedTax > 0 && (
                        <> · <span className="text-primary font-medium">You: ${(activeMacroTotal * estimatedTax).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span></>
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[480px] overflow-y-auto custom-scrollbar">
                  {activeMacro.micros.map((micro) => {
                    const microPct = micro.percentage * 100;
                    const dollarB = (micro.percentage * TOTAL_BUDGET_BILLIONS_AUD).toFixed(1);
                    const personalAmt =
                      estimatedTax > 0
                        ? (micro.percentage * estimatedTax).toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })
                        : null;
                    const tooltipId = `${activeMacro.key}-${micro.key}`;

                    return (
                      <div key={micro.key}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="relative mt-0.5">
                              <button
                                onMouseEnter={() => setTooltipKey(tooltipId)}
                                onMouseLeave={() => setTooltipKey(null)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              <AnimatePresence>
                                {tooltipKey === tooltipId && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    className="absolute left-5 top-0 z-20 w-56 p-3 bg-card border border-border rounded-xl text-xs text-muted-foreground shadow-2xl pointer-events-none"
                                  >
                                    {micro.description}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm leading-tight">{micro.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">AUD ${dollarB}B</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold tabular-nums">{microPct.toFixed(2)}%</p>
                            {personalAmt !== null && (
                              <p className="text-xs font-medium text-primary tabular-nums">
                                You: ${personalAmt}
                              </p>
                            )}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="25"
                          step="0.01"
                          value={microPct}
                          onChange={(e) =>
                            handleMicroChange(activeMacro.key, micro.key, Number(e.target.value))
                          }
                          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: activeMacroColor }}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              disabled={!isValid || isSubmitting}
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Submit Your Budget
            </button>
            <Link
              href="/sentiment"
              className="flex items-center justify-center gap-2 px-5 py-4 bg-secondary hover:bg-white/10 font-medium rounded-xl text-sm transition-colors"
            >
              View Sentiment Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
