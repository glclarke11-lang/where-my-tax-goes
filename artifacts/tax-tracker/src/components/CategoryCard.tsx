import type { LocalSpendingCategory } from "@/hooks/use-tax-store";
import { Info } from "lucide-react";

export function CategoryCard({ category }: { category: LocalSpendingCategory }) {
  const formattedAmount = category.amount
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(category.amount)
    : undefined;

  return (
    <div className="group relative bg-card hover:bg-white/[0.03] border border-white/5 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-white/10 overflow-hidden">
      {/* Top Gradient Glow based on category color */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: category.color }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: category.color, boxShadow: `0 0 10px ${category.color}80` }}
          />
          <h3 className="font-display font-semibold text-lg text-foreground">{category.label}</h3>
        </div>
        <div className="group/tooltip relative">
          <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
          {/* Custom Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-popover text-popover-foreground text-xs rounded-xl border border-border shadow-xl opacity-0 group-hover/tooltip:opacity-100 translate-y-2 group-hover/tooltip:translate-y-0 pointer-events-none transition-all duration-200 z-10">
            {category.description}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Percentage</p>
          <p className="text-xl font-bold text-foreground">{(category.percentage * 100).toFixed(1)}%</p>
        </div>
        {formattedAmount && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Your Contribution</p>
            <p className="text-xl font-bold" style={{ color: category.color }}>{formattedAmount}</p>
          </div>
        )}
      </div>
    </div>
  );
}
