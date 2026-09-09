---
"@cyonix/ui": minor
---

Add `MeterRow`, and an `xs` size for `IconTile`

Building the console's AI investigation, False positives by source and Assigned
to analysts panels turned up the same shape three times: a name on the left, a
figure on the right, a bar underneath. Nothing in the library fitted it, so all
three would have been hand-rolled.

`RankedBars` owns its own caption (a computed share) and its own colour (a ramp
position). These rows need "34% of 486" and "1,240 · 2.1s avg", neither of which
is derivable from the fraction, and a colour that carries meaning — a source
past a tuning threshold, an unassigned queue. `ProportionBar` splits one total
into segments, which is a different question from one value against a maximum.

So `MeterRow` takes the caption as a node and the tone explicitly: it decides
layout, the caller decides meaning. `fraction` is clamped, because a meter
overshooting its track is a data bug rendering as a layout bug, and the layout
should not be the thing that breaks.

`IconTile` gains `xs` (24px), the size a meter row's leading marker wants where
36px would dominate the row it labels.
