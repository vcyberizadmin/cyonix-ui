---
"@vcyberizadmin/ui": minor
---

Add CX-FLD — `Field`, `FieldGrid`, `Input`, `Textarea`, `Select`, `Checkbox`,
`Switch`.

Tenant is the sole owner of a real field primitive; SOC and VAPT inline their
inputs per page, so there was nothing to reconcile. The point of the component is
accessibility that is automatic rather than remembered per page: Field generates
its own id, associates the label, and wires `aria-describedby` and
`aria-invalid` onto whatever control sits inside it.

Two API shapes instead of one. The standard flags Tenant's render prop as
"unusual and slightly verbose"; rather than document the awkwardness, controls
now read the wiring from context — `<Field label="Name"><Input /></Field>` — with
the render prop retained for third-party controls that cannot.

Hint and error share ONE slot, so an error replaces the hint in place and the
layout never jumps. Required is the assumed default and only exceptions are
marked `optional`. A disabled field states why, as visible text rather than a
title attribute.

Controls take radius-sm on all four corners — the chamfer stays buttons-only —
with a hairline border that goes orange on focus. `FieldGrid` is two columns
above 720px and one below.

Two defects found by measuring the rendered output:
  - `Switch` had a `size-0` input, so the visible control had NO hit area and
    only the label could toggle it. It is now a fixed box with the input filling
    it.
  - an inline control sat 5px below its own label. The control is now centred on
    the label's first line box instead of nudged with a magic margin.
