---
"@cyonix/theme": major
"@cyonix/ui": patch
---

Match the motion curve and durations to the reference

Everything about the navigation measured correct — panel 76px at x=12, items
48px on a 56px pitch, glyphs 22px centred at x=50, the ink tab 9×34, radii 28
and 16 — and it still did not feel the same, because motion was the one layer
never compared.

**One curve, and it was the wrong one.** The reference moves everything on
`cubic-bezier(.2,.8,.2,1)`: the rail's width, the segmented ink, a progress fill,
the view transition. This file used `cubic-bezier(.2,.7,.2,1)`, which is
indistinguishable in a still frame and reads as a flatter, more mechanical ease
once it moves.

**Both durations were fast.** The reference runs quick state flips — a button, a
chip, a field's focus ring — at `.18s` where this ran `.12s`, and size and
position changes at `.32s` where this ran `.24s`. The rail's peek was the clearest
tell at a third quicker than the original, which reads as eager rather than
considered.

`--duration-instant` 120ms → 180ms, `--duration-standard` 240ms → 320ms. These
are theme-wide, so every transition in the library slows to match; that is the
intent, since the reference tunes from one vocabulary rather than per component.

The rail's ink keeps its own `.22s`, between a colour flip and the panel's
width, as the reference has it.
