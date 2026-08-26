import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // theme.css is read from disk and parsed; nothing here needs a DOM.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
