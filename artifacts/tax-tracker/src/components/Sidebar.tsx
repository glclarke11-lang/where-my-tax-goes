import { Link, useLocation } from "wouter";
import {
  PieChart,
  Calculator,
  SlidersHorizontal,
  Share2,
  TrendingUp,
  Globe,
  Users,
  MapPin,
  Home,
  X,
  Landmark,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calculator", label: "Calculator", icon: Calculator },
  { href: "/breakdown", label: "Breakdown", icon: PieChart },
  { href: "/lifetime", label: "Lifetime Taxes", icon: TrendingUp },
  { href: "/explorer", label: "Budget Explorer", icon: Globe },
  { href: "/simulator", label: "Simulator", icon: SlidersHorizontal },
  { href: "/run-the-country", label: "Run the Country", icon: Landmark },
  { href: "/sentiment", label: "Sentiment", icon: Users },
  { href: "/money-map", label: "Money Map", icon: MapPin },
  { href: "/share", label: "Share", icon: Share2 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const [location] = useLocation();

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "rgba(8, 9, 14, 0.98)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-white/5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <PieChart className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-lg tracking-tight">
          Tax<span className="text-primary">Scope</span>
        </span>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        <p className="px-2 mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-t border-white/5 shrink-0">
        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
          Australian Federal Budget
          <br />
          FY2024–25 · AUD $690B outlays
        </p>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* ── Desktop: always visible ───────────────────────────── */}
      <div className="hidden md:flex w-[240px] shrink-0 h-screen sticky top-0 flex-col">
        <SidebarContent onClose={() => {}} />
      </div>

      {/* ── Mobile: slide-in overlay ─────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={onClose}
            />
            <motion.div
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 w-[240px] h-full z-50 md:hidden"
            >
              <SidebarContent onClose={onClose} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
