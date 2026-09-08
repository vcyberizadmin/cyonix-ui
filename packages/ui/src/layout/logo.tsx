import { cn } from "../lib/cn.js";

/**
 * The Cyonix logo.
 *
 * The official artwork, not a rebuild: the wordmark paths are lifted verbatim
 * from `Cyonix Logo_Light Mode.svg` / `_Dark Mode_Inversed.svg`. Those two files
 * differ ONLY in the wordmark fill — `#1C1E25` against `white` — so this ships
 * as one component whose letterforms take `currentColor`. Set the colour with a
 * text utility and the logo follows the theme; there is no light/dark pair to
 * keep in sync, and no chance of shipping the wrong one.
 *
 * THE ONE LEGITIMATE USE OF THE SPARK GRADIENT
 * --------------------------------------------
 * `--spark` is restricted to logo artwork: never a button background, never a
 * UI fill, never a chart colour. The three gradient paths below — the four-point
 * star and the two angled strokes inside the Y and the X — are that use. Because
 * it is the only one, every console that hand-rolls the mark is one careless
 * copy-paste away from the gradient escaping into the interface, which is why
 * this ships as a component rather than as an SVG file to drop in.
 *
 * Server-safe: no state, no hooks, no handlers.
 */

export interface LogoProps {
  /**
   * Module badge beside the wordmark — "VAPT", "SOC", "TENANT". This is what
   * lets one mark serve three consoles without three forks.
   */
  module?: string;
  /**
   * The short mark — a CX monogram with the spark between the letters — for a
   * collapsed rail. This IS the official short mark, lifted from the reference
   * console's `short-dark.svg`, and it replaces the bare four-point star this
   * prop used to render before a real mark existed.
   *
   * Its letterforms take `currentColor` like the lockup's, which the reference
   * itself cannot manage: it embeds the artwork as `<img src>`, so CSS cannot
   * reach the fill. That is why the reference's own `--logo` token is dead
   * code, and why its mark loses its orange elements against the orange
   * light-mode rail. Ours does not.
   */
  mini?: boolean;
  size?: "sm" | "md" | "lg";
  /** Drop the wordmark but keep the module badge. */
  wordmark?: boolean;
  className?: string;
}

/* Heights, not widths: the lockup is 498 × 97, so a fixed height keeps the
   aspect ratio and lets the width fall where it may. */
const LOCKUP = { sm: "h-4", md: "h-5", lg: "h-6" } as const;
const STAR = { sm: "size-5", md: "size-6", lg: "size-8" } as const;

/**
 * One id for every instance. SVG gradient ids are document-global, so several
 * logos on a page all resolve to the same definition — which is correct here,
 * because every definition is identical. A per-instance id would need `useId`,
 * and that would cost this component its server-safety for no visible gain.
 *
 * camelCase, not kebab: `verify-utilities` scans the built output for anything
 * class-shaped, and a dashed id reads to it as a Tailwind class that resolves
 * to nothing. This is an SVG id, so it is spelled like one.
 */
const SPARK_ID = "cxLogoSparkGradient";

function SparkGradient() {
  return (
    <defs>
      <linearGradient
        id={SPARK_ID}
        x1="287.435"
        y1="0"
        x2="286.132"
        y2="34.9949"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FFA505" />
        <stop offset="1" stopColor="#FE1F0B" />
      </linearGradient>
    </defs>
  );
}

/** The four-point star that sits over the i. */
const STAR_PATH =
  "M287.435 0L288.985 7.56596C289.864 11.8518 293.213 15.201 297.499 16.0793L305.065 17.63L297.499 19.1806C293.213 20.059 289.864 23.4082 288.985 27.694L287.435 35.26L285.884 27.694C285.006 23.4082 281.656 20.059 277.371 19.1806L269.805 17.63L277.371 16.0793C281.656 15.201 285.006 11.8518 285.884 7.56595L287.435 0Z";

/** Letterforms. These take currentColor. */
const WORDMARK_PATHS = [
  "M165.36 38.749C174.823 38.8501 184.411 38.3048 191.965 45.1562C201.592 53.8871 202.411 72.7113 193.674 82.2754C187.516 89.0182 177.359 89.9538 168.717 90.2676C159.712 90.3176 147.986 90.038 141.199 83.3984C131.97 74.3687 131.349 55.1125 140.65 45.8516C147.57 38.9608 156.288 38.8858 165.36 38.749ZM184.949 52.2207C179.7 47.8607 169.149 47.8758 162.564 48.1836C157.372 48.4922 151.216 49.0355 147.523 53.2422C142.473 58.9936 142.824 71.6017 148.76 76.5889C153.754 80.784 164.927 81.1812 171.34 80.5566C176.521 80.2326 182.597 79.5643 186.215 75.4619C191.368 69.6176 190.989 57.2372 184.949 52.2207Z",
  "M209.875 39.0786L210.014 39.0771L234.04 39.1937C243.802 39.2314 255.495 37.8004 263.059 45.0987C270.818 52.585 269.735 62.7132 269.717 72.5788L269.749 89.6986C267.236 87.088 262.241 82.0356 260.086 79.6257L259.999 71.0198C259.965 67.0012 260.009 62.7664 259.551 58.7916C257.964 51.6507 253.689 49.4691 246.858 49.1362C243.009 48.9486 239.205 48.9638 235.356 48.9717L219.738 48.9608C219.498 62.3986 220.003 76.1588 219.742 89.7055C217.858 87.9156 212.651 82.5856 209.943 79.5739L209.875 39.0786Z",
  "M25.2761 39.166C29.5674 38.8986 35.0711 38.995 39.4292 39.0024L61.3984 39.0665C58.9084 41.9595 54.6481 46.3438 52.136 48.7736C49.3996 49.0179 46.3776 48.7778 43.5628 48.8009C35.632 48.8666 27.3872 48.1705 19.5542 49.454C16.5842 50.0365 13.9728 51.3232 12.277 53.9638C8.64375 59.622 9.0966 71.5126 13.8816 76.3198C18.1623 80.6202 27.0171 80.351 32.7613 80.3858L42.7817 80.4095C48.3818 80.4354 53.995 80.3301 59.5932 80.4665C57.1365 82.6491 52.136 87.6608 49.6405 89.6286C44.5673 89.8158 47.7009 89.6866 42.5394 89.6804C35.4852 89.6717 23.222 90.1792 16.7803 88.5949C13.0784 87.7208 9.66316 85.9103 6.86191 83.3372C1.79885 78.6552 0.444126 72.2081 0.0638086 65.6038C-0.528667 55.3157 2.93799 45.0437 13.2664 41.126C17.522 39.5117 20.7776 39.3323 25.2761 39.166Z",
  "M324.729 78.1953L313.506 89.7529H300.125L318.038 71.3057L324.729 78.1953Z",
  "M362.717 89.7529H349.336L331.42 71.3037L331.419 71.3057L324.729 64.417L324.729 64.4141L300.125 39.0771H313.506L362.717 89.7529Z",
  "M281.531 39.2598L291.131 49.2598V89.6851H281.531V39.2598Z",
  "M77.8672 39.042L105.515 70.7148L105.505 70.7275V96.6924L94.4053 88.6875V72.5869L65.125 39.04H77.8672V39.042Z",
  "M497.561 90.3621H487.961V41.7861H497.561V90.3621Z",
  "M388.021 90.3621H377.188V81.3921H388.021V90.3621Z",
  "M443.367 41.7884L474.465 90.3626H463.068L438.06 51.2767L412.598 90.3626H401.141L432.789 41.7881L443.367 41.7884Z",
];

/** The CX monogram letterforms. These take currentColor. */
const MARK_PATHS = [
  "M39.7448 51.7998C44.0361 51.5324 49.5398 51.6288 53.8978 51.6362L75.867 51.7003C72.8924 54.2069 67.2813 59.0883 64.6046 61.4074C61.8682 61.6517 60.8462 61.4116 58.0315 61.4347C50.1007 61.5004 41.8559 60.8043 34.0229 62.0878C31.0529 62.6702 28.4415 63.957 26.7457 66.5976C23.1125 72.2557 23.5653 84.1463 28.3503 88.9535C32.631 93.2539 41.4858 92.9847 47.2299 93.0195L55.2504 93.0432C60.8504 93.0691 65.4636 92.9638 71.0619 93.1002C68.6051 95.2828 63.6046 100.294 61.1091 102.262C56.036 102.449 60.1696 102.32 55.0081 102.314C47.9538 102.305 37.6907 102.813 31.249 101.229C27.5471 100.354 24.1319 98.544 21.3306 95.9709C16.2676 91.2889 14.9129 84.8419 14.5326 78.2375C13.9401 67.9495 17.4067 57.6775 27.7352 53.7597C31.9908 52.1455 35.2463 51.9661 39.7448 51.7998Z",
  "M101.549 90.8291L90.3262 102.387H76.9453L94.8584 83.9395L101.549 90.8291Z",
  "M139.537 102.387H126.156L108.24 83.9375L108.239 83.9395L101.549 77.0508L101.55 77.0479L76.9453 51.7109H90.3262L139.537 102.387Z",
];

/** The spark, and the angled stroke in the X. Gradient, not currentColor. */
const MARK_ACCENT_PATHS = [
  "M76.4063 61.3845L77.6542 67.4731C78.3611 70.922 81.0563 73.6173 84.5053 74.3242L90.5939 75.572L84.5053 76.8199C81.0563 77.5268 78.3611 80.222 77.6542 83.671L76.4063 89.7596L75.1584 83.671C74.4516 80.222 71.7563 77.5268 68.3074 76.8199L62.2188 75.572L68.3074 74.3242C71.7563 73.6173 74.4516 70.922 75.1584 67.4731L76.4063 61.3845Z",
  "M121.619 70.1576L114.93 63.2693L126.155 51.7109H139.533L121.619 70.1576Z",
];

/** The angled strokes in the Y and the X. Gradient, not currentColor. */
const ACCENT_PATHS = [
  "M344.8 57.5273L338.109 50.6377L349.337 39.0771H362.718L344.8 57.5273Z",
  "M111.778 63.2939L105.391 55.9756L119.669 39.04H132.226L111.778 63.2939Z",
];

export function Logo({
  module,
  mini = false,
  size = "md",
  wordmark = true,
  className,
}: LogoProps) {
  return (
    <span
      className={cn("flex items-center gap-2", className)}
      // One accessible name for the whole lockup, so a screen reader reads
      // "Cyonix.ai SOC" rather than spelling out decorative paths.
      role="img"
      aria-label={module ? `Cyonix.ai ${module}` : "Cyonix.ai"}
    >
      {mini ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 154 154"
          fill="none"
          className={cn("shrink-0", STAR[size])}
        >
          <SparkGradient />
          {MARK_PATHS.map((d) => (
            <path key={d.slice(0, 24)} d={d} fill="currentColor" />
          ))}
          {MARK_ACCENT_PATHS.map((d) => (
            <path key={d.slice(0, 24)} d={d} fill={`url(#${SPARK_ID})`} />
          ))}
        </svg>
      ) : (
        wordmark && (
          <svg
            aria-hidden="true"
            viewBox="0 0 498 97"
            fill="none"
            className={cn("w-auto shrink-0", LOCKUP[size])}
          >
            <SparkGradient />
            {WORDMARK_PATHS.map((d) => (
              <path key={d.slice(0, 24)} d={d} fill="currentColor" />
            ))}
            <path d={STAR_PATH} fill={`url(#${SPARK_ID})`} />
            {ACCENT_PATHS.map((d) => (
              <path key={d.slice(0, 24)} d={d} fill={`url(#${SPARK_ID})`} />
            ))}
          </svg>
        )
      )}
      {!mini && module && (
        <span
          aria-hidden="true"
          className="bg-wash-2 text-fg-2 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase"
        >
          {module}
        </span>
      )}
    </span>
  );
}
