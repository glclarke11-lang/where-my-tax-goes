import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";

export interface InsightItem {
  text: ReactNode;
}

interface InsightPanelProps {
  insights: InsightItem[];
  className?: string;
}

export function InsightPanel({ insights, className = "" }: InsightPanelProps) {
  if (!insights.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400/80">
          Insight
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2.5">
        {insights.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-[7px] w-1 h-1 rounded-full bg-amber-400/50 shrink-0 block" />
            <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
