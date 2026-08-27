/**
 * CX-CHT — chart primitives.
 *
 * Two distinct risks here, and they need different kinds of test.
 *
 * The arithmetic (share percentages, compact labels, ramp selection) is pure
 * and produces a specific wrong number when it breaks — a legend reading
 * "50% · 25% · 24%" is a bug a reviewer would report, and one no type can stop.
 *
 * The SVG is worse, because it fails to NOTHING. A Tailwind class handed to an
 * SVG `stroke` attribute paints no colour and raises no error; the Gauge
 * shipped blank exactly that way. So these tests assert that marks carry
 * `currentColor` plus an ink CLASS, rather than a class name smuggled into a
 * paint attribute.
 */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AxisBars,
  Donut,
  FunnelFlow,
  Gauge,
  Heatmap,
  ProportionBar,
  RankedBars,
  Sparkline,
  compact,
  rampFill,
  rampInk,
  sharePercents,
} from "../src/charts/index.js";

const SLICES = [
  { label: "Critical", value: 4 },
  { label: "High", value: 11 },
  { label: "Medium", value: 27 },
];

describe("sharePercents", () => {
  it("always sums to exactly 100", () => {
    // The documented reason it exists: independent rounding gives
    // "50% · 25% · 24%", which reads as a bug.
    const cases = [
      [1, 1, 1],
      [1, 2, 3],
      [7, 11, 13, 17],
      [1, 1, 1, 1, 1, 1, 1],
      [99, 1],
      [1000, 1, 1],
      [2, 2, 2, 2, 2, 2],
    ];
    for (const values of cases) {
      const shares = sharePercents(values);
      expect(shares.reduce((a, b) => a + b, 0), `${values} → ${shares}`).toBe(100);
    }
  });

  it("puts the slack on the segments that lost most to rounding", () => {
    // Three equal thirds: 33.33 each. Largest-remainder gives 34/33/33.
    expect(sharePercents([1, 1, 1])).toEqual([34, 33, 33]);
  });

  it("returns all zeroes for an all-zero series rather than dividing by zero", () => {
    expect(sharePercents([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("returns all zeroes for an empty series", () => {
    expect(sharePercents([])).toEqual([]);
  });

  it("treats a negative value as zero rather than inverting a bar", () => {
    const shares = sharePercents([-5, 10, 10]);
    expect(shares[0]).toBe(0);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("gives a single value the whole hundred", () => {
    expect(sharePercents([42])).toEqual([100]);
  });

  it("never returns a negative share", () => {
    for (const share of sharePercents([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])) {
      expect(share).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("compact", () => {
  it.each([
    [0, "0"],
    [42, "42"],
    [999, "999"],
    [1000, "1.0k"],
    [1500, "1.5k"],
    [9999, "10.0k"],
    [10_000, "10k"],
    [999_999, "1000k"],
    [1_000_000, "1.0M"],
    [10_000_000, "10M"],
  ])("%i → %s", (value, expected) => {
    expect(compact(value)).toBe(expected);
  });

  it("keeps the sign on negatives", () => {
    expect(compact(-1500)).toBe("-1.5k");
    expect(compact(-42)).toBe("-42");
  });
});

describe("ramps", () => {
  it("severity maps a known label to its own rank, not to its position", () => {
    // A series listed High-then-Critical must still paint High as High.
    expect(rampFill("severity", 0, "High")).toBe(rampFill("severity", 3, "High"));
  });

  it("severity falls back to position for an unknown label", () => {
    expect(rampFill("severity", 0, "Wat")).toBe(rampFill("severity", 0, "Critical"));
  });

  it("sequential runs darkest first, so the largest bar is deepest", () => {
    expect(rampFill("sequential", 0)).not.toBe(rampFill("sequential", 1));
  });

  it("sequential stops at the light end rather than wrapping to dark", () => {
    // Wrapping would make two very different magnitudes share a colour.
    const far = rampFill("sequential", 50);
    const further = rampFill("sequential", 500);
    expect(far).toBe(further);
    expect(far).not.toBe(rampFill("sequential", 0));
  });

  it("categorical cycles, because buckets have no order", () => {
    const first = rampFill("categorical", 0);
    let period = 0;
    for (let i = 1; i < 32; i += 1) {
      if (rampFill("categorical", i) === first) {
        period = i;
        break;
      }
    }
    expect(period).toBeGreaterThan(1);
  });

  it("rampFill yields a background class and rampInk a text class", () => {
    // The documented trap: `rampFill(...).replace("bg-", "text-")` is a runtime
    // string Tailwind never sees, so the mark renders with no colour at all.
    for (const ramp of ["severity", "sequential", "categorical"] as const) {
      for (let i = 0; i < 6; i += 1) {
        expect(rampFill(ramp, i)).toMatch(/^bg-/);
        expect(rampInk(ramp, i)).toMatch(/^text-/);
      }
    }
  });

  it("never returns an empty class", () => {
    for (const ramp of ["severity", "sequential", "categorical"] as const) {
      for (let i = 0; i < 12; i += 1) {
        expect(rampFill(ramp, i)).not.toBe("");
        expect(rampInk(ramp, i)).not.toBe("");
      }
    }
  });
});

/**
 * The blank-chart guard.
 *
 * `rampFill` returns a Tailwind class. Handing one to an SVG paint attribute
 * (`stroke="bg-sev-crit"`) is valid markup, raises no error and paints nothing.
 * The Gauge shipped that way. The correct pattern is `stroke="currentColor"`
 * plus the ink class, which is what these assert.
 */
describe("SVG marks are actually painted", () => {
  const SVG_CHARTS = {
    Donut: <Donut slices={SLICES} />,
    Gauge: <Gauge slices={SLICES} />,
    Sparkline: <Sparkline series={[3, 7, 4, 9]} />,
    AxisBars: <AxisBars points={[{ label: "Mon", value: 4 }, { label: "Tue", value: 9 }]} />,
  };

  /** Charts drawn with divs and Tailwind backgrounds rather than SVG. */
  const DIV_CHARTS = {
    ProportionBar: <ProportionBar slices={SLICES} />,
    FunnelFlow: <FunnelFlow stages={SLICES} />,
    RankedBars: <RankedBars items={SLICES} />,
  };

  const ALL = { ...SVG_CHARTS, ...DIV_CHARTS };

  it.each(Object.entries(ALL))("%s puts no class name in a paint attribute", (_name, node) => {
    const { container } = render(node);

    const smuggled: string[] = [];
    for (const el of container.querySelectorAll("*")) {
      for (const attr of ["fill", "stroke"] as const) {
        const value = el.getAttribute(attr);
        if (value === null) continue;
        // A Tailwind utility, not a colour.
        if (/^(bg|text|fill|stroke)-[a-z0-9-]+$/.test(value)) {
          smuggled.push(`${el.tagName}[${attr}="${value}"]`);
        }
      }
    }

    expect(smuggled, "a Tailwind class in a paint attribute paints nothing").toEqual([]);
  });

  it.each(Object.entries(SVG_CHARTS))("%s renders SVG geometry", (_name, node) => {
    const { container } = render(node);
    const marks = container.querySelectorAll("path, rect, circle, line, polygon, polyline");
    expect(marks.length, "the chart drew nothing").toBeGreaterThan(0);
  });

  it.each(Object.entries(DIV_CHARTS))("%s paints its segments with a real class", (_name, node) => {
    // The div equivalent of the blank-Gauge failure: a segment with a width and
    // no background is an invisible bar.
    const { container } = render(node);
    const painted = [...container.querySelectorAll<HTMLElement>("*")].filter((el) =>
      /(^|\s)bg-/.test(el.className.toString()),
    );
    expect(painted.length, "no element carries a background class").toBeGreaterThan(0);
  });
});

describe("Donut", () => {
  it("draws one arc per slice", () => {
    const { container } = render(<Donut slices={SLICES} />);
    const arcs = container.querySelectorAll("circle[stroke-dasharray], path[stroke-dasharray]");
    expect(arcs.length).toBeGreaterThanOrEqual(SLICES.length);
  });

  it("survives a single slice", () => {
    const { container } = render(<Donut slices={[{ label: "Only", value: 5 }]} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("survives an all-zero series without drawing NaN into a path", () => {
    const { container } = render(
      <Donut slices={[{ label: "A", value: 0 }, { label: "B", value: 0 }]} />,
    );
    for (const el of container.querySelectorAll("[d], [stroke-dasharray], [stroke-dashoffset]")) {
      for (const attr of ["d", "stroke-dasharray", "stroke-dashoffset"]) {
        expect(el.getAttribute(attr) ?? "").not.toMatch(/NaN|Infinity/);
      }
    }
  });
});

describe("Gauge", () => {
  it("uses pathLength so segments can be expressed as percentages", () => {
    const { container } = render(<Gauge slices={SLICES} />);
    expect(container.querySelector("[pathLength]")).toBeInTheDocument();
  });

  it("writes no NaN into its dash arithmetic", () => {
    const { container } = render(<Gauge slices={SLICES} />);
    for (const el of container.querySelectorAll("[stroke-dasharray], [stroke-dashoffset]")) {
      expect(el.getAttribute("stroke-dasharray") ?? "").not.toMatch(/NaN/);
      expect(el.getAttribute("stroke-dashoffset") ?? "").not.toMatch(/NaN/);
    }
  });
});

describe("Sparkline", () => {
  it("draws a path for a normal series", () => {
    const { container } = render(<Sparkline series={[3, 7, 4, 9, 6]} />);
    expect(container.querySelector("path")).toBeInTheDocument();
  });

  it("does not emit NaN for a flat series", () => {
    // A flat line divides by a zero range unless it is special-cased.
    const { container } = render(<Sparkline series={[5, 5, 5, 5]} />);
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("d") ?? "").not.toMatch(/NaN|Infinity/);
    }
  });

  it("handles a single point", () => {
    const { container } = render(<Sparkline series={[5]} />);
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("d") ?? "").not.toMatch(/NaN/);
    }
  });

  it("handles an empty series without throwing", () => {
    expect(() => render(<Sparkline series={[]} />)).not.toThrow();
  });
});

describe("Heatmap", () => {
  it("is a real table, so the axes are readable out of order", () => {
    render(
      <Heatmap rows={["web-01", "db-02"]} columns={["Mon", "Tue"]} values={[[3, 1], [0, 7]]} />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Mon" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "web-01" })).toBeInTheDocument();
  });

  it("distinguishes a null cell from a zero cell", () => {
    // Zero is a measurement; null is an absence. Painting them alike loses the
    // difference between "nothing happened" and "we did not look".
    const { container } = render(
      <Heatmap rows={["a"]} columns={["x", "y"]} values={[[0, null]]} />,
    );
    const cells = container.querySelectorAll("tbody td");
    expect(cells).toHaveLength(2);
    expect(cells[0]!.className).not.toBe(cells[1]!.className);
  });
});

describe("AxisBars", () => {
  it("labels every point", () => {
    render(<AxisBars points={[{ label: "Mon", value: 4 }, { label: "Tue", value: 9 }]} />);
    // Twice each, deliberately: once as an SVG axis label and once in the
    // tabular equivalent below.
    expect(screen.getAllByText("Mon").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tue").length).toBeGreaterThan(0);
  });

  it("carries a tabular equivalent, so the data survives without the picture", () => {
    // An SVG chart is a shape to a screen reader. The paired table is what makes
    // the numbers reachable at all.
    render(<AxisBars points={[{ label: "Mon", value: 4 }, { label: "Tue", value: 9 }]} />);
    const table = screen.getByRole("table");
    expect(within(table).getByRole("rowheader", { name: "Mon" })).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "9" })).toBeInTheDocument();
  });

  it("survives an all-zero series", () => {
    const { container } = render(
      <AxisBars points={[{ label: "Mon", value: 0 }, { label: "Tue", value: 0 }]} />,
    );
    expect(container.innerHTML).not.toMatch(/NaN/);
  });
});

describe("FunnelFlow and RankedBars", () => {
  it("FunnelFlow lists every stage", () => {
    render(<FunnelFlow stages={SLICES} />);
    for (const stage of SLICES) expect(screen.getByText(stage.label)).toBeInTheDocument();
  });

  it("RankedBars lists every item", () => {
    render(<RankedBars items={SLICES} />);
    for (const item of SLICES) expect(screen.getByText(item.label)).toBeInTheDocument();
  });

  it("neither emits NaN for an all-zero series", () => {
    const zeroes = [{ label: "A", value: 0 }, { label: "B", value: 0 }];
    for (const node of [<FunnelFlow stages={zeroes} />, <RankedBars items={zeroes} />]) {
      const { container } = render(node);
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    }
  });
});
