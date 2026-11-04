# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).
Add notes under **Unreleased** as you work; `npm run release -- <patch|minor|major>` moves them under the new version.

## [Unreleased]

## [0.3.1] - 2026-11-04
### Fixed
- Theme switch no longer "changes twice": CSS transitions (room tint, control colours) are suspended while the circular reveal runs, so the revealed theme is already final when it completes.

## [0.3.0] - 2026-11-04
### Changed
- Opening a product is instant: product pages are statically generated on first visit and revalidated every 60 s (ISR), so `<Link>` prefetches them in full and the card photo morphs straight into the detail hero. A thin light sweeps along the card caption if a page wasn't prefetched yet.
- The light/dark toggle reveals the new theme as a circle growing from the button (View Transitions API; instant with reduced motion or no support).

### Fixed
- **Saved** now toggles: pressing it while the saved view is open returns to all products.

## [0.2.1] - 2026-11-04
### Fixed
- The sticky category panel no longer slides under the header at the bottom of the page: its height is capped to the space between the header and the footer, and the list scrolls inside it.

## [0.2.0] - 2026-11-04
### Added
- `PRODUCT.md`: the product record (audience, brief constraints, evidence, principles) used to guide design work.
- Persistent light/dark theme toggle (follows the system until chosen; no flash, no hydration warning).

### Changed
- Visual redesign, "atelier glass": real refractive glass surfaces (SVG displacement over the backdrop with a circular-bezel profile, per-channel dispersion, frost, saturation, rim light and sheen; Chromium refracts, other browsers get frosted glass), a porcelain/obsidian room lit by colour sampled from the product you point at, Archivo Expanded display with Hanken Grotesk, and monochrome ink controls.
- Product detail page rebuilt: the card photo morphs into the hero (React `<ViewTransition>`), an angle gallery, and a glass spec panel that rises in.

### Removed
- `products/[id]/loading.tsx`: the detail route now waits for data inside the navigation transition so the shared-element morph can pair (a skeleton commit would break it).

## [0.1.1] - 2026-11-04
### Fixed
- CI typecheck on a clean checkout: `typecheck` now runs `next typegen` first so generated route types (`LayoutProps`) exist.

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
