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

### The same class of bug, in the theme toolbar

Storybook's light/dark control put `.light` on a wrapper `<div>`. Overlays
portal to `document.body` — see `usePortalTarget` — so every portalled panel
rendered OUTSIDE that scope and kept the dark tokens while the page behind it
was light. `Menu`, `Popover`, `Modal`, `Drawer`, `Tooltip` and `DatePicker` were
all affected, and nothing errored: the panel simply looked wrong in a theme
nobody was checking it in.

Caught the same way as the fonts — by measuring rather than by looking.
`forms-date-picker--single-date` had a panel background of `rgb(21, 22, 28)` on
a light page; it is `rgb(255, 255, 255)` now. The decorator sets the class on
`document.documentElement` instead, which is where an app puts it anyway. The
theme sheet already anticipated this: `.light` is scoped to the element rather
than to `:root`, with a comment saying so, precisely so it can live on `<html>`.

Storybook exists to catch a token that only works in one theme. This was the
harness quietly disabling the one check it is for.

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

`pnpm dev` runs tsup with `--no-clean` for a reason. The build is two tools —
tsup emits the JS, `tsc` emits the `.d.ts` — and only tsup runs in watch mode. With
tsup's default `clean: true` every watch rebuild wiped the declaration files `tsc`
had written, so `pnpm typecheck` in `apps/storybook` started failing with
*"Could not find a declaration file for module '@vcyberizadmin/ui'"* the moment the
dev server was running. Nothing was wrong with the types; the files were simply
gone. `pnpm build` put them back, which made it look intermittent.

Use `pnpm dev` from the **root**, not `pnpm dev` inside `apps/storybook`.
Storybook resolves `@vcyberizadmin/ui` through its `exports` map to `dist/`, so editing
a component with only Storybook running shows nothing — you are looking at the
last build. The root script runs tsup in watch mode alongside it. (Theme edits
do appear immediately: `theme.css` is consumed directly, with no build step.)

### Five guards worth knowing about

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

**`verify-dates`** — asserts CX-DTE's arithmetic and the grid it renders. Every
failure mode in a date component is an off-by-one that renders perfectly: a leap
day dropped, a "Last 7 Days" that quietly spans eight, a month grid whose leading
blanks are one column short so every date sits under the wrong weekday, a
`31 January` minus one month that rolls forward to 3 March. Nothing throws,
nothing fails a typecheck, and nothing looks wrong in a screenshot unless you
happen to count.

The dates in it are fixed and deliberately awkward — February 2023 starts on a
Wednesday, 2024 is a leap year, and the January/December cases straddle a year
boundary. A date test written against `today` passes for eleven months of the
year. The render half asserts structure rather than classes: one tab stop per
grid, both endpoints marked selected, out-of-bounds days announced but still
focusable, and Apply refusing exactly one state.

**`verify-tokens`** — asserts every fallback-less `var(--x)` in `theme.css`
resolves to a token the file defines. A dangling custom property fails silently
and totally: the declaration is invalid at computed-value time, so the property
does not fall back to the previous rule, it **inherits from the parent**. There
is no error, no warning and no visual clue.

That is not hypothetical. Rewriting the ramp layer deleted `--display`, `--ui`
and `--mono` while the file kept referencing them, and every heading and every
line of body text silently lost its typeface. Only a bare `var(--x)` is an
error — `var(--x, fallback)` degrades safely and is a deliberate pattern.

## Tests

`pnpm test` runs, per package: the build, `tsc`, the guards above, and a Vitest
suite. Roughly 1,180 assertions, about two seconds.

The guards and the tests catch different things and neither replaces the other.
A guard reads an artefact as text — the compiled CSS, the built `dist/` — and
proves a property of it. A test renders a component and asserts what it does.
The font regression that prompted this suite is the clearest example: a guard
now proves no token reference dangles, and a test proves `--display` resolves to
a real stack and that Tailwind's `font-display` utility is still wired to it.

| Suite | What it holds the library to |
| --- | --- |
| `theme/tests/typography` | The three font roles resolve, reach the host `--font-*`, and keep a concrete fallback. The regression test for the bug above. |
| `theme/tests/tokens` | Layer discipline: ramps are literals, light overrides every colour role dark defines and nothing more, `@theme inline` is still `inline`, no semantic utility is wired straight to the ramp. |
| `theme/tests/contrast` | WCAG 2.2 AA on every text role against every ground it sits on, in both themes, with translucent washes composited first — plus 1.4.11 on the focus indicator. |
| `ui/tests/smoke` | Every exported component mounts, renders something, unmounts, and logs no React warning. |
| `ui/tests/exports` | The public surface. Every entrypoint export is defined, every component has a fixture, every fixture names a real export, and the export list is snapshotted. |
| `ui/tests/ssr` | Every component renders through `react-dom/server` **with no DOM present at all**. |
| `ui/tests/a11y` | Six mechanical rules swept across all 70 fixtures: accessible names, no positive `tabindex`, decorative graphics hidden, widget roles focusable, no skipped heading levels. |
| `ui/tests/dates`, `tabs`, `form`, `overlays`, `table`, `navigation`, `charts` | Behaviour: keyboard contracts, ARIA state, controlled-vs-uncontrolled, date arithmetic, sort order, chart maths. |

### Three conventions worth keeping

**Fixtures are exhaustive by assertion, not by discipline.** `tests/fixtures.tsx`
holds one minimal instance of every exported component, and `exports.test.ts`
fails if an export has no fixture. Adding a component without covering it is not
possible; the smoke, SSR and a11y sweeps all iterate that one registry, so a new
component picks up ~10 assertions for free.

**`tests/ssr.test.tsx` runs in plain node**, not jsdom — `// @vitest-environment
node` at the top. That is the whole point: in jsdom, a component that reaches for
`window` during render simply works. The shared `setup.ts` is guarded for both
environments for the same reason.

**A test that found a bug keeps guarding it.** Writing the suite surfaced four
defects, all since fixed. Each one's test stayed, rewritten to assert the
correct behaviour with the original failure described above it — so the comment
explains why an otherwise unremarkable assertion is load-bearing:

| Was | Now guarded by |
| --- | --- |
| Overlays mounted already open never took focus — the portal target resolves in an effect, so `panelRef.current` was null when `useOverlay` fired, and the effect keyed on `open` never re-ran. `ConfirmDialog`'s "Cancel holds focus" was inert with it. | `overlays.test.tsx` sweeps all three dialogs; `navigation.test.tsx` covers the palette |
| The focus ring was painted with `--accent`, leaving `--focus` dead and light mode at 2.51:1 | `contrast.test.ts` asserts 3:1 in both modes **and** that the base rule still reads `--focus` |
| A single-day range printed its date twice, which is what the `today` preset produces | `dates.test.ts` |

There is no register of accepted failures, and adding one should be a
deliberate act with a named owner in review — not a way to make a red test
green.

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
| `@vcyberizadmin/ui` | `Button` + `IconButton` (CX-BTN) · `Card` (CX-CRD) · `StatusPill` + `SeverityBadge` (CX-STA) · `Tag` + `ChipStack` + `Code` (CX-TAG) · `EmptyState` + `ErrorState` + `Skeleton` (CX-STE) · `Note` + `InsightPanel` (CX-INS) · `DataTable` + `Toolbar` + `FilterChip` + `SegmentedFilter` + `Pagination` + cells (CX-TBL/FLT/PAG) · `Field` + `Input` + `Textarea` + `Select` + `Checkbox` + `Switch` (CX-FLD) · `StatTile` + `TrendTile` + `StatusTile` + `TileGrid` (CX-TIL) · `Tabs` + `Segmented` (CX-TAB) · `DefinitionCard` + `DescriptionList` (CX-DEF) · `Calendar` + `DatePicker` + `DateRangePicker` + `DateRangeFilter` (CX-DTE) · `cn` |
| `@vcyberizadmin/ui/layout` | `AppShell` (CX-SHL) · `NavRail` (CX-NAV) · `DockRail` (CX-DCK) · `TopBar` (CX-TOP) · `ConsoleBar` (CX-CBR) · `PageHeader` + `Breadcrumb` (CX-HDR) · `CommandPalette` (CX-CMD) · `SettingsShell` (CX-SET) · `Logo` · `ThemeToggle` |
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

Additions beyond the 59: the CX-DTE date set (below), `FieldBoundary`, `TileGrid` (the auto-fit
grid rule, also used for definition cards at 320px), `FieldGrid`, `useTabsPanel`,
and the overlay hooks `useAnchoredPosition` / `useDismissOnOutside` /
`usePortalTarget`.

### CX-DTE — the component the standard names but never specifies

The standard lists **"bound by date with a start–end range"** as an operation
every filter strip needs (CX-FLT), and ships no control that performs it. CX-FLD
has the same gap on the form side: Input, Textarea, Select, Checkbox, Switch, and
no date. Neither omission is a base-app disagreement to reconcile — none of the
three consoles had a date control at all — so this set is written from scratch
and given its own ID rather than smuggled into CX-FLT.

`Calendar` is one month as a real ARIA grid. `DateRangePicker` is the panel:
preset rail, a read-out of what is about to be applied, and one grid per end of
the range. `DateRangeFilter` drops that panel into the toolbar behind a trigger
that states the applied range. `DatePicker` is the single-date form control.

**The value type is a `YYYY-MM-DD` string, not a `Date`.** A `Date` is an instant;
a picked calendar day is not. `new Date("2023-02-10")` parses as UTC midnight,
which is 9 February in every negative offset, and `toISOString()` on a
local-midnight `Date` shifts the other way — both bugs invisible in CI, which
runs in UTC, and visible only to users west of Greenwich. Strings also fall out
right for the two things CX-FLT actually asks: they are URL-safe without
encoding, so a filtered view stays linkable, and they compare with `<` and `===`,
so range maths needs no library. `Date` appears only inside `dates.ts`, always
pinned to noon — midnight does not exist on some DST-shift days, and a missing
hour silently moves a date by one.

**This is the one filter with an Apply button, and the deviation is deliberate.**
CX-FLT is explicit that filters apply immediately. Every other filter in the
strip reaches a valid state in one interaction; a range is assembled from up to
six — a month, a year and a day at each end — and the states in between are not
merely stale, they are wrong. A range with one end filled in reads both as
"everything since 10 February" and "everything up to 10 February", so applying on
each click means firing a series of expensive queries, most for a window nobody
asked for, and showing the last as though it were the answer. The whole panel is
therefore one transaction: presets, hand-picked days and Clear filters write to a
draft, Apply commits, Cancel discards. Presets do not shortcut past Apply either
— a rail where one row applies instantly and the grid beside it does not is a
worse inconsistency than the button. Apply is disabled in exactly one state, the
half-built range; clearing both ends and applying is how the filter is removed.

**With nothing applied, the panel opens on today** — today selected at both ends,
`Today` lit in the rail, Apply live. It is usable on the first click instead of
the third. `defaultToToday={false}` opens blank.

What that seeds is the **draft**, not the filter, and the distinction is what
makes it safe as a default: the trigger still reads its idle label and the table
still shows every row until Apply is pressed, so CX-FLT's rule about applied
filter state staying visible is untouched. Two states the seed deliberately
leaves alone — a half-built range, because overwriting a start the operator has
already chosen is worse than an empty end, and a cleared draft, because a Clear
that instantly refilled itself would look broken.

An **applied** default is a different thing and stays the caller's decision, since
only the app knows whether a pre-narrowed table is honest on first paint:

```tsx
const [range, setRange] = useState(todayRange);   // filtering before you touch it
const [due, setDue] = useState(todayISO);         // a form field that starts on today
```

**Ends carry the selection, the band carries the context.** The two selected days
take the orange fill and the days between take a neutral wash. The brand caps
orange at "well under a tenth of any screen" and a 30-day band is roughly a third
of the grid — and an orange band would compete with the two cells holding the
actual selection. Same division CX-NAV makes: orange bar on the current item,
neutral wash on hover. Today is marked with a hairline, never a fill, because it
is a location rather than a selection.

**Unavailable days carry `aria-disabled`, not `disabled`.** The grid is one tab
stop with a roving tabindex, per the ARIA grid pattern. A truly disabled button
is not focusable, so a min-bounded calendar opening on a month whose 1st is out
of range would lose its tab stop and become unreachable by keyboard. The click is
refused in the handler instead.

Two small changes to existing components fell out of this, both backward
compatible:

- **`Popover` gained optional `open` / `onOpenChange`.** A panel whose content
  carries its own Cancel and Apply has to be able to dismiss itself. The
  uncontrolled default is unchanged.
- **`FieldBoundary` was added to CX-FLD.** A composite control is one Field
  control on the outside and a panel of its own controls on the inside, and
  context reaches those inner controls too — *including through a portal*, since
  a portal moves the DOM node and not the React tree. Without the boundary the
  calendar's month and year selects each picked up the field's `id` (three
  elements, one `id`, `<label for>` pointing at whichever the browser found
  first) along with its `aria-describedby` and `aria-invalid`, so a bad date was
  reported by the month dropdown. `verify-dates` asserts all three stay clear,
  and was checked against the unfixed component to make sure it can actually see
  the leak.

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

### DockRail, and why it is not a NavRail variant

CX-DCK is the SOC console's rail, ported. It sits **beside** CX-NAV rather than
replacing it, because the two answer different questions: `NavRail` for a
console with groups and sub-items, `DockRail` for one whose whole surface fits
in four or five destinations.

Four differences make it a component rather than a prop:

- **It floats.** The panel is absolutely positioned inside a fixed 100px gutter
  and expands to 232px *over* the content, so the gutter never changes.
  `NavRail`'s collapse resizes the grid — correct at 300px, wrong here, because
  a rail that reflows a table whenever the pointer passes it is unusable.
- **Expansion is hover**, so there is no persisted state to own: no storage key,
  no controlled/uncontrolled pair. Bound to `focus-within` too, so tabbing in
  reveals the labels a mouse user gets for free. Labels collapse to zero width
  rather than unmounting, which is what keeps the accessible name intact at
  every width.
- **Below `xl` it is a bottom dock**, not a drawer — always visible, thumb-
  reachable, primary action lifted out of its centre as a FAB.
- **Nesting is unrepresentable.** `DockItem` has no `children`, the same
  type-level cap `NavChild` uses one level further down.

It keeps CX-NAV's two portability choices unchanged — `activeHref` as a prop,
`linkComponent` injectable — for the same reasons.

**One deliberate departure from the source.** The deployed console paints the
entire rail Sunset Orange in light mode. That is dropped: orange marks the
current location and nothing else, and an orange rail leaves the active item
distinguishing itself from a field of its own colour. The surface is `--surface`
in both themes and the only orange is the ink tab on the active item.

`AppShell` gains `railMode="dock"` to go with it, which renders the rail
unwrapped, drops the drawer and its trigger, and reserves scroll room at the
foot of the content column so the dock never covers the last row.

### ConsoleBar, and the two ways a scope goes missing

CX-CBR is the SOC console's header. It stands beside CX-TOP on the same terms
CX-DCK stands beside CX-NAV: `TopBar` is a 52px utility strip of small controls;
`ConsoleBar` is a 68/78px identity bar built around the question an operator
asks all shift — *whose data am I looking at?*

Scope leads, far left, as tabs with a moving ink. Tabs rather than a dropdown
because it is switched constantly; far left because it qualifies everything to
its right. The ink is the only orange in the bar, which is the location rule
holding: scope IS location.

The interesting part is keeping the current scope visible, because it can go
missing two ways and the source only handles one:

1. **It is not pinned** — the picker button takes over its name. The source does
   this.
2. **It is pinned but the breakpoint dropped it.** The inline tabs shed one at a
   time as the bar narrows, so a pinned scope can be hidden by CSS, leaving the
   picker saying "Tenants" and no ink anywhere. Handled here by measuring
   `offsetWidth` — the breakpoint is a CSS fact, and reading the DOM back is the
   only way to know it — so the picker takes over in this case too.

Below `xl` the theme and settings controls fold INTO the profile panel as
labelled rows (`compactOnly`) rather than being dropped. One definition, an icon
button on a wide screen and a row on a narrow one, never both at once.

All three panels are CX-TIP's `Popover`, so the overlay behaviour is shared
rather than written three more times. The bar does no date arithmetic — a
notification's `time` arrives pre-formatted, so the bar needs no clock and
cannot disagree with the server.

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
