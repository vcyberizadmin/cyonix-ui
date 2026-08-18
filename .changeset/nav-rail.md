---
"@cyonix/ui": minor
"@cyonix/theme": minor
---

Add `NavRail` (CX-NAV) under the new `@cyonix/ui/layout` export.

Merges the three consoles as the standard directs: Tenant's rendering, SOC's
data model (`liveBadge` slot, `tag` pill), VAPT's affordances (labelled
"Minimize menu" control, independent group and section expand). Portable across
repos via a `linkComponent` prop and a prop-driven `activeHref` rather than an
internal router call. Collapse and mini state persist per user.

`@cyonix/theme` gains `--container-rail` / `--container-rail-mini` (300px / 68px).
