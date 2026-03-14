import { PageTransition } from "@/components/PageTransition";
import { useTaxStore } from "@/hooks/use-tax-store";
import { useCalculateTax } from "@workspace/api-client-react";
import { useState } from "react";
import { DollarSign, ArrowRight, Loader2, Download, PieChart } from "lucide-react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { CategoryCard } from "@/components/CategoryCard";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Calculator() {
  const { setInput, result, setResult } = useTaxStore();
  const [incomeStr, setIncomeStr] = useState("");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [taxPaidStr, setTaxPaidStr] = useState("");
  const [localError, setLocalError] = useState("");

  const calculateMutation = useCalculateTax();

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setResult(null);

    const income = Number(incomeStr);
    if (!income || income <= 0) {
      setLocalError("Please enter a valid annual income.");
      return;
    }

    const payload: { income?: number; taxPaid?: number } = { income };
    if (isAdvanced && taxPaidStr) {
      payload.taxPaid = Number(taxPaidStr);
    }

    try {
      // Generated client expects: mutateAsync({ data: TaxInput })
      const res = await calculateMutation.mutateAsync({ data: payload });
      setInput(payload);
      setResult(res);
    } catch (err: any) {
      setLocalError(err?.message || "Failed to calculate taxes. Please try again.");
    }
  };

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">Tax Calculator</h1>
            <p className="text-muted-foreground">Find out exactly where your money goes.</p>
          </div>

          <form onSubmit={handleCalculate} className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Annual Income</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="number"
                  value={incomeStr}
                  onChange={(e) => setIncomeStr(e.target.value)}
                  placeholder="e.g. 85000"
                  className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={isAdvanced}
                  onChange={(e) => setIsAdvanced(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                />
                <span className="text-sm text-muted-foreground">I know exactly how much tax I paid</span>
              </label>

              {isAdvanced && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-medium text-foreground">Total Tax Paid (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="number"
                      value={taxPaidStr}
                      onChange={(e) => setTaxPaidStr(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {localError && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{localError}</div>}

            <button
              type="submit"
              disabled={calculateMutation.isPending}
              className="w-full py-4 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {calculateMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  Show Breakdown
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8">
          {!result && !calculateMutation.isPending && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-card/20">
              <PieChart className="w-16 h-16 mb-4 text-border" />
              <h3 className="text-xl font-medium mb-2 text-foreground">Awaiting Input</h3>
              <p>Enter your income on the left to see your personalized tax breakdown.</p>
            </div>
          )}

          {calculateMutation.isPending && (
            <div className="h-full min-h-[400px] rounded-3xl flex flex-col items-center justify-center text-primary">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-medium animate-pulse">Crunching the numbers...</p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Summary Header */}
              <div className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 w-full">
                  <p className="text-muted-foreground mb-1 font-medium">Estimated Total Tax</p>
                  <p className="text-4xl sm:text-5xl font-display font-bold text-primary mb-4 tracking-tight">
                    ${result.estimatedTax.toLocaleString()}
                  </p>
                  <div className="flex gap-4">
                    <div className="bg-white/5 rounded-lg px-4 py-2">
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="font-medium">${result.income.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg px-4 py-2">
                      <p className="text-xs text-muted-foreground">Effective Rate</p>
                      <p className="font-medium">{(result.effectiveRate * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-64">
                  <TaxDoughnut 
                    categories={result.breakdown} 
                    hideLegend={true}
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/share"
                  className="px-6 py-3 rounded-xl font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-foreground transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Create Share Card
                </Link>
              </div>

              {/* Grid of categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.breakdown.map((cat) => (
                  <CategoryCard key={cat.key} category={cat} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
