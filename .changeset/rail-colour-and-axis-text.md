---
"@cyonix/theme": patch
"@cyonix/ui": minor
---

Fix the rail's fill, distorted axis text, and Segmented's fixed width

**The rail was the wrong grey.** `--neutral-850` held an interpolated `#2b2e33`
where the reference uses `#26282c`, so the navigation sat five points too light
against a page background that was already exact. Worse, the comment beside
`--rail` asserted it was "the reference's #26282C step" while pointing at a
value that was not. Both corrected, and the ramp's own comment no longer claims
850 is interpolated.

**`StepArea`'s axis text was stretched.** The plot uses
`preserveAspectRatio="none"` so its 600-unit coordinate space fits any card
width, which is right for the line and the gridlines and ruinous for glyphs:
SVG `<text>` inside it is scaled horizontally too, so on a wide card the tick
numbers and times came out visibly distorted. The labels are now positioned as
HTML in percentages, which keeps the type undistorted at any width. `Sankey`
already did this, for exactly this reason; the lesson had not been carried over.

**`Segmented` could not be made full width.** The track was hardcoded to
`w-max`, so the console's range selector — which runs the full width of the
chart above it, segments aligned to the plot — was not expressible at all. A
`stretch` prop switches the track to an equal-fraction grid, and centres each
label in its cell, which content-sized segments never needed.
