---
"@cyonix/ui": patch
---

`Sankey` lays out in measured pixels, so its node bars are the width they claim

The chart used a fixed 600-unit coordinate space scaled to the container with
`preserveAspectRatio="none"`. That is right for a ribbon, an organic shape that
may stretch, and wrong for anything whose WIDTH carries meaning: a 12-unit node
bar in a 1707px container rendered **34px** wide, nearly three times its stated
size.

This is the same defect that stretched `StepArea`'s axis text, and I fixed that
one by moving the text out of the scaled space without asking what else in there
had a horizontal dimension. The node bars did.

It now measures its container with a `ResizeObserver` and lays out in real
pixels, so one user unit is one pixel and neither axis is distorted — which is
what the reference does, and the only way a bar can be 12px at every width.
Verified at 1707px and 1212px: node width 12px in both.

Node labels stay HTML. With the space measured they would no longer distort, but
HTML keeps them on the document's type stack, lets them inherit the theme's font
tokens, and allows CSS truncation of a long node name.
