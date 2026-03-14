import { useLocation, Link } from "wouter";
import { Menu, Calculator, ChevronRight } from "lucide-react";
import { useTaxStore } from "@/hooks/use-tax-store";

const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": { title: "Welcome to TaxScope", description: "Your Australian civic budget dashboard" },
  "/calculator": { title: "Tax Calculator", description: "Calculate how your income maps to federal spending" },
  "/breakdown": { title: "Budget Breakdown", description: "See exactly how your taxes are allocated by category" },
  "/lifetime": { title: "Lifetime Taxes", description: "Project your total career tax contribution over time" },
  "/explorer": { title: "National Budget Explorer", description: "Drill into every Australian federal spending category" },
  "/simulator": { title: "Budget Simulator", description: "Redesign the federal budget and submit your preference" },
  "/sentiment": { title: "Public Sentiment", description: "Compare citizen preferences to actual government allocation" },
  "/money-map": { title: "Follow the Money Map", description: "Visualise where your taxes fund infrastructure across Australia" },
  "/share": { title: "Share Your Receipt", description: "Export and share your personalised tax breakdown card" },
};

export function TopHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const [location] = useLocation();
  const { result } = useTaxStore();
  const meta = ROUTE_META[location] ?? { title: "TaxScope", description: "" };
  const estimatedTax = result?.estimatedTax;

  return (
    <header
      className="h-14 shrink-0 border-b border-white/5 px-4 sm:px-6 flex items-center justify-between gap-4"
      style={{
        background: "rgba(8,9,14,0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* ── Left: hamburger + page meta ──────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors md:hidden shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="font-display font-semibold text-sm leading-tight text-foreground truncate">
            {meta.title}
          </p>
          <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
            {meta.description}
          </p>
        </div>
      </div>

      {/* ── Right: tax chip ───────────────────────────────────── */}
      <div className="shrink-0">
        {estimatedTax ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-sm">
            <span className="text-muted-foreground text-xs hidden sm:inline">Your taxes:</span>
            <span className="font-bold text-primary tabular-nums">
              ${estimatedTax.toLocaleString("en-AU", { maximumFractionDigits: 0 })}
            </span>
          </div>
        ) : (
          <Link
            href="/calculator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all group"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculate Tax</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </header>
  );
}
