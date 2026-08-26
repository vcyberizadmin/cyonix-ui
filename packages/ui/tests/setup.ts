import { afterEach, beforeAll, vi } from "vitest";

/**
 * Shared test setup.
 *
 * Runs for BOTH environments: most files use jsdom, but ssr.test.tsx runs in
 * plain node with no DOM at all, so everything here is guarded. A setup file
 * that assumed `window` would make the SSR suite fail before it started —
 * which is precisely the bug it exists to catch.
 */
const hasDOM = typeof window !== "undefined";

if (hasDOM) {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}

beforeAll(() => {
  if (!hasDOM) return;

  // Overlays measure their anchor to position themselves, and several
  // components read a media query on mount. jsdom implements neither, so
  // without these the components throw rather than render.
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});
