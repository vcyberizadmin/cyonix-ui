---
"@cyonix/theme": minor
---

Add panel-heading steps to the type scale

A card's title had no size in the scale. Between `--text-h3` at 22px and
`--text-body` at 15px there was nothing, which is the widest gap in the whole
ramp — and a panel heading falls squarely into it. So every card heading reached
for `h3` and came out a third too large.

The console runs **17px** for a panel that owns its row and **16.5px** for one
sharing a grid with siblings, both at weight 700 with tight tracking. Half a
point apart is not false precision: it is the reference's own two-level
hierarchy, and both sizes appear dozens of times across its screens.

`--text-panel` and `--text-subpanel` name them.

This is one bite of a larger problem already visible in the library: 170
arbitrary font sizes across 17 distinct values, against a scale that names
seven. The scale is close to decorative, and components hardcode around it. This
adds the two steps that were most conspicuously missing rather than attempting
that sweep.
