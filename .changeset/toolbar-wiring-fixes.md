---
"@cyonix/ui": patch
---

Fix three `Toolbar` defects found by actually using it

The parity app's Alerts and Cases screens were built from bare `Segmented` rows
rather than `Toolbar`, so none of its search, chip or count machinery had ever
run. Wiring them up found three bugs immediately.

**The "Applied / Clear all" row drew itself with nothing applied.** The test was
`{chips && ...}`, and a fragment is truthy even when every chip inside it is
conditional and absent — which is the natural way to write that prop.
`Children.toArray` is the next obvious fix and is also wrong: it flattens arrays
but treats a Fragment as ONE child, so it counts the wrapper. The component now
walks into fragments rather than asking the caller to pass an array.

**Children rendered after the search field, contradicting their own
documentation** — `/** Rendered first: segmented status filters, selects, date
ranges. */` — and the console's layout, which puts the dimensions you filter by
ahead of the field that searches within them. Now first, as documented.

**The search input was the last bordered control in the library.** A 32px box on
a white wash with a border-colour focus, where every other field is a 44px
`--surface` fill with a 2px inset ring. Its magnifier was 14px against the
console's 18px.
