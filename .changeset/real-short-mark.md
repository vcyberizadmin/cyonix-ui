---
"@cyonix/ui": minor
---

`Logo mini` renders the real short mark

`mini` used to render the bare four-point spark, with a comment explaining why:
the brand shipped no separate short mark, and the star was the only
self-contained element in the lockup. A real short mark now exists in the
reference console's artwork, so `mini` renders it: the CX monogram, with the
spark between the letters.

The letterforms take `currentColor` like the lockup's already did. This is
worth stating because the reference cannot do it: it embeds the artwork as
`<img src="short-dark.svg">`, and CSS cannot reach the fill of an `<img>`. That
makes the reference's own `--logo` token dead code, and it means its mark loses
every orange element against its orange light-mode rail. Ours recolours with a
text utility, so it survives both rail treatments.
