// @vitest-environment node
/**
 * Every component renders on the SERVER.
 *
 * This file deliberately runs with no DOM at all — `window`, `document` and
 * `localStorage` are undefined, exactly as they are in a Next server render.
 * The jsdom tests beside it cannot catch this class of bug, because in jsdom a
 * component that reaches for `window` during render simply works.
 *
 * The library's build is shaped around this promise: tsup runs with
 * `bundle: false` specifically so that one "use client" boundary is not forced
 * across the whole library, dragging server-safe components into the client
 * graph. That promise is only worth anything if the server-safe components
 * actually render on a server.
 *
 * Note that a "use client" component still server-renders in Next — the
 * directive marks the boundary, it does not opt out of SSR. So the expectation
 * here is the same for all of them: produce markup, throw nothing.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FIXTURES } from "./fixtures.js";

const names = Object.keys(FIXTURES).sort();

/**
 * Overlays and anything that portals render `null` on the server on purpose —
 * usePortalTarget only resolves in an effect, so there is no target yet. Empty
 * markup is the CORRECT answer for these, not a failure.
 */
const RENDERS_EMPTY_ON_SERVER = new Set([
  "Modal",
  "Drawer",
  "ConfirmDialog",
  "CommandPalette",
]);

describe("server rendering", () => {
  it("has no DOM, so the test is meaningful", () => {
    // If jsdom leaked in, every assertion below would pass for the wrong reason.
    expect(typeof window).toBe("undefined");
    expect(typeof document).toBe("undefined");
  });

  it.each(names)("%s renders without touching the DOM", (name) => {
    let markup = "";
    expect(() => {
      markup = renderToStaticMarkup(FIXTURES[name]!());
    }, `${name} threw during server render`).not.toThrow();

    if (!RENDERS_EMPTY_ON_SERVER.has(name)) {
      expect(markup, `${name} produced no server markup`).not.toBe("");
    }
  });

  it.each(names)("%s produces no NaN or undefined in its markup", (name) => {
    const markup = renderToStaticMarkup(FIXTURES[name]!());
    expect(markup).not.toMatch(/NaN/);
    expect(markup).not.toMatch(/undefined/);
    expect(markup).not.toMatch(/\[object Object\]/);
  });
});
