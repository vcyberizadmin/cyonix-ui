---
"@vcyberizadmin/ui": patch
---

Fix overlays not taking focus when mounted already open

`Modal`, `Drawer`, `ConfirmDialog` and `CommandPalette` moved focus into the
panel only when they transitioned closed → open. One rendered already open —
from a route, or from URL state — left focus on `<body>`.

Every overlay renders through a portal, and `usePortalTarget` only resolves in
an effect, so on the render where `open` becomes true the panel is not in the
DOM yet and `panelRef.current` is still null. `useOverlay`'s effect keyed on
`open`, fired once against that null ref, and never ran again.

Nothing errored. Escape and the scroll lock still worked, so the overlay looked
correct. What was lost:

- The dialog title was never announced — the reason focus goes to the panel
  rather than the first field.
- The Tab trap only intervenes once focus is already inside the panel, so the
  first Tab walked into the page behind the scrim.
- `ConfirmDialog`'s guarantee that Cancel holds default focus was inert, so
  Enter could reach the destructive action. `initialFocus` points at a node
  inside the portal, which was null at exactly the same moment.

`useOverlay` now mirrors the panel node into state and focuses in a separate
effect that depends on it, so focus happens whenever the panel actually lands.
Deliberately not a `ready` flag each overlay passes in: a flag every future
overlay must remember is the same bug waiting to happen.
