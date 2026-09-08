# Publishing to npm

`@cyonix/theme` and `@cyonix/ui` are published publicly to **npmjs.com** under
the `cyonix` organisation. Public scoped packages are free, so this costs
nothing, and consumers install them with no token, no `.npmrc` and no registry
mapping:

```sh
pnpm add @cyonix/ui @cyonix/theme
```

## Why not GitHub Packages

The packages used to live on GitHub Packages as `@vcyberizadmin/*`. Two of that
registry's rules made it a poor fit:

1. **The scope must match the account owning the repository.** This repo is
   owned by `vcyberizadmin`, so the packages could not be called `@cyonix/*`
   there at all. The scope carried an admin account name instead of the product
   name, and no token configuration could change that.
2. **Every read needs an authenticated token, even for a public package.** An
   unauthenticated request returns `401 authentication token not provided`, not
   the tarball. So each consuming app, each developer machine and each CI job
   needed a GitHub PAT carrying `read:packages` purely to install a public
   library, and a token missing that scope failed with:

   ```
   403 Forbidden - GET https://npm.pkg.github.com/@vcyberizadmin%2fui
   Permission permission_denied: The token provided does not match expected scopes.
   ```

npmjs.com has neither rule. The move traded a registry that constrained the name
and gated every install for one that does neither.

The consequence is that GitHub Packages can no longer receive these packages,
because `@cyonix` does not match the `vcyberizadmin` owner. Versions already
published under the old scope keep resolving for anything still pointed at them,
but they receive no new releases.

## One-time setup

Only needed once per person, or when rotating CI credentials.

### An npm account in the org

You must be a member of the `cyonix` organisation on npmjs.com. Check with:

```sh
npm whoami        # who you are
npm org ls cyonix # your role in the org
```

`developer` is enough to publish. `owner` is needed to add members or change
billing. If `npm whoami` reports `ENEEDAUTH`, run `npm login` and complete the
browser flow.

### CI credentials, and the January 2027 deadline

**Do not build the release pipeline on a long-lived publish token.** npm is
retiring them:

| When | What changes |
| ---- | ------------ |
| August 2026 (done) | Bypass-2FA tokens can no longer perform sensitive account, package or org actions: creating tokens, changing 2FA or email, altering package access or maintainers, editing trusted-publishing config, managing org membership. |
| January 2027 | Bypass-2FA tokens lose direct publish. Their remaining surface is reading private packages and *staging* a publish that a maintainer must then approve with 2FA. |

So a granular token with **Bypass 2FA** will publish today and stop working in
January. It is a stopgap, not the destination.

The destination is **trusted publishing**: GitHub Actions proves its identity to
npm over OIDC and receives a short-lived, workflow-scoped credential. Nothing
long-lived is stored anywhere, so there is no token to leak, rotate or watch
expire. Configure it at npmjs.com > the package > **Settings > Trusted
Publisher**:

| Field | Value |
| ----- | ----- |
| Organization/username | `vcyberizadmin` |
| Repository | `cyonix-ui` |
| Workflow filename | `release.yml` |
| Environment | optional, for deployment protection |

Then in the workflow:

```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write   # required for OIDC
```

Once it works, npmjs.com offers **"Require two-factor authentication and
disallow tokens"** on the package, which closes off token publishing entirely.

Three things to check before relying on it, none of which are configured in this
repo yet:

- **npm CLI 11.5.1+ and Node 22.14.0+.** `actions/setup-node@v4` with
  `node-version: 22` currently supplies npm 10.x, which is too old. The workflow
  needs an explicit `npm i -g npm@latest` step or a newer pinned Node.
- **Whether `changeset publish` under pnpm negotiates OIDC.** Releases here go
  through changesets, not a bare `npm publish`, and that path needs verifying
  against the installed versions before the first trusted-publish release.
- **Whether a package must already exist** before a trusted publisher can be
  configured for it. npm's docs describe navigating to an existing package's
  settings and do not address pre-publication setup, so assume the first publish
  of any new name is manual.

Trusted publishing also generates provenance attestations automatically for
public packages from public repos, which makes the separate provenance section
below unnecessary once it is on.

Until that is in place, releases run on a granular token held as the repository
secret `NPM_TOKEN` (GitHub repo > Settings > Secrets and variables > Actions).
Generate it at npmjs.com > Access Tokens > Granular Access Token with:

- **Packages and scopes**: read and write, selecting the **`@cyonix` scope**
  rather than individual packages. A token limited to named packages cannot
  create new ones, so scoping it to packages breaks the first publish of any
  name that does not exist yet.
- **Bypass 2FA**: enabled. Without it CI fails with `EOTP`, because it cannot
  answer an authenticator prompt.
- **Expiration**: before January 2027, so it fails loudly on a date you chose
  rather than mysteriously on one npm chose.

## The normal release flow

Releases are driven by [changesets](https://github.com/changesets/changesets).
Nothing is published by hand.

**1. Describe the change.** On your feature branch, after making the change:

```sh
pnpm changeset
```

It asks which packages changed and whether each is a major, minor or patch, then
writes a markdown file under `.changeset/`. Commit that file with your work. The
prose you write becomes the changelog entry, so write it for someone reading the
release notes, not for a diff.

Pick the bump honestly:

| Bump | When |
| ----- | ---- |
| `patch` | Bug fix, no API change. A token value moves, a component stops mis-rendering. |
| `minor` | New component, new export, new optional prop. Existing code keeps working. |
| `major` | Anything existing code must be edited for. A removed export, a renamed prop, a changed default. |

`@cyonix/ui` depends on `@cyonix/theme` through `workspace:*`, so changesets
bumps `ui` automatically when `theme` changes. `updateInternalDependencies` is
set to `patch` in `.changeset/config.json`.

**2. Merge to `main`.** The Release workflow runs `pnpm test`, then opens (or
updates) a pull request titled **"chore: version packages"**. That PR is
generated, not written: it applies every pending changeset, bumps the versions
in `package.json`, rewrites the `CHANGELOG.md` files and deletes the consumed
changeset files.

**3. Merge the "Version Packages" PR.** *This* is the publish. Merging it runs
the workflow again, which now finds versions not on the registry and runs
`pnpm release` (`pnpm build && changeset publish`).

So a release is two merges: your change, then the generated version PR. If no
changesets are pending, no version PR appears and nothing publishes.

## Publishing by hand

For the first publish under a new name, or to recover when CI cannot run. Use it
sparingly: a hand publish does not write changelogs or bump versions, so the
repo and the registry can drift.

```sh
# From the repo root, on a clean tree at the commit you want to publish.
pnpm install --frozen-lockfile
pnpm test          # do not skip; this is the only gate
pnpm build

pnpm release       # changeset publish: publishes only versions not yet on npm
```

To publish a single package instead:

```sh
cd packages/ui
pnpm publish --access public
```

Use `pnpm publish`, not `npm publish`. pnpm rewrites `workspace:*` dependency
ranges into real version ranges on the way out; npm publishes the literal string
`workspace:*`, which no consumer can resolve.

Check what a tarball will contain before sending it:

```sh
cd packages/ui && npm pack --dry-run
```

Only `dist/` ships for `ui` and only `theme.css` for `theme`, per the `files`
field in each `package.json`.

## Verifying a publish

```sh
npm view @cyonix/ui version          # what the registry thinks is latest
npm view @cyonix/ui                  # full metadata, including all versions
npm view @cyonix/ui dist-tags

# A real end-to-end check: install it somewhere with no workspace linking.
cd "$(mktemp -d)" && npm init -y >/dev/null && npm i @cyonix/ui
```

The last one is worth doing after the first publish of any new name. It is the
only check that exercises the same path a consumer takes, including whether the
`exports` map resolves and whether `dist/` actually made it into the tarball.

## Troubleshooting

| Error | Cause | Fix |
| ----- | ----- | --- |
| `402 Payment Required ... You must sign up for private packages` | `publishConfig.access` is `restricted`. Scoped packages default to private on npm, and private is a paid plan. | Set `"access": "public"` in the package's `publishConfig` and in `.changeset/config.json`. |
| `404 Not Found - PUT .../@cyonix%2fui` | The `cyonix` org does not exist, or you are not a member of it. npm reports a permission problem as a 404 to avoid confirming that a private name exists. | `npm org ls cyonix`. If it errors, get added to the org. |
| `403 Forbidden ... you do not have permission to publish` | Someone else owns the name, or your account lacks write access in the org. | `npm view <name>` to see who holds it. |
| `E409 Conflict` / `cannot publish over previously published version` | That exact version is already on the registry. npm versions are immutable. | Bump the version. Never try to overwrite. |
| `EOTP` / `This operation requires a one-time password` | Publishing with 2FA from a non-interactive context. | Pass `--otp=<code>` from your authenticator, or use a token that bypasses 2FA. |
| `E403 ... Two-factor authentication or granular access token with bypass 2fa enabled is required` | The org enforces 2FA on publish and the credential in use cannot satisfy it. A browser `npm login` session cannot: it is not a 2FA-bypassing token. | Either publish interactively with `pnpm release --otp=<code>`, or configure a granular token with **Bypass 2FA** as described above. |
| `ENEEDAUTH` | Not logged in. | `npm login`. |
| Consumer gets `workspace:*` unresolvable | Published with `npm publish` instead of `pnpm publish`. | Republish with a bumped version using `pnpm publish`. |

### Unpublishing is mostly not possible

npm allows `npm unpublish` only within **72 hours** of publishing, and only if
nothing else depends on the package. After that the version is permanent. A
package name, once used, cannot be reused by anyone even after unpublishing.

This is why the scope decision was made before the first publish rather than
after. If a bad version ships, the remedy is to publish a fixed version and
deprecate the bad one:

```sh
npm deprecate @cyonix/ui@1.0.1 "Broken exports map, use 1.0.2"
```

Deprecation leaves the version installable but prints a warning, which is the
right tool when something is wrong but not dangerous.

## Optional: build provenance

Trusted publishing turns this on by itself, so this section only applies while
releases still run on a token.

npm can attach a signed, verifiable link from a published package back to the
exact source commit and workflow run that built it, shown as a "Provenance"
badge on the package page. It costs one workflow permission and one flag:

```yaml
permissions:
  id-token: write   # alongside contents: write, pull-requests: write
```

```jsonc
// in each package.json
"publishConfig": { "access": "public", "provenance": true }
```

It only works from a supported CI provider, so a local `pnpm publish` will fail
with provenance enabled unless you pass `--no-provenance`. Worth turning on for
public packages, since it lets consumers confirm the tarball matches the repo.

## Consuming the packages

Nothing special is required:

```sh
pnpm add @cyonix/ui @cyonix/theme
```

Then, in the consuming app's CSS entry point:

```css
@import "@cyonix/theme";
@source "../../../node_modules/@cyonix/ui/dist/**/*.js";
```

The `@source` line is what tells Tailwind v4 to scan the shipped components for
the utility classes they reference. Miss it and the components render completely
unstyled.

The path is relative to the CSS file, so count the hops from wherever that file
actually sits up to `node_modules`. The three levels above suit a file at
`src/styles/app.css`; a file at `src/main.css` needs two. Getting this wrong
fails silently, with no error and no styles, so verify it renders rather than
assuming. See the README's integration section for the full walkthrough.
