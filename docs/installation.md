# Installing and using @cyonix/ui

Both packages are public on npmjs.com. There is no token, no `.npmrc` and no
registry mapping to configure.

```sh
pnpm add @cyonix/ui @cyonix/theme
pnpm add -D tailwindcss @tailwindcss/postcss
```

`tailwindcss` v4 is a peer dependency, not something the library bundles. The
components are built from Tailwind utility classes and generate no CSS of their
own, so without Tailwind v4 in the app they render unstyled.

React 18 or 19 is the other peer dependency, which any React app already has.

## Wiring the CSS

Four lines in the app's CSS entry point, and the fourth is the one everybody
gets wrong.

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "@cyonix/theme";

@source "../../node_modules/@cyonix/ui/dist/**/*.js";
```

`@source` exists because Tailwind only generates the classes it can *see*, and
it skips `node_modules` during auto-detection. Without that line Tailwind never
looks at the shipped components, generates none of the utilities they reference,
and every component renders with no styling at all. There is no error, no
warning and nothing in the console. It just looks broken.

### Counting the path

**The path is relative to the CSS file, not to the project root.** This is the
whole difficulty. Count the hops from the file up to the directory holding
`node_modules`:

| Your CSS file | Hops to root | Write |
| ------------- | ------------ | ----- |
| `src/app/globals.css` | 2 | `../../node_modules/@cyonix/ui/dist/**/*.js` |
| `src/styles/main.css` | 2 | `../../node_modules/@cyonix/ui/dist/**/*.js` |
| `src/globals.css` | 1 | `../node_modules/@cyonix/ui/dist/**/*.js` |
| `app/globals.css` | 1 | `../node_modules/@cyonix/ui/dist/**/*.js` |
| `styles/globals.css` | 1 | `../node_modules/@cyonix/ui/dist/**/*.js` |

Verify it renders rather than assuming it worked. Drop a `<Button>` on a page:
if it has a background colour and a chamfered corner, the path is right. If it
looks like an unstyled `<button>`, it is not.

## The app must supply the fonts

The theme's font tokens point at variables the **consuming app** defines. They
are not bundled, because a design system should not decide how an app loads
fonts.

| Token | Font | Expects the variable |
| ----- | ---- | -------------------- |
| `--display` | Plus Jakarta Sans | `--font-plus-jakarta-sans` |
| `--ui` | Plus Jakarta Sans | `--font-plus-jakarta-sans` |
| `--mono` | JetBrains Mono | `--font-jetbrains-mono` |

`--display` and `--ui` are the same family. Headings and body separate by
weight and size, not by typeface. The two roles stay distinct so a future split
costs nothing, but today an app only needs to supply two variables.

In Next.js:

```tsx
// app/layout.tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

Skip this and the failure is silent in a particular nasty way: a custom property
whose value contains an unresolvable `var()` becomes invalid at computed-value
time, so `font-family` falls back to whatever is inherited. No error, no
warning, just the wrong typeface everywhere. This exact bug went unnoticed in
this repo's own Storybook until someone measured the rendered `font-family`.

## Light and dark

The theme ships dark as the default and scopes light to a class. Put it on
`<html>`, not on a wrapper `<div>`:

```tsx
document.documentElement.classList.add("light");
```

The element matters. Overlays portal to `document.body`, so a `.light` class on
some inner wrapper leaves every portalled panel (`Menu`, `Popover`, `Modal`,
`Drawer`, `Tooltip`, `DatePicker`) outside its scope, still rendering dark
tokens over a light page. The theme sheet scopes `.light` to the element rather
than `:root` specifically so it can live on `<html>`.

`ThemeToggle` from `@cyonix/ui/layout` does this correctly if you would rather
not wire it yourself.

## Importing components

Five entry points:

```tsx
import { Button, Card, DataTable, Field, StatTile, cn } from "@cyonix/ui";
import { AppShell, NavRail, TopBar, ThemeToggle } from "@cyonix/ui/layout";
import { Modal, Drawer, Menu, ToastProvider, useToast } from "@cyonix/ui/overlays";
import { Sparkline, Donut, ProportionBar } from "@cyonix/ui/charts";
import { severityRank, bySeverity } from "@cyonix/ui/lib/status";
```

| Entry point | Holds |
| ----------- | ----- |
| `@cyonix/ui` | Buttons, cards, status, tags, tables, form fields, tiles, tabs, definitions, date pickers, `cn` |
| `@cyonix/ui/layout` | `AppShell`, `NavRail`, `DockRail`, `TopBar`, `ConsoleBar`, `PageHeader`, `Breadcrumb`, `CommandPalette`, `SettingsShell`, `Logo`, `ThemeToggle` |
| `@cyonix/ui/overlays` | `Modal`, `Drawer`, `ConfirmDialog`, `Menu`, `Tooltip`, `Popover`, `ToastProvider`, `useToast`, `useOverlay` |
| `@cyonix/ui/charts` | `Sparkline`, `Donut`, `FunnelFlow`, `RankedBars`, `ProportionBar`, all plain SVG with no charting library |
| `@cyonix/ui/lib/status` | Severity vocabulary, ranking helpers, colour ramps |

A minimal page:

```tsx
import { Button, Card } from "@cyonix/ui";

export default function Page() {
  return (
    <Card title="Scan configuration" hint="Applies to all assets in scope">
      <Button variant="primary">Save changes</Button>
    </Card>
  );
}
```

## Next.js: chrome needs a client boundary

`AppShell`, `NavRail` and `TopBar` take handler props (`scope.onChange`,
`notifications.onOpen`). Functions are not serialisable across the RSC boundary,
so a **Server Component cannot construct that JSX**. The build fails at
prerender with *"Event handlers cannot be passed to Client Component props"*.

Give the chrome its own `"use client"` wrapper and pass page content as
children. Only the chrome becomes a client island; the content stays on the
server.

```tsx
// app/chrome.tsx
"use client";
import { AppShell, NavRail, TopBar } from "@cyonix/ui/layout";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState("all");
  return (
    <AppShell
      rail={<NavRail groups={GROUPS} activeHref={usePathname()} linkComponent={Link} />}
      topBar={<TopBar scope={{ current: scope, options: TENANTS, onChange: setScope }} />}
    >
      {children}
    </AppShell>
  );
}
```

```tsx
// app/page.tsx stays a Server Component
export default function Page() {
  return (
    <AppChrome>
      <Card title="Findings">…</Card>
    </AppChrome>
  );
}
```

### No `transpilePackages`

The library ships built ESM, so `next.config` needs no `transpilePackages`
entry. This is verified against Next 16.3 with an empty config. If an app ever
needs transpiling to make this work, the packaging has regressed and that is a
bug here, not in the app.

## Troubleshooting

| Symptom | Cause |
| ------- | ----- |
| Components render completely unstyled | The `@source` path is wrong, or missing, or Tailwind v4 is not installed. Count the hops again. |
| Styling works in dev, breaks in a production build | `@source` resolved by luck through a dev-server root. Make it correct relative to the CSS file. |
| Wrong typeface everywhere, no error | The app does not define `--font-plus-jakarta-sans` and `--font-jetbrains-mono`. |
| Modals and menus stay dark on a light page | `.light` is on a wrapper element instead of `<html>`. Overlays portal to `document.body`. |
| `Event handlers cannot be passed to Client Component props` | Layout chrome constructed in a Server Component. Wrap it in `"use client"`. |
| `ERR_PNPM_PEER_DEP_ISSUES` mentioning tailwindcss | Tailwind v4 is missing or on v3. Install `tailwindcss@^4`. |
| Utilities missing for a component added in a new release | Tailwind scans `@source` at startup. Restart the dev server. |

## Upgrading

Both packages follow semver, and the changelogs record every change with the
reasoning behind it:

```sh
pnpm up @cyonix/ui @cyonix/theme
```

`@cyonix/ui` depends on `@cyonix/theme`, so upgrade them together. A `ui`
release that needs new tokens carries the matching `theme` version as a
dependency, and mismatching them by pinning one and not the other is how you get
components referencing tokens that do not exist.
