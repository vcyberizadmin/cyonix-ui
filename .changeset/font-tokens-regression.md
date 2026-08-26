---
"@vcyberizadmin/theme": patch
---

Restore `--display`, `--ui` and `--mono`. Rewriting the ramp layer for the
official token set deleted all three while the file kept referencing them, so
every heading and every line of body text in the library rendered in the system
font.

**It failed silently and totally.** A declaration whose value contains an
unresolvable `var()` is invalid at computed-value time — it does not fall back
to the previous rule, it inherits from the parent. `font-family: var(--display)`
with no `--display` produces no error, no warning and no visual clue. Measured
before the fix, `h1`, `body` and every mono element all reported the same
`-apple-system` stack; after it, Space Grotesk, Inter and JetBrains Mono.

The host apps were never at fault: `--font-space-grotesk` and its siblings were
defined throughout. Only the bridge between them and the `--font-*` utilities
was gone.

**A guard ships with the fix.** `verify-tokens` asserts that every `var(--x)` in
theme.css with no fallback resolves to a token the file defines, and runs as
part of `pnpm test`. Re-introducing the deletion now fails the build with the
three token names and their line numbers instead of shipping.

Two deliberate exemptions, both documented in the script: the three
`--font-*` families a consuming app supplies through `next/font`, and any
reference written with a fallback — `var(--cx-btn-bg, var(--bg))` degrades
safely by design, and only a bare `var()` takes the declaration down.
