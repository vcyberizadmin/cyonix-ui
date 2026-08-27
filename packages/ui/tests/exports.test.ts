/**
 * The public surface: what the entrypoints actually export, and whether the
 * smoke test covers it.
 *
 * A library's real API is what a consumer can import, not what the source
 * happens to define. Two things go wrong quietly:
 *
 *  · A component is written, documented and never exported. It exists in
 *    Storybook and cannot be installed. (This has happened here — Badge, Tile
 *    and Row were built and left unexported.)
 *  · A component is exported and nothing renders it in CI, so it rots.
 *
 * The second is what makes this file worth having: FIXTURES is required to be
 * exhaustive, so adding an export without a fixture fails the suite rather
 * than silently widening the untested surface.
 */
import { describe, expect, it } from "vitest";

import * as root from "../src/index.js";
import * as charts from "../src/charts/index.js";
import * as date from "../src/date/index.js";
import * as form from "../src/form/index.js";
import * as layout from "../src/layout/index.js";
import * as overlays from "../src/overlays/index.js";
import * as table from "../src/table/index.js";
import * as status from "../src/lib/status.js";
import { FIXTURES } from "./fixtures.js";

/** Every entrypoint declared in package.json's `exports` map. */
const ENTRYPOINTS = {
  ".": root,
  "./charts": charts,
  "./layout": layout,
  "./overlays": overlays,
  "./lib/status": status,
  // Re-exported through the root entrypoint rather than mapped separately, but
  // consumers reach them via deep paths, so they are part of the surface.
  "./form": form,
  "./date": date,
  "./table": table,
} as const;

/**
 * A React component, for this file's purposes: an exported capitalised value
 * that React can render. Hooks (`useX`), helpers (`cn`, `toISODate`) and
 * constants (`SEVERITIES`) are exported too and are checked separately — they
 * just do not need a render fixture.
 *
 * `typeof === "function"` alone is not enough. forwardRef and memo return
 * exotic OBJECTS carrying a `$$typeof` symbol, so a naive check silently
 * excludes exactly the components most likely to be wrapped — every form
 * control here, plus Button and Card. Their absence would have looked like
 * coverage rather than a hole in it.
 */
const isComponentName = (name: string) => /^[A-Z]/.test(name);

const RENDERABLE = new Set([
  Symbol.for("react.forward_ref"),
  Symbol.for("react.memo"),
  Symbol.for("react.lazy"),
  Symbol.for("react.provider"),
  Symbol.for("react.context"),
]);

function isRenderable(value: unknown): boolean {
  if (typeof value === "function") return true;
  if (typeof value !== "object" || value === null) return false;
  const tag = (value as { $$typeof?: symbol }).$$typeof;
  return tag !== undefined && RENDERABLE.has(tag);
}

function componentsOf(ns: Record<string, unknown>): string[] {
  return Object.entries(ns)
    .filter(([name, value]) => isComponentName(name) && isRenderable(value))
    .map(([name]) => name)
    .sort();
}

describe("entrypoints", () => {
  for (const [path, ns] of Object.entries(ENTRYPOINTS)) {
    it(`${path} exports something`, () => {
      expect(Object.keys(ns).length).toBeGreaterThan(0);
    });

    it(`${path} exports nothing undefined`, () => {
      // A barrel that re-exports a renamed or deleted symbol yields `undefined`
      // at runtime while tsc stays happy, because the type still resolves
      // through the .d.ts. The consumer gets "Element type is invalid".
      const holes = Object.entries(ns)
        .filter(([, value]) => value === undefined)
        .map(([name]) => name);
      expect(holes).toEqual([]);
    });
  }
});

describe("fixture coverage", () => {
  const exported = new Set<string>();
  for (const ns of Object.values(ENTRYPOINTS)) {
    for (const name of componentsOf(ns as Record<string, unknown>)) exported.add(name);
  }

  /**
   * Exported capitalised functions that are NOT components, so a render fixture
   * would be meaningless. Each needs a reason.
   */
  const NOT_A_COMPONENT = new Set([
    // A render-prop boundary: it takes a function child and calls it with the
    // wiring. Rendering it bare would assert nothing about a component.
    "FieldBoundary",
    // Icon exported for consumers composing their own date affordance.
    "CalendarIcon",
    // Severity/status helpers that happen to be capitalised constants.
    "EMPTY_RANGE",
    "DATE_RANGE_PRESETS",
    "MONTH_NAMES",
    "MONTH_ABBREVIATIONS",
    "WEEKDAY_NAMES",
    "WEEKDAY_LETTERS",
    "SEVERITIES",
    "TONE_INK",
  ]);

  it("finds the components it means to check", () => {
    expect(exported.size).toBeGreaterThan(50);
  });

  it("every exported component has a render fixture", () => {
    const uncovered = [...exported]
      .filter((name) => !NOT_A_COMPONENT.has(name))
      .filter((name) => !(name in FIXTURES))
      .sort();

    expect(
      uncovered,
      "add a fixture in tests/fixtures.tsx, or list the symbol in NOT_A_COMPONENT with a reason",
    ).toEqual([]);
  });

  it("every fixture names a real export", () => {
    // Guards the other direction: a fixture for a component that was renamed or
    // withdrawn would keep passing while testing nothing a consumer can reach.
    const orphans = Object.keys(FIXTURES).filter((name) => !exported.has(name)).sort();
    expect(orphans).toEqual([]);
  });
});

describe("named exports are stable", () => {
  // A snapshot of the public API. It fails on ANY change to the export list,
  // which is the intent — adding or removing an export from a published
  // package is a versioning decision, and this makes it visible in review
  // instead of buried in a barrel diff.
  it("root entrypoint", () => {
    expect(componentsOf(root as Record<string, unknown>)).toMatchSnapshot();
  });

  for (const [path, ns] of Object.entries(ENTRYPOINTS)) {
    if (path === ".") continue;
    it(path, () => {
      expect(componentsOf(ns as Record<string, unknown>)).toMatchSnapshot();
    });
  }
});
