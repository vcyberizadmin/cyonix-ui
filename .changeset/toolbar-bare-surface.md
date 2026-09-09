---
"@cyonix/ui": minor
---

`Toolbar` gains a `bare` surface, for a filter row that stands on the page

`Toolbar` hardcoded `border-b` and horizontal padding, which assumes one thing
about where it sits: welded to a `DataTable` directly below it, where the
hairline separates the two and the padding lines its controls up with the
table's cells.

The console does not use it that way on either of its filtered screens. There
the filter row stands on the page and the results are a card BELOW it — two
surfaces, not one. Wrapping the attached form in a card to get there is what
merged the filters into the results and gave them a single background, which is
exactly the wrong reading: the row is a control, the card is the object it acts
on.

`surface="bare"` drops the hairline and the padding, because with nothing to
align to and nothing to separate from, an edge reads as a card that forgot its
fill. `attached` remains the default, so nothing changes for a toolbar sitting
on a table.
