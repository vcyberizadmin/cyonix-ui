---
"@vcyberizadmin/ui": minor
---

Add the step-3 primitives: CX-TAG, CX-STE and CX-INS.

CX-TAG — `Tag`, `ChipStack`, `Code`. Identity dots come from the categorical
ramp, never the severity ladder, because a module is not ranked. A filtering tag
gets a resting-state affordance rather than a hover-only one, so it actually
looks clickable. Overflow collapses to +n with the remainder on hover.

CX-STE — `EmptyState`, `ErrorState`, `Skeleton`. `EmptyState.variant` is
required, so the "nothing exists yet" vs "nothing matches" distinction cannot be
skipped — conflating them is the dead-end screen this component removes. Error
takes the danger tone on its left rule only, never a full red panel. Skeletons
are suppressed for 200ms so fast loads never flash, and reserve their height so
appearing does not shift the page.

CX-INS — `Note`, `InsightPanel`. `NoteTone` has no brand member, which makes an
orange callout unrepresentable rather than merely discouraged. `InsightPanel`
carries a labelled badge header, a confidence signal, and cites the records it
derives from so a claim can be checked; suggested actions are chips, never
auto-executed.

`Tag`, `EmptyState`, `ErrorState`, `Note` and `InsightPanel` are server-safe;
only `Code` (clipboard) and `Skeleton` (the 200ms timer) are client components.
