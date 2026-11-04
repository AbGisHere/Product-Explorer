# Contributing

## Setup

```bash
npm ci   # installs exact deps; the `prepare` script points git at .githooks/
```

If the hooks aren't active (e.g. you installed with `--ignore-scripts`), run
`git config core.hooksPath .githooks`.

## Every change is versioned

The version lives in `package.json` and is mirrored in `package-lock.json`, the top
release in `CHANGELOG.md`, the `**Version:**` line in `README.md`, and the app footer (which reads
`package.json`). `npm run version:check` verifies they all agree.

**Workflow for every push:**

1. Make your change.
2. Describe it under `## [Unreleased]` in `CHANGELOG.md` (Added / Changed / Fixed / Removed).
3. Update any other affected docs (README features, caching, tests, limitations).
4. Bump: `npm run release -- patch` (fix), `minor` (feature), or `major` (breaking).
   This updates every file listed above and moves the Unreleased notes under the new version.
5. Commit using the new version (see below), then push.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), with the **version as the scope**:

```
<type>(v<MAJOR.MINOR.PATCH>): <short imperative description>

feat(v0.2.0): add persistent dark theme
fix(v0.2.1): keep search box focused after back navigation
docs(v0.2.2): document fixture mode switch
```

Types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`.
Add `!` for breaking changes (`feat(v1.0.0)!: …`).

## What enforces it

| Where | Check |
|---|---|
| `.githooks/commit-msg` | Message format; the version in the message must equal `package.json` |
| `.githooks/pre-push` | Versions consistent; version **differs from the remote branch** (so it was bumped); tag doesn't already exist |
| CI (`ci.yml`) | Version consistency, PR commit messages, lint, typecheck, tests, build, cache evidence |
| Release (`release.yml`) | On push to `main`, a new version is tagged `vX.Y.Z` and published as a GitHub Release with its CHANGELOG notes |

## Before pushing

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run evidence   # if you touched data fetching or caching (~70 s)
```
