---
"@cyonix/ui": minor
---

Add `RecordCard` and `QueueRow`, the card/table pair a triage queue needs

The library had the ingredients for a case or alert list — `Card`,
`StatusPill`, `SeverityBadge`, `Tag`, `ProportionBar`, `DataTable` — but
nothing that composed them into either shape the reference console uses, so
every consumer was rebuilding the same two layouts by hand.

`RecordCard` is a record arranged for reading: a severity bar down the left
edge, a meta row of tags with a `flag` that pushes right above phone width, the
title at full weight, and a wrapping footer of facts where a meter is allowed
the remaining space. `needsAction` rings the card rather than tinting it, so it
does not compete with the severity bar for the same job.

`QueueRow` is the same record arranged for scanning: a stack of rows inside one
card on `--surface-2`, each a whole click target. `trailing` is dropped below
`sm` on purpose — a severity tag and a relative time are the first things that
can go, because the bar still carries rank and the row still opens.

`RowFacts` puts dot separators BETWEEN facts and only between them, with no
stranded separator when a fact is conditionally absent. Doing that by hand in
each consumer is how a row ends up reading "· ·".
