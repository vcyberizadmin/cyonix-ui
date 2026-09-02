# Platform sync: GitHub and GitLab

This repository lives on two hosts. GitHub is primary: it holds the mainline and
is where every change is finally reviewed and merged. GitLab receives a mirror,
and work done on GitLab flows back through a channel branch.

## Remotes

| Name     | URL                                           | Role                   |
| -------- | --------------------------------------------- | ---------------------- |
| `origin` | `git@github.com:vcyberizadmin/cyonix-ui.git`  | Primary, PRs land here |
| `gitlab` | `git@gitlab.com:vcyberiz/cyonix-ui.git`       | Mirror                 |

## Branch mapping

Each host carries a branch named after the *other* host. That branch is the sync
channel: it always holds the code as it exists on the opposite platform.

| Content                | On GitHub | On GitLab    |
| ---------------------- | --------- | ------------ |
| Mainline               | `main`    | (not pushed) |
| Cross platform channel | `gitlab`  | `github`     |

- GitHub `main` is pushed to GitLab as `github`, which is how the GitLab side
  receives the mainline. It is the only ref the sync writes to GitLab, and it is
  the default branch on the GitLab project.
- GitHub `gitlab` receives whatever GitLab's `github` branch holds, which is how
  GitLab-side work arrives for review. Open a pull request from `gitlab` into
  `main`; never merge `main` into `gitlab` (that deadlocks the return hop).

Feature branches are local to their host and invisible to the other side until
merged into that host's channel branch.

## Automated sync (CI/CD)

| Job                                      | Trigger                 | Action                  |
| ---------------------------------------- | ----------------------- | ----------------------- |
| `.github/workflows/mirror-to-gitlab.yml` | push to GitHub `main`   | push to GitLab `github` |
| `.gitlab-ci.yml` → `mirror-to-github`    | push to GitLab `github` | push to GitHub `gitlab` |

A push to `main` fans out: GitHub Actions moves it to GitLab `github`, which
triggers GitLab CI to move it to GitHub `gitlab`. All three refs end on the same
commit.

The chain does not loop: GitHub `gitlab` is a write target and never a trigger
(the Actions workflow fires on `main` only), both jobs push existing commits
verbatim so a no-op push fires no event, and neither job force pushes. Do not
widen the Actions trigger to `[main, gitlab]` or `'**'`, and do not enable
GitLab's built-in push mirroring alongside these jobs; either creates a loop.

### Credentials

Each job authenticates with its own deploy key, so neither host holds a
credential that can write beyond the one repository it needs.

**GitHub Actions → GitLab**

1. Generate the pair:
   `ssh-keygen -t ed25519 -C "github-actions-mirror@cyonix-ui" -f gitlab_deploy_key -N ""`
2. GitLab project → **Settings > Repository > Deploy keys** → add
   `gitlab_deploy_key.pub`, and tick **Grant write permissions to this key**.
3. GitHub repository → **Settings > Secrets and variables > Actions** → new
   repository secret named `GITLAB_DEPLOY_KEY`, holding the full contents of the
   private file including the BEGIN and END lines.

**GitLab CI → GitHub**

1. Generate the pair:
   `ssh-keygen -t ed25519 -C "gitlab-ci-mirror@cyonix-ui" -f github_deploy_key -N ""`
2. GitHub repository → **Settings > Deploy keys** → add `github_deploy_key.pub`
   with **Allow write access** ticked.
3. GitLab project → **Settings > CI/CD > Variables** → add `GITHUB_DEPLOY_KEY`
   with type **File**, pasting the private key. File type matters: GitLab's
   masking cannot handle multi-line values, and the job reads it as a path.

Both private keys are generated without a passphrase, since an unattended job
cannot answer a prompt. Delete the local copies once installed.

## Manual fallback

```bash
# GitHub -> GitLab
git fetch origin --prune
git push gitlab origin/main:refs/heads/github

# GitLab -> GitHub
git fetch gitlab
git push origin gitlab/github:refs/heads/gitlab

# Check sync: identical SHAs mean the hosts agree
git fetch origin --prune && git fetch gitlab --prune
git rev-parse origin/main gitlab/github
```

Never run `git push gitlab --mirror`; it deletes remote refs absent from your
clone, including the `github` channel branch.

## Operational caveats

- The GitLab job needs a runner. GitLab.com shared runners on the Free tier
  require identity verification and draw from a monthly compute quota. If the
  pipeline never starts, check quota and verification before debugging the YAML.
- A red mirror-to-gitlab run usually means GitLab-side work is waiting for review
  on the GitHub `gitlab` branch. Merging that pull request into `main` resolves
  it; the next Actions run fast-forwards cleanly.
- Tags are not mirrored by either job. Push them explicitly when cutting a
  release: `git push gitlab --tags`.
