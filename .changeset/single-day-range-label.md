---
"@vcyberizadmin/ui": patch
---

Stop `formatDateRange` printing a single-day range twice

A range whose ends are equal rendered as `26 August 2026 – 26 August 2026`.
That is not an edge case: the `today` preset resolves to `{ from: X, to: X }`,
and `DateRangeFilter`'s trigger renders `formatDateRange(value, true)` — so
choosing **Today** in the filter read `26 Aug – 26 Aug 2026`. It now reads
`26 Aug 2026`.

Genuine two-day spans are unaffected; the collapse keys on the two ends being
the same date, not on them sharing a month.
