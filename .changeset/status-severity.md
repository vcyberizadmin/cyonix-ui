---
"@cyonix/ui": minor
"@cyonix/theme": minor
---

Add CX-STA — `StatusPill` and `SeverityBadge`, plus the vocabulary at
`@cyonix/ui/lib/status`.

Two languages that never share an axis: semantic (what happened, shaped dot) and
severity (how bad, ranked, 3px leading bar). Brand orange is excluded from both.
Colour never carries meaning alone — every tone owns a distinct shape (filled
circle, haloed circle, diamond, hollow ring, square, absent) so the vocabulary
survives colour-blindness and greyscale print.

Ships `severityRank()` and `bySeverity()` for Critical-first sorting,
`extendVocabulary()` so VAPT and SOC states layer over the base without forking,
a liveness pulse on running states, and the categorical + sequential chart ramps
so charts inherit the same discipline.

`@cyonix/theme` gains the `--cat-1..6` and `--seq-1..8` ramps.
