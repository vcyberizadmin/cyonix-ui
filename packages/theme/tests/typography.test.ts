/**
 * THE FONT REGRESSION TEST.
 *
 * Commit f00a600 rewrote the ramp layer and deleted --display, --ui and --mono
 * while the rest of the file went on referencing them. Every heading and every
 * line of body text in the library silently fell back to the system font. The
 * build passed, typecheck passed, all four guard scripts passed, and nothing
 * in CI so much as warned. It was caught by a person looking at a screen.
 *
 * A dangling var() is invalid at computed-value time: the declaration is
 * dropped and the property inherits, so there is no error and no visual clue
 * beyond the wrong glyphs. The only way to catch it automatically is to assert
 * on the VALUE the browser would end up with, which is what this file does.
 *
 * verify-tokens.mjs now guards the same class of bug from the other direction —
 * it proves no reference dangles. This proves the specific chain that broke
 * still arrives somewhere real, and that Tailwind's font utilities are wired to
 * it. Both are cheap; the failure was expensive.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME_PATH } from "./css.js";
import { HOST_SUPPLIED, MODES, THEME_INLINE, resolveToken } from "./modes.js";

/** Role token → the host font it must reach → its concrete fallback family. */
const FONT_ROLES = [
  { role: "--display", host: "--font-space-grotesk", generic: "sans-serif" },
  { role: "--ui", host: "--font-inter", generic: "sans-serif" },
  { role: "--mono", host: "--font-jetbrains-mono", generic: "monospace" },
] as const;

describe("font roles", () => {
  for (const { role, host, generic } of FONT_ROLES) {
    for (const [mode, props] of MODES) {
      it(`${role} resolves to a real stack in ${mode} mode`, () => {
        const { value, missing } = resolveToken(role, props);

        expect(
          missing,
          `${role} is referenced across theme.css but its chain breaks at ${missing}. ` +
            `A dangling var() drops the whole declaration — text renders in the system font with no error.`,
        ).toBeNull();
        expect(value, `${role} is not defined in ${mode} mode`).not.toBeNull();
        expect(value).not.toBe("");
      });
    }

    it(`${role} asks the host app for ${host}`, () => {
      const { value } = resolveToken(role, MODES[0]![1]);
      expect(
        value,
        `${role} must reference ${host} so next/font can supply the real face`,
      ).toContain(HOST_SUPPLIED.get(host));
    });

    it(`${role} still names a family when the host supplies nothing`, () => {
      // The contract in theme.css's header: "An app that does not define them
      // falls back to system-ui." A stack that is only var(--font-x) would
      // leave a plain Vite app with no family at all.
      const { value } = resolveToken(role, MODES[0]![1]);
      const families = value!.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));
      expect(families.length, `${role} needs a fallback after ${host}`).toBeGreaterThan(1);
      expect(families.at(-1)).toBe(generic);
    });
  }
});

describe("Tailwind font utilities", () => {
  // Tailwind promotes --font-* into font-<name> utilities. If @theme inline
  // stops pointing these at the roles, `font-display` keeps compiling and
  // quietly emits nothing useful.
  const UTILITIES = [
    ["--font-display", "--display"],
    ["--font-ui", "--ui"],
    ["--font-mono", "--mono"],
  ] as const;

  for (const [utility, role] of UTILITIES) {
    it(`${utility} maps to ${role}`, () => {
      expect(
        THEME_INLINE.get(utility),
        `@theme inline must map ${utility} to ${role}, or the utility is dead`,
      ).toBe(`var(${role})`);
    });
  }
});

describe("base layer typography", () => {
  // The bug's blast radius was body text and every heading, because @layer base
  // sets those two families. Assert the base layer still reads the roles.
  const source = readFileSync(THEME_PATH, "utf8");

  it("body uses the UI role", () => {
    expect(source).toMatch(/body\s*\{[^}]*font-family:\s*var\(--ui\)/);
  });

  it("headings use the display role", () => {
    expect(source).toMatch(/font-family:\s*var\(--display\)/);
  });
});
