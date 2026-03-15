import { PageTransition } from "@/components/PageTransition";
import { useGetNationalBudget } from "@workspace/api-client-react";
import { useTaxStore } from "@/hooks/use-tax-store";
import { Loader2, AlertTriangle, ChevronDown, Search, X, Star, DollarSign, Calculator } from "lucide-react";
import { TaxDoughnut } from "@/components/TaxDoughnut";
import { useState, useMemo, useCallback, useRef, useEffect, type JSX } from "react";
import { useMarkExplored } from "@/hooks/use-explore-tracker";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

// ── Category icons ────────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  healthcare:    "🏥",
  health:        "🏥",
  education:     "🎓",
  defence:       "🪖",
  infrastructure:"🛣️",
  welfare:       "👴",
  social:        "👴",
  environment:   "🌿",
  economic:      "💼",
  international: "🌏",
  government:    "🏛️",
  general:       "🏛️",
};

function iconForLabel(label: string): string {
  const l = label.toLowerCase();
  for (const [key, icon] of Object.entries(ICONS)) {
    if (l.includes(key)) return icon;
  }
  return "💰";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtB(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}T`;
  if (n >= 1)    return `$${n.toFixed(0)}B`;
  return `$${(n * 1000).toFixed(0)}M`;
}
function fmtUser(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%`; }

function Highlight({ text, query }: { text: string; query: string }): JSX.Element {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-400/25 text-yellow-200 rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Explorer() {
  useMarkExplored("explorer");
  // ── ALL hooks first — never after any conditional return ──────────────────
  const { data, isLoading, isError } = useGetNationalBudget();
  const { result }                   = useTaxStore();

  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [searchQuery,  setSearchQuery]  = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback(
    (key: string) => setExpandedKeys((p) => ({ ...p, [key]: !p[key] })),
    []
  );

  const estimatedTax = result?.estimatedTax ?? 0;
  const hasUserTax   = estimatedTax > 0;

  const categories = useMemo(() => data?.categories ?? [], [data]);
  const totalB     = data?.totalBudgetBillions ?? 690;
  const maxPct     = useMemo(
    () => (categories.length ? Math.max(...categories.map((c) => c.percentage)) : 1),
    [categories]
  );

  const q = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.label.toLowerCase().includes(q) ||
        (cat.description ?? "").toLowerCase().includes(q) ||
        cat.subCategories.some(
          (s) => s.label.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
        )
    );
  }, [categories, q]);

  const autoExpand = useMemo<Record<string, boolean>>(() => {
    if (!q) return {};
    const out: Record<string, boolean> = {};
    categories.forEach((cat) => {
      const parentMatch = cat.label.toLowerCase().includes(q);
      const subMatch    = cat.subCategories.some(
        (s) => s.label.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)
      );
      if (!parentMatch && subMatch) out[cat.key] = true;
    });
    return out;
  }, [categories, q]);

  const topPrograms = useMemo(() => {
    return categories
      .flatMap((cat) =>
        cat.subCategories.map((sub) => ({
          ...sub,
          color:       cat.color,
          parentLabel: cat.label,
          icon:        iconForLabel(cat.label),
        }))
      )
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8);
  }, [categories]);

  const maxSubPct = topPrograms[0]?.percentage ?? 1;

  // ── Loading / error (after all hooks) ────────────────────────────────────
  if (isLoading) return (
    <PageTransition className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </PageTransition>
  );

  if (isError || !data) return (
    <PageTransition className="flex flex-col items-center justify-center text-center min-h-[60vh]">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h3 className="text-xl font-bold mb-2">Failed to load national budget data</h3>
    </PageTransition>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-1">National Budget Explorer</h1>
        <p className="text-muted-foreground">
          FY{data.fiscalYear} Federal Budget:{" "}
          <span className="font-semibold text-foreground">${data.totalBudgetBillions.toFixed(0)}B total outlay</span>
          {hasUserTax && (
            <span className="ml-3 text-sm text-emerald-400">
              · showing your ${estimatedTax.toLocaleString()} contribution
            </span>
          )}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ width: "1.05rem", height: "1.05rem" }} />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search programs, departments… e.g. Medicare, NDIS, Universities, Infrastructure"
          className="w-full pl-11 pr-10 py-3.5 bg-secondary/60 border-2 border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search summary */}
      <AnimatePresence>
        {q && (
          <motion.p
            key="search-summary"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 text-sm text-muted-foreground"
          >
            {filtered.length === 0
              ? <>No results for "<span className="text-foreground">{searchQuery}</span>"</>
              : <><span className="font-semibold text-foreground">{filtered.length}</span> categor{filtered.length === 1 ? "y" : "ies"} match "<span className="text-foreground">{searchQuery}</span>"</>
            }
          </motion.p>
        )}
      </AnimatePresence>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

        {/* ── LEFT: Doughnut + Top Programs ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Doughnut (kept) */}
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-sm font-display font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Budget Distribution</h2>
            <TaxDoughnut categories={data.categories} hideLegend={true} />
          </div>

          {/* Unlocked when no tax */}
          {!hasUserTax && (
            <Link
              href="/calculator"
              className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/6 hover:bg-primary/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">Unlock personal contributions</p>
                <p className="text-xs text-muted-foreground">Enter your income in the Calculator to see how much you fund each program</p>
              </div>
            </Link>
          )}

          {/* Top Programs */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <h2 className="text-sm font-display font-semibold">Top Spending Programs</h2>
            </div>
            <div className="space-y-3.5">
              {topPrograms.map((prog, i) => {
                const barPct  = (prog.percentage / maxSubPct) * 100;
                const subNatB = prog.percentage * totalB;
                const userAmt = estimatedTax * prog.percentage;
                return (
                  <motion.div
                    key={prog.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0">{prog.icon}</span>
                        <span className="text-xs font-medium truncate">{prog.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasUserTax && (
                          <span className="text-[10px] font-bold tabular-nums" style={{ color: prog.color }}>
                            {fmtUser(userAmt)}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground tabular-nums">{fmtPct(prog.percentage)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ delay: i * 0.04 + 0.1, duration: 0.5, ease: "easeOut" }}
                        style={{ backgroundColor: prog.color }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/55">{prog.parentLabel} · {fmtB(subNatB)}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Hierarchical Explorer ── */}
        <div className="lg:col-span-8">
          {/* Column headers */}
          <div className="flex items-center px-4 pb-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 border-b border-white/5">
            <span className="flex-1">Category / Program</span>
            <span className="w-32 text-right hidden md:block">National Spending</span>
            {hasUserTax && <span className="w-28 text-right">Your Share</span>}
            <span className="w-8" />
          </div>

          <div className="space-y-2 mt-1">
            <AnimatePresence>
              {filtered.map((cat, catIdx) => {
                const isExpanded  = expandedKeys[cat.key] || autoExpand[cat.key] || false;
                const barPct      = (cat.percentage / maxPct) * 100;
                const userMacro   = estimatedTax * cat.percentage;
                const natB        = cat.amount; // in billions per API contract
                const icon        = iconForLabel(cat.label);

                const visibleSubs = q
                  ? cat.subCategories.filter(
                      (s) =>
                        cat.label.toLowerCase().includes(q) ||          // show all if parent matches
                        s.label.toLowerCase().includes(q) ||
                        (s.description ?? "").toLowerCase().includes(q)
                    )
                  : cat.subCategories;

                return (
                  <motion.div
                    key={cat.key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.03, duration: 0.25 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border:     `1px solid ${isExpanded ? cat.color + "35" : "rgba(255,255,255,0.07)"}`,
                      background: isExpanded ? `${cat.color}08` : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Macro row */}
                    <button
                      onClick={() => toggle(cat.key)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/4 transition-colors text-left group"
                    >
                      <span className="text-xl shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-sm">
                            <Highlight text={cat.label} query={searchQuery} />
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ color: cat.color, background: `${cat.color}18` }}
                          >
                            {fmtPct(cat.percentage)}
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${barPct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>

                      <div className="w-32 text-right shrink-0 hidden md:block">
                        <p className="text-xs font-semibold tabular-nums">{fmtB(natB)}</p>
                        <p className="text-[10px] text-muted-foreground">{cat.subCategories.length} programs</p>
                      </div>

                      {hasUserTax && (
                        <div className="w-28 text-right shrink-0">
                          <p className="text-xs font-bold tabular-nums" style={{ color: cat.color }}>
                            {fmtUser(userMacro)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">your share</p>
                        </div>
                      )}

                      <ChevronDown
                        className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 group-hover:text-foreground"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    {/* Subcategory expansion */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          {cat.description && (
                            <div
                              className="px-5 py-3 text-xs text-muted-foreground leading-relaxed border-t"
                              style={{ borderColor: `${cat.color}20`, background: "rgba(0,0,0,0.15)" }}
                            >
                              {cat.description}
                            </div>
                          )}

                          <div
                            className="flex items-center px-5 pt-3 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/50 border-t"
                            style={{ borderColor: `${cat.color}15` }}
                          >
                            <span className="flex-1">Program</span>
                            <span className="w-32 text-right hidden md:block">Budget</span>
                            {hasUserTax && <span className="w-28 text-right">Your Share</span>}
                          </div>

                          <div className="pb-3 space-y-0.5">
                            {visibleSubs.map((sub, si) => {
                              const subBarPct  = (sub.percentage / maxPct) * 100;
                              const subNatB    = sub.percentage * totalB;
                              const subUser    = estimatedTax * sub.percentage;
                              const matchesSub = q && !cat.label.toLowerCase().includes(q) &&
                                (sub.label.toLowerCase().includes(q) || (sub.description ?? "").toLowerCase().includes(q));
                              return (
                                <motion.div
                                  key={sub.label}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: si * 0.03, duration: 0.2 }}
                                  className={`flex items-start gap-3 px-5 py-2.5 transition-colors ${
                                    matchesSub ? "bg-yellow-400/6 rounded-lg mx-2" : "hover:bg-white/3"
                                  }`}
                                >
                                  <div className="flex items-center gap-1 shrink-0 pt-1">
                                    <div className="w-3 h-px bg-white/15" />
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color, opacity: 0.7 }} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-medium">
                                        <Highlight text={sub.label} query={searchQuery} />
                                      </span>
                                      <span className="text-[10px] text-muted-foreground shrink-0">{fmtPct(sub.percentage)}</span>
                                    </div>
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-1.5">
                                      <motion.div
                                        className="h-full rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${subBarPct}%` }}
                                        transition={{ delay: si * 0.04, duration: 0.5, ease: "easeOut" }}
                                        style={{ backgroundColor: cat.color, opacity: 0.75 }}
                                      />
                                    </div>
                                    {sub.description && (
                                      <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2">
                                        <Highlight text={sub.description} query={searchQuery} />
                                      </p>
                                    )}
                                  </div>

                                  <div className="w-32 text-right shrink-0 hidden md:block pt-0.5">
                                    <p className="text-[11px] font-semibold tabular-nums">{fmtB(subNatB)}</p>
                                  </div>

                                  {hasUserTax && (
                                    <div className="w-28 text-right shrink-0 pt-0.5">
                                      <p className="text-[11px] font-bold tabular-nums" style={{ color: cat.color }}>
                                        {fmtUser(subUser)}
                                      </p>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No results for "<span className="text-foreground">{searchQuery}</span>"</p>
                <button onClick={() => setSearchQuery("")} className="mt-3 text-sm text-primary hover:underline">
                  Clear search
                </button>
              </div>
            )}
          </div>

          {/* Scale legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 px-1 text-[10px] text-muted-foreground/50">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-1.5 rounded-full bg-white/20" />
              Bar width = % of $690B budget
            </div>
            {hasUserTax && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" />
                Your share = your ${estimatedTax.toLocaleString()} tax × program %
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
