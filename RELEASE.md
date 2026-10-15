# Releasing

Publishing is done by [`.github/workflows/release.yml`](./.github/workflows/release.yml) — it runs when a version bump in the root `package.json` is merged to `main`, publishes every public `@hiero-hackers/*` package to the [GitHub Packages npm registry](https://github.com/orgs/hiero-hackers/packages?repo_name=hiero-enterprise-js), tags the merge commit `v<version>` and opens a **draft** GitHub Release with that version's CHANGELOG section. Developers never publish from their machines, and there is no publish token to manage: the workflow authenticates with its own `GITHUB_TOKEN` (`packages: write`). Consumers need a token with `read:packages`; see [Installing the published packages](./CONTRIBUTING.md#installing-the-published-packages).

A release ships **whatever is on `main` at the release PR's merge commit** — it is not tied to any one feature branch. Merge everything you want included first, then cut the release as its own step.

Both packages are versioned **in lockstep**: one version number, one tag. The workflow refuses to publish if the root `package.json` and every `packages/*` version don't all agree.

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
5. Open a PR with the bump and changelog, get it reviewed, and merge to `main`. Set the CHANGELOG date to the day you merge.
6. Watch the **Release** workflow in the Actions tab. It publishes both packages, pushes the `v<version>` tag and creates a draft Release.
7. Review the draft under **Releases**, edit the notes if needed, and publish it.

**Notes**

- A merge that changes `package.json` without a new version does nothing: the workflow skips any version that already has a tag.
- `pnpm -r publish` skips the `private` root and samples, rewrites each `workspace:*` dependency to the version being published, and publishes in dependency order.
- Publishing a version that's already on the registry fails cleanly — there is no accidental double-publish. To fix a botched release, bump to the next patch; published versions are immutable.
- `workflow_dispatch` re-runs the workflow on `main` (e.g. after a failed publish). It releases the current version only if it has no tag yet.
