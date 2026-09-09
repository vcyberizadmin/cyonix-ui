---
"@cyonix/ui": minor
---

Add `Annotation`, and build the alert and case detail screens

Those two screens could not be opened at all: the parity app's rows and cards
carried `onOpen={() => {}}` stubs and the app knew only four routes. They are the
richest screens in the console and had never been exercised.

**`Annotation`** is what the case narrative needs: a term in prose that explains
itself. A summary names hosts, users and domains inline, and an analyst needs to
know what `FIN-WS-2214` is without leaving the sentence — a footnote or a link
both break the reading to answer. So the term carries its own panel: bold, a
dotted brand underline, `cursor: help`.

The underline is dotted rather than solid because solid reads as a link and
invites a click that goes nowhere. And it sets `tabIndex` with
`aria-describedby`, because a term whose meaning is only reachable with a
pointer is unreachable to a keyboard — and these are the load-bearing nouns of
the narrative, not decoration. The panel is CSS-only, so the component stays
server-safe.

Building the screens also confirmed something about routing that is worth
recording: a detail screen is NOT a rail destination. You reach it by opening a
record, and the rail keeps the list you came from marked current. I had it wired
as a fifth route at first, which lit nothing in the rail and lost the reader's
place.
