---
"@vcyberizadmin/ui": minor
---

Complete the overlay family: CX-TST and CX-TIP.

`ToastProvider` + `useToast` (CX-TST) — tokenized and dependency-free, so SOC can
drop `react-hot-toast` and its unthemed styling. Bottom-right, stacks upward
without displacing what is already there, semantic left rule PLUS an icon so it
never rests on colour. Errors persist and announce assertively (`role="alert"`);
everything else clears after 4s politely. Undo stays available for the whole
display duration.

Both gaps the standard records against Tenant's version are closed: a queue cap
(`max`, default 4) so a bulk action cannot flood the corner, and dedupe so a
repeat increments a count instead of stacking copies.

`Tooltip` + `Popover` (CX-TIP) — written from scratch; no console had a reusable
one. A tooltip must never contain a control, so its `content` is typed as a
string: passing a button in is a type error rather than a review note. Opens
after 400ms of hover but IMMEDIATELY on focus, because hover-only content is
invisible on touch and to keyboard users. Popover opens on click, traps nothing,
Escape closes.

Also extracts `useAnchoredPosition` — flip-to-viewport placement now shared by
Menu, Tooltip and Popover instead of living inline in Menu, and it gained
scroll/resize repositioning that Menu never had.
