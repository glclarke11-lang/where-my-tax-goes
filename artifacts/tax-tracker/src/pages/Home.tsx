import { type ReactNode } from "react";
import { Link } from "wouter";
import {
  Calculator,
  ArrowRight,
  PieChart,
  ShieldCheck,
  SlidersHorizontal,
  Share2,
  TrendingUp,
  Globe,
  Users,
  MapPin,
  DollarSign,
  BarChart3,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTaxStore } from "@/hooks/use-tax-store";
import { PageTransition } from "@/components/PageTransition";
import { HowItWorks } from "@/components/HowItWorks";

const DEMO_TAX = 18_420;
const DEMO_LIFETIME = 812_000;
const DEMO_TOP_CATEGORY = "Social Security & Welfare";

export default function Home() {
  const { result } = useTaxStore();
  const tax = result?.estimatedTax ?? DEMO_TAX;
  const topCategory = result?.breakdown?.[0]?.label ?? DEMO_TOP_CATEGORY;
  const hasData = !!result?.estimatedTax;

  return (
    <PageTransition className="pt-0 px-0 max-w-none">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Radial glow background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(189 94% 43% / 0.12), transparent 70%), radial-gradient(ellipse 60% 50% at 80% 20%, hsl(262 83% 58% / 0.10), transparent 60%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <ShieldCheck className="w-4 h-4" />
            Australian Civic Budget Platform · FY2024–25
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{ fontSize: "clamp(1.75rem, 7vw, 5rem)" }}
          >
            Understand Where Your
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-accent">
              Taxes Go
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Enter your income and instantly see how your hard-earned tax dollars are
            distributed across healthcare, education, defence, infrastructure, and more.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/calculator"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Start Calculation
            </Link>
            <Link
              href="/breakdown"
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-base bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <PieChart className="w-5 h-5" />
              View Budget Breakdown
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Dashboard Summary Cards ─────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <SummaryCard
              icon={<DollarSign className="w-5 h-5 text-primary" />}
              iconBg="bg-primary/10"
              value={`$${tax.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`}
              label="Annual Tax Contribution"
              sublabel={hasData ? "Based on your income" : "Example figure"}
              accentColor="text-primary"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
          >
            <SummaryCard
              icon={<BarChart3 className="w-5 h-5 text-accent" />}
              iconBg="bg-accent/10"
              value={topCategory}
              label="Largest Spending Category"
              sublabel="36% of federal budget"
              accentColor="text-accent"
              isText
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.49 }}
          >
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              iconBg="bg-green-500/10"
              value={`$${DEMO_LIFETIME.toLocaleString("en-AU")}`}
              label="Est. Lifetime Tax"
              sublabel="Projected over career"
              accentColor="text-green-400"
            />
          </motion.div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto border-t border-white/5" />
      </div>

      {/* ── How TaxScope Works ───────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-7xl mx-auto">
          <HowItWorks />
        </div>
      </section>

      {/* ── Feature Cards ────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-2">Explore TaxScope</h2>
            <p className="text-muted-foreground text-sm">
              Eight powerful tools to understand and engage with the Australian federal budget.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <FeatureCard
              href="/calculator"
              title="Tax Calculator"
              description="Enter your income and instantly see exact dollar amounts sent to every sector of the Australian budget."
              icon={<Calculator className="w-5 h-5" />}
              iconColor="text-primary"
              iconBg="bg-primary/10"
              delay={0.55}
            />
            <FeatureCard
              href="/breakdown"
              title="Budget Breakdown"
              description="Interactive charts and doughnut graphs showing how the AUD $690B federal budget is distributed."
              icon={<PieChart className="w-5 h-5" />}
              iconColor="text-cyan-400"
              iconBg="bg-cyan-400/10"
              delay={0.60}
            />
            <FeatureCard
              href="/simulator"
              title="Budget Simulator"
              description="Disagree with the government? Reallocate the budget yourself using our macro-to-micro drill-down simulator."
              icon={<SlidersHorizontal className="w-5 h-5" />}
              iconColor="text-accent"
              iconBg="bg-accent/10"
              delay={0.65}
            />
            <FeatureCard
              href="/lifetime"
              title="Lifetime Tax Dashboard"
              description="Project your total career tax contribution decade by decade, from first job to retirement."
              icon={<TrendingUp className="w-5 h-5" />}
              iconColor="text-green-400"
              iconBg="bg-green-400/10"
              delay={0.70}
            />
            <FeatureCard
              href="/explorer"
              title="National Budget Explorer"
              description="Drill into all nine macro spending categories with detailed sub-categories and comparisons."
              icon={<Globe className="w-5 h-5" />}
              iconColor="text-blue-400"
              iconBg="bg-blue-400/10"
              delay={0.75}
            />
            <FeatureCard
              href="/money-map"
              title="Follow the Money Map"
              description="Interactive map showing 58 real Australian hospitals, bases, universities, and infrastructure projects."
              icon={<MapPin className="w-5 h-5" />}
              iconColor="text-orange-400"
              iconBg="bg-orange-400/10"
              delay={0.80}
            />
            <FeatureCard
              href="/sentiment"
              title="Public Sentiment"
              description="See what other Australians prefer for the budget and compare against actual government allocation."
              icon={<Users className="w-5 h-5" />}
              iconColor="text-purple-400"
              iconBg="bg-purple-400/10"
              delay={0.85}
            />
            <FeatureCard
              href="/share"
              title="Shareable Tax Receipt"
              description="Export a beautiful summary graphic of your full tax breakdown to share on social media."
              icon={<Share2 className="w-5 h-5" />}
              iconColor="text-pink-400"
              iconBg="bg-pink-400/10"
              delay={0.90}
            />
            <FeatureCard
              href="/calculator"
              title="Personalised Insights"
              description="Every number is calculated from your real income bracket using the ATO's 2024–25 tax scales."
              icon={<Zap className="w-5 h-5" />}
              iconColor="text-yellow-400"
              iconBg="bg-yellow-400/10"
              delay={0.95}
            />
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}

function SummaryCard({
  icon,
  iconBg,
  value,
  label,
  sublabel,
  accentColor,
  isText = false,
}: {
  icon: ReactNode;
  iconBg: string;
  value: string;
  label: string;
  sublabel: string;
  accentColor: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 p-5 flex items-start gap-4 hover:border-white/15 transition-all duration-200"
         style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={`font-display font-bold mb-0.5 truncate ${accentColor} ${
            isText ? "text-base leading-tight" : "text-2xl"
          }`}
        >
          {value}
        </p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  href,
  title,
  description,
  icon,
  iconColor,
  iconBg,
  delay,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -5, transition: { duration: 0.15 } }}
    >
      <Link
        href={href}
        className="block h-full rounded-2xl border border-white/6 p-5 hover:border-white/15 transition-all duration-200 group"
        style={{ background: "rgba(255,255,255,0.025)" }}
      >
        <div
          className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 ${iconColor}`}
        >
          {icon}
        </div>
        <h3 className="text-base font-display font-semibold mb-1.5 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
          Explore
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}
