"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/cn.js";
import { Menu, type MenuItemDef } from "../overlays/menu.js";

/**
 * CX-TOP — the utility bar.
 *
 * SOC's wins decisively (Tenant's carries only identity and a theme toggle,
 * which is too thin for an operations console). VAPT adds the two things SOC
 * lacks and operators genuinely use: a live clock with timezone, and system
 * health at a glance. Both are here.
 *
 * Brand/UX rules encoded here:
 *  · 52px, sticky, bg/95 with backdrop blur so content scrolling underneath
 *    stays legible.
 *  · Groups separated by 24px hairline dividers.
 *  · Scope sits on the FAR LEFT — it qualifies everything to its right.
 *  · Clock in tabular mono with the timezone beneath.
 *  · Status is a semantic dot PLUS the word, never the dot alone.
 *  · Every group is individually optional — the Tenant console needs no time
 *    window, and a group that does not apply must not be a hole in the strip.
 *
 * Menus reuse CX-MNU, so aria-expanded, Escape, click-outside, focus return and
 * one-menu-at-a-time all come from the shared overlay stack rather than being
 * reimplemented here.
 */

export interface ScopeOption {
  id: string;
  name: string;
}

export interface TopBarProps {
  /** Tenant/scope switcher. Changing it re-scopes the page. */
  scope?: {
    current: string;
    options: ScopeOption[];
    onChange: (id: string) => void;
    label?: string;
  };
  /** Opens the command palette (CX-CMD). The visible ⌘K affordance is what
   *  makes the palette discoverable — do not hide it. */
  onSearch?: () => void;
  searchPlaceholder?: string;
  /** Time window applied to every widget below. */
  timeWindow?: {
    current: string;
    options: string[];
    onChange: (value: string) => void;
  };
  /** Contextual help for the current page. */
  help?: { text: string };
  /** System health. Always renders dot + word. */
  status?: { tone: "ok" | "warning" | "danger"; label: string };
  /** Live clock with timezone. */
  clock?: boolean;
  notifications?: { count: number; onOpen: () => void };
  user?: { name: string; role?: string };
  userMenu?: MenuItemDef[];
  /** Theme toggle or any app-specific trailing control. */
  actions?: ReactNode;
  className?: string;
}

function Chevron() {
  return (
    <svg
      className="size-3 shrink-0 opacity-65"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Groups are separated by a hairline with 12px either side — the 24px rule. */
function Group({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-rule flex items-center gap-2 border-l px-3 first:border-l-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

const triggerBase =
  "text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand flex h-8 w-auto cursor-pointer items-center gap-2 rounded-sm px-2.5 text-[12.5px] font-medium transition-colors";

/**
 * Renders only after mount. `new Date()` during render would differ between
 * server and client and break hydration.
 */
function Clock() {
  const [now, setNow] = useState<{ time: string; zone: string } | null>(null);

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const read = () => {
      const date = new Date();
      const parts = date
        .toLocaleTimeString("en-US", { timeZoneName: "short" })
        .split(" ");
      setNow({
        time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
        zone: parts[parts.length - 1] ?? "Local",
      });
    };
    read();
    const id = setInterval(read, 1000);
    return () => clearInterval(id);
  }, []);

  // Reserve the width so the strip does not jump when the clock appears.
  return (
    <div className="flex min-w-[64px] flex-col items-end leading-tight">
      <span className="text-fg font-mono text-[12px] font-semibold tabular-nums">
        {now?.time ?? "--:--:--"}
      </span>
      <span className="text-fg-muted text-[10px]">{now?.zone ?? ""}</span>
    </div>
  );
}

const STATUS_TONE = {
  ok: "bg-ok text-ok-ink",
  warning: "bg-warning text-warning-ink",
  danger: "bg-danger text-danger-ink",
} as const;

function SystemStatus({ tone, label }: { tone: keyof typeof STATUS_TONE; label: string }) {
  const classes = STATUS_TONE[tone];
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-fg-muted text-[10px] tracking-[0.08em] uppercase">
        System status
      </span>
      {/* Dot AND word — never the dot alone. */}
      <span className={cn("flex items-center gap-1.5 text-[12px] font-bold", classes.split(" ")[1])}>
        <span className={cn("size-1.5 rounded-full", classes.split(" ")[0])} />
        {label}
      </span>
    </div>
  );
}

export function TopBar({
  scope,
  onSearch,
  searchPlaceholder = "Search",
  timeWindow,
  help,
  status,
  clock,
  notifications,
  user,
  userMenu,
  actions,
  className,
}: TopBarProps) {
  const [shortcut, setShortcut] = useState("⌘K");
  useEffect(() => {
    setShortcut(
      /mac/i.test(navigator.platform ?? navigator.userAgent) ? "⌘K" : "Ctrl K",
    );
  }, []);

  const scopeLabel =
    scope?.options.find((option) => option.id === scope.current)?.name ??
    scope?.current;

  /**
   * Below 1280px the non-essential groups collapse into an overflow menu rather
   * than wrapping. SOC currently hides only the dividers, which is the one thing
   * the standard says to fix on the way in.
   */
  const overflowItems: MenuItemDef[] = [
    ...(timeWindow
      ? timeWindow.options.map((option) => ({
          label: `Time window: ${option}`,
          onSelect: () => timeWindow.onChange(option),
        }))
      : []),
    ...(status ? [{ label: `System status: ${status.label}` }] : []),
    ...(help ? [{ label: help.text }] : []),
  ];

  return (
    <header
      className={cn(
        "bg-bg/95 border-rule sticky top-0 z-30 flex h-13 shrink-0 items-center border-b backdrop-blur",
        className,
      )}
    >
      {/* Scope qualifies everything to its right, so it leads the strip. */}
      {scope && (
        <Group>
          <Menu
            label={scope.label ?? "Switch scope"}
            align="start"
            triggerClassName={triggerBase}
            trigger={
              <>
                <span className="bg-accent size-1.5 shrink-0 rounded-full" />
                <span className="text-fg max-w-[180px] truncate">{scopeLabel}</span>
                <Chevron />
              </>
            }
            items={scope.options.map((option) => ({
              label: option.name,
              onSelect: () => scope.onChange(option.id),
            }))}
          />
        </Group>
      )}

      {onSearch && (
        <Group className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Open command palette"
            // text-fg-2, not text-fg-muted: this looks like a placeholder but it is a
            // real button label, and at 12.5px on a wash muted reaches only 4.37:1.
            className="border-rule bg-wash-1 text-fg-2 hover:border-accent/40 hover:text-fg duration-instant ease-brand flex h-8 w-full max-w-md cursor-pointer items-center gap-2 rounded-sm border px-3 text-[12.5px] transition-colors"
          >
            <svg
              className="size-3.5 shrink-0"
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
            <span className="truncate">{searchPlaceholder}</span>
            <kbd className="border-rule text-fg-2 ml-auto shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]">
              {shortcut}
            </kbd>
          </button>
        </Group>
      )}

      <div className="ml-auto flex items-center">
        {timeWindow && (
          <Group className="max-[1280px]:hidden">
            <Menu
              label="Time window"
              triggerClassName={triggerBase}
              trigger={
                <>
                  <span className="text-fg">{timeWindow.current}</span>
                  <Chevron />
                </>
              }
              items={timeWindow.options.map((option) => ({
                label: option,
                onSelect: () => timeWindow.onChange(option),
              }))}
            />
          </Group>
        )}

        {help && (
          <Group className="max-[1280px]:hidden">
            <button
              type="button"
              title={help.text}
              aria-label={help.text}
              className="text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand grid size-8 cursor-pointer place-items-center rounded-sm text-[13px] font-bold transition-colors"
            >
              ?
            </button>
          </Group>
        )}

        {status && (
          <Group className="max-[1280px]:hidden">
            <SystemStatus tone={status.tone} label={status.label} />
          </Group>
        )}

        {clock && (
          <Group className="max-[1280px]:hidden">
            <Clock />
          </Group>
        )}

        {/* The overflow strategy: one menu holding whatever was collapsed. */}
        {overflowItems.length > 0 && (
          <Group className="min-[1281px]:hidden">
            <Menu label="More" items={overflowItems} trigger={<Chevron />} />
          </Group>
        )}

        {notifications && (
          <Group>
            <button
              type="button"
              onClick={notifications.onOpen}
              aria-label={`Notifications, ${notifications.count} unread`}
              className="text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand relative grid size-8 cursor-pointer place-items-center rounded-sm transition-colors"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              {notifications.count > 0 && (
                <span className="bg-warning text-onyx absolute top-0.5 right-0.5 grid min-w-3.5 place-items-center rounded-full px-1 font-mono text-[9px] font-bold tabular-nums">
                  {notifications.count > 99 ? "99+" : notifications.count}
                </span>
              )}
            </button>
          </Group>
        )}

        {actions && <Group>{actions}</Group>}

        {user && (
          <Group>
            <Menu
              label="Open user menu"
              triggerClassName={triggerBase}
              trigger={
                <>
                  <span className="bg-wash-2 text-fg-2 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="hidden flex-col text-left leading-tight sm:flex">
                    <span className="text-fg text-[12px] font-semibold">
                      {user.name}
                    </span>
                    {user.role && (
                      <span className="text-fg-muted text-[11px]">{user.role}</span>
                    )}
                  </span>
                  <Chevron />
                </>
              }
              items={userMenu ?? [{ label: "Sign out", danger: true }]}
            />
          </Group>
        )}
      </div>
    </header>
  );
}
