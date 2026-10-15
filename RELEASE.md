# Releasing

Publishing is done by [`.github/workflows/release.yml`](./.github/workflows/release.yml) — it runs when a `v*.*.*` tag is pushed and publishes every public `@hiero-hackers/*` package to the [GitHub Packages npm registry](https://github.com/orgs/hiero-hackers/packages?repo_name=hiero-enterprise-js), then cuts a GitHub Release for the tag. Developers never publish from their machines, and there is no publish token to manage: the workflow authenticates with its own `GITHUB_TOKEN` (`packages: write`). Consumers need a token with `read:packages`; see [Installing the published packages](./CONTRIBUTING.md#installing-the-published-packages).

A release ships **whatever is on `main` at the tagged commit** — it is not tied to any one feature branch. Merge everything you want included first, then cut the release as its own step.

Both packages are versioned **in lockstep**: one version number, one tag. The workflow refuses to publish if the tag, the root `package.json`, and every `packages/*` version don't all agree.

**To cut a release:**

1. Make sure everything intended for the release is merged to `main` and CI is green.
2. Choose the new version (pre-1.0: minor `0.x.0` for features, patch `0.0.x` for fixes) and bump the root **and** every publishable package to it, in lockstep:
   ```bash
   NEW=0.3.0
   pnpm --filter "./packages/*" exec npm pkg set version="$NEW"  # the published packages
   npm pkg set version="$NEW"                                    # repo root
   ```
   (The private `samples/*` are never published, so leave them alone.)
3. Optionally sanity-check what would go out — this rewrites `workspace:*` to real versions and packs, without uploading:
   ```bash
   pnpm install --frozen-lockfile && pnpm -r run build
   pnpm -r publish --dry-run --no-git-checks
   ```
4. In [`CHANGELOG.md`](./CHANGELOG.md), rename the `Unreleased` heading to the new version and date, point its link at the `vPREVIOUS...vNEW` comparison, and add a fresh `Unreleased` section above it comparing `vNEW...HEAD`.
5. Open a PR with the bump and changelog, get it reviewed, and merge to `main`.
6. From the merged commit on `main`, push a **signed** tag that matches the version (note the `v` prefix):
   ```bash
   git tag -s v0.3.0 -m "v0.3.0" && git push origin v0.3.0
   ```
7. Watch the **Release** workflow in the Actions tab. On success, both packages are live on the registry at the new version.

**Notes**

- The tag must equal the workspace version (`v0.3.0` ↔ `0.3.0`), or the workflow fails before publishing — this is a guard, not a suggestion.
- `pnpm -r publish` skips the `private` root and samples, rewrites each `workspace:*` dependency to the version being published, and publishes in dependency order.
- Re-pushing a tag for a version that's already on the registry fails cleanly — there is no accidental double-publish. To fix a botched release, bump to the next patch and tag again; published versions are immutable.
- `workflow_dispatch` can run the workflow manually (e.g. to re-attempt a failed publish); it skips the tag/version guards, so use it deliberately.
