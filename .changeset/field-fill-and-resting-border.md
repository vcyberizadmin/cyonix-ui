---
"@cyonix/theme": minor
"@cyonix/ui": minor
---

Inputs, selects and textareas get a fill and a resting border of their own, so a field is identifiable before it is focused.

They were invisible. `base` in `form/controls.tsx` filled every control with
`--surface`, which is also what `Card` is filled with, and the resting ring was
`inset 0 0 0 2px transparent` with colour arriving only on focus. A field inside
a card therefore measured **1.00:1** against it in both themes: not low contrast,
the same colour, with no border to fall back on. On the page shell it was 1.27:1
dark and 1.11:1 light. The other house pattern, `bg-wash-1 border-rule` in
`ConfirmDialog`, `DatePicker` and `DateRangePicker`, failed the same way, because
`--rule` is the subtle divider and measures 1.05:1 dark and 1.11:1 light against
the surface it sits on. Both patterns now resolve to one.

`@cyonix/theme` adds `--field`, `--field-border` and `--field-border-hover`, with
`bg-field`, `border-field-border` and `border-field-border-hover` utilities.

The border is the guarantee, not the fill. With four surface steps no single
fill stays visibly distinct from all of them, so `--field-border` is picked
against the WORST ground rather than the common one: Neutral 500 in dark
(5.89 / 4.64 / 3.87 / 3.28 against `--bg`, `--surface`, `--surface-2`,
`--surface-3`) and Neutral 550 in light (3.94 / 3.55 / 3.27 / 3.01). Those are
the lightest and darkest steps that clear the 3:1 of WCAG 2.2 1.4.11 on all
four, so one token serves every placement.

The fill is a recess in dark and a lift in light, the inversion the rest of the
theme already makes. Dark is a literal `#1a1d20` because no ramp step fits:
Neutral 850 is the obvious-looking pick and measures 1.003:1 against `--surface`,
which is the collision being fixed. Light is white, which does equal `--bg`, so a
field on the page shell is white on white and carried entirely by its 3.94:1
border. That is the standard treatment and it is why the border, not the fill,
had to be the thing that clears.

Field focus rings now read `--focus` rather than `--accent`. The two are
near-identical oranges, but `--accent` is picked for brand fills and measures
2.69:1 on `--surface` in light, under the 3:1 a focus indicator needs. `--focus`
is Orange 450 for exactly this reason, and `Checkbox` and `Switch` already used
it.

Fields gain a hover border, scoped `not-focus:not-aria-invalid`. The scoping is
not tidiness: `enabled:hover` carries more specificity than either `focus` or
`aria-invalid` and Tailwind emits it later, so unscoped it wins both. Checked in
a browser, hovering a focused field dropped the orange ring, and hovering an
invalid one replaced the red ring with the plain grey border — an error state
erased by moving the pointer. Narrowing hover to the plain resting state makes
the four states mutually exclusive, so precedence no longer depends on
specificity or emission order.

Contrast tests cover the new tokens: `--field-border` against all four grounds
in both themes, and `--field` against `--surface` as a measured ratio rather
than value inequality, so a one-point difference cannot pass for a real step.
