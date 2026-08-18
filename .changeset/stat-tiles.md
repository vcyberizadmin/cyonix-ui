---
"@vcyberizadmin/ui": minor
---

CX-TIL — stat tiles, plus a `cn()` fix that repairs two shipped defects.

**Three tiles, not one overloaded one.** `StatTile` answers "how many",
`TrendTile` "which way is it moving", `StatusTile` "is this OK". `TileGrid`
carries the layout rule: auto-fit, 200px minimum, so tiles wrap rather than
shrink.

Brand rules moved from prose into the type system:

- **Never brand orange.** `TileTone` is derived from the CX-STA semantic tones
  minus `draft`, so there is no accent member and no prop that can reach the
  brand hue. The drill-through hover affordance uses surface and motion instead.
- **Deltas state their baseline.** `baseline` is required by the type whenever
  `delta` is present — a bare percentage does not compile.
- **Polarity is per-metric.** There is no correct global default, so omitting
  `polarity` yields a colourless delta rather than a confident wrong one. The
  same +12% reads green on "resolved" and red on "open".
- **Direction survives greyscale.** An arrow *and* a word carry it, not colour.
- A tile that filters a list is a link (`href` + `linkComponent`), never an
  `onClick` — which also keeps the whole file server-safe, so a dashboard of
  tiles costs zero client JS.

Each tile is a `<dl>`, so the label and value are associated for a screen reader
without `useId` — which would have forced the file client-side.

`Sparkline` geometry lives in `lib/spark.ts` as pure functions with a derived
text equivalent. The standard says only the trend variant needs a chart
dependency; it needs none, so `TrendTile` stays in the root export and the Tenant
console never pulls in `recharts`.

**`cn()` now knows the theme's custom scales.** `tailwind-merge` classifies
unknown `text-*` values as colours, so `text-h2` and `text-danger` collided and
the size lost — silently, with every surviving class still resolving. Two places
shipped broken in `0.1.0`: a `StatTile` value carrying a tone rendered at 15px
instead of 30px, and every `ImpactBox` row in the confirm dialog rendered at 15px
instead of 13.5px. `scripts/verify-merge.mjs` now guards it.

`TONE_INK` is added to `./lib/status` (tone → ink, fill and border-left colour)
so a tile and a pill cannot disagree about what "danger" looks like.
