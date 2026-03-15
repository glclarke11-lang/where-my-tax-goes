import { PageTransition } from "@/components/PageTransition";
import { useGetBudgetData } from "@workspace/api-client-react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { CategoryCard } from "@/components/CategoryCard";
import { TaxFlowDiagram } from "@/components/TaxFlowDiagram";
import { Loader2, AlertTriangle, Calendar } from "lucide-react";

export default function Breakdown() {
  const { data, isLoading, isError } = useGetBudgetData();

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Federal Budget Breakdown</h1>
        <p className="text-lg text-muted-foreground">
          A comprehensive view of how every dollar of tax revenue is allocated across government sectors.
        </p>
      </div>

      {isLoading && (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-primary">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p>Loading federal budget data...</p>
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
        <div className="space-y-12">
          {/* Main Chart Section */}
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Calendar className="w-4 h-4" />
              Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-12 mt-8 md:mt-0">
              <div className="w-full md:w-1/2 max-w-[400px]">
                <TaxDoughnut 
                  categories={data.categories} 
                  totalLabel="Total Allocation"
                  totalValue="100%"
                />
              </div>
              
              <div className="w-full md:w-1/2 space-y-6">
                <h3 className="text-2xl font-display font-semibold mb-4">The Big Picture</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  The government distributes tax revenue according to national priorities. 
                  Currently, <span className="text-foreground font-semibold" style={{ color: data.categories[0]?.color }}>{data.categories[0]?.label}</span> receives the largest portion of funding, 
                  while <span className="text-foreground font-semibold" style={{ color: data.categories[data.categories.length-1]?.color }}>{data.categories[data.categories.length-1]?.label}</span> represents the smallest specific allocation.
                </p>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary font-medium">
                  Want to see this applied to your specific income? Visit the <a href="/calculator" className="underline hover:text-white transition-colors">Calculator</a>.
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Cards */}
          <div>
            <h2 className="text-2xl font-display font-semibold mb-6 px-2">Detailed Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.categories.map(cat => (
                <CategoryCard key={cat.key} category={cat} />
              ))}
            </div>
          </div>

          {/* Tax Flow Diagram */}
          <div className="glass-panel rounded-3xl p-6 md:p-8">
            <TaxFlowDiagram />
          </div>
        </div>
      )}
    </PageTransition>
  );
}
