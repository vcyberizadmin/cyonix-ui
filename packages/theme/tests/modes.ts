/**
 * The two cascades a component can find itself in, built once and shared by
 * every test in this package.
 *
 * Dark is the master: theme.css declares the full role contract on `:root` and
 * the light block overrides a subset. Reading light mode as "dark, then the
 * light overrides applied" is not a shortcut — it is what the browser does, and
 * it is why a role that light forgets to override is a real bug that these
 * tests can see.
 */
import { customProperties, readTheme, resolve, topLevelBlocks, type ResolveResult } from "./css.js";

const css = readTheme();
const blocks = topLevelBlocks(css);

const isRoot = (s: string) => s === ":root";
const isLight = (s: string) => s.includes(".light") && !s.startsWith("@");
const isThemeInline = (s: string) => /^@theme\b/.test(s);

/** Every `:root` declaration, ramp and role together — the dark cascade. */
export const DARK = new Map<string, string>();
for (const b of blocks.filter((b) => isRoot(b.selector))) {
  for (const [k, v] of customProperties(b.body)) DARK.set(k, v);
}

/** Only the declarations the light block overrides. */
export const LIGHT_OVERRIDES = new Map<string, string>();
for (const b of blocks.filter((b) => isLight(b.selector))) {
  for (const [k, v] of customProperties(b.body)) LIGHT_OVERRIDES.set(k, v);
}

/** The light cascade as a browser sees it: dark, then the overrides on top. */
export const LIGHT = new Map([...DARK, ...LIGHT_OVERRIDES]);

/** The `@theme inline` block — Tailwind's utility namespaces. */
export const THEME_INLINE = new Map<string, string>();
for (const b of blocks.filter((b) => isThemeInline(b.selector))) {
  for (const [k, v] of customProperties(b.body)) THEME_INLINE.set(k, v);
}

/**
 * The HOST APP CONTRACT, mirroring verify-tokens.mjs. theme.css names no font
 * families on purpose — a Next app supplies these through next/font. They are
 * given stand-in values so a resolve() walk reports a genuine break rather than
 * tripping over an absence that is by design.
 */
export const HOST_SUPPLIED = new Map<string, string>([
  ["--font-space-grotesk", "HostDisplayFont"],
  ["--font-inter", "HostUiFont"],
  ["--font-jetbrains-mono", "HostMonoFont"],
]);

/** Resolves a token in one mode, following `var()` to a literal. */
export function resolveToken(token: string, mode: Map<string, string>): ResolveResult {
  const value = mode.get(token);
  if (value === undefined) return { value: null, missing: token };
  return resolve(value, mode, HOST_SUPPLIED);
}

export const MODES: ReadonlyArray<readonly [name: string, props: Map<string, string>]> = [
  ["dark", DARK],
  ["light", LIGHT],
];
