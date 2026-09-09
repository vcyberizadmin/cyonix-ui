/**
 * The glyphs the reference console uses, with its own paths.
 *
 * These are lifted verbatim from the reference's SVG sprite rather than drawn
 * by hand. That distinction matters: hand-approximated glyphs were the one
 * thing that still looked wrong in the rail after every measurement matched —
 * 22px icons on a 48px row at x=26 in both, and the shapes still differed
 * because a hand-drawn "workflow" mark is not the workflow mark.
 *
 * Drawn to the reference's stroke spec: `.ico { fill:none; stroke:currentColor;
 * stroke-width:2; round caps and joins }`, and `.ico-solid` for the filled
 * variants. None of these sets a size — whatever holds them does.
 *
 * A real consumer passes lucide here; these are inline so this app has no icon
 * dependency and the parity screenshots cannot drift because a package bumped.
 */
import type { ReactNode } from "react";

const Ico = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Solid = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={1.1}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/* --------------------------------------------------------- rail glyphs ---- */

export const House = () => (
  <Ico>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Ico>
);

/** The one glyph the reference swaps for a filled variant when current. */
export const HouseSolid = () => (
  <Solid>
    <path
      fillRule="evenodd"
      d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8Z"
    />
  </Solid>
);

export const ShieldAlert = () => (
  <Ico>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Ico>
);

export const FolderOpen = () => (
  <Ico>
    <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
  </Ico>
);

export const Workflow = () => (
  <Ico>
    <rect width="8" height="8" x="3" y="3" rx="2" />
    <path d="M7 11v4a2 2 0 0 0 2 2h4" />
    <rect width="8" height="8" x="13" y="13" rx="2" />
  </Ico>
);

/* ---------------------------------------------------------- KPI glyphs ---- */

export const Radar = () => (
  <Ico>
    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
    <path d="M4 6h.01" />
    <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
    <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" />
    <path d="M12 18h.01" />
    <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />
    <circle cx="12" cy="12" r="2" />
    <path d="m13.41 10.59 5.66-5.66" />
  </Ico>
);

export const Clock = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Ico>
);

export const CircleX = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </Ico>
);

/* --------------------------------------------------------- chrome glyphs -- */

export const Bot = () => (
  <Ico>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </Ico>
);

export const TrendDown = () => (
  <Ico>
    <path d="M16 17h6v-6" />
    <path d="m22 17-8.5-8.5-5 5L2 7" />
  </Ico>
);

export const TrendUp = () => (
  <Ico>
    <path d="M16 7h6v6" />
    <path d="m22 7-8.5 8.5-5-5L2 17" />
  </Ico>
);

export const Info = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </Ico>
);

/** The card/table view toggle, which the reference builds from a segmented. */
export const Grid2x2 = () => (
  <Ico>
    <path d="M12 3v18" />
    <path d="M3 12h18" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </Ico>
);

export const Rows3 = () => (
  <Ico>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M21 9H3" />
    <path d="M21 15H3" />
  </Ico>
);

/* ---------------------------------------------------- agent glyphs ---- */

export const Zap = () => (
  <Ico>
    <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
  </Ico>
);

export const ScanSearch = () => (
  <Ico>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
    <path d="m16 16-1.9-1.9" />
  </Ico>
);

export const UserCheck = () => (
  <Ico>
    <path d="m16 11 2 2 4-4" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </Ico>
);

export const Ban = () => (
  <Ico>
    <circle cx="12" cy="12" r="10" />
    <path d="M4.929 4.929 19.07 19.071" />
  </Ico>
);

/* ------------------------------------------------ detail-page glyphs ---- */

export const ArrowLeft = () => (
  <Ico>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Ico>
);

export const Check = () => (
  <Ico>
    <path d="M20 6 9 17l-5-5" />
  </Ico>
);

export const Sliders = () => (
  <Ico>
    <path d="M21 4h-8M8 4H3M21 12h-4M12 12H3M21 20h-10M6 20H3" />
    <circle cx="10" cy="4" r="2" />
    <circle cx="14" cy="12" r="2" />
    <circle cx="8" cy="20" r="2" />
  </Ico>
);

export const Copy = () => (
  <Ico>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </Ico>
);

export const ChevronRight = () => (
  <Ico>
    <path d="m9 18 6-6-6-6" />
  </Ico>
);

export const ChevronDown = () => (
  <Ico>
    <path d="m6 9 6 6 6-6" />
  </Ico>
);
