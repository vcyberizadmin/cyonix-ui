/**
 * The role contract: every token a component may reference must exist, resolve
 * and mean the same thing in both themes.
 *
 * The failure this guards against is a theme that is only half-swapped. Light
 * mode overrides a SUBSET of the dark roles, so a role added to dark and
 * forgotten in light does not error — it keeps its dark value and one element
 * renders as a dark patch on a light page. Nothing in the build can see that.
 */
import { describe, expect, it } from "vitest";
import { customProperties, readTheme, topLevelBlocks } from "./css.js";
import { DARK, LIGHT, LIGHT_OVERRIDES, MODES, THEME_INLINE, resolveToken } from "./modes.js";

const css = readTheme();

/** Layer 1. Named brand values; a role may point here, a component may not. */
const RAMP_PREFIXES = [
  "--neutral-",
  "--orange-",
  "--red-",
  "--green-",
  "--amber-",
  "--blue-",
  "--amethyst-",
];

const isRamp = (token: string) => RAMP_PREFIXES.some((p) => token.startsWith(p));

/**
 * Roles that are deliberately theme-independent, so light not overriding them
 * is correct rather than an oversight. Each needs a reason, and the reason has
 * to be that the value means the same thing on both grounds.
 */
const MODE_INDEPENDENT = new Set([
  // "Static" tokens: the point of them is that they do NOT flip. A label burnt
  // onto a brand-orange chip is on orange in both themes.
  "--fg-on-dark",
  "--fg-on-light",
  // The logo gradient. It is Layer 1 brand artwork, not a role — the mark is
  // the same gradient on either ground, which is the whole point of a logo.
  "--spark",
]);

describe("layers", () => {
  it("the ramp defines the seven official Cyonix families", () => {
    const families = new Set(
      [...DARK.keys()].filter(isRamp).map((t) => t.slice(0, t.lastIndexOf("-"))),
    );
    expect([...families].sort()).toEqual([
      "--amber",
      "--amethyst",
      "--blue",
      "--green",
      "--neutral",
      "--orange",
      "--red",
    ]);
  });

  it("every ramp step is a literal colour, never another var", () => {
    // Layer 1 is the bottom. A ramp step that points at another token means the
    // layering has been broken and the "one place to change a brand value"
    // guarantee is gone.
    for (const [token, value] of DARK) {
      if (!isRamp(token)) continue;
      expect(value, `${token} must be a literal, not ${value}`).not.toContain("var(");
    }
  });

  it("no ramp step is redefined per theme", () => {
    // The ramp is the brand. Only roles swap.
    const swapped = [...LIGHT_OVERRIDES.keys()].filter(isRamp);
    expect(swapped, "light mode must reassign roles, never repaint the ramp").toEqual([]);
  });
});

describe("theme parity", () => {
  /**
   * Roles are everything on :root that is not a ramp step and is not one of the
   * scalar scales (radius, elevation, motion, type) that are shared by design.
   */
  const COLOUR_ROLE = /^--(bg|surface|rule|fg|accent|ok|warning|danger|info|ai|sev|wash|cat|seq|spark|overlay|scrim|focus|chart|grid|link)/;

  const colourRoles = [...DARK.keys()].filter((t) => !isRamp(t) && COLOUR_ROLE.test(t));

  it("finds the colour roles it means to check", () => {
    // A regex that silently matches nothing would make every test below pass.
    expect(colourRoles.length).toBeGreaterThan(30);
  });

  it("light mode overrides every colour role dark defines", () => {
    const missing = colourRoles
      .filter((t) => !MODE_INDEPENDENT.has(t))
      .filter((t) => !LIGHT_OVERRIDES.has(t))
      .sort();

    expect(
      missing,
      "these roles keep their dark value on a light page — add them to the light block, " +
        "or to MODE_INDEPENDENT with a reason if they genuinely should not flip",
    ).toEqual([]);
  });

  it("light mode overrides nothing dark has not defined", () => {
    // A light-only role is unreachable in dark mode and will render as an
    // invalid declaration there.
    const orphans = [...LIGHT_OVERRIDES.keys()].filter((t) => !DARK.has(t)).sort();
    expect(orphans).toEqual([]);
  });
});

describe("resolution", () => {
  for (const [mode, props] of MODES) {
    it(`every token resolves to a literal in ${mode} mode`, () => {
      const broken: string[] = [];
      for (const token of props.keys()) {
        const { value, missing } = resolveToken(token, props);
        if (value === null) broken.push(`${token} → missing ${missing}`);
      }
      expect(broken).toEqual([]);
    });
  }

  it("no token resolution cycles", () => {
    // resolve() throws on a cycle rather than hanging.
    for (const [, props] of MODES) {
      for (const token of props.keys()) {
        expect(() => resolveToken(token, props)).not.toThrow();
      }
    }
  });
});

describe("@theme inline", () => {
  it("is declared inline", () => {
    // Without `inline`, Tailwind bakes the resolved value into every utility
    // and the light-mode override stops having any effect — the theme toggle
    // dies silently. This is the one mechanism choice in the file that cannot
    // change casually.
    const themeBlocks = topLevelBlocks(css).filter((b) => /^@theme\b/.test(b.selector));
    expect(themeBlocks.length).toBeGreaterThan(0);
    for (const b of themeBlocks) expect(b.selector).toMatch(/^@theme\s+inline$/);
  });

  it("maps only to roles that exist", () => {
    const dangling: string[] = [];
    for (const [utility, value] of THEME_INLINE) {
      for (const m of value.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/gi)) {
        if (!DARK.has(m[1]!)) dangling.push(`${utility} → ${m[1]}`);
      }
    }
    expect(dangling).toEqual([]);
  });

  it("maps semantic utilities to roles, never straight to the ramp", () => {
    // `--color-bg: var(--neutral-950)` would compile, look right in dark mode,
    // then refuse to flip — the utility would be frozen at one theme's value.
    //
    // The palette passthrough is the deliberate exception: --color-neutral-800
    // exposing --neutral-800 is Tailwind's raw palette, where NOT theming is
    // the contract. A passthrough is recognised by the utility naming its own
    // ramp step, so --color-bg: var(--neutral-950) still fails.
    const leaks: string[] = [];
    for (const [utility, value] of THEME_INLINE) {
      if (!utility.startsWith("--color-")) continue;
      const passthrough = `--${utility.slice("--color-".length)}`;
      for (const m of value.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/gi)) {
        if (isRamp(m[1]!) && m[1] !== passthrough) leaks.push(`${utility} → ${m[1]}`);
      }
    }
    expect(leaks, "a semantic utility wired straight to the ramp cannot theme").toEqual([]);
  });
});

describe("the light variant", () => {
  it("matches a class or attribute on the element itself, not only :root", () => {
    // Scoping the swap to :root silently does nothing whenever an app — or a
    // Storybook decorator — puts the class on a wrapper div instead of <html>.
    const variant = css.match(/@custom-variant light \(([^\n]*)\);/);
    expect(variant, "@custom-variant light is missing").not.toBeNull();
    expect(variant![1]).toContain(".light");
    expect(variant![1]).toContain('[data-theme="light"]');
  });

  it("the light block is not scoped to :root", () => {
    const lightBlocks = topLevelBlocks(css).filter(
      (b) => b.selector.includes(".light") && !b.selector.startsWith("@"),
    );
    expect(lightBlocks.length).toBeGreaterThan(0);
    for (const b of lightBlocks) {
      expect(b.selector).not.toContain(":root");
      expect(customProperties(b.body).size).toBeGreaterThan(0);
    }
  });
});
