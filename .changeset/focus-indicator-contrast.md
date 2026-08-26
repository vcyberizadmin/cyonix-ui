---
"@vcyberizadmin/theme": minor
"@vcyberizadmin/ui": patch
---

Give the focus indicator its own token, and lift it to WCAG AA in light mode

`--focus` and `--focus-critical` were defined, promoted to `--color-focus`
utilities, and read by nothing. `@layer base` painted `:focus-visible` with
`var(--accent)` instead, and the 17 components that strip that outline to draw
their own border or ring followed suit.

They are near-identical oranges, so nothing looked wrong. The cost was that the
focus ring took a colour chosen for brand fills rather than for visibility, and
in light mode that colour measures **2.51:1** against the Cloud ground — below
the 3:1 WCAG 2.2 1.4.11 requires of a focus indicator. Every input, select,
combobox and search field was affected, because those are exactly the controls
that replace the base outline with `focus:border-accent`.

- Light `--focus` moves from Orange 350 to **Orange 450** — 3.38:1 on `--bg`,
  4.02 on `--surface`, 3.74 on `--surface-2`. The lightest step that clears on
  all three. Dark mode already measured 6.44:1 and is unchanged, as is
  `--focus-critical` at 3.26:1.
- `:focus-visible` now reads `var(--focus)`.
- Components use `border-focus` / `ring-focus` in place of the accent.

`--accent` itself is untouched: it stays Orange 350 in light and Orange 400 in
dark. Splitting the two tokens is what allows the ring to clear AA without
moving the brand primary.

**Visible change.** The focus ring is a slightly deeper orange in light mode and
a slightly brighter one in dark. Anything relying on the ring matching
`--accent` exactly will now differ.
