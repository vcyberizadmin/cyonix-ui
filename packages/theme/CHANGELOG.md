# @vcyberizadmin/theme

## 0.1.0

### Minor Changes

- 9426308: Initial packages.

  `@vcyberizadmin/theme` — the canonical CX-TOK token contract, transcribed from the
  brand guidelines and the console design system of record. Three layers (ramp →
  role → `@theme inline`), dark-first, light via either `.light` or
  `[data-theme="light"]`. Includes the chamfer, the logo-spark scope, and explicit
  `@utility` declarations for the motion durations.

  `@vcyberizadmin/ui` — `Button` (CX-BTN, six brand variants with the chamfer and an
  in-place loading state) and `Card` (CX-CRD, header/hint/one-level nesting, no
  shadow at rest).

- 9426308: Add `NavRail` (CX-NAV) under the new `@vcyberizadmin/ui/layout` export.

  Merges the three consoles as the standard directs: Tenant's rendering, SOC's
  data model (`liveBadge` slot, `tag` pill), VAPT's affordances (labelled
  "Minimize menu" control, independent group and section expand). Portable across
  repos via a `linkComponent` prop and a prop-driven `activeHref` rather than an
  internal router call. Collapse and mini state persist per user.

  `@vcyberizadmin/theme` gains `--container-rail` / `--container-rail-mini` (300px / 68px).

- 9426308: Add the overlay family under a new `@vcyberizadmin/ui/overlays` export, all sharing one
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

  `@vcyberizadmin/theme` gains `--container-drawer{,-wide}` and the `modal-in`,
  `drawer-in` and `fade-in` animations.

- 9426308: Add CX-STA — `StatusPill` and `SeverityBadge`, plus the vocabulary at
  `@vcyberizadmin/ui/lib/status`.

  Two languages that never share an axis: semantic (what happened, shaped dot) and
  severity (how bad, ranked, 3px leading bar). Brand orange is excluded from both.
  Colour never carries meaning alone — every tone owns a distinct shape (filled
  circle, haloed circle, diamond, hollow ring, square, absent) so the vocabulary
  survives colour-blindness and greyscale print.

  Ships `severityRank()` and `bySeverity()` for Critical-first sorting,
  `extendVocabulary()` so VAPT and SOC states layer over the base without forking,
  a liveness pulse on running states, and the categorical + sequential chart ramps
  so charts inherit the same discipline.

  `@vcyberizadmin/theme` gains the `--cat-1..6` and `--seq-1..8` ramps.
