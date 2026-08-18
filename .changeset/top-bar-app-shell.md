---
"@cyonix/ui": minor
---

Complete the navigation frame in `@cyonix/ui/layout`.

- `TopBar` (CX-TOP) — SOC's utility bar plus the two groups VAPT adds and SOC
  lacks: a live clock with timezone, and system health as a dot **and** word.
  Eight control groups, every one individually optional. Below 1280px the
  non-essential groups collapse into a real overflow menu rather than wrapping —
  the one thing the standard says to fix on the way in. Menus reuse CX-MNU, so
  aria-expanded, Escape, click-outside and focus return come from the shared
  overlay stack.
- `AppShell` (CX-SHL) — composes rail and top bar as props rather than
  hardcoding them. Skip-to-content is the first focusable element, the content
  column takes `min-w-0`, and below 768px the rail becomes a focus-trapped
  drawer instead of holding 300px, closing the gap the standard records.
