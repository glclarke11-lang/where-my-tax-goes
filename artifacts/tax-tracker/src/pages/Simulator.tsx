import { PageTransition } from "@/components/PageTransition";
import { useGetBudgetData } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { Loader2, AlertTriangle, RefreshCcw } from "lucide-react";
import type { LocalSpendingCategory } from "@/hooks/use-tax-store";

export default function Simulator() {
  const { data, isLoading, isError } = useGetBudgetData();
  const [simCategories, setSimCategories] = useState<LocalSpendingCategory[]>([]);

  useEffect(() => {
    if (data?.categories) {
      // Deep copy to avoid mutating cache
      setSimCategories(JSON.parse(JSON.stringify(data.categories)));
    }
  }, [data]);

  const handleSliderChange = (key: string, newPercentageValue: number) => {
    setSimCategories((prev) =>
      prev.map((c) => (c.key === key ? { ...c, percentage: newPercentageValue / 100 } : c))
    );
  };

  const handleReset = () => {
    if (data?.categories) {
      setSimCategories(JSON.parse(JSON.stringify(data.categories)));
    }
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

  // Calculate sum of percentages
  const currentTotal = simCategories.reduce((acc, cat) => acc + cat.percentage, 0) * 100;
  const isOver = currentTotal > 100.1;
  const isUnder = currentTotal < 99.9;
  const isValid = !isOver && !isUnder;

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">Budget Simulator</h1>
        <p className="text-muted-foreground">Adjust the sliders to build your ideal government budget.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Controls */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-8">
          <div className="flex justify-between items-end pb-4 border-b border-border">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Allocated Total</p>
              <h2 className={`text-4xl font-display font-bold tracking-tight transition-colors ${isValid ? 'text-primary' : 'text-destructive'}`}>
                {currentTotal.toFixed(1)}%
              </h2>
            </div>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-white/10 text-sm font-medium transition-colors"
            >
              <RefreshCcw className="w-4 h-4" /> Reset
            </button>
          </div>

          {!isValid && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Your budget must equal exactly 100% to be realistic. You are currently {isOver ? "over" : "under"} budget by {Math.abs(currentTotal - 100).toFixed(1)}%.
            </div>
          )}

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            {simCategories.map((cat) => (
              <div key={cat.key} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <label className="font-medium">{cat.label}</label>
                  </div>
                  <span className="text-sm font-bold bg-white/5 px-2 py-1 rounded-md min-w-[3.5rem] text-center">
                    {(cat.percentage * 100).toFixed(1)}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={cat.percentage * 100}
                  onChange={(e) => handleSliderChange(cat.key, Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  style={{ accentColor: cat.color }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center">
            <h3 className="text-xl font-display font-semibold mb-6">Your Simulation</h3>
            <div className="w-full max-w-[350px]">
              <TaxDoughnut categories={simCategories} hideLegend={true} />
            </div>
          </div>
          
          <div className="bg-card border border-border p-6 rounded-3xl flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity">
            <h3 className="text-xl font-display font-semibold mb-6">Current Government Budget</h3>
            <div className="w-full max-w-[250px]">
              <TaxDoughnut categories={data.categories} hideLegend={true} />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
