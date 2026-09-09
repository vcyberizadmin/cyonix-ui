---
"@cyonix/ui": minor
---

`MeterRow` gains an inline orientation, and the tone vocabulary is exported from the root.

The console has two meter shapes and only one was here. `stacked` is the widget
row — a name, a figure, a bar beneath. `inline` is the SLA readout: the bar and
its figure on one line, 6px rather than 8px, and no visible label, because it
sits inside a facts strip that has already said what it is. Building that with
the stacked form meant passing `label=""`, which reserved a line for nothing and
left a full-width bar with its figure adrift.

`label` stays required in both. Inline turns it into the bar's accessible name
rather than dropping it, so the meter can still be identified by anyone who
cannot see the strip around it. Inline also emits only phrasing content, which
is what makes it legal inside a text row at all — the stacked form's divs are
invalid there, and the browser closes the enclosing paragraph early.

Both orientations now expose the fill as a `progressbar` with
`aria-valuenow/min/max`. Previously the value was visible and nowhere in the
accessibility tree. `title` is a new passthrough, for the target a countdown is
counting down to.

`Tone` and the `TONE_BG` / `TONE_TEXT` / `TONE_VAR` / `TONE_TINT` maps are now
exported from the package root. They were reachable only at
`@cyonix/ui/lib/status`, while every component that takes a tone lives at the
root — so an app deriving a tone had to reach past the entrypoint it was already
importing from to name what it was deriving. Deriving one is ordinary app work:
an SLA bar thresholding on elapsed time, a queue row on depth.
