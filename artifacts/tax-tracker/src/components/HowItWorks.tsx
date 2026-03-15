import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Calculator, PieChart, Globe, MapPin, Landmark, Users, ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "Calculate Your Taxes",
    desc: "Estimate your income tax based on ATO FY2024–25 brackets and see your effective rate.",
    href: "/calculator",
    icon: Calculator,
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    glow: "from-cyan-500/10 to-transparent",
    badge: "bg-cyan-500/15 text-cyan-300",
    btn: "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25",
  },
  {
    n: 2,
    title: "See Where Your Taxes Go",
    desc: "See how your tax is allocated across healthcare, education, defence, and more.",
    href: "/breakdown",
    icon: PieChart,
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "from-emerald-500/10 to-transparent",
    badge: "bg-emerald-500/15 text-emerald-300",
    btn: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25",
  },
  {
    n: 3,
    title: "Explore the National Budget",
    desc: "Drill into all nine spending categories and see the $690B budget broken down.",
    href: "/explorer",
    icon: Globe,
    color: "text-blue-400",
    border: "border-blue-500/20",
    glow: "from-blue-500/10 to-transparent",
    badge: "bg-blue-500/15 text-blue-300",
    btn: "bg-blue-500/15 text-blue-300 hover:bg-blue-500/25",
  },
  {
    n: 4,
    title: "See Spending Across Australia",
    desc: "View real hospitals, schools, and bases on an interactive map of federal projects.",
    href: "/money-map",
    icon: MapPin,
    color: "text-orange-400",
    border: "border-orange-500/20",
    glow: "from-orange-500/10 to-transparent",
    badge: "bg-orange-500/15 text-orange-300",
    btn: "bg-orange-500/15 text-orange-300 hover:bg-orange-500/25",
  },
  {
    n: 5,
    title: "Run the Country",
    desc: "Build your own national budget and watch approval ratings rise or fall in real time.",
    href: "/simulator",
    icon: Landmark,
    color: "text-violet-400",
    border: "border-violet-500/20",
    glow: "from-violet-500/10 to-transparent",
    badge: "bg-violet-500/15 text-violet-300",
    btn: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/25",
  },
  {
    n: 6,
    title: "Compare With Public Opinion",
    desc: "See how citizens think taxes should be spent versus what the government actually does.",
    href: "/sentiment",
    icon: Users,
    color: "text-purple-400",
    border: "border-purple-500/20",
    glow: "from-purple-500/10 to-transparent",
    badge: "bg-purple-500/15 text-purple-300",
    btn: "bg-purple-500/15 text-purple-300 hover:bg-purple-500/25",
  },
] as const;

const ArrowConnector = () => (
  <div className="hidden lg:flex items-center justify-center shrink-0 w-5 text-muted-foreground/25 px-0.5">
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export function HowItWorks() {
  return (
    <section>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-xl sm:text-2xl font-display font-bold mb-1.5">How TaxScope Works</h2>
        <p className="text-muted-foreground text-sm">
          Follow the journey of tax money from income to government spending.
        </p>
      </motion.div>

      {/* Step flow
          Mobile / sm  : 2-column grid, no arrows
          lg+          : single horizontal flex row with arrow connectors
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-stretch gap-3 lg:gap-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.n} className="contents lg:flex lg:flex-1 lg:items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="lg:flex-1"
              >
                <Link
                  href={step.href}
                  className={`group flex flex-col h-full rounded-2xl border ${step.border} p-3 sm:p-4 transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5 relative overflow-hidden`}
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  {/* Subtle radial glow */}
                  <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${step.glow}`} />

                  {/* Badge + icon */}
                  <div className="relative flex items-start justify-between mb-2.5">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${step.badge}`}>
                      {step.n}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 ${step.color} transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="relative flex-1 flex flex-col">
                    <p className="text-xs sm:text-sm font-semibold mb-1 leading-snug">
                      {step.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed flex-1 hidden sm:block">
                      {step.desc}
                    </p>

                    {/* CTA */}
                    <div className={`inline-flex items-center gap-1 mt-2.5 px-2 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-semibold ${step.btn} transition-colors self-start`}>
                      Open
                      <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>

              {/* Arrow between cards — lg only */}
              {i < STEPS.length - 1 && <ArrowConnector />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
