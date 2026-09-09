---
"@cyonix/theme": major
"@cyonix/ui": major
---

Align the theme with the SOC reference design

The library and the reference console it is meant to implement had diverged on
everything except the brand orange. This brings the token layer onto the
reference; components are unchanged in this release because they address roles
rather than values, which is why 1057 component tests passed untouched.

**Typography is one family, not two.** `--display` and `--ui` both resolve to
Plus Jakarta Sans; the reference separates headings from body by weight and size
rather than by typeface. Consuming apps now supply two host variables instead of
three: `--font-plus-jakarta-sans` and `--font-jetbrains-mono`. An app still
passing `--font-space-grotesk` and `--font-inter` will render in the system font
with no error, which is the silent failure this contract has always had.

A weight scale comes with it (`--weight-body` 500 through `--weight-heavy` 800).
The reference is a markedly heavier design than the old 400-600 range.

**Light mode inverts.** The ground was Cloud with white cards; it is now white
with grey cards, matching the reference's `#FFFFFF` shell over `#F3F3F5`
surfaces. A card now reads as a recess rather than a slab. Both values had to
move together, since flipping one would leave cards invisible.

**The neutral ramp is hue-neutral.** It carried a blue cast (Cloud `#e5ecf6`,
Silver Dust `#c9d0e2`) where the reference is pure grey. This was the single
most visible divergence in light mode. The ramp grew from 13 steps to 22 so
surface roles land on the reference's values exactly rather than near them.

**Severity is re-hued, and the change is semantic.** The old scale ran
red → red → amber → blue → neutral, so `high` was a second red and `low` was a
blue that outranked amber by eye. It now runs the reference's
red → amber → blue → grey → green:

| level | was | now |
| ----- | --- | --- |
| `--sev-crit` | red-400 | `#f0384a` |
| `--sev-high` | red-300 | `#f5a524` |
| `--sev-med` | amber-350 | `#1b6ef3` |
| `--sev-low` | blue-350 | `#8a9198` |
| `--sev-info` | neutral-400 | `#7ed321` |

Anything reading a severity colour will change hue. Token names are unchanged.

**The rail is now its own surface.** Six new tokens (`--rail`, `--rail-fg`,
`--rail-fg-dim`, `--rail-active`, `--rail-ink`, `--logo`) with matching
utilities. In dark the rail is a raised grey slab with brand ink; in light it
inverts to a solid brand column with white icons, which is the reference's most
recognisable feature. `NavRail` previously read `bg-bg` and had no way to
express this.

Also adds `--surface-3`, `--thread`, `--track`, the reference's `--shadow-2` /
`--shadow-3` elevations, `--radius-2xl`, and rounder radius aliases (a card goes
12px to 22px, a button 8px to 14px). The `--r-*` step scale is untouched, so
code addressing a step directly keeps its value.

**Two accessibility regressions are carried deliberately and recorded.**
`--fg-2` and `--fg-muted` in light are the reference's own `#7a818a` and
`#a6acb4`, which measure 3.94:1 and 2.29:1 on white against the 4.5:1 WCAG 2.2
1.4.3 asks of body text. They are listed in `ACCEPTED_BELOW_AA` in
`contrast.test.ts` with their measured ratios, so the debt is visible, a further
regression still fails the build, and re-enabling the floor is a deletion. Three
other pairs that the reference has no opinion on were fixed rather than excused:
dark `--accent-ink` and `--fg-link` both fell below AA once the surface
lightened, and light `--sev-low-ink` was 0.05 short.
