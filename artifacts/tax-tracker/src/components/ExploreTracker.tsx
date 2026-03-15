import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Share2, Users } from "lucide-react";
import { useExploreTracker, EXPLORE_STEPS } from "@/hooks/use-explore-tracker";

export function ExploreTracker() {
  const { visited } = useExploreTracker();
  const total     = EXPLORE_STEPS.length;
  const done      = EXPLORE_STEPS.filter((s) => visited.has(s.id)).length;
  const pct       = Math.round((done / total) * 100);
  const allDone   = done === total;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/8 overflow-hidden mb-8"
      style={{ background: "rgba(255,255,255,0.025)" }}
    >
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-base font-display font-bold leading-tight">Explore Your Taxes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Follow the journey of tax money through Australia.
          </p>
        </div>

        {/* Progress fraction + bar */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 min-w-[140px]">
          <span className="text-xs font-semibold tabular-nums">
            {allDone ? (
              <span className="text-emerald-400">All steps completed 🎉</span>
            ) : (
              <span>
                <span className="text-foreground">{done}</span>
                <span className="text-muted-foreground"> / {total} steps completed</span>
              </span>
            )}
          </span>
          <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background: allDone
                  ? "linear-gradient(90deg, #10B981, #34D399)"
                  : "linear-gradient(90deg, hsl(189 94% 43%), hsl(262 83% 68%))",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Steps grid ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {allDone ? (
          /* ── Reward message ── */
          <motion.div
            key="reward"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="px-5 pb-5 pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-400 mb-1">
                You've explored the full TaxScope platform.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You now understand how Australia's $690B federal budget is collected and spent.
                Share your results or submit your budget preference to make your voice heard.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href="/share"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/15 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share receipt
              </Link>
              <Link
                href="/sentiment"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/25 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                Submit preference
              </Link>
            </div>
          </motion.div>
        ) : (
          /* ── Checklist ── */
          <motion.div
            key="checklist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-0 border-t border-white/5 divide-y divide-white/5 md:divide-y-0"
          >
            {EXPLORE_STEPS.map((step, i) => {
              const isVisited = visited.has(step.id);
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-2.5 px-4 py-3 transition-colors ${
                    isVisited ? "bg-emerald-500/5" : "hover:bg-white/3"
                  } ${
                    /* right border between col pairs on md+ */
                    i % 3 !== 2 ? "md:border-r md:border-white/5" : ""
                  } ${
                    /* top border for all rows after first on md */
                    i >= 3 ? "md:border-t md:border-white/5" : ""
                  }`}
                >
                  {isVisited ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isVisited ? "text-emerald-300" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                  </div>
                  {!isVisited && (
                    <Link
                      href={step.href}
                      className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                    >
                      Go →
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
