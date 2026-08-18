---
"@vcyberizadmin/ui": minor
---

Complete the shell group: CX-HDR and CX-CMD.

`PageHeader` + `Breadcrumb` (CX-HDR) — server-safe, pure presentation. Tenant's
primitives win because they are real primitives with correct
`aria-label="Breadcrumb"` and `aria-current`, where SOC and VAPT inline the same
markup per page; VAPT's eyebrow kicker is folded in. The last crumb renders as
text even when an href is supplied — a link to the page you are already on is
noise, so the rule is enforced rather than documented. Actions wrap under the
title below 640px rather than truncating, because a hidden action is worse than
a wrapped one. The FR chip hides behind `showInternal` for customer-facing builds.

`CommandPalette` (CX-CMD) — built on `useOverlay` rather than on cmdk. The
standard lists "adds the cmdk dependency to every consumer" as a con of lifting
SOC's version, and everything cmdk provides is either already in `useOverlay` or
is a small local function, so the dependency surface stays at three packages.

Centred at 640px on a blurred scrim, capped at 60vh, grouped with uppercase
headers, selected row in the orange wash. An empty query shows recents from
localStorage rather than a blank panel. Fuzzy matching scores word starts higher,
so "ca" finds "Create case". Remote record search appends UNDER the local results
and never blocks them. The hotkey is suppressed inside Monaco and CodeMirror,
which bind it themselves, but still fires from plain inputs.
