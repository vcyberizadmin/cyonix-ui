/**
 * WCAG 2.2 AA on the text roles, in both themes.
 *
 * This exists because a contrast failure is invisible to everyone who can
 * already read the screen. It ships, and the people it excludes are not the
 * people reviewing the PR.
 *
 * It has also caught a real one: --fg-muted measured 4.46:1 against the app
 * background — close enough to look fine and still a failure. A hand check had
 * previously "passed" it, because the checker sliced the file on the first
 * textual `.light`, which appeared in a comment.
 *
 * The mark/ink split this asserts is the library's own rule: --danger is a bar,
 * a dot or a fill; --danger-ink is the label. Marks are exempt from the text
 * ratio because they are not text — but only ink may be used for type, and
 * these tests are what make that split mean something.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME_PATH, composite, contrastRatio, parseColor, round2, type Rgba } from "./css.js";

const source = readFileSync(THEME_PATH, "utf8");
import { LIGHT, MODES, resolveToken } from "./modes.js";

/** WCAG 2.2 1.4.3 Contrast (Minimum), normal-size text. */
const AA_TEXT = 4.5;
/** WCAG 2.2 1.4.11 Non-text Contrast, for UI component boundaries. */
const AA_NON_TEXT = 3;

function colour(token: string, props: Map<string, string>): Rgba {
  const { value, missing } = resolveToken(token, props);
  if (value === null) throw new Error(`${token} does not resolve (missing ${missing})`);
  const parsed = parseColor(value);
  if (!parsed) throw new Error(`${token} resolved to "${value}", which is not a colour`);
  return parsed;
}

/** Flattens a possibly-translucent token onto its ground. */
function opaque(token: string, ground: string, props: Map<string, string>): Rgba {
  const top = colour(token, props);
  return top.a === 1 ? top : composite(top, colour(ground, props));
}

/** Text roles that must clear AA against every ground they sit on. */
const TEXT_ON_GROUND: ReadonlyArray<readonly [ink: string, grounds: readonly string[]]> = [
  ["--fg", ["--bg", "--surface", "--surface-2"]],
  ["--fg-2", ["--bg", "--surface", "--surface-2"]],
  ["--fg-muted", ["--bg", "--surface", "--surface-2"]],
  ["--fg-link", ["--bg", "--surface"]],
  ["--accent-ink", ["--bg", "--surface"]],
  ["--ok-ink", ["--bg", "--surface"]],
  ["--warning-ink", ["--bg", "--surface"]],
  ["--danger-ink", ["--bg", "--surface"]],
  ["--info-ink", ["--bg", "--surface"]],
  ["--sev-crit-ink", ["--bg", "--surface"]],
  ["--sev-high-ink", ["--bg", "--surface"]],
  ["--sev-med-ink", ["--bg", "--surface"]],
  ["--sev-low-ink", ["--bg", "--surface"]],
  ["--sev-info-ink", ["--bg", "--surface"]],
];

/** Text burnt onto a filled element, where the fill IS the ground. */
const TEXT_ON_FILL: ReadonlyArray<readonly [ink: string, fill: string]> = [
  ["--accent-fg", "--accent"],
  ["--fg-inverse", "--surface-inverse"],
  ["--fg", "--field"],
];

/**
 * Pairs that do NOT clear AA, carried deliberately, with the ratio measured at
 * the time they were accepted.
 *
 * These are the reference design's own literal values: --text-dim #7a818a and
 * --text-faint #a6acb4 on its #ffffff / #f3f3f5 / #e9eaed grounds. The decision
 * was to treat the reference as authoritative on colour, so they are recorded
 * rather than corrected.
 *
 * THIS IS AN ACCESSIBILITY DEBT, NOT A PASS. --fg-muted at 2.06:1 is well
 * under the 4.5:1 WCAG 2.2 1.4.3 asks of body text, and it is used for the
 * small uppercase labels (.lbl in the reference) where legibility is already
 * hardest. Anyone reading this should feel free to argue for raising these two
 * values; the fix is one ramp step each and nothing else depends on them.
 *
 * The entries assert the ratio has not got WORSE, so a further regression
 * still fails the build. Deleting an entry is how you re-enable the AA floor.
 */
const ACCEPTED_BELOW_AA = new Map<string, number>([
  // --accent-fg is white on the brand orange, which is what the reference's
  // .btn-primary does: `background:#FE6409; color:#fff`. This file previously
  // used near-black here, at 6.3:1, with a comment saying not to swap it for
  // white. The swap is deliberate and it is the most consequential entry in
  // this map, because it is the primary button — the most-clicked control in
  // the product — carrying a 14px label at 2.98:1.
  ["dark --accent-fg on --accent", 2.98],
  ["light --accent-fg on --accent", 2.98],
  ["light --fg-2 on --bg", 3.94],
  ["light --fg-2 on --surface", 3.55],
  ["light --fg-2 on --surface-2", 3.27],
  ["light --fg-muted on --bg", 2.29],
  ["light --fg-muted on --surface", 2.06],
  ["light --fg-muted on --surface-2", 1.9],
]);

describe.each(MODES)("%s mode — text contrast", (mode, props) => {
  for (const [ink, grounds] of TEXT_ON_GROUND) {
    for (const ground of grounds) {
      const key = `${mode} ${ink} on ${ground}`;
      const accepted = ACCEPTED_BELOW_AA.get(key);

      if (accepted !== undefined) {
        it(`${ink} on ${ground} stays at its accepted sub-AA ratio`, () => {
          const ratio = round2(
            contrastRatio(opaque(ink, ground, props), colour(ground, props)),
          );
          expect(
            ratio,
            `${key} was accepted at ${accepted}:1 and now measures ${ratio}:1. ` +
              `It got worse. Either restore the previous value or, better, raise it above ${AA_TEXT}:1 ` +
              `and delete the ACCEPTED_BELOW_AA entry.`,
          ).toBeGreaterThanOrEqual(accepted);
        });
        continue;
      }

      it(`${ink} on ${ground} clears AA`, () => {
        const ratio = contrastRatio(opaque(ink, ground, props), colour(ground, props));
        expect(
          round2(ratio),
          `${ink} on ${ground} in ${mode} measures ${round2(ratio)}:1, below the ${AA_TEXT}:1 minimum`,
        ).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  }

  for (const [ink, fill] of TEXT_ON_FILL) {
    const key = `${mode} ${ink} on ${fill}`;
    const accepted = ACCEPTED_BELOW_AA.get(key);

    if (accepted !== undefined) {
      it(`${ink} on ${fill} stays at its accepted sub-AA ratio`, () => {
        const ratio = round2(contrastRatio(colour(ink, props), colour(fill, props)));
        expect(
          ratio,
          `${key} was accepted at ${accepted}:1 and now measures ${ratio}:1. It got worse.`,
        ).toBeGreaterThanOrEqual(accepted);
      });
      continue;
    }

    it(`${ink} on ${fill} clears AA`, () => {
      const ratio = contrastRatio(colour(ink, props), colour(fill, props));
      expect(round2(ratio)).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }
});

describe.each(MODES)("%s mode — non-text contrast", (mode, props) => {
  /**
   * Only tokens components actually use to identify a control or its state.
   *
   * --rule and --rule-default are dividers: 1.4.11 exempts decoration, and a
   * hairline between rows is not what tells you a control is there.
   * --rule-strong is deliberately absent too — no component references it, and
   * asserting a criterion on an unused token measures nothing.
   *
   * --focus is the one that matters. It is the base :focus-visible outline and,
   * since 17 components strip that outline and draw their own, the border and
   * ring on every input, select, combobox and search field as well. If it does
   * not clear 3:1 the keyboard user cannot see where they are.
   *
   * --field-border is the other. It is the RESTING boundary of every input,
   * select and textarea, which is what makes the control findable before it is
   * focused. It is measured against all four grounds, not the usual three: a
   * field is placed inside --surface-3 panels, and the step that passes on
   * --surface can still fail there.
   */
  const BOUNDARIES: ReadonlyArray<readonly [token: string, ground: string]> = [
    ["--focus", "--bg"],
    ["--focus", "--surface"],
    ["--focus", "--surface-2"],
    ["--focus-critical", "--bg"],
    ["--focus-critical", "--surface"],
    ["--focus-critical", "--surface-2"],
    ["--field-border", "--bg"],
    ["--field-border", "--surface"],
    ["--field-border", "--surface-2"],
    ["--field-border", "--surface-3"],
    ["--field-border", "--field"],
  ];

  for (const [token, ground] of BOUNDARIES) {
    it(`${token} on ${ground} clears 3:1`, () => {
      const ratio = round2(contrastRatio(opaque(token, ground, props), colour(ground, props)));
      expect(
        ratio,
        `${token} on ${ground} in ${mode} measures ${ratio}:1, below the ${AA_NON_TEXT}:1 ` +
          `that 1.4.11 requires of a focus indicator`,
      ).toBeGreaterThanOrEqual(AA_NON_TEXT);
    });
  }
});

describe("the focus indicator is its own token", () => {
  /**
   * The regression this guards.
   *
   * --focus and --accent were near-identical oranges, so the base ring was
   * painted with --accent and every component that drew its own focus border
   * followed suit. --focus and --focus-critical sat defined and promoted to
   * utilities, read by nothing. The cost was not tidiness: it meant the ring
   * took a colour picked for brand fills, and in light mode that colour
   * measures 2.51:1 — below the 3:1 a focus indicator needs. They cannot be
   * re-merged without reintroducing that.
   */
  it("the base :focus-visible rule reads --focus, not --accent", () => {
    const rule = /:focus-visible\s*\{[^}]*\}/.exec(source);
    expect(rule, ":focus-visible rule not found in theme.css").not.toBeNull();
    expect(rule![0]).toContain("var(--focus)");
    expect(rule![0]).not.toContain("var(--accent)");
  });

  it("light mode does not reuse the accent as the focus colour", () => {
    // Dark mode may legitimately land on the same step; light mode cannot,
    // because that is exactly the 2.51:1 failure.
    const accent = colour("--accent", LIGHT);
    const focus = colour("--focus", LIGHT);
    expect(`${focus.r},${focus.g},${focus.b}`).not.toBe(`${accent.r},${accent.g},${accent.b}`);
  });

  it("the accent is still free to fail non-text contrast, because it is a fill", () => {
    // Not an assertion that it fails — a statement of scope. --accent is
    // measured as a background with text on it (see TEXT_ON_FILL above), which
    // is the criterion that applies to it now that it no longer marks focus.
    expect(colour("--accent-fg", LIGHT)).toBeDefined();
  });
});

describe.each(MODES)("%s mode — the grounds are ordered", (mode, props) => {
  it("surfaces step consistently away from the page", () => {
    // Dark: each surface is lighter than the page. Light: each is lighter still
    // (Cloud ground, white cards), so a card lifts rather than dissolving. The
    // direction differs; the requirement that they DIFFER does not.
    const bg = colour("--bg", props);
    const surface = colour("--surface", props);
    const surface2 = colour("--surface-2", props);
    for (const [name, c] of [["--surface", surface], ["--surface-2", surface2]] as const) {
      expect(
        Math.abs(contrastRatio(c, bg) - 1),
        `${name} is indistinguishable from --bg in ${mode}`,
      ).toBeGreaterThan(0.02);
    }
  });
});

describe("the mark/ink split", () => {
  // Ink exists because the mark colours do not clear AA at text sizes. If ink
  // ever equals its mark, the split has quietly collapsed and the ink tokens
  // are giving false assurance.
  const PAIRS = [
    ["--ok", "--ok-ink"],
    ["--warning", "--warning-ink"],
    ["--danger", "--danger-ink"],
    ["--info", "--info-ink"],
  ] as const;

  for (const [mode, props] of MODES) {
    for (const [mark, ink] of PAIRS) {
      it(`${ink} is a distinct value from ${mark} in ${mode}`, () => {
        const m = colour(mark, props);
        const i = colour(ink, props);
        expect(
          `${i.r},${i.g},${i.b}`,
          `${ink} has collapsed onto ${mark}; the ink token is no longer doing anything`,
        ).not.toBe(`${m.r},${m.g},${m.b}`);
      });
    }
  }
});

describe("a field is not painted with a surface", () => {
  /**
   * The regression this guards.
   *
   * Every input, select and textarea was filled with --surface and given a
   * transparent resting ring. --surface is also what Card is filled with, so a
   * field inside a card measured 1.00:1 against it: not low contrast, the same
   * colour. The border patterns in use elsewhere did not save it either, since
   * --rule against --surface is 1.05:1 dark and 1.11:1 light.
   *
   * Only --surface is asserted, and deliberately. With four surface steps no
   * single fill can stay distinct from all of them — light --field is white
   * and so is --bg — which is why --field-border, measured against all four
   * above, is what actually identifies the control. The fill's one job is to
   * not collide with the card, because that is where fields live.
   *
   * The floor is a RATIO, not inequality of values. Neutral 850 reads as an
   * obvious pick for the dark fill and differs from --surface by one point of
   * red: a string comparison passes it, and it measures 1.003:1.
   */
  const MIN_DELTA = 1.1;

  for (const [mode, props] of MODES) {
    it(`--field is a visible step away from --surface in ${mode}`, () => {
      const ratio = round2(contrastRatio(colour("--field", props), colour("--surface", props)));
      expect(
        ratio,
        `--field measures ${ratio}:1 against --surface in ${mode}. A field on a Card ` +
          `needs a fill of its own, not the card's.`,
      ).toBeGreaterThanOrEqual(MIN_DELTA);
    });

    it(`--field-border is a distinct value from --rule in ${mode}`, () => {
      // --rule is the subtle divider. It is exempt from 1.4.11 as decoration,
      // which is exactly why a control boundary may not borrow it.
      const border = colour("--field-border", props);
      const rule = colour("--rule", props);
      expect(`${border.r},${border.g},${border.b}`).not.toBe(`${rule.r},${rule.g},${rule.b}`);
    });
  }
});
