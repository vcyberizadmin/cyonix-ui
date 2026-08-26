import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Components are rendered for real, so they need a DOM. jsdom resolves the
    // cascade far enough for roles, attributes, focus and events — it does NOT
    // substitute var() or lay anything out, which is why no test here asserts a
    // computed colour or a measured position. Those live in packages/theme
    // (token values) and in the guard scripts (utility generation).
    environment: "jsdom",
    globals: false,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
