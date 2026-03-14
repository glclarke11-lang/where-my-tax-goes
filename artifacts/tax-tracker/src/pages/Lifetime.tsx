import { useState } from "react";
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
import { Loader2, TrendingUp, DollarSign, Calculator } from "lucide-react";
import { CategoryCard } from "@/components/CategoryCard";

ChartJS.register(
  LineElement,
  PointElement,
  BarElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Lifetime() {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(65);
  const [startingSalary, setStartingSalary] = useState<number>(50000);
  const [currentSalary, setCurrentSalary] = useState<number>(80000);
  const [annualGrowthRate, setAnnualGrowthRate] = useState<number>(3);

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

  const lineChartData = data?.yearlyData
    ? {
        labels: data.yearlyData.map((d) => d.age),
        datasets: [
          {
            label: "Tax Paid Per Year",
            data: data.yearlyData.map((d) => d.tax),
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  const barChartData = data?.decadeBreakdown
    ? {
        labels: data.decadeBreakdown.map((d) => d.decade),
        datasets: [
          {
            label: "Total Tax by Decade",
            data: data.decadeBreakdown.map((d) => d.totalTax),
            backgroundColor: "#3b82f6",
            borderRadius: 4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#A1A1AA",
        },
      },
      tooltip: {
        backgroundColor: "#18181B",
        titleColor: "#FFFFFF",
        bodyColor: "#A1A1AA",
        borderColor: "#27272A",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "#A1A1AA" },
        grid: { color: "#27272A" },
      },
      y: {
        ticks: { color: "#A1A1AA" },
        grid: { color: "#27272A" },
      },
    },
  };

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">Lifetime Tax Dashboard</h1>
        <p className="text-muted-foreground">Project your total career tax contribution and understand your lifetime impact.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleCalculate} className="glass-panel p-6 rounded-3xl space-y-6">
            <h2 className="text-xl font-display font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Your Trajectory
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Current Age</label>
                <input
                  type="number"
                  min="18"
                  max="64"
                  required
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Retirement Age</label>
                <input
                  type="number"
                  min={currentAge + 1}
                  max="80"
                  required
                  value={retirementAge}
                  onChange={(e) => setRetirementAge(Number(e.target.value))}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Starting Salary ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={startingSalary}
                    onChange={(e) => setStartingSalary(Number(e.target.value))}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Current Salary ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(Number(e.target.value))}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Annual Growth Rate (%)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={annualGrowthRate}
                    onChange={(e) => setAnnualGrowthRate(Number(e.target.value))}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calculate Lifetime Tax"}
            </button>
          </form>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-8 space-y-8">
          {!data && !isPending && (
            <div className="h-full min-h-[400px] glass-panel rounded-3xl flex flex-col items-center justify-center text-center p-8">
              <TrendingUp className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">Ready to see your lifetime impact?</h3>
              <p className="text-muted-foreground max-w-md">Enter your career details on the left to project your total lifetime tax contributions and see exactly where that money goes.</p>
            </div>
          )}

          {isPending && (
            <div className="h-full min-h-[400px] glass-panel rounded-3xl flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}

          {data && !isPending && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-2xl md:col-span-2 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Lifetime Tax</p>
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                    ${data.totalLifetimeTax.toLocaleString()}
                  </h2>
                </div>
                
                <div className="grid grid-rows-2 gap-4">
                  <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Years Working</p>
                    <p className="text-2xl font-bold text-foreground">{data.yearsWorking}</p>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl flex flex-col justify-center">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Avg Effective Rate</p>
                    <p className="text-2xl font-bold text-foreground">{(data.averageEffectiveRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl h-[300px] flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Tax Paid Per Year</h3>
                  <div className="flex-1 min-h-0">
                    {lineChartData && <Line data={lineChartData} options={chartOptions} />}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl h-[300px] flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Tax by Decade</h3>
                  <div className="flex-1 min-h-0">
                    {barChartData && <Bar data={barChartData} options={chartOptions} />}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-display font-bold mb-4">Lifetime Contribution by Sector</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.categoryBreakdown.map(cat => (
                    <CategoryCard key={cat.key} category={cat} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}