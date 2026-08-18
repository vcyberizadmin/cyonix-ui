/**
 * Asserts that cn() knows this theme's custom scales.
 *
 * tailwind-merge classifies unknown `text-*` / `shadow-*` values as COLOURS, so
 * without the extension in lib/cn.ts a tone silently evicts a font size:
 * `cn("text-h2", "text-danger")` drops the 30px. Nothing throws, every
 * surviving class still resolves, and verify-utilities stays green — the only
 * symptom is the wrong rendered size. Hence a dedicated check.
 */
import { cn } from "../dist/lib/cn.js";

const cases = [
  // The bug this exists to prevent: a size and a colour must coexist.
  { args: ["font-display text-h2 font-bold", "text-danger"], has: ["text-h2", "text-danger"] },
  { args: ["text-small flex gap-2", "text-ok"], has: ["text-small", "text-ok"] },
  { args: ["text-label", "text-fg-muted"], has: ["text-label", "text-fg-muted"] },
  { args: ["shadow-e2", "text-fg"], has: ["shadow-e2", "text-fg"] },
  // Genuine conflicts must STILL merge — the fix must not simply opt out.
  { args: ["text-h2", "text-h3"], has: ["text-h3"], hasNot: ["text-h2"] },
  { args: ["text-body", "text-small"], has: ["text-small"], hasNot: ["text-body"] },
  { args: ["text-danger", "text-ok"], has: ["text-ok"], hasNot: ["text-danger"] },
  { args: ["shadow-e2", "shadow-e4"], has: ["shadow-e4"], hasNot: ["shadow-e2"] },
  // Stock behaviour must be untouched.
  { args: ["p-4", "p-6"], has: ["p-6"], hasNot: ["p-4"] },
  { args: ["text-sm", "text-lg"], has: ["text-lg"], hasNot: ["text-sm"] },
];

const failures = [];
for (const { args, has, hasNot = [] } of cases) {
  const out = cn(...args);
  const tokens = new Set(out.split(/\s+/));
  for (const cls of has) {
    if (!tokens.has(cls)) failures.push(`cn(${args.map((a) => `"${a}"`).join(", ")}) dropped "${cls}" — got "${out}"`);
  }
  for (const cls of hasNot) {
    if (tokens.has(cls)) failures.push(`cn(${args.map((a) => `"${a}"`).join(", ")}) kept "${cls}" — got "${out}"`);
  }
}

if (failures.length) {
  console.error(`\n✗ verify-merge: ${failures.length} case(s) failed:`);
  for (const f of failures) console.error("    " + f);
  console.error(
    "\n  A custom --text-* or --shadow-* token is missing from the classGroups\n" +
      "  extension in src/lib/cn.ts.\n",
  );
  process.exit(1);
}
console.log(`✓ verify-merge: cn() honours all ${cases.length} custom-scale cases`);
