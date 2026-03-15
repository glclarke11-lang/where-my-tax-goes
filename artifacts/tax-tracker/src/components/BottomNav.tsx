import { useLocation, Link } from "wouter";
import { LayoutDashboard, Calculator, Map, Landmark, BarChart2 } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",       href: "/dashboard",       icon: LayoutDashboard },
  { label: "Calculator",      href: "/calculator",      icon: Calculator      },
  { label: "Money Map",       href: "/money-map",       icon: Map             },
  { label: "Run Country",     href: "/run-the-country", icon: Landmark        },
  { label: "Sentiment",       href: "/sentiment",       icon: BarChart2       },
] as const;

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/8 flex justify-around items-stretch"
      style={{ background: "rgba(8,9,14,0.95)", backdropFilter: "blur(16px)" }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = location === href || (href !== "/dashboard" && location.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center justify-center gap-1 flex-1 min-h-[56px] py-2 px-1 transition-colors ${
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${active ? "drop-shadow-[0_0_6px_var(--tw-shadow-color)]" : ""}`}
              style={active ? { filter: "drop-shadow(0 0 4px currentColor)" } : undefined}
            />
            <span className={`text-[10px] font-semibold leading-none tracking-wide ${active ? "text-primary" : ""}`}>
              {label}
            </span>
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
