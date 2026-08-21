---
"@vcyberizadmin/ui": minor
---

CX-CBR — `ConsoleBar`, the SOC console's header, ported. Sits beside `TopBar`
rather than replacing it.

Same relationship CX-DCK has to CX-NAV, for the same reason: the two answer
different questions. `TopBar` is a 52px utility strip — scope, clock, health, a
menu — where every group is a small control and the whole thing reads as chrome.
`ConsoleBar` is a 68/78px identity bar built around the question an operator
asks constantly ("whose data am I looking at?") and the three panels they open
all shift. It is taller, its search affordance is sized to be *seen*, and its
scope switcher is a row of tabs with a moving ink rather than a dropdown.

**Scope is the point.** It sits far left because it qualifies everything to its
right, and it reads as tabs because it is switched far more often than anything
else in the bar. The ink beneath the current scope is the ONE orange thing here
— scope is location, and location is what orange means.

**Two ways the current scope can stop being visible, both handled.** The source
handles one: an unpinned scope makes the picker button take over its name. The
other it misses — the inline tabs shed one at a time as the bar narrows, so a
*pinned* scope can be hidden by a breakpoint, leaving the picker saying
"Tenants" and no ink anywhere. This measures `offsetWidth` rather than inferring
from the breakpoint (CSS is the only thing that knows, and only the DOM can read
it back), so the picker takes over in that case too. The bar never stops showing
where you are.

**Controls fold rather than vanish.** Below `xl` there is no room for the theme
and settings buttons, so they move INTO the profile panel as labelled rows —
`ConsoleMenuItem.compactOnly`. One definition, visible as an icon button on a
wide screen and a row on a narrow one, never both at once. A control that
disappears on a laptop is a control the operator cannot reach.

**Counts take the danger tone, never orange** — the same rule CX-DCK's badges
follow — and a zero renders no badge at all.

All three panels are CX-TIP's `Popover`, so Escape, click-outside, focus return,
portalling and anchored positioning come from the shared overlay stack instead
of being reimplemented three times. The bar does no date arithmetic:
`ConsoleNotification.time` is pre-formatted by the app, so it needs no clock and
cannot disagree with the server.

**Departure from the source, consistent with CX-DCK:** the bar is painted with
the library's own tokens rather than the console's `--bell`/`--badge` pair,
which puts orange on the notification bell in light mode. Orange stays on
location and primary action.
