import { cn } from "../lib/cn.js";

/**
 * The Cyonix mark.
 *
 * THE ONE LEGITIMATE USE OF THE SPARK GRADIENT
 * --------------------------------------------
 * The design system of record restricts `--spark` to logo artwork: never a
 * button background, never a UI fill, never a chart colour. This component is
 * that use. Because it is the only one, every console that hand-rolls the
 * monogram is one careless copy-paste away from the gradient escaping into the
 * interface — which is why it ships as a component rather than as a snippet.
 *
 * The white "C" on the gradient measures about 1.9:1 at the light end. That is
 * intentional and compliant: WCAG 2.2 exempts text that is part of a logo or
 * brand name from contrast requirements. Do not "fix" it by darkening the mark.
 *
 * Server-safe: no state, no handlers.
 */

export interface LogoProps {
  /**
   * Module badge beside the wordmark — "VAPT", "SOC", "TENANT". This is what
   * lets one mark serve three consoles without three forks.
   */
  module?: string;
  /** Monogram only, for a minimised rail. */
  mini?: boolean;
  size?: "sm" | "md" | "lg";
  /** Drop the wordmark but keep the module badge. */
  wordmark?: boolean;
  className?: string;
}

const MONOGRAM = {
  sm: "size-6 rounded-sm text-[11px]",
  md: "size-7 rounded-md text-[13px]",
  lg: "size-8 rounded-md text-[15px]",
} as const;

const WORD = {
  sm: "text-[13px]",
  md: "text-[15px]",
  lg: "text-[17px]",
} as const;

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
      // "Cyonix.ai VAPT" rather than spelling out a decorative C.
      role="img"
      aria-label={module ? `Cyonix.ai ${module}` : "Cyonix.ai"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "cx-logo-spark grid shrink-0 place-items-center font-bold text-white",
          MONOGRAM[size],
        )}
      >
        C
      </span>
      {!mini && wordmark && (
        <span
          aria-hidden="true"
          className={cn("font-display font-bold whitespace-nowrap", WORD[size])}
        >
          CYONIX.AI
        </span>
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
