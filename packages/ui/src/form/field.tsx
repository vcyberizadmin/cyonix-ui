"use client";

/**
 * CX-FLD — Field. Tenant is the sole owner of a real field primitive; SOC and
 * VAPT inline their inputs per page, so there is nothing to reconcile here.
 *
 * WHAT THIS EXISTS FOR: accessibility that is automatic rather than remembered
 * per page. Field generates its own id, associates the label, and wires
 * `aria-describedby` and `aria-invalid` onto whatever control sits inside it.
 *
 * TWO API SHAPES
 * --------------
 * The standard flags Tenant's render-prop API as "unusual and slightly verbose"
 * and worth documenting prominently. Rather than document the awkwardness, both
 * shapes work:
 *
 *   <Field label="Name"><Input /></Field>            // control reads context
 *   <Field label="Name">{(p) => <Input {...p} />}</Field>   // explicit props
 *
 * The first is the one to reach for. The render prop stays for wiring a
 * third-party control that cannot read our context.
 *
 * REQUIRED IS THE ASSUMED DEFAULT. Mark the exceptions with `optional` instead
 * of starring every mandatory field — a long form full of asterisks tells you
 * nothing.
 */
import {
  createContext,
  useContext,
  useId,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn.js";

/** Props a control needs in order to be correctly associated and described. */
export interface ControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  disabled: boolean | undefined;
}

const FieldContext = createContext<ControlProps | null>(null);

/** Controls call this to pick up the field's wiring. Returns null when a control
 *  is used standalone, which is allowed — it just carries no association. */
export function useFieldControl(): ControlProps | null {
  return useContext(FieldContext);
}

export interface FieldProps {
  label: ReactNode;
  /** Explain the constraint, e.g. "Must be unique. 2-150 characters."
   *  REPLACED IN PLACE by `error` when one exists — they never stack. */
  hint?: ReactNode;
  /** Say how to FIX it, not that something is wrong. */
  error?: ReactNode;
  /** Required is assumed; mark the exceptions. */
  optional?: boolean;
  disabled?: boolean;
  /** Why it is disabled. Rendered as visible text — a disabled control whose
   *  reason lives only in a title attribute is a dead end. */
  disabledReason?: ReactNode;
  /** `inline` puts the control before the label, for checkboxes and switches. */
  orientation?: "stacked" | "inline";
  children: ReactNode | ((control: ControlProps) => ReactNode);
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  optional,
  disabled,
  disabledReason,
  orientation = "stacked",
  children,
  className,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  // Hint and error share ONE slot, so only ever one description id.
  const hasMessage = Boolean(error ?? hint ?? (disabled && disabledReason));

  const control: ControlProps = {
    id,
    "aria-describedby": hasMessage ? messageId : undefined,
    "aria-invalid": error ? true : undefined,
    disabled: disabled || undefined,
  };

  const rendered =
    typeof children === "function" ? children(control) : children;

  const labelEl = (
    <label
      htmlFor={id}
      className={cn(
        // leading-5 fixes the first line box at 20px so an inline control can be
        // centred against it exactly, instead of nudged with a magic margin.
        "text-fg text-[13px] leading-5 font-medium",
        disabled && "text-fg-muted",
      )}
    >
      {label}
      {optional && (
        <span className="text-fg-muted font-normal"> (optional)</span>
      )}
    </label>
  );

  return (
    <FieldContext.Provider value={control}>
      <div
        className={cn(
          "flex min-w-0",
          orientation === "inline"
            ? "flex-row items-start gap-2.5"
            : "flex-col gap-1.5",
          className,
        )}
      >
        {orientation === "inline" ? (
          <>
            <div className="flex h-5 shrink-0 items-center">{rendered}</div>
            <div className="flex min-w-0 flex-col gap-1">
              {labelEl}
              <Message
                id={messageId}
                error={error}
                hint={hint}
                disabled={disabled}
                disabledReason={disabledReason}
              />
            </div>
          </>
        ) : (
          <>
            {labelEl}
            {rendered}
            <Message
              id={messageId}
              error={error}
              hint={hint}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          </>
        )}
      </div>
    </FieldContext.Provider>
  );
}

/** One slot. An error replaces the hint rather than pushing it around. */
function Message({
  id,
  error,
  hint,
  disabled,
  disabledReason,
}: {
  id: string;
  error?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  disabledReason?: ReactNode;
}) {
  const content = error ?? (disabled && disabledReason) ?? hint;
  if (!content) return null;
  return (
    <p
      id={id}
      className={cn(
        "text-[11px] leading-snug",
        error ? "text-danger-ink" : "text-fg-muted",
      )}
    >
      {content}
    </p>
  );
}

export interface FieldGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Two columns above 720px, one below — the layout the standard specifies for a
 * form. 720px is not a default breakpoint, so it is written out rather than
 * rounded to `md`.
 */
export function FieldGrid({ children, className }: FieldGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4 min-[720px]:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
