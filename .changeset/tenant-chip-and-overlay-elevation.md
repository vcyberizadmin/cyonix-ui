---
"@cyonix/ui": patch
---

Fix the tenant chip's radius and fill, and lift overlays onto the reference's elevation

The tenant switcher's chip rendered at a 22px radius on `--surface-2`, where the
console has 12px on `--surface`.

The radius was a trap of this theme's own making. `--radius-xl` is redefined here
as the CARD radius (22px), so `rounded-xl` does not mean Tailwind's 12px — and
reaching for it expecting 12px silently gets a card corner. That has now caused
this bug twice, the first time with `rounded-2xl`. The override is deliberate
and stays, but it is now documented loudly beside the definitions, and the chip
asks for its 12px literally.

`Popover` and `Menu` move from `--e-2` to the reference's `--shadow-2`. The `e-*`
scale was tuned when a panel and the page shared a ground; against a floating
surface it is too tight and too shallow to read as elevation at all. This is why
the tenant panel looked flat.
