"use client";

/**
 * CX-FLD controls: Input, Select, Textarea, Checkbox, Switch.
 *
 * Each picks up its `id`, `aria-describedby`, `aria-invalid` and `disabled` from
 * the enclosing Field, so a page cannot forget to associate them. Used outside a
 * Field they still render — they just carry no association.
 *
 * Shape rules from the standard:
 *  · radius-sm on ALL FOUR corners. The chamfer is buttons-only; a chamfered
 *    input would dilute the one place the shape means something.
 *  · A RESTING border in --field-border, going to --focus on focus. The
 *    resting one is not decoration: it is what makes the control findable
 *    before anyone has focused it, and WCAG 2.2 1.4.11 asks 3:1 of it.
 *  · Fill is --field, which is neither a surface nor a wash. An input used to
 *    be filled with --surface, which is also what Card is filled with, so a
 *    field inside a card measured 1.00:1 against it and had no resting border
 *    to fall back on. It was invisible in both themes.
 *
 * Both borders are drawn as INSET box-shadows rather than a real border, so
 * focus can thicken the ring from 1px to 2px without resizing the content box
 * and shifting the text inside it.
 */
import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../lib/cn.js";
import { useFieldControl } from "./field.js";

const base =
  "bg-field text-fg placeholder:text-fg-muted placeholder:font-medium " +
  "shadow-[inset_0_0_0_1px_var(--field-border)] " +
  // The not-* chain is load-bearing, and both halves were caught in a browser
  // rather than by the token maths. `enabled:hover` carries more specificity
  // than either `focus` (0,4,0 vs 0,2,0) or `aria-invalid` (vs 0,2,0) and
  // Tailwind emits it later, so on its own it WINS both: moving the pointer
  // over a focused field dropped the orange ring, and moving it over an
  // invalid one hid the red one — an error state silently erased by a hover.
  // Narrowing hover to the plain resting state makes the four mutually
  // exclusive, so precedence no longer rests on specificity or sort order.
  // Any state added later needs adding here too.
  "enabled:hover:not-focus:not-aria-invalid:shadow-[inset_0_0_0_1px_var(--field-border-hover)] " +
  // --focus, not --accent. They are near-identical oranges and the accent is
  // picked for brand fills, so in light mode it measures 2.69:1 on --surface,
  // under the 3:1 a focus indicator needs. --focus is Orange 450 for exactly
  // this reason; Checkbox and Switch below already use it.
  "focus:shadow-[inset_0_0_0_2px_var(--focus)] " +
  "duration-instant ease-brand w-full rounded-lg text-[13.5px] font-semibold " +
  "transition-[box-shadow,background-color] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/** An invalid control shows it on the border too, not only in the message. */
const invalid = "aria-invalid:shadow-[inset_0_0_0_2px_var(--danger)]";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    <input
      ref={ref}
      {...field}
      {...props}
      className={cn(base, invalid, "h-11 px-4", className)}
    />
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    const field = useFieldControl();
    return (
      <textarea
        ref={ref}
        rows={rows}
        {...field}
        {...props}
        className={cn(base, invalid, "resize-y px-4 py-3", className)}
      />
    );
  },
);

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, children, ...props }, ref) {
    const field = useFieldControl();
    return (
      // Wrapper exists so the chevron can be a real element inheriting
      // currentColor. A background data-URI would have to hardcode a hex, and
      // the standard is explicit that a component resolves colour from tokens
      // and never from a literal.
      <span className="relative block w-full">
        <select
          ref={ref}
          {...field}
          {...props}
          className={cn(
            base,
            invalid,
            "h-11 cursor-pointer appearance-none px-4 pr-9",
            className,
          )}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-fg-muted pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    );
  },
);

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    const field = useFieldControl();
    return (
      <input
        ref={ref}
        type="checkbox"
        {...field}
        {...props}
        className={cn(
          "bg-field accent-accent focus-visible:shadow-[0_0_0_2px_var(--focus)] duration-instant ease-brand size-4 cursor-pointer rounded-sm transition-shadow focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
    );
  },
);

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
>;

/**
 * A real checkbox under the hood, styled as a switch. Keeping the native input
 * means keyboard, form submission and screen-reader semantics come for free —
 * a div with role="switch" has to reimplement all three.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, ...props },
  ref,
) {
  const field = useFieldControl();
  return (
    // A fixed box with everything absolutely placed inside it. The earlier
    // version sized the wrapper from a `size-0` input, which had two bugs: the
    // inline-flex baseline pushed the control below its own label, and — worse —
    // a zero-sized input has NO HIT AREA, so clicking the visible switch did
    // nothing and only the label could toggle it.
    <span
      className={cn(
        "relative inline-block h-[30px] w-[52px] shrink-0 align-middle",
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        {...field}
        {...props}
        className="peer absolute inset-0 z-10 size-full cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-not-allowed"
      />
      {/* Track. Driven by peer-checked, so no JS state is involved. */}
      <span
        aria-hidden="true"
        className="bg-surface-3 peer-checked:bg-accent peer-focus-visible:shadow-[0_0_0_2px_var(--focus)] duration-instant ease-brand pointer-events-none absolute inset-0 rounded-full transition-colors peer-disabled:opacity-50"
      />
      {/* Knob. */}
      <span
        aria-hidden="true"
        className="duration-instant ease-brand pointer-events-none absolute top-1/2 left-1 size-[22px] -translate-y-1/2 rounded-full bg-white shadow-[0_2px_5px_rgb(0_0_0_/_0.3)] transition-transform peer-checked:translate-x-[22px] peer-disabled:opacity-50"
      />
    </span>
  );
});
