---
"@vcyberizadmin/ui": minor
---

CX-TBL — `compact`, `align: "center"`, per-column `className` and the row index
reach `Column`; `hoverable` reaches the table. Fixes an actions column that
clipped its own controls.

Found by migrating a real consumer. `cyonix-tenants` had independently arrived at
a column vocabulary this table could not express, and used it **73 times** across
eight tables: `compact` on 42 columns and `align: "center"` on 31. Porting to the
library would have meant deleting both and inventing percentage widths in their
place — the library forcing a regression on an app, which is backwards.

- **`compact`** sizes a column to its own content rather than giving it a share
  of the table's leftover width. Without it a status mark or an action group ends
  up stranded a hand's width from its header, because the six text columns and
  the one-glyph column all divide the remaining space equally. `actions` already
  did this privately; `compact` is that behaviour named and made available to the
  codes, counts, dates and statuses that need it and must *not* also swallow the
  row click.

- **`align: "center"`** completes an axis that was half-built. `align` drove the
  header and body together — the property that stops the two disagreeing — but
  offered only `left` and `right`, so a centred column was unreachable through
  the API. `right` continues to carry the mono tabular face, since a column of
  figures compared digit by digit needs it and a centred date does not.

- **`className`** is the escape hatch for what the props above cannot say —
  `min-w-[20rem]` on a message column, `hidden md:table-cell` on one that drops
  out on narrow screens. Applied to header and body alike, for the same reason
  `align` is.

- **`cell` now receives the rendered index**, so a numbered column follows the
  sort instead of contradicting it. Passing an extra argument to callbacks that
  ignore it is invisible to existing code.

- **`hoverable`** turns off the row hover wash. It stays on by default and
  should stay on for any table whose rows are records an operator acts on, but a
  static reference grid — a permissions matrix, a legend — has nothing to click,
  and a hover wash there advertises interactivity the row does not have.

**The bug.** `actions: true` did not exempt its cell from the default
`max-w-0 truncate`, and `overflow: hidden` clips a `<button>` exactly as readily
as a long string. Every actions column rendered its controls cut off — an `Edit`
button arriving as `dit` — and it survived unnoticed because the story's actions
column holds a single `⋯` glyph narrow enough to fit. Nothing errors, nothing
fails a typecheck, and a screenshot looks plausible unless you read the label.

`compact`, `actions` and `truncate: false` now all opt out of truncation, which
is not three special cases but one rule: a column sized by its content has no
share of the table to truncate against.

Every addition is optional and `Column`'s required fields are unchanged, so no
consumer needs to touch anything.
