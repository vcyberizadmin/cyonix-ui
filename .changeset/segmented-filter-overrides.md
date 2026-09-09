---
"@cyonix/ui": minor
---

`SegmentedFilter` stops overriding `Segmented`, which had made it a different control

It passed three overrides — the lighter `tint` variant, `size="sm"` and
`overflow="wrap"` — on the reasoning that a filter sitting beside other controls
should read quieter than a tab row. The console disagrees emphatically: its
filter segmented is the *same* control as its tab segmented.

Between them those three produced something else entirely:

| | Console | Was |
| --- | --- | --- |
| Track | `--track`, 4px padding | none: transparent, no radius, no padding |
| Sliding ink | solid `#FE6409` | no ink element at all |
| Active | white on the fill, weight 800 | accent text on a 15% wash, weight 700 |
| Size | 32px / 12.5px | 28px / 12px |

`wrap` is the culprit for the first two: it drops the groove entirely and lays
the segments out as separate pills, so there was nothing for an ink to slide
along. The control had no animation because it had nothing to animate.

It now overrides nothing. A screen that genuinely wants the quieter form can
pass `variant`, `size` or `overflow` to `Segmented` directly.
