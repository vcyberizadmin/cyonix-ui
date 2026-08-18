---
"@vcyberizadmin/ui": minor
---

Add the step-4 workhorse surface: CX-TBL, CX-FLT and CX-PAG.

`DataTable` (CX-TBL) — Tenant's structure, SOC's behaviours, VAPT's cell
renderers. Sorting is designed so SOC's defect cannot recur: omit
`onSortChange` and the table genuinely sorts (stable, and severity by rank so
Critical leads); provide it and the caller owns ordering for server-side sorts.
There is no state where a header responds but nothing moves. Overflow lives on
the table's own scroll container behind a min-width, so a 12-column table never
makes the page scroll sideways. No zebra striping — it fights severity colour.
Loading, empty and error render in the table's own body by composing CX-STE.

`Toolbar`, `SegmentedFilter`, `FilterChip` (CX-FLT) — Tenant's removable chips,
VAPT's segmented pills with live counts, SOC's saved views. Filters apply
immediately, search debounces at 250ms, applied state stays visible. URL
persistence is left to the caller, which owns the router.

`Pagination` (CX-PAG) — states the range and the total ("Showing 1-7 of 48"),
which is the detail that makes paging honest. Disabled controls stay visible at
muted opacity so reaching a boundary does not shift the layout. Adds the
page-size control the standard lists as a gap.

Cell renderers as named exports so apps stop re-inventing them: `TwoLineCell`,
`SeverityCounts`, `DueChip`, `Progress`.

Also fixes `ChipStack`: it wrapped, which grew table rows. The standard requires
a `+n` overflow rather than growth, so it no longer wraps.
