/**
 * Guarantees that React directives ("use client" / "use server") present at the
 * top of a source file are also present at the top of its build output.
 *
 * Why this exists
 * ---------------
 * A stripped "use client" is the single highest-impact failure mode for a
 * component library consumed by the Next.js App Router: every interactive
 * component throws a Server Component error in the consuming app, and the
 * cause is invisible in the library's own tests. esbuild's handling of unknown
 * top-level directives has changed across versions, and with `bundle: false`
 * esbuild plugins do not run at all — so rather than depend on that behaviour,
 * we assert it here and repair it if needed.
 *
 * Runs last in the build. Exits non-zero if an expected output file is missing,
 * so a broken build fails loudly instead of publishing silently-broken output.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(pkgRoot, "src");
const outDir = join(pkgRoot, "dist");

/** Matches a leading directive, skipping any block/line comments before it. */
const DIRECTIVE_RE =
  /^(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*(["'])(use (?:client|server))\1/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

let repaired = 0;
let verified = 0;
const missing = [];

for (const srcFile of walk(srcDir)) {
  const directive = DIRECTIVE_RE.exec(readFileSync(srcFile, "utf8"))?.[2];
  if (!directive) continue;

  const outFile = join(
    outDir,
    relative(srcDir, srcFile).replace(/\.tsx?$/, ".js"),
  );

  if (!existsSync(outFile)) {
    missing.push(relative(pkgRoot, outFile));
    continue;
  }

  const built = readFileSync(outFile, "utf8");
  if (DIRECTIVE_RE.test(built)) {
    verified++;
  } else {
    writeFileSync(outFile, `"${directive}";\n${built}`);
    repaired++;
  }
}

if (missing.length > 0) {
  console.error(
    `\n✗ preserve-directives: expected build output is missing:\n` +
      missing.map((f) => `    ${f}`).join("\n") +
      `\n  The build did not emit a file for a source file that carries a\n` +
      `  React directive. Fix the build before publishing.\n`,
  );
  process.exit(1);
}

console.log(
  `✓ preserve-directives: ${verified} preserved by the bundler, ${repaired} repaired`,
);
