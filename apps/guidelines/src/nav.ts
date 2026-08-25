/**
 * The section registry.
 *
 * One list drives the sidebar and the scroll spy, so the two can never
 * disagree about what exists or what order it is in.
 *
 * It does NOT create the sections — the page body does. Registering an id here
 * with no matching section is the one way to break this, and it happened, so
 * `useScrollSpy` now checks every id against the DOM in development and logs
 * the ones with nothing behind them.
 */
export interface DocSection {
  id: string;
  label: string;
}
export interface DocGroup {
  label: string;
  sections: DocSection[];
}

export const NAV: DocGroup[] = [
  {
    label: "Foundations",
    sections: [
      { id: "principles", label: "Principles" },
      { id: "brand", label: "Brand & logo" },
      { id: "colour", label: "Colour" },
      { id: "type", label: "Typography" },
      { id: "layout", label: "Spacing & radius" },
      { id: "elevation", label: "Elevation" },
      { id: "motion", label: "Motion" },
    ],
  },
  {
    label: "Components",
    sections: [
      { id: "buttons", label: "Buttons" },
      { id: "forms", label: "Inputs & forms" },
      { id: "controls", label: "Selection controls" },
      { id: "chips", label: "Chips, tags, badges" },
      { id: "cards", label: "Cards & tiles" },
      { id: "feedback", label: "Feedback & status" },
      { id: "navigation", label: "Navigation" },
      { id: "overlays", label: "Overlays" },
      { id: "tables", label: "Tables" },
    ],
  },
  {
    label: "Data",
    sections: [{ id: "charts", label: "Charts" }],
  },
  {
    label: "Reference",
    sections: [{ id: "tokens", label: "Token export" }],
  },
];

export const ALL_SECTIONS = NAV.flatMap((g) => g.sections);
