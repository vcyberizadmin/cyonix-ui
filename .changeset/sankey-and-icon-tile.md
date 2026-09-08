---
"@cyonix/ui": minor
---

Add `Sankey` and `IconTile`

**`Sankey`** answers a question `FunnelFlow` cannot. FunnelFlow deliberately
refuses to be a Sankey, and its reasoning holds for a linear pipeline: one that
only ever narrows is read by its drop-off figure, and a ribbon encodes that
number less precisely than a bar plus a stated percentage.

That reasoning does not extend to branching. Once a population splits several
ways and the branches recombine — alerts from four sources, each either closed
by an agent or sent to an analyst, each of those ending benign, tuned or
escalated — there is no single drop-off to state. The question stops being
"where are we losing them" and becomes "which path did they take", which is
about topology, and a stack of bars cannot show topology at all. Reach for
FunnelFlow first; it is the more precise chart whenever it fits.

No charting library, per the same argument as the rest of `./charts`: it is
some arithmetic and one cubic Bézier per ribbon. It is also server-safe, which
the reference's own implementation is not — that one measures `clientWidth` and
redraws, where this scales through a viewBox. Hover is CSS, and every band and
node carries a `<title>`, so the numbers are reachable without a pointer.

A node is as thick as the larger of what enters and what leaves it: using
either alone makes a node that drops part of its input look like it passed
everything on. Ribbons are coloured by destination, so following a colour
answers where something ended up rather than where it came from, and they leave
each node ordered by their targets' stacking, which is what stops them
braiding. Labels are HTML rather than SVG text, because
`preserveAspectRatio="none"` stretches the coordinate space and would distort
any glyph drawn inside it.

**`IconTile`** is the filled rounded square that identifies what a KPI card is
counting. Its tone is a label, not a severity — two cards tinted amber and
azure are not being ranked — so the tones name their intent (`info`, `ai`,
`neutral`) rather than borrowing the severity ladder.
