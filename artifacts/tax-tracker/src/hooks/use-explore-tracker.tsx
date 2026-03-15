import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from "react";

// ── Step definitions ──────────────────────────────────────────────────────────
export const EXPLORE_STEPS = [
  { id: "calculator", label: "Calculate your tax",            href: "/calculator" },
  { id: "breakdown",  label: "See where your taxes go",       href: "/breakdown"  },
  { id: "explorer",   label: "Explore the national budget",   href: "/explorer"   },
  { id: "money-map",  label: "View spending across Australia", href: "/money-map" },
  { id: "simulator",  label: "Run the country",               href: "/simulator"  },
  { id: "sentiment",  label: "Compare public opinion",        href: "/sentiment"  },
] as const;

export type ExploreStepId = (typeof EXPLORE_STEPS)[number]["id"];

const STORAGE_KEY = "taxscope_explored_v1";

function loadVisited(): Set<ExploreStepId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed as ExploreStepId[]);
  } catch {
    return new Set();
  }
}

function saveVisited(visited: Set<ExploreStepId>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
  } catch {}
}

// ── Context ───────────────────────────────────────────────────────────────────
interface ExploreContextType {
  visited: Set<ExploreStepId>;
  markVisited: (id: ExploreStepId) => void;
  reset: () => void;
}

const ExploreContext = createContext<ExploreContextType | undefined>(undefined);

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<Set<ExploreStepId>>(loadVisited);

  const markVisited = useCallback((id: ExploreStepId) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveVisited(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const empty = new Set<ExploreStepId>();
    setVisited(empty);
    saveVisited(empty);
  }, []);

  return (
    <ExploreContext.Provider value={{ visited, markVisited, reset }}>
      {children}
    </ExploreContext.Provider>
  );
}

export function useExploreTracker() {
  const ctx = useContext(ExploreContext);
  if (!ctx) throw new Error("useExploreTracker must be used inside ExploreProvider");
  return ctx;
}

// ── Convenience hook for individual pages ─────────────────────────────────────
export function useMarkExplored(id: ExploreStepId) {
  const { markVisited } = useExploreTracker();
  useEffect(() => {
    markVisited(id);
  }, [id, markVisited]);
}
