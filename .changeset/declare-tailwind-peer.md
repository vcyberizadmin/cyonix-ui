---
"@cyonix/ui": minor
---

Declare `tailwindcss` as a peer dependency

The components are built from Tailwind utility classes and ship no CSS of their
own, so the library has always required Tailwind v4 in the consuming app. That
requirement was never declared: `tailwindcss` sat in `devDependencies` only, so
npm and pnpm had no way to tell a consumer they were missing it, or were on v3.

The failure mode this produced is the worst kind. Nothing errors. Tailwind
generates none of the utilities the components reference, so every component
renders completely unstyled, and the app author has no signal pointing at the
cause.

Declaring `tailwindcss: ">=4"` as a peer means the package manager says so at
install time instead.

Anyone already using this library necessarily has Tailwind v4, since otherwise
nothing was rendering. Strict-peer setups may now surface a warning that was
always true but previously invisible.
