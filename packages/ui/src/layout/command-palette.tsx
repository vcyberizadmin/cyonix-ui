"use client";

/**
 * CX-CMD — the ⌘K command runner. Only SOC has one; VAPT renders a ⌘K hint with
 * nothing behind it and Tenant has neither.
 *
 * WHY NOT cmdk
 * ------------
 * SOC's is built on cmdk, and the standard lists "adds the cmdk dependency to
 * every consumer" as a con of lifting it. The pieces cmdk provides — an overlay,
 * focus handling, fuzzy filtering, roving selection — are either already in
 * `useOverlay` or are the small functions below, so this is built on our own
 * machinery and the dependency surface stays at three packages.
 *
 * Rules encoded here:
 *  · Centred at 640px on a blurred scrim, capped at 60vh.
 *  · Results grouped with uppercase headers; shortcut keys as mono chips,
 *    right-aligned.
 *  · The selected row takes the ORANGE WASH — it is a current location, which is
 *    a legitimate accent use.
 *  · ⌘K / Ctrl+K from anywhere EXCEPT a code editor, which binds it itself.
 *    Plain inputs still allow it — you often want to search mid-form.
 *  · An empty query shows RECENTS, never a blank panel.
 *  · Remote results stream in UNDER local ones and never block them.
 *
 * It stays undiscoverable unless the top bar advertises it, so keep TopBar's
 * visible ⌘K affordance.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn.js";
import { useOverlay, usePortalTarget } from "../overlays/use-overlay.js";

export interface Command {
  id: string;
  label: string;
  /** Uppercase group header. Defaults to "Commands". */
  group?: string;
  /** Rendered as mono chips, e.g. "⌘N" or "g then a". */
  shortcut?: string;
  icon?: ReactNode;
  /** Secondary context on the row. */
  hint?: string;
  onRun: () => void;
}

export interface CommandPaletteProps {
  commands: Command[];
  /**
   * Record search — alerts, cases, tenants, findings. Results append UNDER the
   * local ones, so a slow network never delays the palette. Stale responses are
   * dropped.
   */
  onSearch?: (query: string) => Promise<Command[]>;
  /** Controlled open state. Omit to let the palette own its ⌘K. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  /** localStorage key for recents. Set per app. */
  storageKey?: string;
  /** Extra selectors where ⌘K must not fire, beyond the known code editors. */
  ignoreSelector?: string;
  className?: string;
}

/** Subsequence match with a score: consecutive runs and word starts rank higher. */
function score(text: string, query: string): number | null {
  const haystack = text.toLowerCase();
  const needle = query.toLowerCase();
  let at = 0;
  let points = 0;
  let run = 0;

  for (const char of needle) {
    const found = haystack.indexOf(char, at);
    if (found === -1) return null;
    // Word start is a strong signal — "ca" should find "Create Assessment".
    const boundary = found === 0 || /[\s\-_/:.]/.test(haystack[found - 1] ?? "");
    run = found === at ? run + 1 : 0;
    points += 1 + run * 2 + (boundary ? 4 : 0);
    at = found + 1;
  }
  // Shorter matches win when scores tie.
  return points - haystack.length * 0.01;
}

const CODE_EDITOR = ".monaco-editor, .cm-editor, [data-code-editor]";

export function CommandPalette({
  commands,
  onSearch,
  open: controlledOpen,
  onOpenChange,
  placeholder = "Search or run a command",
  storageKey = "cyonix.palette.recents",
  ignoreSelector,
  className,
}: CommandPaletteProps) {
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlledOpen ?? ownOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (controlledOpen === undefined) setOwnOpen(next);
    },
    [controlledOpen, onOpenChange],
  );

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Command[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;
  const listRef = useRef<HTMLDivElement | null>(null);
  const target = usePortalTarget();

  const { panelRef } = useOverlay<HTMLDivElement>({
    open,
    onClose: () => setOpen(false),
    initialFocus: inputRef,
  });

  // Recents, read after mount so SSR and hydration agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setRecentIds(JSON.parse(raw) as string[]);
    } catch {
      /* private mode or corrupt JSON — recents are a convenience, not state */
    }
  }, [storageKey]);

  // The global hotkey.
  useEffect(() => {
    if (controlledOpen !== undefined && onOpenChange === undefined) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const el = event.target as Element | null;
      // Monaco and CodeMirror bind ⌘K themselves; do not fight them.
      const selector = ignoreSelector
        ? `${CODE_EDITOR}, ${ignoreSelector}`
        : CODE_EDITOR;
      if (el?.closest?.(selector)) return;
      event.preventDefault();
      setOpen(!open);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen, ignoreSelector, controlledOpen, onOpenChange]);

  // Reset per opening — a stale query is never what you wanted.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setRemote([]);
    }
  }, [open]);

  // Remote search. Never awaited before rendering local results.
  useEffect(() => {
    if (!open || !onSearch || query.trim() === "") {
      setRemote([]);
      return;
    }
    let live = true;
    const id = setTimeout(() => {
      void onSearch(query)
        .then((results) => {
          if (live) setRemote(results);
        })
        .catch(() => {
          if (live) setRemote([]);
        });
    }, 150);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [open, onSearch, query]);

  const local = useMemo(() => {
    if (query.trim() === "") {
      // Empty query shows recents, in most-recent-first order.
      const byId = new Map(commands.map((c) => [c.id, c]));
      const recents = recentIds
        .map((id) => byId.get(id))
        .filter((c): c is Command => c !== undefined)
        .map((c) => ({ ...c, group: "Recent" }));
      const rest = commands.filter((c) => !recentIds.includes(c.id));
      return [...recents, ...rest];
    }
    return commands
      .map((command) => ({
        command,
        points: score(`${command.label} ${command.hint ?? ""}`, query),
      }))
      .filter((entry) => entry.points !== null)
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      .map((entry) => entry.command);
  }, [commands, query, recentIds]);

  // Remote results sit UNDER the local ones.
  const flat = useMemo(() => [...local, ...remote], [local, remote]);

  const groups = useMemo(() => {
    const out: { name: string; items: { command: Command; index: number }[] }[] = [];
    flat.forEach((command, index) => {
      const name = command.group ?? "Commands";
      const bucket = out.find((g) => g.name === name);
      if (bucket) bucket.items.push({ command, index });
      else out.push({ name, items: [{ command, index }] });
    });
    return out;
  }, [flat]);

  const run = useCallback(
    (command: Command) => {
      setRecentIds((current) => {
        const next = [command.id, ...current.filter((id) => id !== command.id)].slice(0, 5);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* non-fatal */
        }
        return next;
      });
      setOpen(false);
      command.onRun();
    },
    [setOpen, storageKey],
  );

  // Keep the active row in view as the arrows move.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || !target) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-[12vh]"
      style={{ backgroundColor: "rgb(6 6 8 / 0.8)", backdropFilter: "blur(2px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "bg-surface border-rule shadow-e4 animate-modal-in flex w-full max-w-[640px] flex-col overflow-hidden rounded-lg border focus:outline-none",
          className,
        )}
      >
        <div className="border-rule flex items-center gap-2.5 border-b px-4">
          <svg
            className="text-fg-muted size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-activedescendant={optionId(active)}
            autoComplete="off"
            className="text-fg placeholder:text-fg-2 h-12 flex-1 bg-transparent text-[14px] focus:outline-none"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) =>
                  flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length,
                );
              } else if (event.key === "Enter") {
                event.preventDefault();
                const command = flat[active];
                if (command) run(command);
              }
            }}
          />
          <kbd className="border-rule text-fg-2 shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]">
            esc
          </kbd>
        </div>

        {/* Capped at 60vh; the list scrolls inside. */}
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Results"
          className="max-h-[60vh] overflow-y-auto py-2"
        >
          {flat.length === 0 && (
            <p className="text-fg-muted px-4 py-6 text-center text-[13px]">
              No matches for “{query}”
            </p>
          )}

          {groups.map((group) => (
            <div key={group.name} className="mb-1">
              <p className="text-fg-muted px-4 py-1.5 text-[10px] font-semibold tracking-[0.1em] uppercase">
                {group.name}
              </p>
              {group.items.map(({ command, index }) => (
                <button
                  key={command.id}
                  id={optionId(index)}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => run(command)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-[13px]",
                    // Orange wash marks the current location in the list.
                    index === active
                      ? "bg-accent/12 text-accent-ink"
                      : "text-fg-2 hover:bg-wash-hover",
                  )}
                >
                  {command.icon && (
                    <span className="shrink-0 [&_svg]:size-3.5">{command.icon}</span>
                  )}
                  <span className="truncate">{command.label}</span>
                  {command.hint && (
                    <span className="text-fg-muted truncate text-[11px]">
                      {command.hint}
                    </span>
                  )}
                  {command.shortcut && (
                    <kbd className="border-rule text-fg-2 ml-auto shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    target,
  );
}
