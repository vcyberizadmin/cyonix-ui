"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./lib/cn.js";

/**
 * CX-BTN
 *
 * Brand rules encoded here, from the design system of record:
 *  · The corner is a plain 14px radius. The chamfered bottom-right corner the
 *    brand calls its "most recognisable cue" was DROPPED on an explicit call to
 *    match the SOC console, whose button is a rounded rectangle. `.cx-chamfer`
 *    still ships in @vcyberizadmin/theme for anything that wants it back; this
 *    component no longer applies it.
 *  · Labels are Space Grotesk at 14px, weight 800 — the console's weight. The
 *    brand specified 600; that too was overridden for the match. The 14px still
 *    sits deliberately outside the body type scale.
 *  · Hover brightens 110%, active dims to 94%.
 *  · The spark gradient is never a button background — it is logo artwork.
 *  · Exactly one `primary` per view.
 */
const button = cva(
  "relative isolate inline-flex items-center justify-center whitespace-nowrap " +
    "rounded-lg font-display text-[14px] font-extrabold " +
    "transition-[filter,background-color,color] duration-instant ease-brand " +
    "disabled:pointer-events-none disabled:brightness-100",
  {
    variants: {
      variant: {
        /** The single action you want taken. One per view. */
        primary:
          "bg-accent text-accent-fg hover:brightness-110 active:brightness-[0.94]",
        /**
         * Orange hairline, orange label, no fill — the reversible
         * counter-action beside a primary. The outer element paints the accent
         * and the inset ::before covers all but a 1px edge, so the hairline
         * follows the chamfer diagonal instead of being clipped by it.
         * On hover the label goes white over a 22% orange wash.
         */
        outline:
          // hover:text-fg, NOT text-accent-fg. --accent-fg means "ink that sits
          // ON the accent fill", and this label never does: the inset ::before
          // covers the fill with --bg, and on hover with a 22% orange wash over
          // it. Near-black on that wash measures 1.3:1 in dark mode. --fg is
          // correct here because the label sits on the app background.
          "cx-inset-hairline bg-accent text-accent-ink hover:text-fg " +
          "[--cx-btn-bg:var(--bg)] hover:[--cx-btn-bg:var(--wash-accent)]",
        /**
         * Neutral weight for toolbars and dense rows. The brand specifies a
         * Dark Grey 2 fill outright, so this stays dark in light mode too —
         * flagged as an open light-mode question rather than silently reinvented.
         */
        solid:
          "bg-neutral-800 text-neutral-0 hover:brightness-110 active:brightness-[0.94]",
        /** Marks the recommended option inside a group of equals. */
        edge:
          // The marker is an inset bar clipped by the button's own radius, not
          // a left border. A 3px border follows the 14px curve and reads as a
          // crescent; the chamfer used to hide that, and with it gone the bar
          // has to be drawn rather than bordered.
          "overflow-hidden bg-neutral-800 text-neutral-0 " +
          "before:bg-accent before:absolute before:inset-y-0 before:left-0 before:z-0 before:w-[3px] before:content-[''] " +
          "hover:brightness-110 active:brightness-[0.94]",
        /**
         * Destructive. Always confirms through CX-CNF.
         *
         * Uses --danger-strong, not --danger. White on the semantic danger hue
         * is 3.76:1, under AA for a 14px label. Unlike the accent — where no
         * shade of Sunset Orange carries white text and the label had to darken
         * — a deeper red still reads unmistakably as danger, so the fill
         * darkens and the label stays white. A black-on-red destructive button
         * would be the worse trade.
         */
        danger:
          "bg-danger-strong text-white hover:brightness-110 active:brightness-[0.94]",
        /** Lowest weight, for dense toolbars. */
        ghost: "text-fg hover:bg-wash-hover",
      },
      size: {
        /* The console's ladder: 44 / 36 / 28, with its own radius per step —
           the corner tightens as the control shrinks rather than staying fixed.
           With the chamfer gone there is no 11px corner budget to protect, so
           horizontal padding scales with height again. */
        sm: "h-9 rounded-[11px] px-[.9rem] text-[13px]",
        md: "h-11 px-5",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof button> {
  children?: ReactNode;
  /**
   * Shows progress in place and holds the button disabled until settled, so an
   * async action cannot double-submit.
   */
  loading?: boolean;
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- IconButton -- */

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    Pick<VariantProps<typeof button>, "variant"> {
  children: ReactNode;
  /**
   * REQUIRED. An icon-only control with no accessible name is unusable with a
   * screen reader, and it is the single commonest defect in icon toolbars — so
   * the type refuses to let it be forgotten.
   */
  label: string;
  /** Why it is unavailable. A disabled control with no explanation is a dead
   *  end; the standard requires the reason be visible to the user. */
  disabledReason?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Compact visual box, full 44x44 hit area.
 *
 * The hit area is a centred `::after` at exactly `size-11`, which is the WCAG
 * 2.2 target-size minimum. Doing it with a pseudo-element rather than padding
 * is what keeps a 32px-looking button in a dense toolbar from pushing the row
 * to 44px — the standard notes Tenant already gets this right, and this is that
 * behaviour made size-independent.
 *
 * NOT chamfered, unlike Button. The chamfer needs a stable 11px corner budget,
 * which on a 32px square is a third of the width; at that ratio it stops reading
 * as the brand cue and starts reading as a cut corner. Radius-sm instead, which
 * is what the existing row and top-bar controls already use.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { className, variant = "ghost", size = "md", label, disabledReason, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={disabled ? disabledReason : undefined}
        disabled={disabled}
        className={cn(
          button({ variant }),
          // Undo the label geometry the shared recipe carries: no chamfer, no
          // horizontal padding, square box.
          "grid place-items-center rounded-lg p-0",
          // .btn-icon is 44px square; .btn-icon.btn-sm is 36px at an 11px corner.
          size === "sm"
            ? "size-9 rounded-[11px]"
            : size === "lg"
              ? "size-12"
              : "size-11",
          "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
          disabled && "opacity-50",
          "[&_svg]:size-4",
          size === "sm" && "[&_svg]:size-3.5",
          className,
        )}
        {...props}
      >
        <span className="relative z-[1] grid place-items-center">{children}</span>
      </button>
    );
  },
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        button({ variant, size }),
        // Loading and disabled must not look alike: loading is work in
        // progress at full strength, disabled is unavailable and dimmed. Both
        // are non-interactive. Decided here rather than with a `disabled:`
        // variant because loading also sets `disabled`, and the two utilities
        // would collide on equal specificity.
        disabled && !loading && "opacity-50",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* The chamfer hairline is a positioned ::before, so the label needs its
          own layer to sit above it. */}
      <span className="relative z-[1] inline-flex items-center gap-2">
        {loading ? <Spinner /> : null}
        {children}
      </span>
    </button>
  );
});
