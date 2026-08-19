"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { Button } from "../button.js";
import { cn } from "../lib/cn.js";

/**
 * CX-SET — the two-pane settings shell.
 *
 * A left list of sections beside a pane scoped to one of them. The standard is
 * blunt about the alternatives: Tenant stacks everything in one column, which
 * "does not survive ten sections"; VAPT uses tabs, "fine for three and unusable
 * at ten". All three consoles are heading toward ten-plus sections.
 *
 * Rules encoded here:
 *  · Left pane 250px, sticky, its own card. The active section takes an orange
 *    rail — a current location, which is where the accent belongs.
 *  · Every entry carries a DESCRIPTION, and the type requires it. The standard
 *    singles this out: "that description is what makes the list scannable
 *    instead of a menu of nouns."
 *  · Each section is a real route when `linkComponent` is supplied, so it is
 *    linkable and Back works.
 *  · Save is per section. Scoped saving is the whole point — a mistake stays
 *    contained to one area instead of risking a page-long form.
 *  · Switching away from a section with unsaved changes prompts first.
 *  · Below 900px the left pane becomes a disclosure rather than disappearing.
 *    The standard records that this fallback "does not exist yet" in any
 *    console; it does now.
 *  · Each section states whether its settings SYNC or are local to the device,
 *    because the standard requires the page to say so plainly and no console
 *    currently does.
 *
 * NOT wired to ConfirmDialog on purpose. `./overlays` is a separate subpath
 * precisely so an app using the shell but no overlays does not pay for the focus
 * machinery. Pass `confirmDiscard` to use the brand dialog; the built-in
 * fallback is `window.confirm`, which is plain but never silently discards work.
 */

export interface SettingsSection {
  id: string;
  title: string;
  /**
   * REQUIRED, one line. A list of bare nouns — "General", "Security",
   * "Advanced" — forces the operator to open every section to find anything.
   */
  description: string;
  /** Marks unsaved changes in that section. */
  dirty?: boolean;
  /**
   * `synced` settings follow the account; `device` settings are local to this
   * browser. Stating it per section is what stops the "why did my setting not
   * follow me" ticket.
   */
  scope?: "synced" | "device";
  /** Makes the entry a real link, so the section is deep-linkable. */
  href?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface SettingsShellProps {
  sections: SettingsSection[];
  /** Id of the visible section. */
  active: string;
  onSectionChange?: (id: string) => void;
  /** Apps pass `next/link` to make sections real routes. */
  linkComponent?: ElementType;
  /** Accessible name for the section list. */
  label?: string;

  /** Right pane header. Defaults to the active section's title. */
  title?: ReactNode;
  /** Right-aligned qualifier in the header — removes most inline paragraphs. */
  hint?: ReactNode;
  /** Extra header controls, left of Save. */
  actions?: ReactNode;
  children: ReactNode;

  /** Section-scoped save. Omit to render no Save control. */
  onSave?: () => void;
  /** Unsaved changes in the ACTIVE section. Gates Save and the switch prompt. */
  dirty?: boolean;
  saving?: boolean;
  saveLabel?: string;
  /**
   * Asked before leaving a dirty section. Return false to stay. Wire this to
   * ConfirmDialog; without it, `window.confirm` is used.
   */
  confirmDiscard?: (nextSectionId: string) => boolean | Promise<boolean>;

  className?: string;
}

const SCOPE_LABEL = {
  synced: "Synced",
  device: "This device",
} as const;

/** Mounted-guarded, so the server and client agree on the first render. */
function useNarrow(query = "(max-width: 899px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return narrow;
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "duration-instant ease-brand size-4 shrink-0 transition-transform",
        open && "rotate-180",
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SettingsShell({
  sections,
  active,
  onSectionChange,
  linkComponent,
  label = "Settings sections",
  title,
  hint,
  actions,
  children,
  onSave,
  dirty = false,
  saving = false,
  saveLabel = "Save changes",
  confirmDiscard,
  className,
}: SettingsShellProps) {
  const narrow = useNarrow();
  const [listOpen, setListOpen] = useState(false);
  const current = sections.find((section) => section.id === active);

  const attempt = useCallback(
    async (id: string) => {
      if (id === active) return;
      if (dirty) {
        const proceed = confirmDiscard
          ? await confirmDiscard(id)
          : window.confirm(
              "You have unsaved changes in this section. Leave without saving?",
            );
        if (!proceed) return;
      }
      setListOpen(false);
      onSectionChange?.(id);
    },
    [active, dirty, confirmDiscard, onSectionChange],
  );

  // Opening the disclosure on a narrow screen should not leave a stale open
  // state behind once the layout widens again.
  useEffect(() => {
    if (!narrow) setListOpen(false);
  }, [narrow]);

  const list = (
    <nav aria-label={label} className="flex flex-col">
      {sections.map((section) => {
        const isActive = section.id === active;
        // A dirty section must never be a plain link: navigating away would
        // discard work before `attempt` could ask.
        const asLink = Boolean(section.href) && !dirty && !section.disabled;
        const Root = (asLink ? (linkComponent ?? "a") : "button") as ElementType;
        return (
          <Root
            key={section.id}
            {...(asLink
              ? { href: section.href }
              : { type: "button", disabled: section.disabled })}
            aria-current={isActive ? "page" : undefined}
            title={section.disabled ? section.disabledReason : undefined}
            onClick={() => {
              void attempt(section.id);
            }}
            className={cn(
              "duration-instant ease-brand border-rule flex w-full flex-col gap-0.5 border-b border-l-[3px] px-4 py-3 text-left transition-colors last:border-b-0",
              section.disabled
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer",
              // Orange rail marks the current location.
              isActive
                ? "border-l-accent bg-wash-1"
                : "border-l-transparent hover:bg-wash-hover",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  isActive ? "text-fg" : "text-fg-2",
                )}
              >
                {section.title}
              </span>
              {section.dirty && (
                // Shape as well as colour: the haloed ring matches CX-STA's
                // warning dot, so "unsaved" survives greyscale.
                <span
                  role="img"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                  className="bg-warning ring-warning/30 size-1.5 shrink-0 rounded-full ring-2"
                />
              )}
            </span>
            {/* The line that makes the list scannable. */}
            <span className="text-fg-muted text-[11px] leading-snug">
              {section.description}
            </span>
            {section.scope && (
              <span className="text-fg-muted mt-1 text-[9.5px] font-semibold tracking-wider uppercase">
                {SCOPE_LABEL[section.scope]}
              </span>
            )}
          </Root>
        );
      })}
    </nav>
  );

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-6 min-[900px]:flex-row min-[900px]:items-start",
        className,
      )}
    >
      {narrow ? (
        // The disclosure fallback. The active section's title stays visible
        // while collapsed, so the pane is never unlabelled.
        <div className="border-rule bg-surface w-full overflow-hidden rounded-md border">
          <button
            type="button"
            aria-expanded={listOpen}
            onClick={() => setListOpen((open) => !open)}
            className="hover:bg-wash-hover duration-instant ease-brand flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-fg-muted text-[10px] font-semibold tracking-wider uppercase">
                Section
              </span>
              <span className="text-fg truncate text-[13px] font-semibold">
                {current?.title ?? "Settings"}
              </span>
            </span>
            <ChevronDown open={listOpen} />
          </button>
          {listOpen && <div className="border-rule border-t">{list}</div>}
        </div>
      ) : (
        <aside className="border-rule bg-surface sticky top-6 w-(--container-settings-rail) shrink-0 self-start overflow-hidden rounded-md border">
          {list}
        </aside>
      )}

      {/* The pane is a CX-CRD with a header and a scoped Save. min-w-0 so a wide
          table inside owns its own overflow instead of pushing the layout. */}
      <section className="border-rule bg-surface min-w-0 flex-1 rounded-md border">
        <div className="border-rule bg-wash-1 flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
          <div className="flex min-w-0 flex-col">
            <h2 className="font-display text-h3 truncate font-semibold">
              {title ?? current?.title}
            </h2>
            {current?.scope && (
              <span className="text-fg-muted text-[10.5px]">
                {current.scope === "synced"
                  ? "These settings follow your account."
                  : "These settings are local to this device."}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hint != null && <span className="text-fg-2 text-small">{hint}</span>}
            {actions}
            {onSave && (
              <Button
                size="sm"
                onClick={onSave}
                loading={saving}
                // Disabled until something changed: an always-enabled Save on a
                // per-section form invites saving a section you never edited.
                disabled={!dirty}
                title={dirty ? undefined : "No changes to save"}
              >
                {saveLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="min-w-0 p-6">{children}</div>
      </section>
    </div>
  );
}
