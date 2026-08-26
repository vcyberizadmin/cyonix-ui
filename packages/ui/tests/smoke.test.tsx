/**
 * Every exported component renders.
 *
 * The cheapest test in the library and, historically, the one that would have
 * caught the most. A component that throws on mount, imports a symbol that no
 * longer exists, or calls a hook conditionally does not fail `tsc` and does not
 * fail `tsup` — it fails in the consuming app, at runtime, in front of a user.
 *
 * It also fails LOUDLY, unlike the styling regressions the guard scripts catch,
 * which is why this file asserts only three things per component: it mounts, it
 * puts something in the document, and it unmounts without throwing. Anything
 * more specific belongs in the behaviour tests next to it.
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FIXTURES } from "./fixtures.js";

const names = Object.keys(FIXTURES).sort();

describe("every component mounts", () => {
  it.each(names)("%s", (name) => {
    const { container, unmount } = render(FIXTURES[name]!());

    // Overlays portal out of `container`, so an empty container is only a
    // failure when nothing landed in the document body either.
    const rendered = container.childNodes.length > 0 || document.body.childNodes.length > 1;
    expect(rendered, `${name} rendered nothing`).toBe(true);

    expect(() => unmount(), `${name} threw while unmounting`).not.toThrow();
  });
});

describe("no component logs a React error", () => {
  // React reports invalid nesting, bad keys, unknown DOM props and act()
  // violations through console.error and then carries on. Left unchecked those
  // are invisible in CI, and each one is a real defect in the markup.
  it.each(names)("%s", async (name) => {
    const errors: unknown[][] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args);
    });

    render(FIXTURES[name]!());
    spy.mockRestore();

    expect(errors.map((e) => String(e[0])), `${name} produced React warnings`).toEqual([]);
  });
});
