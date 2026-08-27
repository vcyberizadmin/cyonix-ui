/**
 * A minimal CSS reader for theme.css, plus the colour maths the contrast test
 * needs.
 *
 * WHY NOT A REAL CSS PARSER
 * -------------------------
 * The assertions here are about ONE file with a known shape: top-level rule
 * blocks whose bodies are custom-property declarations. A full parser would be
 * a heavier dependency than the thing it parses. What this does handle, because
 * theme.css actually contains them, is nested blocks (`&::-webkit-scrollbar`),
 * comments in the middle of a value list, and `rgb(r g b / a)` values whose
 * slashes and spaces break naive splitting.
 *
 * WHAT `resolve` PROVES, AND WHAT IT DOES NOT
 * -------------------------------------------
 * It walks a `var()` chain the way the cascade would and returns the literal at
 * the end, or `null` if the chain hits a token nothing defines. That is exactly
 * the font regression's failure mode, so it is testable. It does NOT prove the
 * literal is the right colour — only that the browser will get a value at all.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const THEME_PATH = fileURLToPath(new URL("../theme.css", import.meta.url));

/** theme.css with comments removed, so prose never reads as code. */
export function readTheme(): string {
  return readFileSync(THEME_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
}

export interface Block {
  /** The selector text, whitespace collapsed: `:root`, `.light, [data-theme="light"]`. */
  selector: string;
  /** Everything between the braces, nested blocks included. */
  body: string;
}

/**
 * Every depth-0 block in source order. A selector that lists several matchers
 * arrives as one block, which is what we want: `.light, [data-theme="light"]`
 * is a single set of declarations, not two.
 */
export function topLevelBlocks(css: string): Block[] {
  const blocks: Block[] = [];
  let depth = 0;
  let selectorStart = 0;
  let bodyStart = 0;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === "{") {
      depth += 1;
      if (depth === 1) bodyStart = i + 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        blocks.push({
          selector: css.slice(selectorStart, bodyStart - 1).trim().replace(/\s+/g, " "),
          body: css.slice(bodyStart, i),
        });
        selectorStart = i + 1;
      }
    } else if (depth === 0 && ch === ";") {
      // A top-level at-rule statement (`@import "x";`) — not a block.
      selectorStart = i + 1;
    }
  }
  return blocks;
}

/**
 * Custom-property declarations at the TOP level of a block body. Nested blocks
 * are skipped rather than flattened: a declaration inside `&:hover` is a
 * different cascade context and must not be read as if it sat beside its
 * siblings.
 */
export function customProperties(body: string): Map<string, string> {
  const out = new Map<string, string>();
  let depth = 0;
  let start = 0;

  const commit = (chunk: string) => {
    const colon = chunk.indexOf(":");
    if (colon === -1) return;
    const name = chunk.slice(0, colon).trim();
    if (!name.startsWith("--")) return;
    out.set(name, chunk.slice(colon + 1).trim());
  };

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      start = i + 1;
    } else if (ch === ";" && depth === 0) {
      commit(body.slice(start, i));
      start = i + 1;
    }
  }
  commit(body.slice(start));
  return out;
}

/** Blocks whose selector matches, merged in source order (later wins). */
export function mergedProperties(css: string, selector: (s: string) => boolean): Map<string, string> {
  const out = new Map<string, string>();
  for (const block of topLevelBlocks(css)) {
    if (!selector(block.selector)) continue;
    for (const [name, value] of customProperties(block.body)) out.set(name, value);
  }
  return out;
}

/**
 * Splits a `var(...)` invocation at the FIRST top-level comma, which is the
 * only comma that separates the token from its fallback. `var(--a, var(--b, x))`
 * and `rgb(0 0 0 / 0.5)` both survive this; splitting on `,` naively does not.
 */
function splitVarArgs(inner: string): { token: string; fallback: string | null } {
  let depth = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "," && depth === 0) {
      return { token: inner.slice(0, i).trim(), fallback: inner.slice(i + 1).trim() };
    }
  }
  return { token: inner.trim(), fallback: null };
}

/** Finds the first `var(` and returns the span of its arguments. */
function findVar(value: string): { start: number; end: number; inner: string } | null {
  const at = value.indexOf("var(");
  if (at === -1) return null;
  let depth = 0;
  for (let i = at + 3; i < value.length; i += 1) {
    if (value[i] === "(") depth += 1;
    else if (value[i] === ")") {
      depth -= 1;
      if (depth === 0) return { start: at, end: i + 1, inner: value.slice(at + 4, i) };
    }
  }
  return null;
}

export interface ResolveResult {
  /** The fully substituted value, or `null` if some `var()` had nowhere to go. */
  value: string | null;
  /** The token that broke the chain, when `value` is null. */
  missing: string | null;
}

/**
 * Substitutes `var()` until none remain.
 *
 * `known` is the set of tokens a consuming app supplies (theme.css names no
 * font families on purpose). They resolve to a placeholder so the chain
 * continues instead of reporting a false break.
 */
export function resolve(
  value: string,
  props: Map<string, string>,
  known: ReadonlyMap<string, string> = new Map(),
  seen: ReadonlySet<string> = new Set(),
): ResolveResult {
  const found = findVar(value);
  if (!found) return { value: value.trim(), missing: null };

  const { token, fallback } = splitVarArgs(found.inner);

  if (seen.has(token)) {
    throw new Error(`Cyclic custom property: ${[...seen, token].join(" → ")}`);
  }

  let substitution: string | null = null;
  if (known.has(token)) substitution = known.get(token)!;
  else if (props.has(token)) {
    const inner = resolve(props.get(token)!, props, known, new Set([...seen, token]));
    if (inner.value === null) return inner;
    substitution = inner.value;
  } else if (fallback !== null) {
    const inner = resolve(fallback, props, known, seen);
    if (inner.value === null) return inner;
    substitution = inner.value;
  }

  if (substitution === null) return { value: null, missing: token };

  const next = value.slice(0, found.start) + substitution + value.slice(found.end);
  return resolve(next, props, known, seen);
}

/* ---------------------------------------------------------------------------
   Colour
   --------------------------------------------------------------------------- */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parses `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(r g b)` and `rgb(r g b / a)`. */
export function parseColor(input: string): Rgba | null {
  const value = input.trim();

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (hex) {
    const d = hex[1]!;
    const wide = d.length <= 4 ? d.split("").map((c) => c + c).join("") : d;
    if (wide.length !== 6 && wide.length !== 8) return null;
    return {
      r: parseInt(wide.slice(0, 2), 16),
      g: parseInt(wide.slice(2, 4), 16),
      b: parseInt(wide.slice(4, 6), 16),
      a: wide.length === 8 ? parseInt(wide.slice(6, 8), 16) / 255 : 1,
    };
  }

  const fn = /^rgba?\(([^)]*)\)$/i.exec(value);
  if (fn) {
    const [channels, alpha] = fn[1]!.split("/");
    const parts = channels!.trim().split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const chan = (raw: string) =>
      raw.endsWith("%") ? (parseFloat(raw) / 100) * 255 : parseFloat(raw);
    const a = alpha !== undefined ? parseFloat(alpha) : parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    return { r: chan(parts[0]!), g: chan(parts[1]!), b: chan(parts[2]!), a };
  }

  return null;
}

/** Paints `top` onto `under`, so a translucent wash can be measured. */
export function composite(top: Rgba, under: Rgba): Rgba {
  const a = top.a + under.a * (1 - top.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (t: number, u: number) => (t * top.a + u * under.a * (1 - top.a)) / a;
  return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a };
}

/** WCAG 2.2 relative luminance. */
export function luminance({ r, g, b }: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.2 contrast ratio, 1–21. Both colours must be opaque. */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
