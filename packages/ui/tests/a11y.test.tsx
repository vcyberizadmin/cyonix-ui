/**
 * Accessibility invariants that must hold for EVERY component, checked by
 * sweeping the whole fixture registry rather than by remembering to assert them
 * one component at a time.
 *
 * These are the rules that get broken by a refactor somewhere else — an icon
 * swapped for one without a label, a div given an onClick, a decorative SVG
 * left exposed to the accessibility tree. Per-component tests do not catch them
 * because the person changing the icon is not reading that component's test.
 *
 * This is not a substitute for an audit. It is a floor: a small number of
 * mechanical rules, applied without exception, so the obvious failures cannot
 * reach a consumer.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FIXTURES } from "./fixtures.js";

const names = Object.keys(FIXTURES).sort();

/** Everything rendered, portals included. */
function roots(container: HTMLElement): HTMLElement[] {
  return [container, document.body];
}

function queryAll(container: HTMLElement, selector: string): HTMLElement[] {
  const found = new Set<HTMLElement>();
  for (const root of roots(container)) {
    for (const el of root.querySelectorAll<HTMLElement>(selector)) found.add(el);
  }
  return [...found];
}

/**
 * The accessible name, computed well enough for these rules: visible text, then
 * aria-label, then the text of whatever aria-labelledby points at, then title.
 * Content marked aria-hidden does not count, which is the whole point — an
 * icon-only button whose only child is a hidden SVG has no name.
 */
function accessibleName(el: HTMLElement): string {
  const label = el.getAttribute("aria-label");
  if (label?.trim()) return label.trim();

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }

  const clone = el.cloneNode(true) as HTMLElement;
  for (const hidden of clone.querySelectorAll("[aria-hidden='true']")) hidden.remove();
  const text = clone.textContent?.trim();
  if (text) return text;

  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();

  // An <input> is named by its own label element or placeholder.
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.labels?.length) {
      const fromLabel = [...el.labels].map((l) => l.textContent ?? "").join(" ").trim();
      if (fromLabel) return fromLabel;
    }
    if (el.placeholder?.trim()) return el.placeholder.trim();
  }

  return "";
}

describe("every interactive element has an accessible name", () => {
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    const unnamed = queryAll(container, "button, a[href], [role='menuitem'], [role='option'], [role='tab'], [role='radio'], [role='switch']")
      .filter((el) => el.getAttribute("aria-hidden") !== "true")
      .filter((el) => accessibleName(el) === "")
      .map((el) => `<${el.tagName.toLowerCase()} class="${el.className}">`);

    expect(unnamed, `${name} has ${unnamed.length} unnamed control(s)`).toEqual([]);
  });
});

describe("every form control has an accessible name", () => {
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    const unnamed = queryAll(container, "input, textarea, select")
      .filter((el) => (el as HTMLInputElement).type !== "hidden")
      .filter((el) => accessibleName(el) === "")
      .map((el) => `<${el.tagName.toLowerCase()} type="${el.getAttribute("type") ?? ""}">`);

    expect(unnamed).toEqual([]);
  });
});

describe("decorative graphics are hidden from assistive tech", () => {
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    // An SVG that is neither labelled nor hidden is announced as "graphic"
    // with no name, which is worse than silence.
    const exposed = queryAll(container, "svg")
      .filter((svg) => svg.getAttribute("aria-hidden") !== "true")
      .filter((svg) => svg.closest("[aria-hidden='true']") === null)
      .filter((svg) => accessibleName(svg) === "" && !svg.querySelector("title"))
      // An svg inside a named control is part of that control's presentation.
      .filter((svg) => {
        const owner = svg.closest("button, a[href], [role='img'], [role='button']");
        return owner === null || accessibleName(owner as HTMLElement) === "";
      })
      .map((svg) => `<svg class="${svg.getAttribute("class") ?? ""}">`);

    expect(exposed, `${name} exposes ${exposed.length} unlabelled graphic(s)`).toEqual([]);
  });
});

describe("no positive tabindex", () => {
  // A positive tabindex jumps the element ahead of everything in document
  // order and silently reorders the whole page's tab sequence.
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    const offenders = queryAll(container, "[tabindex]")
      .filter((el) => Number(el.getAttribute("tabindex")) > 0)
      .map((el) => `${el.tagName.toLowerCase()}[tabindex=${el.getAttribute("tabindex")}]`);

    expect(offenders).toEqual([]);
  });
});

describe("no click handler on a non-interactive element", () => {
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    // React attaches at the root, so onClick is not visible as an attribute.
    // What IS checkable is the inverse tell: an element given a button/link
    // role but no way to reach it from the keyboard.
    const unreachable = queryAll(container, "[role='button'], [role='link'], [role='menuitem'], [role='option']")
      .filter((el) => !["BUTTON", "A", "INPUT"].includes(el.tagName))
      .filter((el) => el.getAttribute("tabindex") === null)
      .map((el) => `${el.tagName.toLowerCase()}[role=${el.getAttribute("role")}]`);

    expect(unreachable, "an element with a widget role must be focusable").toEqual([]);
  });
});

describe("headings do not skip levels within a component", () => {
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    const levels = queryAll(container, "h1, h2, h3, h4, h5, h6").map((h) =>
      Number(h.tagName[1]),
    );

    for (let i = 1; i < levels.length; i += 1) {
      expect(
        levels[i]! - levels[i - 1]!,
        `${name} jumps from h${levels[i - 1]} to h${levels[i]}`,
      ).toBeLessThanOrEqual(1);
    }
  });
});

describe("a labelled region is not left empty", () => {
  it.each(names)("%s", (name) => {
    const { container } = render(FIXTURES[name]!());

    // An aria-label on an element with no content announces a landmark that
    // leads nowhere.
    const empty = queryAll(container, "[aria-label]")
      .filter((el) => el.getAttribute("aria-hidden") !== "true")
      .filter((el) => !["INPUT", "TEXTAREA", "SELECT", "IMG", "SVG"].includes(el.tagName))
      .filter((el) => el.childNodes.length === 0)
      .map((el) => `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute("aria-label")}"]`);

    expect(empty).toEqual([]);
  });
});
