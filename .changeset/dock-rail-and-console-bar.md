---
"@cyonix/ui": major
---

Point `DockRail` and `ConsoleBar` at their own surfaces

Both were already faithful ports of the reference console's rail and header —
`DockRail` had the edge-tab ink, the overlapping count bubble, the width-animated
labels, the module badge and the asymmetric logo crossfade; `ConsoleBar` had the
68/78px height, the 15px scope tabs with their glowing ink, the 268px search
affordance and the ringed notification count. What neither had was a surface of
its own, because the tokens did not exist.

`DockRail` now fills with `--rail`, which inverts: a raised grey slab in dark, a
solid brand column in light. That is the reference's most recognisable single
feature, and it changes how "one accent, earned" is satisfied per theme — in
dark the ink tab is orange against grey; in light the whole column is orange, so
the ink goes white, because an orange marker on an orange ground is invisible.
`--rail-ink` carries that inversion.

`ConsoleBar` moves its tonal fills from the white washes onto `--surface-2` /
`--surface-3`, its mobile logo chip onto `--chip`, and its bell and notification
count onto `--bell` / `--badge`. Those last two invert against each other, so the
pair spends exactly one accent in either mode: orange bell with a dark count in
light, dark bell with an orange count in dark. The count previously took the
danger tone, which said "something is wrong" about a number that is usually just
a number.

`NavRail` is unchanged. It is the flush, groupable, click-collapsed sidebar for
consoles with deep navigation, and `DockRail` is the flat icon dock for consoles
whose surface fits in five destinations. That distinction is deliberate and both
components document it.
