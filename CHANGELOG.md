# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).
Add notes under **Unreleased** as you work; `npm run release -- <patch|minor|major>` moves them under the new version.

## [Unreleased]

## [0.1.0] - 2026-11-04
### Added
- Next.js 16.4.5 App Router + TypeScript + Tailwind CSS 4 project with exact pinned dependencies.
- Typed, validated DummyJSON data access (`lib/api.ts`), distinguishing not-found from upstream failure, with an 8 s timeout.
- Server Data Cache: shared catalogue entry (60 s, tag `catalogue`) and per-product entries (60 s, tags `product`, `product-{id}`).
- **Refresh catalogue** Server Action (`updateTag`) and `POST /api/refresh` Route Handler.
- Catalogue: search (300 ms debounce), category filter, sort, 12-per-page pagination, all stored in the URL and validated.
- Product detail route with metadata, not-found and error boundaries.
- Favourites in `localStorage` with a saved-only view and no hydration warnings.
- Responsive layout (375 / 768 / 1280 px), loading skeletons, and empty and error states.
- Fixture mode (`DATA_SOURCE=fixture`) and a logging mock origin (`npm run mock-origin`).
- Vitest unit and integration tests (30), plus the automated cache evidence script (`npm run evidence`).
- CI (lint, typecheck, test, build, cache evidence), automatic GitHub Releases, and versioning hooks.

### Changed
- Turned off `cacheComponents`, which `create-next-app` enables by default, in favour of explicit fetch caching.
