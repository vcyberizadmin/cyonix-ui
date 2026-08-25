---
"@vcyberizadmin/ui": minor
"@vcyberizadmin/theme": minor
---

CX-DCK — `DockRail`, the floating dock rail, ported from the SOC console. Plus
`railMode` on `AppShell` so the shell knows not to wrap it in a drawer.

Ported from the deployed SOC console, whose rail is the one piece of that app's
chrome no library component could express. It ships **beside** `NavRail`, not in
place of it: both are legitimate, and which one an app wants is decided by how
many destinations it has, not by which is newer.

**Why it could not be a `NavRail` variant.** Four differences, each of which
alone would be a prop, but together are a different component:

- **It floats.** The panel is absolutely positioned inside a fixed-width gutter
  and expands *over* the content, so the gutter never changes and nothing
  reflows when the pointer crosses the rail. `NavRail`'s collapse resizes the
  grid — deliberately, because at 300px it has to. This one must not, because a
  rail that reshuffles a table every time the mouse passes it is unusable.
- **Expansion is hover, not a click.** So there is no persisted state, no
  storage key, no controlled/uncontrolled pair, and nothing for a user to set.
  Bound to `focus-within` as well, so the keyboard gets what the mouse gets.
- **Below `xl` it is a bottom dock, not a drawer.** Thumb-reachable and always
  visible, with the primary action lifted out of its centre as a FAB. `action`
  is dock-only and renders nothing above `xl`: the expanded rail is a column of
  destinations, and a button among them reads as one more place to go. On a wide
  screen the primary action belongs in the console bar, where there is room to
  label it.
- **Nesting is not supported, by type.** `DockItem` has no `children` field. A
  dock with sub-items is a sidebar wearing the wrong clothes; that is what
  `NavRail` is for.

**The one deliberate departure from the source.** The SOC console paints the
whole rail Sunset Orange in its light theme. That is dropped. The design system
reserves orange for exactly one thing at a time — the current location — and an
orange rail puts the accent everywhere, leaving the active item to distinguish
itself from a field of its own colour. Here the rail surface is `--surface` in
both themes, hover is a neutral wash, and the only orange is the ink tab welded
to the active item's edge. Same geometry, same motion, same crossfade; the
colour rule the rest of the library follows now holds here too.

**Counts** take the danger tone, never orange, and `0` renders nothing rather
than a zero badge — an empty queue is not a state worth a glance.

**`DockReveal`** ships alongside, for text that collapses with the rail. The
module badge needs it: the source keeps the "S" of "SOC" visible at 76px and
reveals only the "OC", so the badge reads as one letter collapsed and the whole
word expanded rather than appearing out of nothing —
`footer={<>S<DockReveal>OC</DockReveal></>}`. It shares the nav label's collapse
mechanics from a single constant, so the two cannot drift apart.

**`AppShell` gains `railMode`.** `sidebar` (the default) is unchanged. `dock`
renders the rail straight through and drops the drawer and its trigger, which
would otherwise hide a rail meant to stay visible and mount a button that opens
nothing. In exchange the shell takes on the one duty the dock cannot do for
itself: reserving scroll room at the foot of the content column below `xl`, so
the last row of a table is not stranded under the floating bar.

**Theme** adds `--container-dock-rail` (76px), `--container-dock-rail-open`
(232px) and `--container-dock-gutter` (100px). Only the widths are named,
because only the widths are load-bearing for the no-reflow behaviour above.
