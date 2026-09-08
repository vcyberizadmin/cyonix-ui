/**
 * The glyphs the reference console uses, drawn to its own stroke spec:
 * `.ico { fill:none; stroke:currentColor; stroke-width:2; round caps and
 * joins }`. Sized by whatever holds them, so none of these set a size.
 *
 * A consuming app would reach for lucide here. These are inline so this app
 * has no icon dependency and so the parity screenshots cannot drift because a
 * package bumped.
 */
import type { ReactNode } from "react";

const S = ({ children, fill }: { children: ReactNode; fill?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={fill ? 1.4 : 2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Home = () => (
  <S>
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z" />
  </S>
);
export const HomeFill = () => (
  <S fill>
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z" />
  </S>
);
export const ShieldAlert = () => (
  <S>
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
    <path d="M12 9v3.5M12 16h.01" />
  </S>
);
export const ShieldAlertFill = () => (
  <S fill>
    <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z" />
  </S>
);
export const Folder = () => (
  <S>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
  </S>
);
export const FolderFill = () => (
  <S fill>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
  </S>
);
export const Blocks = () => (
  <S>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
    <path d="M13 7h8M7 13v8" />
  </S>
);
export const Radar = () => (
  <S>
    <path d="M19.07 4.93A10 10 0 1 0 12 22a10 10 0 0 0 7.07-17.07" />
    <path d="M12 12l5-5M12 12a3 3 0 1 0 3 3" />
  </S>
);
export const Clock = () => (
  <S>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </S>
);
export const CircleX = () => (
  <S>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </S>
);
export const Bot = () => (
  <S>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01" />
  </S>
);
export const TrendDown = () => (
  <S>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M15 17h6v-6" />
  </S>
);
export const TrendUp = () => (
  <S>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </S>
);
export const Info = () => (
  <S>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </S>
);
export const Grid = () => (
  <S>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </S>
);
export const Rows = () => (
  <S>
    <rect x="3" y="4" width="18" height="5" rx="1.5" />
    <rect x="3" y="12" width="18" height="5" rx="1.5" />
  </S>
);
