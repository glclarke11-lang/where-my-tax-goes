import { useState, useMemo, useRef } from "react";
import { useTaxStore } from "@/hooks/use-tax-store";
import { motion, AnimatePresence } from "framer-motion";

// ── Static Data ─────────────────────────────────────────────────────────────
// Revenue side → sums to $690B (includes $40B borrowing to balance the budget)
const REV_NODES = [
  { id: "income_tax",  label: "Income Tax",    value: 295, color: "#06B6D4" },
  { id: "company_tax", label: "Company Tax",   value: 130, color: "#8B5CF6" },
  { id: "gst",         label: "GST",           value:  90, color: "#F59E0B" },
  { id: "other_rev",   label: "Other Revenue", value:  75, color: "#6B7280" },
  { id: "excise",      label: "Excise Taxes",  value:  35, color: "#F97316" },
  { id: "resource",    label: "Resource Tax",  value:  25, color: "#10B981" },
  { id: "borrowing",   label: "Borrowing",     value:  40, color: "#94A3B8" },
];

// Spending side → sums to $690B
const SPEND_NODES = [
  { id: "welfare",    label: "Welfare",        value: 248, color: "#8B5CF6" },
  { id: "health",     label: "Healthcare",     value: 110, color: "#10B981" },
  { id: "admin",      label: "Public Svcs",    value:  97, color: "#6B7280" },
  { id: "education",  label: "Education",      value:  55, color: "#3B82F6" },
  { id: "defence",    label: "Defence",        value:  55, color: "#EF4444" },
  { id: "infra",      label: "Infrastructure", value:  41, color: "#F97316" },
  { id: "env_econ",   label: "Economy & Env.", value:  84, color: "#22C55E" },
];

const TOTAL = 690; // $B — both sides must sum to this

// ── Layout constants ─────────────────────────────────────────────────────────
const VW        = 1000; // SVG viewBox width
const VH        = 480;  // SVG viewBox height
const TOP_PAD   = 30;   // top padding for budget node label
const NODE_H    = VH - TOP_PAD; // 450px of node area
const NODE_W    = 18;   // node rectangle width

// Column x-positions
const REV_RX    = 128;  // revenue nodes right edge
const BUD_LX    = 490;  // budget node left edge
const BUD_RX    = BUD_LX + NODE_W; // = 508
const SPN_LX    = 872;  // spending nodes left edge

// ── Helpers ───────────────────────────────────────────────────────────────────

function layoutNodes(nodes: typeof REV_NODES) {
  let y = TOP_PAD;
  return nodes.map((n) => {
    const h = (n.value / TOTAL) * NODE_H;
    const result = { ...n, y, h };
    y += h;
    return result;
  });
}

function ribbonPath(
  sx: number, sy1: number, sy2: number,
  tx: number, ty1: number, ty2: number
): string {
  const mx = (sx + tx) / 2;
  return [
    `M ${sx} ${sy1}`,
    `C ${mx} ${sy1} ${mx} ${ty1} ${tx} ${ty1}`,
    `L ${tx} ${ty2}`,
    `C ${mx} ${ty2} ${mx} ${sy2} ${sx} ${sy2}`,
    "Z",
  ].join(" ");
}

function fmtNational(valueB: number) {
  return `$${valueB}B`;
}

function fmtPersonal(valueB: number, userTax: number) {
  const amt = Math.round((valueB / TOTAL) * userTax);
  return `$${amt.toLocaleString("en-AU")}`;
}

// ── Tooltip state ─────────────────────────────────────────────────────────────

interface TooltipData {
  sourceLabel: string;
  targetLabel: string;
  valueB: number;
  personalAmt: number | null;
  color: string;
  mouseX: number;
  mouseY: number;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TaxFlowDiagram({ className = "" }: { className?: string }) {
  const { result } = useTaxStore();
  const userTax = result?.estimatedTax ?? null;

  const [personal, setPersonal] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const revLayout  = useMemo(() => layoutNodes(REV_NODES),   []);
  const spdLayout  = useMemo(() => layoutNodes(SPEND_NODES), []);

  // Budget left side: segments matching revenue proportions (no gaps)
  const budLeftSegs  = revLayout.map((n) => ({ y1: n.y, y2: n.y + n.h }));
  // Budget right side: segments matching spending proportions (no gaps)
  const budRightSegs = spdLayout.map((n) => ({ y1: n.y, y2: n.y + n.h }));

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip((prev) =>
      prev
        ? { ...prev, mouseX: e.clientX - rect.left, mouseY: e.clientY - rect.top }
        : null
    );
  }

  function handleLinkEnter(
    e: React.MouseEvent<SVGPathElement>,
    sourceLabel: string,
    targetLabel: string,
    valueB: number,
    color: string,
    linkId: string
  ) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const personalAmt = userTax ? Math.round((valueB / TOTAL) * userTax) : null;
    setTooltip({
      sourceLabel,
      targetLabel,
      valueB,
      personalAmt,
      color,
      mouseX: e.clientX - rect.left,
      mouseY: e.clientY - rect.top,
    });
    setActiveId(linkId);
  }

  function handleLinkLeave() {
    setTooltip(null);
    setActiveId(null);
  }

  const display = (valueB: number) =>
    personal && userTax ? fmtPersonal(valueB, userTax) : fmtNational(valueB);

  // Font size helpers
  const labelSize  = (h: number) => (h < 18 ? 0 : h < 28 ? 9 : 11);
  const valueSize  = (h: number) => (h < 30 ? 0 : 9.5);

  return (
    <div className={`relative ${className}`} ref={containerRef} onMouseMove={handleMouseMove}>
      {/* ── Header row ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display font-semibold text-lg">Tax Flow Diagram</h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            How revenue enters the federal budget and flows to spending categories
          </p>
        </div>
        {userTax && (
          <div className="flex rounded-xl bg-secondary p-0.5 text-sm shrink-0">
            <button
              onClick={() => setPersonal(false)}
              className={`px-4 py-1.5 rounded-lg transition-colors font-medium ${
                !personal
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              National
            </button>
            <button
              onClick={() => setPersonal(true)}
              className={`px-4 py-1.5 rounded-lg transition-colors font-medium ${
                personal
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Your Share
            </button>
          </div>
        )}
      </div>

      {/* ── SVG diagram ─────────────────────────────────────────── */}
      <div className="relative overflow-visible" onMouseLeave={handleLinkLeave}>
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          className="w-full h-auto"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* ── Animated flow stripe ── */}
            <pattern
              id="taxflow-stripe"
              x="0"
              y="0"
              width="40"
              height="480"
              patternUnits="userSpaceOnUse"
            >
              <rect width="16" height="480" fill="rgba(255,255,255,0.055)" />
              <animateTransform
                attributeName="patternTransform"
                type="translate"
                from="0,0"
                to="40,0"
                dur="2.2s"
                repeatCount="indefinite"
              />
            </pattern>

            {/* ── Revenue → Budget gradients ── */}
            {REV_NODES.map((n) => (
              <linearGradient
                key={`g-rev-${n.id}`}
                id={`g-rev-${n.id}`}
                x1={REV_RX}
                y1="0"
                x2={BUD_LX}
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor={n.color} stopOpacity="0.55" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.18" />
              </linearGradient>
            ))}

            {/* ── Budget → Spending gradients ── */}
            {SPEND_NODES.map((n) => (
              <linearGradient
                key={`g-spd-${n.id}`}
                id={`g-spd-${n.id}`}
                x1={BUD_RX}
                y1="0"
                x2={SPN_LX}
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor={n.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.55" />
              </linearGradient>
            ))}

            {/* ── Hover highlight gradients ── */}
            {REV_NODES.map((n) => (
              <linearGradient
                key={`gh-rev-${n.id}`}
                id={`gh-rev-${n.id}`}
                x1={REV_RX}
                y1="0"
                x2={BUD_LX}
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor={n.color} stopOpacity="0.85" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.45" />
              </linearGradient>
            ))}
            {SPEND_NODES.map((n) => (
              <linearGradient
                key={`gh-spd-${n.id}`}
                id={`gh-spd-${n.id}`}
                x1={BUD_RX}
                y1="0"
                x2={SPN_LX}
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor={n.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.85" />
              </linearGradient>
            ))}
          </defs>

          {/* ═══════════════ LEFT RIBBONS: Revenue → Budget ═══════════════ */}
          {revLayout.map((node, i) => {
            const linkId = `rev-${node.id}`;
            const isActive = activeId === linkId;
            const d = ribbonPath(
              REV_RX, node.y, node.y + node.h,
              BUD_LX, budLeftSegs[i].y1, budLeftSegs[i].y2
            );
            return (
              <g key={node.id}>
                {/* Base fill */}
                <path
                  d={d}
                  fill={isActive ? `url(#gh-rev-${node.id})` : `url(#g-rev-${node.id})`}
                  style={{ cursor: "pointer", transition: "fill 0.15s" }}
                  onMouseEnter={(e) =>
                    handleLinkEnter(e, node.label, "Federal Budget", node.value, node.color, linkId)
                  }
                  onMouseLeave={handleLinkLeave}
                />
                {/* Animated stripe overlay */}
                <path d={d} fill="url(#taxflow-stripe)" style={{ pointerEvents: "none" }} />
              </g>
            );
          })}

          {/* ═══════════════ RIGHT RIBBONS: Budget → Spending ═══════════════ */}
          {spdLayout.map((node, i) => {
            const linkId = `spd-${node.id}`;
            const isActive = activeId === linkId;
            const d = ribbonPath(
              BUD_RX, budRightSegs[i].y1, budRightSegs[i].y2,
              SPN_LX, node.y, node.y + node.h
            );
            return (
              <g key={node.id}>
                <path
                  d={d}
                  fill={isActive ? `url(#gh-spd-${node.id})` : `url(#g-spd-${node.id})`}
                  style={{ cursor: "pointer", transition: "fill 0.15s" }}
                  onMouseEnter={(e) =>
                    handleLinkEnter(e, "Federal Budget", node.label, node.value, node.color, linkId)
                  }
                  onMouseLeave={handleLinkLeave}
                />
                <path d={d} fill="url(#taxflow-stripe)" style={{ pointerEvents: "none" }} />
              </g>
            );
          })}

          {/* ═══════════════ REVENUE NODES ═══════════════ */}
          {revLayout.map((n) => {
            const lsz = labelSize(n.h);
            const vsz = valueSize(n.h);
            const midY = n.y + n.h / 2;
            return (
              <g key={n.id}>
                <rect
                  x={REV_RX - NODE_W}
                  y={n.y + 0.5}
                  width={NODE_W}
                  height={Math.max(n.h - 1, 1)}
                  fill={n.color}
                  rx={3}
                />
                {lsz > 0 && (
                  <text
                    x={REV_RX - NODE_W - 7}
                    y={vsz > 0 ? midY - 6 : midY}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={lsz}
                    fontWeight={500}
                    opacity={0.9}
                  >
                    {n.label}
                  </text>
                )}
                {vsz > 0 && (
                  <text
                    x={REV_RX - NODE_W - 7}
                    y={midY + 8}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fill={n.color}
                    fontSize={vsz}
                    fontWeight={700}
                    opacity={1}
                  >
                    {display(n.value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* ═══════════════ BUDGET CENTER NODE ═══════════════ */}
          <rect
            x={BUD_LX}
            y={TOP_PAD}
            width={NODE_W}
            height={NODE_H}
            fill="rgba(255,255,255,0.10)"
            rx={3}
          />
          <text
            x={BUD_LX + NODE_W / 2}
            y={TOP_PAD - 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={11}
            fontWeight={600}
            letterSpacing={0.5}
          >
            FEDERAL BUDGET
          </text>
          <text
            x={BUD_LX + NODE_W / 2}
            y={TOP_PAD - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={9}
          >
            {personal && userTax
              ? `Your ${fmtPersonal(TOTAL, userTax)} tax`
              : `$${TOTAL}B outlays`}
          </text>

          {/* ═══════════════ SPENDING NODES ═══════════════ */}
          {spdLayout.map((n) => {
            const lsz = labelSize(n.h);
            const vsz = valueSize(n.h);
            const midY = n.y + n.h / 2;
            return (
              <g key={n.id}>
                <rect
                  x={SPN_LX}
                  y={n.y + 0.5}
                  width={NODE_W}
                  height={Math.max(n.h - 1, 1)}
                  fill={n.color}
                  rx={3}
                />
                {lsz > 0 && (
                  <text
                    x={SPN_LX + NODE_W + 7}
                    y={vsz > 0 ? midY - 6 : midY}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={lsz}
                    fontWeight={500}
                    opacity={0.9}
                  >
                    {n.label}
                  </text>
                )}
                {vsz > 0 && (
                  <text
                    x={SPN_LX + NODE_W + 7}
                    y={midY + 8}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fill={n.color}
                    fontSize={vsz}
                    fontWeight={700}
                    opacity={1}
                  >
                    {display(n.value)}
                  </text>
                )}
              </g>
            );
          })}

          {/* ═══════════════ COLUMN HEADERS ═══════════════ */}
          <text
            x={REV_RX - NODE_W / 2}
            y={TOP_PAD - 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={10}
            fontWeight={600}
            letterSpacing={0.5}
          >
            REVENUE SOURCES
          </text>
          <text
            x={SPN_LX + NODE_W / 2}
            y={TOP_PAD - 18}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={10}
            fontWeight={600}
            letterSpacing={0.5}
          >
            SPENDING
          </text>
        </svg>

        {/* ═══════════════ HOVER TOOLTIP ═══════════════ */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute z-20"
              style={{
                left: Math.min(tooltip.mouseX + 14, (containerRef.current?.offsetWidth ?? 600) - 200),
                top:  Math.max(tooltip.mouseY - 52, 0),
              }}
            >
              <div
                className="rounded-xl px-3 py-2.5 text-xs shadow-2xl min-w-[160px]"
                style={{
                  background: "rgba(8,9,14,0.96)",
                  border: `1px solid ${tooltip.color}55`,
                  backdropFilter: "blur(8px)",
                }}
              >
                <p className="font-semibold mb-1" style={{ color: tooltip.color }}>
                  {tooltip.sourceLabel} → {tooltip.targetLabel}
                </p>
                <p className="text-muted-foreground">
                  National: <span className="font-bold text-foreground">${tooltip.valueB}B / yr</span>
                </p>
                {tooltip.personalAmt !== null && (
                  <p className="mt-0.5" style={{ color: tooltip.color }}>
                    Your contribution:{" "}
                    <span className="font-bold">
                      ${tooltip.personalAmt.toLocaleString("en-AU")} / yr
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════ LEGEND ═══════════════ */}
      <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
            Revenue Sources
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {REV_NODES.map((n) => (
              <span key={n.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: n.color }} />
                {n.label}
                <span className="text-muted-foreground/50">{personal && userTax ? fmtPersonal(n.value, userTax) : `$${n.value}B`}</span>
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
            Spending Categories
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SPEND_NODES.map((n) => (
              <span key={n.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: n.color }} />
                {n.label}
                <span className="text-muted-foreground/50">{personal && userTax ? fmtPersonal(n.value, userTax) : `$${n.value}B`}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
