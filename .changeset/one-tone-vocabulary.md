---
"@cyonix/ui": major
---

One tone vocabulary, and a levelled `Donut`

The AI investigation panel was wrong in three ways, and two of them shared a
cause.

**The ring was crimson, not mint.** It reported "85% resolved without a human"
in the severity ramp's CRITICAL red, which is close to the opposite of what it
says. A ramp answers "which series is this" by index — right for a split,
meaningless for a level, where one arc has one meaning. `Donut` gains `tone` to
state it, alongside `max` (measure against a ceiling rather than the sum of the
slices, leaving the remainder as bare track and earning a round cap) and
`centerValue` (a level shows its VALUE, not the ceiling).

**The agent tiles were four near-misses**: `#4d9cf0` where the console has
`#1b6ef3`, `#744eeb` for `#a855f7`, `#2cbf8f` for `#7ed321`, `#efa71a` for
`#f5a524`. Close enough to look intentional, wrong in every case.

That happened because four components had grown four private tone unions that
disagreed at the edges — `ok` meaning teal in one and mint in another. There is
now ONE vocabulary in `lib/status.ts`: `Tone`, with `TONE_BG`, `TONE_TEXT` and
`TONE_VAR`. `Sankey`, `MeterRow`, `IconTile` and `Donut` all read it, so a flow
node, a meter bar, a tile and a ring that all mean "medium" are the same blue.

**BREAKING for `IconTile`:** its tones were `warning` / `info` / `danger` / `ai`
and are now `high` / `med` / `crit` / `violet`. `accent`, `ok` and `neutral` are
unchanged in name, and `ok` changes hue from the semantic green to the mint the
rest of the system uses.

This overrules an argument I made in `IconTile`'s own header — that borrowing
the severity hues would imply a rank. A private palette is what let a tile and a
bar that both meant "medium" render as two different blues. Position in a ladder
carries rank; a colour alone does not.
