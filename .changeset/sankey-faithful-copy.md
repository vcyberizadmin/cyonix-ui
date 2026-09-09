---
"@cyonix/theme": minor
"@cyonix/ui": major
---

Bring `Sankey` up to the reference's full design

The first pass got the topology right and skipped almost everything else. This
copies the rest.

**Node labels are drawn in place**, beside each node, at the reference's
`11.5px/800` over a `10.5px/700` count — not collected into a caption below the
chart. They read against the ribbons they name, which is the whole point of
labelling a node rather than a series. They are HTML positioned in percentages
rather than SVG text, because the plot uses `preserveAspectRatio="none"` and
would stretch any glyph drawn inside it.

**Hovering a ribbon now dims the others** to 7% and lifts the hovered one to
72%, with a brand-filled readout naming both ends and the count. This is not
decoration: a Sankey answers "where did THIS one go", and that is unreadable
while a dozen others compete for the same pixels. The previous behaviour — a
brightness nudge with no dimming — did not answer the question.

**Ribbons paint thickest-first**, so a hairline lands on top of the slab it
crosses and stays hoverable rather than being buried by it.

**Tones are the reference's own.** `SankeyTone` now names the ranked marks
(`crit`, `high`, `med`, `low`, `ok`) plus `violet` and `neutral`, replacing a
palette that mapped to the wrong tokens: `ok` resolved to a teal `#00b37a` where
the reference is mint `#7ed321`, and `info` to `#4d9cf0` where the reference is
azure `#1b6ef3`. Colouring a flow by what each end MEANS is what lets a source
that mostly auto-closes share a language with the outcome it reaches.

**`--violet` is new** in the theme: `#a855f7`, the reference's fifth accent. Its
palette is brand / azure / mint / violet / rose, and the other four are already
the severity marks — this is the one that was missing. Deliberately not a step
on the Amethyst ramp, which runs bluer and stays reserved for agent output.

`Sankey` is now a client component, since the hover state is what makes it
readable. Every band and node still carries a `<title>`, so the numbers survive
without a pointer.
