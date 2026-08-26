/**
 * Asserts that every `var(--x)` inside theme.css resolves to a token the file
 * actually defines.
 *
 * Why this exists
 * ---------------
 * A dangling custom property fails SILENTLY and totally. A declaration whose
 * value contains an unresolvable `var()` is invalid at computed-value time, so
 * the property does not fall back to the previous rule — it inherits from the
 * parent. `font-family: var(--display)` with no `--display` produces no error,
 * no warning and no visual clue: the text renders in whatever the parent had,
 * which on a bare page is the system font.
 *
 * That is not hypothetical. Rewriting the ramp layer deleted --display, --ui
 * and --mono while the file kept referencing them, and every heading and every
 * line of body text in the library silently lost its typeface. Nothing failed.
 *
 * Coverage limit, stated honestly: this proves every reference has a
 * definition. It does not prove the value is right, and it deliberately skips
 * the variables a consuming app is expected to supply — see HOST_SUPPLIED.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const cssPath = fileURLToPath(new URL("../theme.css", import.meta.url));
const css = readFileSync(cssPath, "utf8");

/**
 * The HOST APP CONTRACT. theme.css names no font families on purpose — a Next
 * app supplies these through next/font. Referenced but never defined here, and
 * that is correct.
 */
const HOST_SUPPLIED = new Set([
  "--font-space-grotesk",
  "--font-inter",
  "--font-jetbrains-mono",
]);

/* Strip comments, so a token named only in prose is not mistaken for a definition. */
const code = css.replace(/\/\*[\s\S]*?\*\//g, "");

const defined = new Set();
for (const m of code.matchAll(/(--[a-z0-9-]+)\s*:/gi)) defined.add(m[1]);

/**
 * Only a reference with NO fallback is dangerous.
 *
 * `var(--x, something)` degrades to `something` when --x is absent, which is a
 * deliberate and safe pattern — the outline button sets --cx-btn-bg itself and
 * the theme reads it with `var(--cx-btn-bg, var(--bg))`, so the rule still
 * paints for anything that does not set it. `var(--x)` bare has no such escape:
 * it takes the whole declaration down.
 */
const referenced = new Map();
let bareCount = 0;
code.split("\n").forEach((line, i) => {
  for (const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
    const [, token, next] = m;
    if (next !== ")") continue; // has a fallback
    bareCount += 1;
    if (!referenced.has(token)) referenced.set(token, i + 1);
  }
});

const dangling = [...referenced]
  .filter(([token]) => !defined.has(token) && !HOST_SUPPLIED.has(token))
  .sort();

if (dangling.length) {
  console.error(
    `\n✗ verify-tokens: ${dangling.length} token(s) referenced by theme.css but never defined:\n`,
  );
  for (const [token, line] of dangling) {
    console.error(`    ${token}  — first referenced at theme.css:${line}`);
  }
  console.error(`
  A dangling var() does not fall back. The declaration becomes invalid at
  computed-value time and the property inherits instead, with no error and no
  visual clue. Define the token, or add it to HOST_SUPPLIED if a consuming app
  is meant to provide it.
`);
  process.exit(1);
}

console.log(
  `✓ verify-tokens: all ${referenced.size} fallback-less tokens resolve (${bareCount} references, ${HOST_SUPPLIED.size} host-supplied)`,
);
