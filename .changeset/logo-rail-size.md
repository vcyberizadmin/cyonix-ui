---
"@cyonix/ui": minor
---

`Logo` gains an `xl` size, and `DockRail` centres its expanded lockup

The rail's mark was rendering at 20px against the reference's 36px, and its
expanded lockup at 16px against 32px — roughly half, in both cases. The cause
was that `Logo`'s scale simply had no step that large: `lg` topped out at a 32px
mark and a 24px lockup, both below what a 76px rail column needs. A mark set two
steps down in that column does not read as an identity, it reads as an icon
someone forgot to size.

`xl` is the rail size: a 36px mark, a 32px lockup.

It was also off-centre, which followed from the same cause. `DockRail` pins the
mini mark at `left-1.5`, which centres a 36px mark in the 48px brand box exactly
and leaves a 20px one 8px short. And the expanded lockup was pinned left too,
where the reference centres it — so it now anchors from the middle while the
mark holds its left position through the crossfade.
