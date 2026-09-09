---
"@cyonix/theme": minor
"@cyonix/ui": minor
---

Add `Timeline` and `CodeBlock`, and a toned ring on `Card`

Groundwork for the alert and case detail screens, which the parity app has
never covered — four of the console's seven screens were untouched, including
the two richest.

**`Timeline`** is the shape those screens repeat: an agent's steps, the events
behind an alert, the actions on a case. A marker in a threaded column, a title
with its timestamp, a line of detail.

The emphasis falls on the LAST entry, not the first, which inverts the usual
reading and is worth stating: these run oldest to newest, so the bottom entry is
the current state — what the agent concluded, where the intrusion reached.
Everything above is history and takes the neutral marker. The thread stops at
the last marker rather than running past it, so the column reads as finished
rather than truncated.

**`CodeBlock`** is the block sibling of `Code`, which is an inline chip. The
difference that matters is the gutter: a detection rule gets discussed line by
line, so the numbers are content. They are real text so they survive a copy —
but `onCopy` receives the code WITHOUT them, because pasting a rule with "01 "
welded to every line is worse than useless, and that is exactly what select-all
gives you. New `--code`, `--code-fg` and `--code-gutter` put it a step darker
than any surface in either theme, so a block reads as machine output rather than
another panel. It stays dark in light mode for the same reason.

**`Card` gains `ring`**, generalising what `RecordCard`'s `needsAction` did
privately. A ring marks a card without claiming a place in whatever ranking the
cards carry, which a tint would — it would compete with a severity bar for the
same job. The console uses it at 22% for a case waiting on a human and 30% for
the panel holding an agent's verdict.

`Card`'s own heading also moves from `text-h3` (22px) to `--text-panel` (17px),
the same fix already applied to the parity app's headings.
