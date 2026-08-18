import { defineConfig } from "tsup";

export default defineConfig({
  // Every source file becomes its own output file. This is deliberate:
  // bundling the barrel into one chunk would force a single "use client"
  // boundary across the whole library, dragging server-safe components
  // into the client graph.
  entry: ["src/**/*.ts", "src/**/*.tsx"],
  bundle: false,
  format: ["esm"],
  outDir: "dist",
  // package.json has "type": "module", so .js is already ESM. Keeping .js
  // (rather than .mjs) lets tsc's .d.ts files pair with it without needing
  // the .d.mts variant.
  outExtension: () => ({ js: ".js" }),
  // Declarations come from tsc (see tsconfig.build.json) — tsup's dts
  // bundler is unnecessary when we are not bundling.
  dts: false,
  sourcemap: true,
  clean: true,
  target: "es2022",
});
