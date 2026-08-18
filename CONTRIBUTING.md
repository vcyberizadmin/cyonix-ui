# Contributing

## Adding a component

1. **Read the component's entry in `cyonix-component-standard.html` first.** It
   names the base app whose implementation wins, the operations the component
   must support, and the UI/UX rules — including which brand rules apply. Do not
   design from an existing app's code; the standard and the brand documents are
   the authority.
2. Create `packages/ui/src/<name>.tsx`.
3. **Decide the client boundary.** If the component holds state, uses a ref
   callback, or attaches an event handler, put `"use client"` on line 1. If it
   does not, leave the directive off so it stays renderable from a Server
   Component. Do not add it "just in case" — every client component you add
   widens the client bundle for all three apps.
4. Use `cva` for variants and `cn()` for merging incoming `className`.
5. Reference **role** tokens only (`bg-surface`, `text-fg`, `border-rule`,
   `bg-accent`), never ramp values (`bg-onyx`, `bg-dark-grey`). Roles are the
   CX-TOK contract and the only layer that swaps per theme; a ramp value
   hard-codes one theme's appearance into a shared component.
6. Export it from `src/index.ts`.
7. Add a story in `apps/storybook/stories/`, including a variant-matrix story.
8. Run `pnpm test`.

## Adding a token

Tokens live in [packages/theme/theme.css](packages/theme/theme.css), in two layers:

- **Ramps** — raw scale values. Adding one is a palette decision.
- **Aliases** — semantic roles. Components consume these.

If a token needs to change between dark and light, it must be an **alias**, and
the light override goes in the `.light` block. Ramps never change per theme.

### Check that your token actually becomes a utility

Tailwind v4 only promotes certain namespaces into utility classes —
`--color-*`, `--font-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`,
`--spacing`, and others. It does **not** promote everything. There is no
`--duration-*` namespace, which is why the motion tokens need explicit
`@utility` declarations.

`pnpm test` runs `verify-utilities`, which compiles Tailwind the way a consuming
app does and fails if a class the components reference does not resolve. Trust
it over your assumptions — a non-resolving class produces no error at all, just
silently missing styles.

Also: don't put a `**/` glob inside a CSS comment. It contains the comment
terminator and will break the parse in a confusing way.

## Releasing

```sh
pnpm changeset      # describe the change, pick the bump
```

Commit the generated file. On merge to `main`, CI opens a "Version Packages" PR;
merging that publishes.

Use `patch` for fixes, `minor` for new components or tokens, `major` for
renaming or removing anything a consuming app imports — including an alias token
name, since apps use those directly in their own markup.
