"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn.js";
import { Popover } from "../overlays/tooltip.js";

/**
 * CX-CBR — the console bar.
 *
 * The SOC console's header, ported. Like CX-DCK beside CX-NAV, this is a
 * SIBLING of CX-TOP rather than a replacement, and for the same reason: the two
 * answer different questions.
 *
 * `TopBar` is a 52px utility strip — scope, clock, health, a menu — where every
 * group is a small control and the whole thing reads as chrome. `ConsoleBar` is
 * a 68/78px identity bar built around one question the operator asks constantly
 * ("whose data am I looking at?") and three panels they open all shift. It is
 * taller, it carries a search affordance sized to be seen, and its scope
 * switcher is a set of tabs with a moving ink, not a dropdown.
 *
 * Rules encoded here:
 *  · Scope sits FAR LEFT and reads as tabs, because it qualifies everything to
 *    its right and is switched far more often than anything else in the bar.
 *  · The ink under the current scope is the ONE orange thing in the bar. Scope
 *    is location, and location is what orange means.
 *  · A count that needs attention takes the danger tone, never orange — the
 *    same rule CX-DCK's badges follow.
 *  · Below `xl` the theme and settings controls fold INTO the profile panel
 *    rather than being dropped, because a control that vanishes on a laptop is
 *    a control the operator cannot reach.
 *
 * All three panels are CX-TIP's `Popover`, so Escape, click-outside, focus
 * return, portalling and anchored positioning come from the shared overlay
 * stack rather than being reimplemented three times here.
 */

/* ---------------------------------------------------------------- icons --
   Structural chrome, drawn at the brand's 1.8px stroke like every other icon
   the library owns. App-supplied icons (a notification's source, the search
   glyph's companion) stay props. */

function Glyph({
  path,
  className,
}: {
  path: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

const ChevronDown = ({ className }: { className?: string }) => (
  <Glyph className={className} path={<path d="m6 9 6 6 6-6" />} />
);
const Bell = ({ className }: { className?: string }) => (
  <Glyph
    className={className}
    path={
      <>
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </>
    }
  />
);
const Users = ({ className }: { className?: string }) => (
  <Glyph
    className={className}
    path={
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <path d="M16 3.128a4 4 0 0 1 0 7.744" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <circle cx="9" cy="7" r="4" />
      </>
    }
  />
);
const Check = ({ className }: { className?: string }) => (
  <Glyph className={className} path={<path d="M20 6 9 17l-5-5" />} />
);

/* ----------------------------------------------------------------- types -- */

export interface ConsoleScope {
  id: string;
  name: string;
  /** Monogram for the picker tile — "NB", "ALL". Falls back to the initial. */
  short?: string;
  /** Second line in the picker: "Financial services", "4 organisations". */
  detail?: string;
  /** Right-aligned figure in the picker, e.g. how many alerts are open. */
  metric?: { value: ReactNode; label?: string };
  /** Tile tint. Any CSS colour. Defaults to a neutral wash. */
  tint?: string;
}

export interface ConsoleNotification {
  id: string;
  title: string;
  body?: string;
  /** Pre-formatted by the app — "6m", "Yesterday". The bar does no date
   *  arithmetic, so it needs no clock and cannot disagree with the server. */
  time?: string;
  unread?: boolean;
  /** Who raised it — usually the originating agent or connector. */
  source?: { name: string; icon?: ReactNode; tint?: string };
  onSelect?: () => void;
}

export interface ConsoleMenuItem {
  label: ReactNode;
  icon?: ReactNode;
  /** Right-aligned value, e.g. the current theme beside "Appearance". */
  value?: ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  /**
   * Show ONLY below `xl`. This is how a control lives inline as an icon button
   * on a wide screen and as a labelled row in the profile panel on a narrow
   * one, without being duplicated to the user at any single width.
   */
  compactOnly?: boolean;
}

export interface ConsoleBarProps {
  /** Mark shown below `xl`, where the dock rail has no room for one. */
  brand?: ReactNode;
  brandHref?: string;

  /** Tenant/scope switcher. Rendered as tabs with a moving ink. */
  scope?: {
    current: string;
    options: ConsoleScope[];
    onChange: (id: string) => void;
    /** Ids kept inline as tabs; everything else lives behind the picker.
     *  Defaults to the first three. */
    pinned?: string[];
    /** Picker button label while the current scope is visible inline. */
    pickerLabel?: string;
  };

  /** Opens the command palette (CX-CMD). The visible affordance is what makes
   *  the palette discoverable — do not hide it. */
  onSearch?: () => void;
  searchPlaceholder?: string;
  /** Shortcut shown in the search affordance. */
  searchHint?: string;
  /** Leading glyph in the search affordance — the console uses its agent mark. */
  searchIcon?: ReactNode;

  notifications?: {
    items: ConsoleNotification[];
    onMarkAllRead?: () => void;
    emptyLabel?: string;
  };

  user?: { name: string; role?: string; avatar?: ReactNode };
  userMenu?: ConsoleMenuItem[];

  /** Inline icon buttons, `xl` and up — theme toggle, settings. Their narrow
   *  equivalents belong in `userMenu` as `compactOnly` rows. */
  actions?: ReactNode;

  linkComponent?: ElementType;
  className?: string;
}

/* ------------------------------------------------------------- fragments -- */

const ICON_BUTTON =
  "bg-wash-2 text-fg hover:bg-wash-3 duration-instant ease-brand grid size-11 shrink-0 cursor-pointer place-items-center rounded-[14px] transition-colors [&_svg]:size-5";

const PANEL_ROW =
  "duration-instant ease-brand hover:bg-wash-2 flex w-full cursor-pointer items-center gap-2.5 rounded-[14px] px-2.5 py-2.5 text-left text-[13.5px] font-bold transition-colors";

function Tile({
  children,
  tint,
  className,
}: {
  children: ReactNode;
  tint?: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[11px] text-[11.5px] font-extrabold",
        // No tint given: a neutral wash, never a colour picked at random. The
        // coloured tiles stay meaningful because most of them are not coloured.
        tint ? "text-white" : "bg-wash-3 text-fg",
        className,
      )}
      style={tint ? { background: tint } : undefined}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------ the switcher -- */

function ScopeSwitcher({
  scope,
}: {
  scope: NonNullable<ConsoleBarProps["scope"]>;
}) {
  const { current, options, onChange } = scope;
  const pinned = scope.pinned ?? options.slice(0, 3).map((o) => o.id);
  const pickerLabel = scope.pickerLabel ?? "Tenants";

  const barRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [ink, setInk] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  /**
   * Whether the current scope is actually VISIBLE as an inline tab. Not the
   * same as "is it pinned": the inline tabs drop out one by one as the bar
   * narrows, and a pinned-but-hidden scope would otherwise leave the bar
   * showing no current scope at all — the picker saying "Tenants" and no ink
   * anywhere. Measured rather than inferred from the breakpoint, because the
   * breakpoint is a CSS fact and this is the only place that can read it.
   */
  const [inlineVisible, setInlineVisible] = useState(true);

  const currentScope = options.find((o) => o.id === current);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const measure = () => {
      const tab = bar.querySelector<HTMLElement>("[data-scope-tab='true']");
      const visible = !!tab && tab.offsetWidth > 0;
      setInlineVisible(visible);

      // With no inline tab the ink belongs under the picker, which is standing
      // in for the current scope.
      const target =
        visible && tab
          ? tab
          : bar.querySelector<HTMLElement>("[data-scope-picker='true']");
      if (!target || !target.offsetWidth) {
        setInk((previous) => ({ ...previous, width: 0 }));
        return;
      }
      setInk({ left: target.offsetLeft, width: target.offsetWidth });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    // Web fonts land after first paint and change every tab's width with them.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [current, options, pinned.join(",")]);

  const inlineScopes = pinned
    .map((id) => options.find((o) => o.id === id))
    .filter((o): o is ConsoleScope => !!o);

  return (
    <nav
      ref={barRef}
      aria-label="Scope"
      className="relative flex h-full items-center gap-5 sm:gap-7"
    >
      {inlineScopes.map((option, index) => {
        const active = option.id === current;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            {...(active ? { "data-scope-tab": "true" } : {})}
            aria-current={active ? "true" : undefined}
            className={cn(
              "duration-instant ease-brand shrink-0 cursor-pointer text-[15px] transition-colors",
              active ? "text-fg font-bold" : "text-fg-2 hover:text-fg font-semibold",
              // The tabs shed one at a time as the bar narrows; the picker
              // below always survives and absorbs whatever is dropped.
              index === 1 && "hidden sm:block",
              index >= 2 && "hidden md:block",
            )}
          >
            {option.name}
          </button>
        );
      })}

      <Popover
        open={open}
        onOpenChange={setOpen}
        align="start"
        label="Select scope"
        className="w-[330px] max-w-[calc(100vw-2rem)] rounded-[20px] p-2"
        content={
          <>
            <p className="text-fg-muted px-3 pt-2 pb-1.5 text-[10.5px] font-bold tracking-[0.05em] uppercase">
              Select scope
            </p>
            <div className="space-y-1">
              {options.map((option) => {
                const active = option.id === current;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "duration-instant ease-brand flex w-full cursor-pointer items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors",
                      active ? "bg-wash-2" : "hover:bg-wash-2",
                    )}
                  >
                    <Tile tint={option.tint}>
                      {option.short ?? option.name.slice(0, 2).toUpperCase()}
                    </Tile>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-extrabold">
                        {option.name}
                      </span>
                      {option.detail && (
                        <span className="text-fg-2 block truncate text-[11.5px] font-semibold">
                          {option.detail}
                        </span>
                      )}
                    </span>
                    {option.metric && (
                      <span className="shrink-0 text-right">
                        <span className="block text-[13px] font-extrabold tabular-nums">
                          {option.metric.value}
                        </span>
                        {option.metric.label && (
                          <span className="text-fg-2 block text-[10.5px] font-bold">
                            {option.metric.label}
                          </span>
                        )}
                      </span>
                    )}
                    {/* A fixed-width slot either way, so the rows do not shift
                        sideways as the tick moves between them. */}
                    <span className="grid w-[18px] shrink-0 place-items-center">
                      {active && <Check className="text-accent-ink size-[18px]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        }
      >
        <button
          type="button"
          data-scope-picker="true"
          className={cn(
            "duration-instant ease-brand bg-wash-2 hover:text-fg flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 text-[13.5px] font-bold transition-colors",
            inlineVisible ? "text-fg-2" : "text-fg",
          )}
        >
          <Users className="size-4" />
          {/* When the current scope has no inline tab the picker becomes the
              place the current scope is named. */}
          <span>
            {inlineVisible ? pickerLabel : (currentScope?.name ?? pickerLabel)}
          </span>
          <span className="bg-wash-3 text-fg-2 grid h-[19px] min-w-[19px] place-items-center rounded-full px-1 text-[10.5px] font-extrabold tabular-nums">
            {options.length}
          </span>
          <ChevronDown className="size-4" />
        </button>
      </Popover>

      {/* The one orange thing in the bar. Scope is location; location is what
          orange means. Width 0 until measured, so it slides in rather than
          appearing at the wrong place first. */}
      <span
        aria-hidden="true"
        // The glow is the console's, and it is why the ink reads as lit rather
        // than drawn. It is a class, not an inline style: only left and width
        // are dynamic. It stays an arbitrary value because the elevation scale
        // is four neutral drop shadows for overlays and none of them is a
        // coloured halo — this is not a missing step on that scale.
        className="bg-accent shadow-[0_0_16px_var(--accent)] duration-standard ease-brand pointer-events-none absolute bottom-0 h-[3px] rounded-full transition-all"
        style={{ left: ink.left, width: ink.width }}
      />
    </nav>
  );
}

/* --------------------------------------------------------------- the bar -- */

export function ConsoleBar({
  brand,
  brandHref,
  scope,
  onSearch,
  searchPlaceholder = "Ask the agent or search…",
  searchHint = "⌘K",
  searchIcon,
  notifications,
  user,
  userMenu,
  actions,
  linkComponent,
  className,
}: ConsoleBarProps) {
  const Link = (linkComponent ?? "a") as ElementType;
  const BrandTag = (brandHref ? Link : "div") as ElementType;

  const unread =
    notifications?.items.filter((item) => item.unread).length ?? 0;

  return (
    <header
      className={cn(
        "border-rule bg-bg relative flex h-17 shrink-0 items-stretch gap-4 border-b px-4 sm:px-6 xl:h-[78px] xl:pr-7",
        className,
      )}
    >
      {brand && (
        <BrandTag
          {...(brandHref ? { href: brandHref } : {})}
          aria-label="Home"
          className="bg-wash-2 grid size-10 shrink-0 self-center place-items-center rounded-[13px] xl:hidden"
        >
          {brand}
        </BrandTag>
      )}

      {scope && <ScopeSwitcher scope={scope} />}

      <div className="ml-auto flex items-center gap-2.5">
        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="bg-surface text-fg duration-instant ease-brand hidden h-11 w-[268px] cursor-pointer items-center gap-2.5 rounded-[14px] px-4 text-left transition-shadow lg:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {searchIcon && (
              <span className="text-accent shrink-0 [&_svg]:size-[18px]">
                {searchIcon}
              </span>
            )}
            <span className="text-fg-muted flex-1 truncate text-[13.5px] font-semibold">
              {searchPlaceholder}
            </span>
            {searchHint && (
              <kbd className="bg-wash-2 text-fg-2 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold">
                {searchHint}
              </kbd>
            )}
          </button>
        )}

        {/* Inline only where there is room. The narrow equivalents are
            `compactOnly` rows inside the profile panel. */}
        {actions && (
          <div className="hidden items-center gap-2.5 xl:flex">{actions}</div>
        )}

        {notifications && (
          <Popover
            align="end"
            label="Notifications"
            className="w-[370px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[20px] p-0"
            content={
              <>
                <div className="border-rule flex items-center gap-3 border-b px-4 py-3.5">
                  <p className="text-[14.5px] font-extrabold">Notifications</p>
                  <span className="bg-wash-3 text-fg-2 grid h-[21px] min-w-[21px] place-items-center rounded-full px-1.5 text-[11px] font-extrabold tabular-nums">
                    {unread}
                  </span>
                  {notifications.onMarkAllRead && unread > 0 && (
                    <button
                      type="button"
                      onClick={notifications.onMarkAllRead}
                      className="text-fg-2 hover:text-fg hover:bg-wash-2 duration-instant ease-brand ml-auto cursor-pointer rounded-sm px-2 py-1 text-[12.5px] font-bold transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[440px] space-y-1 overflow-y-auto p-2">
                  {notifications.items.length === 0 ? (
                    <p className="text-fg-muted px-3 py-8 text-center text-[13px] font-semibold">
                      {notifications.emptyLabel ?? "Nothing new."}
                    </p>
                  ) : (
                    notifications.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onSelect}
                        className={cn(
                          "duration-instant ease-brand flex w-full cursor-pointer items-start gap-3 rounded-[14px] p-2.5 text-left transition-colors",
                          item.unread ? "bg-wash-2" : "hover:bg-wash-2",
                        )}
                      >
                        {item.source && (
                          <Tile tint={item.source.tint}>
                            {item.source.icon ?? item.source.name.slice(0, 2)}
                          </Tile>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-2">
                            <span className="text-[13px] leading-snug font-extrabold">
                              {item.title}
                            </span>
                            {item.time && (
                              <span className="text-fg-muted ml-auto shrink-0 font-mono text-[10.5px] font-semibold">
                                {item.time}
                              </span>
                            )}
                          </span>
                          {item.body && (
                            <span className="text-fg-2 mt-1 block text-[11.5px] leading-relaxed font-medium">
                              {item.body}
                            </span>
                          )}
                          {item.source && (
                            <span
                              className="mt-1.5 block text-[10.5px] font-bold"
                              style={
                                item.source.tint
                                  ? { color: item.source.tint }
                                  : undefined
                              }
                            >
                              {item.source.name}
                            </span>
                          )}
                        </span>
                        {item.unread && (
                          <i
                            aria-hidden="true"
                            className="bg-danger mt-1.5 size-[9px] shrink-0 rounded-full"
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            }
          >
            <button
              type="button"
              aria-label={
                unread > 0
                  ? `Notifications, ${unread} unread`
                  : "Notifications"
              }
              className={cn(ICON_BUTTON, "relative")}
            >
              <Bell />
              {unread > 0 && (
                // Danger, not orange: orange is location and primary action.
                // ring-bg punches it out of the bar it overhangs.
                <span className="bg-danger-strong ring-bg absolute -top-1 -right-1 grid h-[19px] min-w-[19px] place-items-center rounded-full px-1 text-[10.5px] font-extrabold tabular-nums text-white ring-2">
                  {unread}
                </span>
              )}
            </button>
          </Popover>
        )}

        {user && (
          <Popover
            align="end"
            label="Your profile"
            className="w-[262px] rounded-[20px] p-2"
            content={
              <>
                <div className="flex items-center gap-3 p-2 pb-3">
                  <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full [&_img]:size-full [&_img]:object-cover">
                    {user.avatar ?? (
                      <span className="bg-wash-3 text-fg grid size-full place-items-center text-[13px] font-extrabold">
                        {user.name.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-extrabold">
                      {user.name}
                    </span>
                    {user.role && (
                      <span className="text-fg-2 block truncate text-[11.5px] font-semibold">
                        {user.role}
                      </span>
                    )}
                  </span>
                </div>

                {userMenu && userMenu.length > 0 && (
                  <div className="border-rule space-y-0.5 border-t pt-1.5">
                    {userMenu.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={item.onSelect}
                        className={cn(
                          PANEL_ROW,
                          item.danger && "text-danger-ink",
                          // Folded away where the inline icon button exists.
                          item.compactOnly && "xl:hidden",
                        )}
                      >
                        {item.icon && (
                          <span className="text-fg-2 shrink-0 [&_svg]:size-[18px]">
                            {item.icon}
                          </span>
                        )}
                        {item.label}
                        {item.value && (
                          <span className="text-fg-2 ml-auto text-[12px] font-bold">
                            {item.value}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            }
          >
            <button
              type="button"
              aria-label="Your profile"
              className="duration-instant ease-brand hover:ring-accent block size-11 shrink-0 cursor-pointer overflow-hidden rounded-[14px] ring-2 ring-transparent transition-all [&_img]:size-full [&_img]:object-cover"
            >
              {user.avatar ?? (
                <span className="bg-wash-3 text-fg grid size-full place-items-center text-[15px] font-extrabold">
                  {user.name.slice(0, 1)}
                </span>
              )}
            </button>
          </Popover>
        )}
      </div>
    </header>
  );
}
