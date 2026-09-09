"use client";

/**
 * Sankey — where a population went, across two or more decisions.
 *
 * WHY THIS EXISTS ALONGSIDE FunnelFlow
 * ------------------------------------
 * `FunnelFlow` deliberately refuses to be a Sankey, and its reasoning is sound
 * for the question it answers: a pipeline that only ever narrows is read by its
 * drop-off figure, and a ribbon encodes that same number less precisely than a
 * bar plus a stated percentage.
 *
 * That reasoning does not extend to BRANCHING. Once a population splits several
 * ways and the branches recombine — alerts from four sources, each either closed
 * by the agent or sent to an analyst, each ending benign, tuned or escalated —
 * there is no single drop-off to state. The question becomes "which path did
 * they take", which is about topology, and a stack of bars cannot show topology.
 *
 * Reach for the funnel first; it is the more precise chart whenever it fits.
 *
 * No charting library: this is some arithmetic and one cubic Bézier per ribbon.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn.js";
import { compact } from "./util.js";

/**
 * Node fills.
 *
 * These are the RANKED marks plus one: the console colours a flow by what each
 * end MEANS, so a source that mostly auto-closes and an outcome that is benign
 * share the language of the severity ladder rather than inventing a second one.
 * `violet` is the exception, for a node that carries no rank at all.
 */
export type SankeyTone =
  | "crit"
  | "high"
  | "med"
  | "low"
  | "ok"
  | "violet"
  | "neutral";

const TONE_FILL: Record<SankeyTone, string> = {
  crit: "var(--sev-crit)",
  high: "var(--sev-high)",
  med: "var(--sev-med)",
  low: "var(--sev-low)",
  ok: "var(--sev-info)",
  violet: "var(--violet)",
  neutral: "var(--fg-muted)",
};

export interface SankeyNode {
  id: string;
  /** Which vertical band this sits in. 0 is the left-most. */
  column: number;
  label: string;
  tone?: SankeyTone;
}

export interface SankeyLink {
  from: string;
  to: string;
  value: number;
}

export interface SankeyProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  /** Coordinate height. The chart scales to its container's width. */
  height?: number;
  /** Accessible summary. Required: the ribbons are unreadable to a reader. */
  label: string;
  className?: string;
}

/* The width used before the container has been measured, and on the server.
   Everything scales off the measured width once one arrives, so this only has
   to be plausible, not right. */
const W_FALLBACK = 600;
const NODE_W = 12;
const GAP = 16;
const TOP = 8;
/** Gap between a node and its label. */
const LBL = 9;

/* Resting, dimmed, and lit. A hovered ribbon does not merely brighten — every
   OTHER ribbon drops away, because the question a Sankey answers is "where did
   this one go", and that is unreadable while twelve others are still competing
   for the same pixels. */
const REST = 0.3;
const DIMMED = 0.07;
const LIT = 0.72;

interface Box {
  x: number;
  y: number;
  h: number;
  node: SankeyNode;
}

export function Sankey({
  nodes,
  links,
  height = 300,
  label,
  className,
}: SankeyProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  /* MEASURED, not stretched.
     This chart used a fixed 600-unit space scaled to the container with
     preserveAspectRatio="none", which is fine for a ribbon — an organic shape
     that may stretch — and wrong for everything whose WIDTH means something. A
     12-unit node in a 1707px container rendered 34px wide, nearly three times
     the 12px it should be. Laying out in real pixels is what the reference
     does, and it is the only way a node bar and a stroke width can be the size
     they claim to be. */
  const hostRef = useRef<HTMLElement>(null);
  const [W, setW] = useState(W_FALLBACK);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.width ?? 0;
      if (next > 0) setW(next);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const live = links.filter((l) => l.value > 0);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // A node is as thick as the LARGER of what enters and what leaves it. Using
  // either alone makes a node that drops part of its input look like it passed
  // everything on.
  const value = new Map<string, number>();
  for (const node of nodes) {
    const into = live.filter((l) => l.to === node.id).reduce((a, b) => a + b.value, 0);
    const out = live.filter((l) => l.from === node.id).reduce((a, b) => a + b.value, 0);
    value.set(node.id, Math.max(into, out));
  }

  const columns = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
  const last = columns.length - 1;
  // Tallest first within a column, so the ribbons cross as little as possible.
  const colNodes = columns.map((c) =>
    nodes
      .filter((n) => n.column === c)
      .sort((a, b) => (value.get(b.id) ?? 0) - (value.get(a.id) ?? 0)),
  );

  const colTotals = colNodes.map((ns) =>
    ns.reduce((a, n) => a + (value.get(n.id) ?? 0), 0),
  );
  const heaviest = Math.max(...colTotals, 1);
  const maxGaps = Math.max(...colNodes.map((ns) => ns.length - 1), 0);
  const usable = Math.max(1, height - TOP - 6 - GAP * maxGaps);
  const scale = (v: number) => (v / heaviest) * usable;

  const box = new Map<string, Box>();
  colNodes.forEach((ns, index) => {
    const x =
      index === 0 ? 0 : index === last ? W - NODE_W : ((W - NODE_W) / last) * index;
    const stack =
      ns.reduce((a, n) => a + scale(value.get(n.id) ?? 0), 0) + GAP * (ns.length - 1);
    // Each column is centred independently, so a short column does not hang
    // off the top of a tall one.
    let y = TOP + (height - TOP - stack) / 2;
    for (const node of ns) {
      const h = Math.max(3, scale(value.get(node.id) ?? 0));
      box.set(node.id, { x, y, h, node });
      y += h + GAP;
    }
  });

  // Ribbons leave a node in the order their targets are stacked, which stops
  // them braiding on the way across.
  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const bands: { d: string; fill: string; title: string; th: number }[] = [];

  for (const node of colNodes.flat()) {
    const leaving = live
      .filter((l) => l.from === node.id)
      .sort((a, b) => (box.get(a.to)?.y ?? 0) - (box.get(b.to)?.y ?? 0));

    for (const link of leaving) {
      const a = box.get(link.from);
      const b = box.get(link.to);
      if (!a || !b) continue;

      const th = Math.max(1.5, scale(link.value));
      const y0 = a.y + (outOffset.get(link.from) ?? 0);
      const y1 = b.y + (inOffset.get(link.to) ?? 0);
      outOffset.set(link.from, (outOffset.get(link.from) ?? 0) + th);
      inOffset.set(link.to, (inOffset.get(link.to) ?? 0) + th);

      const x0 = a.x + NODE_W;
      const x1 = b.x;
      const mx = (x0 + x1) / 2;
      const f = (n: number) => n.toFixed(1);

      bands.push({
        // One closed shape: across the top on a cubic, down the far edge, back
        // along the bottom on the mirror. Two stroked curves would leave the
        // fill open at the ends.
        d:
          `M${x0},${f(y0)} C${mx},${f(y0)} ${mx},${f(y1)} ${x1},${f(y1)} ` +
          `L${x1},${f(y1 + th)} C${mx},${f(y1 + th)} ${mx},${f(y0 + th)} ${x0},${f(y0 + th)} Z`,
        // Coloured by the DESTINATION, so following a colour answers "where did
        // it end up" rather than "where did it come from".
        fill: TONE_FILL[b.node.tone ?? "neutral"],
        title: `${byId.get(link.from)?.label ?? link.from} → ${byId.get(link.to)?.label ?? link.to} · ${link.value.toLocaleString("en-US")}`,
        th,
      });
    }
  }

  // Thickest first, so a hairline ribbon lands ON TOP of the slab it crosses
  // and stays hoverable instead of being buried by it.
  const painted = bands
    .map((band, index) => ({ ...band, index }))
    .sort((a, b) => b.th - a.th);

  return (
    <figure ref={hostRef} className={cn("relative m-0", className)}>
      <svg
        // The viewBox now MATCHES the rendered box, so one user unit is one
        // pixel and nothing is distorted in either axis.
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={label}
        className="block w-full"
        style={{ height }}
      >
        {painted.map((band) => (
          <path
            key={band.index}
            d={band.d}
            fill={band.fill}
            fillOpacity={
              hovered === null ? REST : hovered === band.index ? LIT : DIMMED
            }
            className="duration-instant ease-brand cursor-pointer transition-[fill-opacity]"
            onPointerEnter={() => setHovered(band.index)}
            onPointerLeave={() => setHovered(null)}
          >
            <title>{band.title}</title>
          </path>
        ))}

        {[...box.values()].map(({ x, y, h, node }) => (
          <rect
            key={node.id}
            x={x}
            y={y}
            width={NODE_W}
            height={h}
            rx={4}
            fill={TONE_FILL[node.tone ?? "neutral"]}
          >
            <title>{`${node.label}: ${compact(value.get(node.id) ?? 0)}`}</title>
          </rect>
        ))}
      </svg>

      {/* Node labels stay HTML rather than SVG text. With the space now
          measured they would no longer be distorted, but HTML keeps them on the
          document's type stack, lets them inherit the theme's font tokens, and
          means a long node name can be truncated with CSS rather than by hand. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {[...box.values()].map(({ x, y, h, node }) => {
          const right = node.column === last;
          const side = right
            ? { right: `${((W - x + LBL) / W) * 100}%` }
            : { left: `${((x + NODE_W + LBL) / W) * 100}%` };
          return (
            <div
              key={node.id}
              className={cn(
                "absolute -translate-y-1/2 leading-tight whitespace-nowrap",
                right && "text-right",
              )}
              style={{ top: `${((y + h / 2) / height) * 100}%`, ...side }}
            >
              <div className="text-fg text-[11.5px] font-extrabold">
                {node.label}
              </div>
              <div className="text-fg-muted text-[10.5px] font-bold tabular-nums">
                {(value.get(node.id) ?? 0).toLocaleString("en-US")}
              </div>
            </div>
          );
        })}
      </div>

      {/* The readout, pinned to the top edge. Brand-filled, because it is the
          one thing on the chart that is a direct answer to a pointer. */}
      <div
        aria-hidden="true"
        className={cn(
          "bg-accent pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-lg px-3 py-1.5 text-[12.5px] font-extrabold whitespace-nowrap text-white",
          "duration-instant ease-brand transition-opacity",
          hovered === null ? "opacity-0" : "opacity-100",
        )}
      >
        {hovered === null ? "" : (bands[hovered]?.title ?? "")}
      </div>
    </figure>
  );
}
