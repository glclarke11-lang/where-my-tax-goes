import { PageTransition } from "@/components/PageTransition";
import { useGetNationalBudget } from "@workspace/api-client-react";
import { Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(BarElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

export default function Explorer() {
  const { data, isLoading, isError } = useGetNationalBudget();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <PageTransition className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </PageTransition>
    );
  }

  if (isError || !data) {
    return (
      <PageTransition className="flex flex-col items-center justify-center text-center min-h-[60vh]">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-xl font-bold mb-2">Failed to load national budget data</h3>
      </PageTransition>
    );
  }

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const barChartData = {
    labels: data.categories.map(c => c.label),
    datasets: [
      {
        label: "Budget Allocation (%)",
        data: data.categories.map(c => c.percentage * 100),
        backgroundColor: data.categories.map(c => c.color),
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18181B",
        titleColor: "#FFFFFF",
        bodyColor: "#A1A1AA",
        borderColor: "#27272A",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => ` ${context.raw.toFixed(1)}%`
        }
      },
    },
    scales: {
      x: {
        ticks: { color: "#A1A1AA" },
        grid: { color: "#27272A" },
      },
      y: {
        ticks: { color: "#A1A1AA" },
        grid: { display: false },
      },
    },
  };

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">National Budget Explorer</h1>
        <p className="text-muted-foreground text-lg">
          FY{data.fiscalYear} Federal Budget: <span className="font-semibold text-foreground">${data.totalBudgetBillions.toFixed(2)} Trillion</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-5 glass-panel p-8 rounded-3xl flex flex-col min-h-[400px]">
          <h2 className="text-xl font-display font-semibold mb-6">Budget Distribution</h2>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full" style={{ height: 320 }}>
              <TaxDoughnut 
                categories={data.categories} 
                hideLegend={true} 
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-xl font-display font-semibold mb-2">Category Deep Dive</h2>
          {data.categories.map((category) => (
            <div key={category.key} className="glass-panel rounded-2xl overflow-hidden border border-border hover:border-white/10 transition-colors">
              <button 
                onClick={() => toggleCategory(category.key)}
                className="w-full px-6 py-4 flex items-center justify-between bg-card/30 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <h3 className="font-semibold text-lg">{category.label}</h3>
                    <p className="text-sm text-muted-foreground">{(category.percentage * 100).toFixed(1)}% • ${(category.amount / 1000).toFixed(2)} Trillion</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${expandedCategories[category.key] ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {expandedCategories[category.key] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-6 bg-black/20 space-y-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">{category.description}</p>
                      
                      <div className="space-y-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sub-Categories</h4>
                        {category.subCategories.map((sub, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-foreground/80">{sub.label}</span>
                              <span className="text-muted-foreground">{(sub.percentage * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ 
                                  width: `${sub.percentage * 100}%`,
                                  backgroundColor: category.color,
                                  opacity: 0.8
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground/70 pl-1">{sub.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl h-[500px] flex flex-col">
        <h2 className="text-xl font-display font-semibold mb-6">Relative Comparison</h2>
        <div className="flex-1 min-h-0">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>
    </PageTransition>
  );
}