---
"@cyonix/ui": minor
---

`Tag` gains a `tone`, which is the console's universal tag treatment

A verdict, a severity, a status and an outcome all read the same way in the
console — a 15% wash of a tone with that tone as the ink — and that is precisely
why they scan as one family instead of four unrelated chips. `Tag` could not
express it, so a consumer's only route was
`className={`bg-${tone}/15 text-${tone}`}`.

That route does not work, and fails silently. Tailwind generates nothing for a
class name assembled at runtime, so the tag renders untinted with no error and
no warning — which is exactly what the parity app was doing, and why its verdict
badges were the wrong colour.

`TONE_TINT` in `lib/status.ts` holds the literal pairs, alongside `TONE_BG`,
`TONE_TEXT` and `TONE_VAR`. An untinted `Tag` is unchanged.

Verdict tags also carry a glyph in the console: the tag's claim is "an agent
decided this", and the bot mark is what says so.
