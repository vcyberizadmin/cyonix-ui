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
 *  · Hairline border that goes ORANGE on focus — focus is a current location.
 *  · Fill is `wash-1` rather than a literal grey-1: an input sitting on a Card
 *    (which is itself the surface colour) would otherwise be distinguishable
 *    only by its border. The wash reads as a control on both ground and surface,
 *    and it matches the inputs already shipped in ConfirmDialog and Toolbar.
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
  "bg-wash-1 border-rule text-fg placeholder:text-fg-2 focus:border-focus duration-instant ease-brand w-full rounded-lg border text-[13.5px] font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/** An invalid control shows it on the border too, not only in the message. */
const invalid = "aria-invalid:border-danger";

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
          "border-rule bg-wash-1 accent-accent focus:border-focus duration-instant ease-brand size-4 cursor-pointer rounded-sm border transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
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
        className="bg-wash-3 border-rule peer-checked:bg-accent peer-checked:border-accent peer-focus-visible:border-focus duration-instant ease-brand pointer-events-none absolute inset-0 rounded-full border transition-colors peer-disabled:opacity-50"
      />
      {/* Knob. */}
      <span
        aria-hidden="true"
        className="bg-fg duration-instant ease-brand pointer-events-none absolute top-1/2 left-1 size-[22px] -translate-y-1/2 rounded-full shadow-e1 transition-transform peer-checked:translate-x-[22px] peer-checked:bg-white peer-disabled:opacity-50"
      />
    </span>
  );
});
