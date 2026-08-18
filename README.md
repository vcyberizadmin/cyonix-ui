# cyonix-ui

One component set for **VAPT**, **Tenant** and **SOC**.

Two packages are published from this repo:

| Package         | What it is                                                        | Build step |
| --------------- | ----------------------------------------------------------------- | ---------- |
| `@vcyberizadmin/theme` | Canonical design tokens, base layer, chamfer, motion utilities     | none       |
| `@vcyberizadmin/ui`    | React components built on those tokens                            | tsup + tsc |

## Source of authority

Token values are transcribed from the brand documents. **No app is the
reference** — all three consoles conform to this library, not the other way
round.

1. `Branding Guidelines V2.0.pdf` — corporate brand: palette, typography
2. `cyonix-vapt/brand-guidelines 2.html` — console design system of record
3. `cyonix-component-standard.html` — canonical token contract (CX-TOK) and the
   per-component standard with the CX-\* IDs and rollout order

If a value here disagrees with an app, the app is wrong. If it disagrees with
the documents above, this file is wrong.

## How the theme is structured

Three layers, in [packages/theme/theme.css](packages/theme/theme.css):

1. **Ramp** — named brand values (`--onyx`, `--orange-400`, `--sev-crit`).
   Never referenced by a component.
2. **Role** — the CX-TOK contract (`--bg`, `--surface`, `--rule`, `--accent`,
   `--r-*`, `--e-*`, `--ease`). Swapped per theme.
3. **Theme** — `@theme inline` maps roles onto Tailwind's utility namespaces.

**Layer 3 must stay `inline`.** Without it Tailwind bakes the resolved value
into each utility and the light-mode override on the role variable stops having
any effect — the theme toggle dies silently. Verified: `bg-accent` compiles to
`background-color: var(--accent)`, so overriding `--accent` under `.light`
reaches every utility.

Dark is the default master. Light is opt-in via **either** `.light` or
`[data-theme="light"]` on a wrapping element — both are supported so Tenant
(which uses `.light`) and VAPT (which uses `[data-theme]`) can migrate without
changing their toggles first.

### Ink vs mark — why each semantic hue has two tokens

The brand sets the bar itself: *"Target WCAG 2.2 AA. Operators use this product
for long shifts, at night, sometimes on bad displays — accessibility is
legibility."* Its own contrast table checks every hue against **one** ground:
Onyx Grey, dark theme only.

The library paints those hues on three more grounds that table never evaluated —
Dark Grey cards, the hue's own 10–20% tint on a card, and the entire light theme.
Measured across all 57 stories by compositing each text node's real background:
**261 text nodes below AA in light, 374 in dark.**

One value cannot serve both jobs, and the reason is structural rather than
aesthetic:

| | Answers to | Needs | Direction |
| --- | --- | --- | --- |
| **mark** — bar, dot, chart fill | WCAG 1.4.11 | 3:1, and "deeper = worse" must hold | keeps the brand value exactly |
| **ink** — an 11px label | WCAG 1.4.3 | 4.5:1 on every ground it lands on | *lighter* on near-black, *darker* on white |

So the bar carries the rank and the label carries the legibility. Use
`text-danger-ink` for type, `bg-danger` for a fill, and `TONE_INK[tone].glyph`
for an icon — a glyph takes the mark, so it matches the bar beside it exactly.
Each ink value is the smallest deviation from its brand hue that clears 4.5:1 on
page, card, tint and wash, chosen by measurement.

`text-danger` still resolves, so a consumer's existing markup keeps working — but
it is the mark, and it will not clear AA at small sizes.

Two visible trades this forced, both recorded in `theme.css` at the tokens
themselves:

- **`--accent-fg` is not white.** White on Sunset Orange is 3.44:1 on Orange 400
  and 2.98:1 on Orange 350, and no shade of the brand orange carries white text
  at 4.5:1 while remaining the brand orange. The label darkens so the fill does
  not have to. Every primary Button now reads orange-with-dark-label.
- **The danger Button takes `--danger-strong`.** Here the opposite trade is
  right: a deeper red still reads unmistakably as danger, so the fill darkens and
  the label stays white. A black-on-red destructive button would be worse.

`--accent-fg` means specifically *ink that sits on the accent fill*. It is not a
general foreground: the outline Button's label sits on `--bg`, where near-black
on the 22% orange hover wash measures 1.3:1, so that variant uses `--fg`.

### Brand rules the code enforces

- **Orange discipline.** `--accent` marks the current location and the primary
  action, nothing else. Never a status, never a KPI, never a chart series on a
  ranked axis. It should cover well under a tenth of any screen.
- **The chamfer** is the bottom-right corner, buttons only, never mirrored or
  doubled, never on cards or inputs. `.cx-chamfer` in the theme.
- **The spark gradient is logo artwork.** Not a UI fill, not a button
  background, not a chart colour. Available only as `.cx-logo-spark`.
- **Cards take no shadow at rest.** Elevation is for overlays — menu `e-2`,
  drawer `e-3`, modal `e-4`.
- **Semantic vs severity** are separate vocabularies. Semantic reports what
  happened; severity ranks how bad. Never mixed on one axis.

## Using it in an app

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "@vcyberizadmin/theme";

/* Tailwind only generates classes it can SEE, and it skips node_modules during
   auto-detection, so the library must be pointed at explicitly. Path is
   relative to this file. */
@source "../../../node_modules/@vcyberizadmin/ui/dist/**/*.js";
```

```tsx
import { Button, Card } from "@vcyberizadmin/ui";

<Card title="Scan configuration" hint="Applies to all assets in scope">
  <Button variant="primary">Save changes</Button>
</Card>;
```

Miss the `@source` line and the components render completely unstyled, with no
error. It is the most common way to get this wrong.

### The chrome must sit behind a client boundary

`AppShell`, `NavRail` and `TopBar` take handler props (`scope.onChange`,
`notifications.onOpen`, …). Functions are not serialisable across the RSC
boundary, so a **Server Component cannot construct that JSX** — the build fails
at prerender with *"Event handlers cannot be passed to Client Component props"*.

Give the chrome its own `"use client"` wrapper and render page content as
children. Content stays on the server; only the chrome is a client island:

```tsx
// app/chrome.tsx
"use client";
import { AppShell, NavRail, TopBar } from "@vcyberizadmin/ui/layout";

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
// app/page.tsx — stays a Server Component
export default function Page() {
  return (
    <AppChrome>
      <Card title="Findings">…</Card>   {/* rendered on the server */}
    </AppChrome>
  );
}
```

### No `transpilePackages` needed

The library ships built ESM, so consumers need no `transpilePackages` entry in
`next.config`. Verified against Next 16.3 with an empty config — if an app ever
needs transpiling to make this work, the packaging has regressed.

### The app must supply the fonts

Font tokens reference variables the **consuming app** defines via `next/font`:

| Token       | Font          | Expects                   |
| ----------- | ------------- | ------------------------- |
| `--display` | Space Grotesk | `--font-space-grotesk`    |
| `--ui`      | Inter         | `--font-inter`            |
| `--mono`    | JetBrains Mono| `--font-jetbrains-mono`   |

An app that does not define these does **not** fall back gracefully: a custom
property whose value contains an unresolvable `var()` becomes invalid at
computed-value time, so `font-family` falls back to whatever is inherited. There
is no error and no warning — the type is simply the wrong face.

That is exactly what Storybook was doing until it was caught by measuring the
rendered `font-family`: every story had been reviewed in the system font rather
than Space Grotesk and Inter. `.storybook/preview-head.html` now loads the three
families and `preview.css` maps the three variables, which reproduces what
`next/font` does in a consumer — so Storybook demonstrates the contract instead
of quietly violating it.

Space Grotesk tops out at 700 — never a synthetic bold above it.

## Local development

```sh
pnpm install
pnpm build      # dist/ must exist before Storybook can resolve @vcyberizadmin/ui
pnpm dev        # tsup --watch + Storybook on http://localhost:6006, together
pnpm test       # build + typecheck + verify utilities
```

### Restart the dev server after adding a NEW component file

Tailwind's `@source` glob is scanned at startup. A file that appears in `dist/`
*after* the dev server is running does not get scanned, so utilities used only by
that new file are silently absent from the served CSS — the component renders,
but those specific classes do nothing.

This is easy to misread as a component bug. It cost real time once: `Note` used
`border-info/30`, only that new file used it, and the border fell back to
`currentColor` (white). `border-info/25` looked fine because an older file
already used it. Restarting the server fixed it; nothing was wrong with the
component.

`pnpm test` is the trustworthy signal here — `verify-utilities` runs a fresh
Tailwind CLI over the current `dist/`, so it is never stale. If a class looks
dead in Storybook but `pnpm test` passes, restart the server before debugging
the component.

Use `pnpm dev` from the **root**, not `pnpm dev` inside `apps/storybook`.
Storybook resolves `@vcyberizadmin/ui` through its `exports` map to `dist/`, so editing
a component with only Storybook running shows nothing — you are looking at the
last build. The root script runs tsup in watch mode alongside it. (Theme edits
do appear immediately: `theme.css` is consumed directly, with no build step.)

### Three guards worth knowing about

**`preserve-directives`** — asserts a `"use client"` at the top of a source file
survives into `dist/`. A stripped directive makes every interactive component
throw a Server Component error in the consuming app, and nothing in the
library's own tests would notice. Components build with `bundle: false` so each
file keeps its own client boundary; bundling the barrel would drag server-safe
components like `Card` into the client graph.

**`verify-utilities`** — compiles Tailwind exactly as a consuming app does, then
asserts every utility the built components reference actually resolves. A class
that stops resolving fails silently: no build error, no warning, just missing
styles.

This one has already earned its place. Tailwind v4 promotes `--color-*`,
`--font-*`, `--text-*`, `--radius-*`, `--shadow-*` and `--ease-*` into utilities
automatically, but there is **no `--duration-*` namespace** — so
`duration-instant` was a dead class until the tokens were declared with
`@utility`. Note that `cyonix-tenants` defines the same duration tokens without
those declarations, so its `duration-*` classes are likely inert today.

**Never compute a class name.** Tailwind emits a rule only for classes it can
find as literal text in the source. A derived class —
`CATEGORICAL[i].replace("bg-", "text-")` — exists only at runtime, so no rule is
emitted and the mark renders with no colour at all. Nothing errors, and
`verify-utilities` cannot see it either, because there is no literal to check.
This was caught in the donut's arcs before release; `CATEGORICAL_INK` and
`SEQUENTIAL_INK` exist as literal arrays for exactly this reason.

**`verify-merge`** — asserts `cn()` knows this theme's custom `--text-*` and
`--shadow-*` scales. `tailwind-merge` decides what conflicts from a map of
Tailwind's *default* scales, so it has never seen `text-h2` and guesses
"colour", because `text-<anything>` is a valid colour utility. `text-h2` and
`text-danger` then land in the same conflict group and the later wins:

```
cn("font-display text-h2 font-bold", "text-danger")
  →  "font-display font-bold text-danger"     // 30px silently became 15px
```

Every surviving class resolves, so `verify-utilities` stays green; the only
symptom is the wrong rendered size. This shipped in `0.1.0` in two places — a
`StatTile` whose value carried a tone, and every `ImpactBox` row in the confirm
dialog. `lib/cn.ts` now declares the scales, so genuine conflicts still merge
(`cn("text-h2", "text-h3")` correctly yields `text-h3`). **Any new `--text-*` or
`--shadow-*` token must be added there**, or it inherits the same silent bug.

## Publishing

Changesets drives releases:

```sh
pnpm changeset
```

Merging to `main` opens a "Version Packages" PR; merging *that* publishes.

Published to **GitHub Packages** under the `@vcyberizadmin` scope. That scope is
not cosmetic: GitHub Packages requires a package's scope to match the account
that owns the repository, and this repo is owned by `vcyberizadmin`. Publishing
as `@cyonix/*` would be rejected with a 403.

Consumers need a registry mapping, since the scope is not on npmjs.com:

```ini
# .npmrc in each consuming app
@vcyberizadmin:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

If the packages ever need to carry the product name instead, the routes are a
GitHub org literally named `cyonix`, or a paid private npm org — either would
mean renaming both packages and every import.

## Status

**Complete against the standard: all 9 rollout steps, 26 of 26 components, and
59 of 59 exports** — verified by diffing the standard's package surface against
the barrels, not by counting by hand. 71 value exports in total, counting
additions.

| Export | Components |
| ------ | ---------- |
| `@vcyberizadmin/ui` | `Button` + `IconButton` (CX-BTN) · `Card` (CX-CRD) · `StatusPill` + `SeverityBadge` (CX-STA) · `Tag` + `ChipStack` + `Code` (CX-TAG) · `EmptyState` + `ErrorState` + `Skeleton` (CX-STE) · `Note` + `InsightPanel` (CX-INS) · `DataTable` + `Toolbar` + `FilterChip` + `SegmentedFilter` + `Pagination` + cells (CX-TBL/FLT/PAG) · `Field` + `Input` + `Textarea` + `Select` + `Checkbox` + `Switch` (CX-FLD) · `StatTile` + `TrendTile` + `StatusTile` + `TileGrid` (CX-TIL) · `Tabs` + `Segmented` (CX-TAB) · `DefinitionCard` + `DescriptionList` (CX-DEF) · `cn` |
| `@vcyberizadmin/ui/layout` | `AppShell` (CX-SHL) · `NavRail` (CX-NAV) · `TopBar` (CX-TOP) · `PageHeader` + `Breadcrumb` (CX-HDR) · `CommandPalette` (CX-CMD) · `SettingsShell` (CX-SET) · `Logo` · `ThemeToggle` |
| `@vcyberizadmin/ui/overlays` | `Modal` (CX-MOD) · `Drawer` (CX-DRW) · `ConfirmDialog` + `ImpactBox` (CX-CNF) · `Menu` (CX-MNU) · `Tooltip` + `Popover` (CX-TIP) · `ToastProvider` + `useToast` (CX-TST) · `useOverlay` |
| `@vcyberizadmin/ui/charts` | `Sparkline` · `Donut` · `FunnelFlow` · `RankedBars` · `ProportionBar` (CX-CHT) |
| `@vcyberizadmin/ui/lib/status` | vocabulary · `severityRank()` · `bySeverity()` · `extendVocabulary()` · ramps · `TONE_INK` |

### Two deliberate deviations from the standard

**Charts ship without recharts.** The standard describes `./charts` as the thing
that "quarantines the recharts dependency". None of the five components needs it:
a sparkline is a polyline, a proportion bar is the standard's own "no library"
case, and a donut is one circle with dash offsets. Shipping them as SVG means no
console pays ~100KB for four shapes. The subpath is kept so the standard's import
paths hold and chart code stays out of the root chunk. Reach for a real charting
library when a console needs brushing, zooming or animated transitions — not
before.

**`SegmentedFilter` delegates to `Segmented`.** The standard lists both names,
under CX-FLT and CX-TAB, and they are the same radiogroup at two visual weights.
One implementation with a `variant`, rather than two copies that drift — which is
what the standard does everywhere else it finds rival implementations.

Additions beyond the 59: `TileGrid` (the auto-fit grid rule, also used for
definition cards at 320px), `FieldGrid`, `useTabsPanel`, and the overlay hooks
`useAnchoredPosition` / `useDismissOnOutside` / `usePortalTarget`.

### Overlays share one hook

Everything in `./overlays` runs on `useOverlay`, so focus trapping, focus
restore, Escape and scroll-lock behave identically. The standard notes Tenant is
the only console with an accessible overlay today; this is that logic factored
out, plus three defects it records against the originals:

- **Portal rendering** — the originals are not portaled, so a transformed
  ancestor or a table's `overflow` clips them. All overlays here render through
  `document.body`.
- **Reference-counted scroll-lock** — the original conflicts when a second
  overlay opens. Locking now counts, so the *last* overlay to close restores the
  original `overflow` rather than the first one clobbering it.
- **One dismissal at a time** — open overlays register in a stack and only the
  topmost answers Escape, so it peels one layer instead of closing everything.

Verified in a real browser, not just by build: portal target, focus landing on
the panel, Shift+Tab wrap-around inside the trap, scroll-lock and restore,
Escape dismissal, and focus returning to the trigger.

### NavRail and the three consoles

The standard specifies CX-NAV as a merge — "Tenant's rendering, SOC's data
model, VAPT's affordances" — so the component takes SOC's richer item shape
(`liveBadge`, `tag`) and VAPT's independent expand and labelled collapse
control, rendered Tenant's way.

Two choices make it portable across three separate repos:

- **`activeHref` is a prop**, not an internal `usePathname()`. Each app passes
  its own router state; the rail stays testable with no route coupling and
  renders in Storybook with no router at all.
- **`linkComponent` is injectable**, defaulting to `a`. Apps pass `next/link`.
  Without this the library would hard-depend on a Next router being mounted.

Live counts are a **slot** (`liveBadge`), so an item that polls owns its own
polling and one busy badge never re-renders the rail. Nesting is capped at two
levels in the type system — `NavChild` has no `children`, which is the
standard's "cap it at two" made unrepresentable rather than merely documented.

The component standard defines ~25 components with a designated base app for
each, sequenced in a 9-step rollout. Step 2 is status & severity (CX-STA), which
retires five rival implementations and is the highest value for the least work.

### Open questions

- **Light-mode `solid` and `edge` buttons.** The brand specifies a Dark Grey 2
  fill outright, so these stay dark in light mode. Implemented literally and
  flagged rather than silently reinvented.
- **Field label casing.** Tenant uses uppercase with tracking; SOC uses sentence
  case. The standard recommends sentence case for field labels, keeping caps for
  table headers and rail group labels.
- **Ship source vs build artifact.** The component standard recommends shipping
  source and letting each Next app transpile it. This repo ships built ESM
  instead, which avoids requiring `transpilePackages` in three separate repos.
  Worth a deliberate confirmation.
