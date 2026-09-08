/**
 * Sankey — where a population went, across two or more decisions.
 *
 * WHY THIS EXISTS ALONGSIDE FunnelFlow
 * ------------------------------------
 * `FunnelFlow` deliberately refuses to be a Sankey, and its reasoning is sound
 * for the question it answers: a pipeline that only ever narrows is read by its
 * drop-off figure, and a ribbon encodes that same single number less precisely
 * than a bar plus a stated percentage.
 *
 * That reasoning does not extend to BRANCHING. Once a population splits several
 * ways and the branches recombine — alerts from four sources, each either closed
 * by the agent or sent to an analyst, each of those ending up benign, tuned or
 * escalated — there is no single drop-off to state. The question changes from
 * "where are we losing them" to "which path did they take", and that is a
 * question about topology, which a stack of bars cannot show at all.
 *
 * So: FunnelFlow for a linear pipeline, Sankey for a branching one. Reach for
 * the funnel first; it is the more precise chart whenever it fits.
 *
 * No charting library, per the same argument as the rest of ./charts: this is
 * some arithmetic and a cubic Bézier per ribbon.
 *
 * Server-safe: no state, no directive. Hover is CSS, and every band carries a
 * <title> so the numbers are reachable without it.
 */
import { cn } from "../lib/cn.js";
import { compact } from "./util.js";

/** Fills a Sankey node can take. Identity, not rank — see IconTile. */
export type SankeyTone =
  | "accent"
  | "ok"
  | "warning"
  | "danger"
  | "info"
  | "ai"
  | "neutral";

const TONE_FILL: Record<SankeyTone, string> = {
  accent: "var(--accent)",
  ok: "var(--ok)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  ai: "var(--ai)",
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

const W = 600;
const NODE_W = 12;
const GAP = 16;
const TOP = 8;

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
  const live = links.filter((l) => l.value > 0);
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // A node is as thick as the LARGER of what enters and what leaves it. Using
  // either one alone makes a node that drops some of its input look like it
  // passed everything on.
  const value = new Map<string, number>();
  for (const node of nodes) {
    const into = live
      .filter((l) => l.to === node.id)
      .reduce((a, b) => a + b.value, 0);
    const out = live
      .filter((l) => l.from === node.id)
      .reduce((a, b) => a + b.value, 0);
    value.set(node.id, Math.max(into, out));
  }

  const columns = [...new Set(nodes.map((n) => n.column))].sort((a, b) => a - b);
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
    const last = columns.length - 1;
    const x =
      index === 0
        ? 0
        : index === last
          ? W - NODE_W
          : ((W - NODE_W) / last) * index;
    const stack =
      ns.reduce((a, n) => a + scale(value.get(n.id) ?? 0), 0) +
      GAP * (ns.length - 1);
    // Each column is centred independently, so a short column does not hang
    // off the top of a tall one.
    let y = TOP + (height - TOP - stack) / 2;
    for (const node of ns) {
      const h = Math.max(3, scale(value.get(node.id) ?? 0));
      box.set(node.id, { x, y, h, node });
      y += h + GAP;
    }
  });

  // Ribbons leave a node in the order their targets are stacked, which is what
  // stops them braiding over each other on the way across.
  const outOffset = new Map<string, number>();
  const inOffset = new Map<string, number>();
  const bands: { d: string; fill: string; title: string }[] = [];

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
        // The band is one closed shape: across the top on a cubic, down the
        // far edge, back along the bottom on the mirror cubic. Two stroked
        // curves would leave the fill open at the ends.
        d:
          `M${x0},${f(y0)} C${mx},${f(y0)} ${mx},${f(y1)} ${x1},${f(y1)} ` +
          `L${x1},${f(y1 + th)} C${mx},${f(y1 + th)} ${mx},${f(y0 + th)} ${x0},${f(y0 + th)} Z`,
        // Coloured by the DESTINATION, so following a colour answers "where
        // did it end up" rather than "where did it come from".
        fill: TONE_FILL[b.node.tone ?? "neutral"],
        title: `${byId.get(link.from)?.label ?? link.from} → ${byId.get(link.to)?.label ?? link.to}: ${compact(link.value)}`,
      });
    }
  }

  return (
    <figure className={cn("m-0", className)}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        className="block h-full w-full"
      >
        {bands.map((band) => (
          <path
            key={band.d}
            d={band.d}
            fill={band.fill}
            // Path opacity, not fill-opacity: Tailwind generates no
            // fill-opacity utility, and with no stroke on the band the two are
            // equivalent anyway.
            className="duration-instant ease-brand opacity-30 transition-opacity hover:opacity-60"
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
            rx={3}
            fill={TONE_FILL[node.tone ?? "neutral"]}
          >
            <title>{`${node.label}: ${compact(value.get(node.id) ?? 0)}`}</title>
          </rect>
        ))}
      </svg>

      {/* The labels are HTML, not SVG text: preserveAspectRatio="none" stretches
          the coordinate space horizontally, which would distort any glyph drawn
          inside it. */}
      <figcaption className="text-fg-2 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold">
        {colNodes.flat().map((node) => (
          <span key={node.id} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full"
              style={{ background: TONE_FILL[node.tone ?? "neutral"] }}
            />
            {node.label}
            <span className="text-fg-muted font-mono tabular-nums">
              {compact(value.get(node.id) ?? 0)}
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
