import { PageTransition } from "@/components/PageTransition";
import { useGetPublicSentiment } from "@workspace/api-client-react";
import { Loader2, AlertTriangle, Users, TrendingDown, TrendingUp, Minus } from "lucide-react";
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
import { Link } from "wouter";

ChartJS.register(BarElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

export default function Sentiment() {
  const { data, isLoading, isError } = useGetPublicSentiment();

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
        <h3 className="text-xl font-bold mb-2">Failed to load sentiment data</h3>
      </PageTransition>
    );
  }

  const chartData = {
    labels: data.categories.map(c => c.label),
    datasets: [
      {
        label: "Government Allocation",
        data: data.categories.map(c => c.governmentAllocation),
        backgroundColor: "#27272a", // darker gray for government
        borderRadius: 4,
      },
      {
        label: "Citizen Preference",
        data: data.categories.map(c => c.averageUserPreference),
        backgroundColor: data.categories.map(c => c.color), // category specific color for citizens
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#A1A1AA" }
      },
      tooltip: {
        backgroundColor: "#18181B",
        titleColor: "#FFFFFF",
        bodyColor: "#A1A1AA",
        borderColor: "#27272A",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => ` ${context.dataset.label}: ${context.raw.toFixed(1)}%`
        }
      },
    },
    scales: {
      x: {
        ticks: { color: "#A1A1AA" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#A1A1AA" },
        grid: { color: "#27272A" },
      },
    },
  };

  return (
    <PageTransition>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Public Sentiment Dashboard</h1>
          <p className="text-muted-foreground text-lg">Compare actual budget vs what citizens really want.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium self-start md:self-end">
          <Users className="w-4 h-4" />
          <span>Based on {data.totalResponses.toLocaleString()} citizen responses</span>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl h-[400px] flex flex-col mb-12">
        <h2 className="text-xl font-display font-semibold mb-6">Government vs Citizen Preferences</h2>
        <div className="flex-1 min-h-0">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <h2 className="text-2xl font-display font-bold mb-6">Detailed Discrepancies</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {data.categories.map(category => {
          const diff = category.averageUserPreference - category.governmentAllocation;
          const isSignificant = Math.abs(diff) > 1.0;
          
          let DeltaIcon = Minus;
          let deltaColor = "text-muted-foreground";
          let deltaBg = "bg-secondary";
          
          if (isSignificant) {
            if (diff > 0) {
              DeltaIcon = TrendingUp;
              deltaColor = "text-green-500";
              deltaBg = "bg-green-500/10 border border-green-500/20";
            } else {
              DeltaIcon = TrendingDown;
              deltaColor = "text-red-500";
              deltaBg = "bg-red-500/10 border border-red-500/20";
            }
          }

          return (
            <div key={category.key} className="glass-panel p-6 rounded-2xl border border-border relative overflow-hidden group">
              <div 
                className="absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: category.color }}
              />
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-semibold text-lg text-foreground">{category.label}</h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${deltaBg} ${deltaColor}`}>
                  <DeltaIcon className="w-3 h-3" />
                  {Math.abs(diff).toFixed(1)}%
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Government</span>
                    <span className="font-medium">{category.governmentAllocation.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${category.governmentAllocation}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Citizens Want</span>
                    <span className="font-medium">{category.averageUserPreference.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${category.averageUserPreference}%`, backgroundColor: category.color }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center max-w-3xl mx-auto">
        <h3 className="text-2xl font-display font-bold text-foreground mb-4">Add Your Voice</h3>
        <p className="text-muted-foreground mb-6">
          Disagree with how the government allocates taxes? Use the Budget Simulator to create your ideal budget and add your preferences to this dashboard.
        </p>
        <Link 
          href="/simulator"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Users className="w-5 h-5" />
          Go to Simulator
        </Link>
      </div>
    </PageTransition>
  );
}