---
"@cyonix/ui": minor
"@cyonix/theme": minor
---

Add the overlay family under a new `@cyonix/ui/overlays` export, all sharing one
`useOverlay` hook so focus, Escape and scroll-lock behave identically.

- `useOverlay` — focus trap (both directions), focus restore, Escape via an
  overlay stack so only the topmost dismisses, reference-counted body
  scroll-lock, and portal rendering.
- `Modal` (CX-MOD) — sm/md/lg, hairline-separated header/body/footer.
- `Drawer` (CX-DRW) — right-anchored 480/640, next/previous, bottom sheet below `sm`.
- `ConfirmDialog` + `ImpactBox` (CX-CNF) — consequence-first title, reversible
  line in the success tone, guidance line, actor attribution, optional
  type-to-confirm and reason capture.
- `Menu` (CX-MNU) — portal-positioned with viewport flip, keyboard navigation,
  outside-click dismissal, destructive items sorted last below a separator.

`@cyonix/theme` gains `--container-drawer{,-wide}` and the `modal-in`,
`drawer-in` and `fade-in` animations.
