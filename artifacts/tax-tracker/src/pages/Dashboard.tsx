import { PageTransition } from "@/components/PageTransition";
import { useTaxStore } from "@/hooks/use-tax-store";
import { useGetPublicSentiment } from "@workspace/api-client-react";
import { AUSTRALIA_BUDGET, TOTAL_BUDGET_BILLIONS_AUD } from "@/data/australiaBudget";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Calculator, PieChart, Globe, Users, TrendingUp,
  MapPin, Share2, Landmark, DollarSign, Wallet, Banknote,
  ChevronRight, Zap, SlidersHorizontal,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number, prefix = "$") =>
  `${prefix}${n.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// ── Precompute macro totals from australiaBudget.ts ───────────────────────────
const MACRO_TOTALS = AUSTRALIA_BUDGET.map((cat) => ({
  key:        cat.key,
  label:      cat.label,
  color:      cat.color,
  percentage: cat.micros.reduce((s, m) => s + m.percentage, 0),
})).sort((a, b) => b.percentage - a.percentage);

// ── Section label ─────────────────────────────────────────────────────────────
function SLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-[10px] font-bold text-primary">{n}</span>
      </div>
      <h2 className="text-lg font-display font-bold">{title}</h2>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

// ── "View all" button ─────────────────────────────────────────────────────────
function ViewBtn({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group mt-4"
    >
      {label}
      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { result } = useTaxStore();
  const { data: sentimentData } = useGetPublicSentiment();

  const hasResult  = !!result?.estimatedTax;
  const income     = result?.income     ?? 0;
  const tax        = result?.estimatedTax ?? 0;
  const takehome   = income - tax - Math.round(income * 0.02); // approx after Medicare
  const effectiveR = result?.effectiveRate ?? 0;

  // Top 5 personal spending categories
  const topBreakdown = hasResult
    ? [...(result?.breakdown ?? [])].sort((a, b) => b.amount - a.amount).slice(0, 5)
    : [];
  const maxBreakdownAmt = topBreakdown[0]?.amount ?? 1;

  // Top 4 sentiment categories
  const topSentiment = sentimentData
    ? [...sentimentData.categories].sort((a, b) => b.averageUserPreference - a.averageUserPreference).slice(0, 4)
    : [];
  const maxSentPref = topSentiment[0]?.averageUserPreference ?? 1;

  // National budget top 5 (already sorted)
  const topNational = MACRO_TOTALS.slice(0, 5);
  const maxNatPct   = topNational[0]?.percentage ?? 1;

  return (
    <PageTransition>

      {/* ── Greeting header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold mb-1">
            {hasResult ? "Your Tax Dashboard" : "TaxScope Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {hasResult
              ? `Income $${income.toLocaleString()} · FY2024–25 Australian Federal Budget`
              : "Enter your income to personalise every section below."}
          </p>
        </div>
        {!hasResult && (
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0 self-start md:self-auto"
          >
            <Calculator className="w-4 h-4" />
            Calculate my tax
          </Link>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — YOUR TAX SUMMARY
      ══════════════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <SLabel n={1} title="Your Tax Summary" />

        {hasResult ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Banknote,    color: "text-blue-400",    bg: "bg-blue-400/10",    label: "Income",         value: fmt(income),    sub: "gross annual salary" },
              { icon: DollarSign,  color: "text-red-400",     bg: "bg-red-400/10",     label: "Estimated Tax",  value: fmt(tax),       sub: `${(effectiveR * 100).toFixed(1)}% effective rate` },
              { icon: Wallet,      color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Take-home Pay",  value: fmt(takehome),  sub: "after tax & Medicare" },
            ].map(({ icon: Icon, color, bg, label, value, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                className="rounded-2xl border border-white/8 p-5 flex items-start gap-4"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
                  <p className={`text-2xl font-display font-bold tabular-nums ${color}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center">
            <Calculator className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground mb-1">No income entered yet</p>
            <p className="text-sm text-muted-foreground/60 mb-4">
              Calculate your tax to see your income, estimated tax, and take-home pay.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all"
            >
              <Calculator className="w-4 h-4" /> Go to Calculator
            </Link>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTIONS 2 + 3 — side by side
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

        {/* SECTION 2 — YOUR TAX CONTRIBUTION */}
        <div className="lg:col-span-7">
          <SLabel n={2} title="Your Tax Contribution" />
          <div className="rounded-2xl border border-white/8 p-5 h-full" style={{ background: "rgba(255,255,255,0.025)" }}>
            {hasResult ? (
              <>
                <p className="text-xs text-muted-foreground mb-5">
                  How your <span className="font-semibold text-foreground">{fmt(tax)}</span> tax is distributed across the five largest sectors.
                </p>
                <div className="space-y-3.5">
                  {topBreakdown.map((cat, i) => {
                    const barW = (cat.amount / maxBreakdownAmt) * 100;
                    return (
                      <motion.div
                        key={cat.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm w-32 truncate shrink-0">{cat.label}</span>
                        <div className="flex-1 h-5 bg-secondary rounded-lg overflow-hidden">
                          <motion.div
                            className="h-full rounded-lg flex items-center pl-2"
                            initial={{ width: 0 }}
                            animate={{ width: `${barW}%` }}
                            transition={{ delay: i * 0.07 + 0.1, duration: 0.6, ease: "easeOut" }}
                            style={{ backgroundColor: cat.color, minWidth: 4 }}
                          >
                            {barW > 24 && (
                              <span className="text-[10px] font-bold text-white/80 tabular-nums">{fmt(cat.amount)}</span>
                            )}
                          </motion.div>
                        </div>
                        <span className="text-xs font-bold tabular-nums w-16 text-right shrink-0" style={{ color: cat.color }}>
                          {fmt(cat.amount)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                <ViewBtn href="/breakdown" label="View Full Breakdown" />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <PieChart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Your personal contribution breakdown appears here after you calculate your tax.</p>
                <ViewBtn href="/breakdown" label="Preview Budget Breakdown" />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3 — NATIONAL BUDGET SNAPSHOT */}
        <div className="lg:col-span-5">
          <SLabel n={3} title="National Budget Snapshot" />
          <div className="rounded-2xl border border-white/8 p-5 h-full" style={{ background: "rgba(255,255,255,0.025)" }}>
            <p className="text-xs text-muted-foreground mb-5">
              FY2024–25 federal budget — <span className="font-semibold text-foreground">${TOTAL_BUDGET_BILLIONS_AUD}B</span> total outlay.
            </p>
            <div className="space-y-3">
              {topNational.map((cat, i) => {
                const barW = (cat.percentage / maxNatPct) * 100;
                return (
                  <motion.div
                    key={cat.key}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs w-28 truncate shrink-0">{cat.label}</span>
                    <div className="flex-1 h-4 bg-secondary rounded-md overflow-hidden">
                      <motion.div
                        className="h-full rounded-md"
                        initial={{ width: 0 }}
                        animate={{ width: `${barW}%` }}
                        transition={{ delay: i * 0.07 + 0.1, duration: 0.55, ease: "easeOut" }}
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-10 text-right shrink-0" style={{ color: cat.color }}>
                      {pct(cat.percentage)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
            <ViewBtn href="/explorer" label="Explore Full Budget" />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTIONS 4 + 5 — side by side
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

        {/* SECTION 4 — YOUR BUDGET SIMULATION */}
        <div className="lg:col-span-5">
          <SLabel n={4} title="Your Budget Simulation" />
          <div
            className="rounded-2xl border border-white/8 p-5 h-full flex flex-col relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            {/* Decorative glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 60% at 80% 20%, hsl(262 83% 58% / 0.07), transparent 70%)" }}
            />
            <div className="relative flex-1 flex flex-col">
              <p className="text-xs text-muted-foreground mb-5">
                Run a real-time budget simulation. Balance the national accounts and see your approval rating soar — or crash.
              </p>

              {/* Mock indicators */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "Approval Rating", value: "—", sub: "complete simulation to update", color: "text-emerald-400" },
                  { label: "Deficit / Surplus", value: "—", sub: "based on your decisions",     color: "text-blue-400"   },
                  { label: "Sectors Changed", value: "0",  sub: "policy decisions made",         color: "text-accent"     },
                  { label: "Difficulty",       value: "Moderate", sub: "default setting",        color: "text-orange-400" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} className="rounded-xl border border-white/7 bg-white/2 p-3">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
                    <p className={`text-base font-display font-bold ${color}`}>{value}</p>
                    <p className="text-[9px] text-muted-foreground/60">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <Link
                  href="/run-the-country"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-accent/15 border border-accent/25 text-accent font-semibold rounded-xl hover:bg-accent/25 transition-all text-sm"
                >
                  <Landmark className="w-4 h-4" />
                  Run the Country
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>
                <Link
                  href="/simulator"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-white/8 text-muted-foreground hover:text-foreground hover:border-white/15 rounded-xl transition-all text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Budget Simulator
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 — PUBLIC SENTIMENT */}
        <div className="lg:col-span-7">
          <SLabel n={5} title="Public Sentiment" />
          <div className="rounded-2xl border border-white/8 p-5 h-full" style={{ background: "rgba(255,255,255,0.025)" }}>
            {topSentiment.length > 0 ? (
              <>
                <p className="text-xs text-muted-foreground mb-5">
                  Where <span className="font-semibold text-foreground">{sentimentData?.totalResponses.toLocaleString()}</span> Australians want their tax money spent.
                </p>
                <div className="space-y-3.5">
                  {topSentiment.map((cat, i) => {
                    const barW = (cat.averageUserPreference / maxSentPref) * 100;
                    return (
                      <motion.div
                        key={cat.key}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs font-bold text-muted-foreground/50 w-4 text-right tabular-nums">{i + 1}</span>
                        <span className="text-sm w-28 truncate shrink-0">{cat.label}</span>
                        <div className="flex-1 h-5 bg-secondary rounded-lg overflow-hidden">
                          <motion.div
                            className="h-full rounded-lg flex items-center pl-2"
                            initial={{ width: 0 }}
                            animate={{ width: `${barW}%` }}
                            transition={{ delay: i * 0.08 + 0.1, duration: 0.65, ease: "easeOut" }}
                            style={{ backgroundColor: cat.color, minWidth: 4 }}
                          >
                            {barW > 22 && (
                              <span className="text-[10px] font-bold text-white/80">{(cat.averageUserPreference * 100).toFixed(1)}%</span>
                            )}
                          </motion.div>
                        </div>
                        <span className="text-xs font-bold tabular-nums w-10 text-right shrink-0" style={{ color: cat.color }}>
                          {(cat.averageUserPreference * 100).toFixed(1)}%
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                <ViewBtn href="/sentiment" label="View Public Sentiment" />
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Loading sentiment data…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          QUICK LINKS — all other tools
      ══════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h2 className="text-lg font-display font-bold">More Tools</h2>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/lifetime",  icon: TrendingUp,  color: "text-green-400",  bg: "bg-green-400/8",  label: "Lifetime Taxes",   sub: "Project your career contribution" },
            { href: "/money-map", icon: MapPin,       color: "text-orange-400", bg: "bg-orange-400/8", label: "Money Map",         sub: "Follow spending to real projects" },
            { href: "/share",     icon: Share2,       color: "text-pink-400",   bg: "bg-pink-400/8",   label: "Share Receipt",    sub: "Export your tax summary" },
            { href: "/calculator",icon: Calculator,   color: "text-primary",    bg: "bg-primary/8",    label: "Tax Calculator",   sub: "Re-calculate your income tax" },
          ].map(({ href, icon: Icon, color, bg, label, sub }, i) => (
            <motion.div
              key={href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              whileHover={{ y: -3, transition: { duration: 0.12 } }}
            >
              <Link
                href={href}
                className="flex flex-col gap-3 p-4 rounded-2xl border border-white/7 hover:border-white/15 transition-all group h-full"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${color} mt-auto opacity-0 group-hover:opacity-100 transition-opacity group-hover:translate-x-0.5 transition-transform`} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

    </PageTransition>
  );
}
