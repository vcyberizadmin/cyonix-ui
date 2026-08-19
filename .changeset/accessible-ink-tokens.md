---
"@vcyberizadmin/theme": minor
"@vcyberizadmin/ui": minor
---

Fixes the WCAG 2.2 AA contrast failures across both themes by splitting each
semantic hue into a **mark** and an **ink**.

The brand document sets the bar itself — *"Target WCAG 2.2 AA. Operators use this
product for long shifts, at night, sometimes on bad displays — accessibility is
legibility."* Its own contrast table checks every hue against **one** ground:
Onyx Grey, dark theme only. The library paints those hues on three more grounds
that table never evaluated — Dark Grey cards, the hue's own 10–20% tint on a
card, and the entire light theme. Measured across all 57 stories by compositing
each text node's real background: **261 text nodes below AA in light, 374 in
dark**.

One value cannot serve both jobs, and the reason is structural:

- **MARK** — a 3px severity bar, a chart fill, a status dot. Answers to WCAG
  1.4.11 at 3:1, and needs "deeper = worse" to hold so critical never reads as
  merely high. **Keeps the brand value exactly.**
- **INK** — an 11px label. Answers to 1.4.3 at 4.5:1 against the darkest *and*
  lightest ground it lands on, which on a near-black canvas forces it lighter and
  on white forces it darker — opposite directions.

So the bar carries the rank and the label carries the legibility. New tokens:
`--{ok,warning,danger,info}-ink`, `--sev-*-ink`, `--accent-ink`, exposed as
`text-*-ink` utilities. Each is the *smallest* deviation from its brand hue that
clears 4.5:1 on page, card, tint and wash — chosen by measurement, not by eye.
`TONE_INK` gains a third role, `glyph`, so an icon takes the mark and therefore
matches the bar beside it exactly.

Critical and high resolve to distinct ink in both themes deliberately: the naive
minimum collapses them onto one value, erasing the single distinction the
severity ladder exists to make.

**Two visible trades, both unavoidable:**

- `--accent-fg` is no longer white. White on Sunset Orange is 3.44:1 on Orange
  400 and 2.98:1 on Orange 350 — under AA for a 14px button label in both
  themes, and no shade of the brand orange carries white text at 4.5:1 while
  remaining the brand orange. The label darkens instead, so the fill does not
  have to: 4.84:1 and 5.58:1. **Every primary Button, filled segment and skip
  link now reads orange-with-dark-label.**
- The danger Button takes a new `--danger-strong` fill. Here the opposite trade
  is correct: a deeper red still reads unmistakably as danger, so the fill
  darkens and the label stays white (3.76:1 → 6.49:1). A black-on-red
  destructive button would be the worse outcome.

Also fixed, each a distinct cause rather than the palette:

- `Code` and `Tooltip` keep a **fixed dark surface** in light mode but carried
  theme-flipping ink, so their text went dark on their own dark panel — 2.96:1.
  They now use fixed light ink.
- The outline Button's hover label sat on `--bg` with a 22% orange wash, not on
  the accent fill, where near-black would have measured 1.3:1. It uses `--fg`.
  `--accent-fg` now documents that it means specifically "ink on the accent
  fill".
- 9–10px badges on `bg-wash-2` and the TopBar's search-field button label moved
  from `--fg-muted` to `--fg-2`; `--fg-muted` itself lifted to the smallest
  passing step in both themes. Muted remains correct for disabled state, which
  WCAG exempts, and for captions at 11px and above.
- Placeholders moved to `--fg-2`. A placeholder is rendered text and cannot be
  both very faint and compliant.

Result: **0 text nodes below AA in dark, 0 in light**, across all 57 stories,
with every functional probe still green.
