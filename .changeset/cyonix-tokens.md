---
"@vcyberizadmin/theme": major
"@vcyberizadmin/ui": major
---

Adopt the official Cyonix token set. The theme is now a direct transcription of
`Cyonix_Token_Variables` — Base Collection, Color Tokens for both modes, and
Global Tokens — rather than a hand-built ramp.

**Base Collection.** Seven official ramps replace the old six-step neutral and
its ad-hoc semantic hues: `--neutral-*` (0 → 950, thirteen steps),
`--orange-*`, `--red-*`, `--green-*`, `--amber-*`, `--blue-*`, `--amethyst-*`.
Every step is the design system's own number, so `Orange 350 (Primary)` in Figma
is `--orange-350` here and the two can be checked against each other by eye.

**Two semantic changes worth reading twice:**

- **Purple means AI now, not info.** Amethyst is reserved for agent output; Info
  is Blue Onyx. Anything that used `--info` for a purple tint is now blue, and
  there is a new `--ai` / `--ai-bg` / `--ai-border` / `--ai-ink` group.
- **Success is teal, not green.** Green Onyx 350 is `#2cbf8f`, where the old
  `--ok` was `#22c55e`.

**Light mode's ground is Cloud (`#e5ecf6`), not white.** White is reserved for
cards, so a card lifts off the page instead of dissolving into it.

**New roles the set defines and we did not have:** action states
(`--accent-hover` / `-pressed` / `-disabled`, plus secondary and ghost),
`--rule-default` / `-strong` / `-brand`, the icon group, `--scrim` and
`--scrim-strong`, `--surface-2`, `--fg-quaternary`, `--fg-disabled`,
`--fg-link`, `--fg-on-dark` / `--fg-on-light`, and per-status `-bg` / `-border`.

**Global Tokens** replace the old radius scale: `--r-1` … `--r-7`
(2 / 4 / 6 / 8 / 10 / 12 / 16) plus `--r-none` and `--r-full`, with `--r-sm|md|lg|xl`
kept as named aliases so component code still reads intent. `--stroke-0` … `-3`
are new.

**Two deviations, both forced by contrast, both minimal:**

| token | as specified | measured | shipped as |
| --- | --- | --- | --- |
| `Text-Brand` light | Orange 350 | **2.51:1** on Cloud | Orange 600 (8.44:1) |
| `Text-Link` light | Blue 350 | **2.41:1** on Cloud | Blue 500 (5.34:1) |

Both are the saturated mid-ramp step used as small text on a light ground; each
moves to the first darker step on the same ramp that clears 4.5:1, so the hue is
unchanged. Everything else is verbatim. `Text-Brand` dark stays Orange 400 as
specified — it measures 5.88:1 and needed no help.

All 48 ink-on-surface pairs clear AA in both themes, and the set's own
`status-*-text` on `status-*-bg` pairings measure 5.0–6.2:1 as designed.

**The real Cyonix logo.** `Logo` no longer draws a "C" monogram and a text
wordmark — it renders the official artwork, paths lifted verbatim from
`Cyonix Logo_Light Mode.svg` and `_Dark Mode_Inversed.svg`. Those two files
differ only in the wordmark fill (`#1C1E25` against `white`), so this ships as
ONE component whose letterforms take `currentColor`: colour it with a text
utility and it follows the theme. There is no light/dark pair to keep in sync
and no way to ship the wrong one.

The spark gradient (`#FFA505 → #FE1F0B`) survives as SVG gradient stops on the
four-point star and the two angled strokes inside the Y and the X — still the
only sanctioned use of it. `mini` renders the star alone: the brand ships no
separate short mark, and the star is the one self-contained element that reads
at 32px. Swap it if a real short mark is issued.

**Breaking.** `--onyx`, `--dark-grey`, `--dark-grey-2`, `--mid-grey` and
`--light-grey` are gone with their `--color-*` utilities; the Neutral ramp
replaces them. Four components reached for a ramp step directly and were
repointed: `Code`, `Button` (solid and edge), `Tooltip`, `TopBar`.
