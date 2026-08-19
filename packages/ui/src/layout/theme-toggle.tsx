"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "../lib/cn.js";

/**
 * Dark / light switch.
 *
 * Writes `data-theme` on `<html>`, which is one of the two selectors
 * @vcyberizadmin/theme's light block matches. It sets the attribute EXPLICITLY in
 * both directions rather than toggling a `.light` class, so an app whose server
 * HTML says dark can be flipped to light and back without the attribute ever
 * being absent — an absent attribute means "follow the default", which is a
 * third state the user never asked for.
 *
 * FLASH OF WRONG THEME
 * --------------------
 * A React component cannot prevent it: the browser paints the server HTML before
 * any effect runs. The app must set the attribute before first paint, with a
 * blocking inline script in <head>:
 *
 *     <script dangerouslySetInnerHTML={{ __html: `
 *       (function () {
 *         var s = localStorage.getItem('cyonix.theme');
 *         var t = s || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
 *         document.documentElement.dataset.theme = t;
 *       })();
 *     ` }} />
 *
 * Use the same storage key there as here. This component reads whatever the
 * script decided, so the two cannot disagree.
 */

export type Theme = "dark" | "light";

export interface ThemeToggleProps {
  /** localStorage key. Must match the app's pre-paint script. */
  storageKey?: string;
  /** Used only when there is no stored choice and no system preference. */
  defaultTheme?: Theme;
  /** Controlled mode, for an app that owns theme state itself. */
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  className?: string;
}

function readTheme(storageKey: string, fallback: Theme): Theme {
  if (typeof document === "undefined") return fallback;
  const attr = document.documentElement.dataset["theme"];
  if (attr === "light" || attr === "dark") return attr;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private mode, or storage disabled. The toggle must still work.
  }
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return fallback;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function ThemeToggle({
  storageKey = "cyonix.theme",
  defaultTheme = "dark",
  theme: controlled,
  onThemeChange,
  className,
}: ThemeToggleProps) {
  // Starts on the default and corrects in an effect. Reading localStorage during
  // render would make the server and client markup disagree and trip hydration.
  const [internal, setInternal] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);
  const theme = controlled ?? internal;

  useEffect(() => {
    setMounted(true);
    if (controlled === undefined) setInternal(readTheme(storageKey, defaultTheme));
  }, [controlled, storageKey, defaultTheme]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset["theme"] = theme;
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }, [theme, mounted, storageKey]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    if (controlled === undefined) setInternal(next);
    onThemeChange?.(next);
  }, [theme, controlled, onThemeChange]);

  return (
    <button
      type="button"
      onClick={toggle}
      // The control is a switch between two named states, so its accessible name
      // states the ACTION and aria-pressed carries the state. "Toggle theme"
      // alone leaves a screen-reader user guessing which one they are in.
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={theme === "light"}
      // Until the stored preference is read, the icon may not match the real
      // theme; hiding it for that one frame avoids showing the wrong one.
      className={cn(
        "text-fg-2 hover:text-fg hover:bg-wash-hover duration-instant ease-brand grid size-8 cursor-pointer place-items-center rounded-sm transition-colors",
        "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
        "relative [&_svg]:size-4",
        !mounted && "invisible",
        className,
      )}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
