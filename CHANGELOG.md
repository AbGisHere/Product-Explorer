# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).
Add notes under **Unreleased** as you work; `npm run release -- <patch|minor|major>` moves them under the new version.

## [Unreleased]

## [1.0.3] - 2026-11-04
### Changed
- Light mode contrast: product photo boxes have a faint hairline edge and a slightly deeper fill, dividers are a touch stronger, and glass panels have a stronger rim and fill, so cards stand out from the background on phones, tablets and laptops.

### Docs
- README screenshots recaptured with the new light theme.

## [1.0.2] - 2026-11-04
### Docs
- README header uses badges instead of a text version line. The badges show the version, latest release tag, CI status, live site, tests, cache evidence, the stack versions and the data source. `npm run release` and `version:check` now read and update the version badge.

## [1.0.1] - 2026-11-04
### Docs
- README links the live site ([pm.abgupta.me](https://pm.abgupta.me)) and adds a Screenshots section: the catalogue at 375 / 768 / 1280 px in both themes, the product page, the combined filters, the saved view, empty results, the 404 and the phone controls. Images are in `evidence/screenshots/`, captured from production.

## [1.0.0] - 2026-11-04
### Release
- 1.0.0: first stable release of Product Explorer for GDG Frontend Task II. No code changes since 0.3.19.

## [0.3.19] - 2026-11-04
### Changed
- Pagination unfolds. Phones now show the neighbouring pages and the first and last page, like larger screens, with arrow icons for Previous and Next to save room. Tapping or clicking either "…", swiping sideways over the numbers, or scrolling sideways with a trackpad or wheel unfolds the pager into a scrollable strip of every page. The swipe that opens it keeps scrolling it, and on a laptop the vertical mouse wheel scrolls the open strip too. Picking a page glides the lens there, then the strip folds back. Clicking outside or pressing Escape also folds it.

## [0.3.18] - 2026-11-04
### Fixed
- Toolbar focus outlines sit 5px inside the field instead of 2px, so they no longer touch the divider or the toolbar's edge.

## [0.3.17] - 2026-11-04
### Changed
- Header buttons (Saved, Refresh catalogue, theme toggle) are now glass, matching the Save product and Back to catalogue buttons. They have a translucent fill, a lit rim and a soft shadow, with the dark glass for Refresh and for Saved while it's active.
### Fixed
- Search, Category and Sort focus outlines now match the toolbar. Each one is rounded only where it meets the toolbar's outer edge and straight where it meets a divider, on both the phone layout (stacked) and the one-row layout.
- The dark glass button style had picked up an extra outline from the lens change in 0.3.16. It's restored.
- Dropdowns on touch screens (phones and iPads, finger or Apple Pencil): the lens no longer chases your finger while you scroll the list. It glides only to the row you tap, and the panel closes once it lands. A mouse or trackpad (an iPad with a trackpad included) still makes it follow the pointer.

## [0.3.16] - 2026-11-04
### Changed
- Category (on phones and tablets) and Sort are now glass dropdowns instead of the system pickers. The same gliding lens follows your pointer or the arrow keys, with a check mark on the current choice. Full keyboard support: arrows, Home/End, Page Up/Down, Enter/Space, Escape and type-to-jump. Screen readers get the standard combobox and listbox roles. The panel opens upward when there isn't room below.
- The lens is more visible: same-tone glass (white on light, black on dark) with a crisper lit rim, an outline and a drop shadow.

## [0.3.15] - 2026-11-04
### Changed
- Pagination: the current page is marked by a glass lens that glides to the page you click, the same way the category lens does. It moves at once instead of waiting for the server, and it carries an inverted copy of the labels so the number under it stays readable on every frame.
- Page changes are smoother. The pager sits outside the dimmed results so it stays sharp while loading, the page scrolls smoothly back to the results heading, and the new cards settle in one after another instead of snapping in.

## [0.3.14] - 2026-11-04
### Changed
- Header: clear glass instead of frosted. Blur drops from 2px to 0.7px and the curved rim narrows from 20px to 14px, so content stays sharp through the middle of the bar and bends, with colour fringes, only at the edges.

## [0.3.13] - 2026-11-04
### Added
- Own icon set: an SVG favicon (an ink tile with the glass selection lens, inverted for dark browser chrome), plus favicon.ico, an Apple touch icon, a web manifest and a social preview image. The template Next.js and Vercel SVGs in `public/` are removed.
- `global-error.tsx`: a branded last-resort error page, replacing Next's default when the root layout itself fails.
- Tab titles for every state: "Page not found", "Product not found", and the error boundary's message. Theme-colour meta tags match the room colour in each theme.
- README: an "Out of scope" section (no auth, payments or API mutations).

### Fixed
- Category sidebar: the inverted label now always sits exactly under the moving lens. The lens carries its own clipped copy of the labels, so text no longer vanishes mid-glide.
- Product 404 page: lost a saved dark theme, and dev mode flagged a client-rendered `<script>`. The theme script now renders in the server HTML only and is re-applied when Next re-renders the root layout.
### Changed
- Category sidebar: the selection lens is now tinted ink glass (dark in the light theme, light in the dark theme) with inverted text, so it is clearly visible in light mode. It keeps a lit top edge and sheen so it still reads as glass.

## [0.3.12] - 2026-11-04
### Changed
- Detail page: "Save product" and "Back to catalogue" are glass buttons (lit rim, frosted fill), matching the sidebar lens. Saving fills the glass with ink and unsaving clears it, both with a smooth fade.

## [0.3.11] - 2026-11-04
### Changed
- Dark mode contrast: product photo boxes have a faint hairline edge and a slightly lighter fill, the room is a touch lighter, and glass panels have a stronger rim and fill, so boxes no longer melt into the background on phones.

## [0.3.10] - 2026-11-04
### Changed
- Phone layout: the header fits on one row (the title stacks onto two lines), category and sort sit side by side under the search, product photos are square instead of 4:5, and spacing is tighter. The first product is now fully visible at 375px. The toolbar stays stacked up to 768px so the search field isn't squeezed.

## [0.3.9] - 2026-11-04
### Changed
- Touch targets: the detail-page breadcrumb links and the footer DummyJSON link now have a 44px tap height without changing the layout. On touch screens at 1024px and wider, the category sidebar rows are taller.

## [0.3.8] - 2026-11-04
### Fixed
- Photo flight on high-density (Retina) screens in light mode: the flying copy showed only an enlarged, faint corner of the photo. With srcset, the browser reports a 2x photo at half its real pixel size, and the copy was drawn unscaled. It is now scaled to the canvas, so the whole photo flies.

## [0.3.7] - 2026-11-04
### Changed
- Category sidebar: the selection is now a clear glass lens (lit rim, inner glow, refraction in Chromium) instead of a solid ink pill. It glides between categories on a slight spring the moment you click, without waiting for the server, and the chosen label nudges in.

## [0.3.6] - 2026-11-04
### Fixed
- No box around the flying photo: v0.3.5 gave the flying copy a solid backing, which showed as a visible rectangle over the page. In light mode the copy is now the photo with its studio white turned into transparency (colour-to-alpha on a canvas), so it looks the same as the blended on-page photo over anything; in dark mode it is the plain photo, as on the page.

## [0.3.5] - 2026-11-04
### Fixed
- Photo flight lands invisibly: the card's full-size hero photo is preloaded on hover (same srcset and `sizes` as the detail hero), the flight is a single `<img>` placed on the exact painted picture (object-contain inside padding) at both ends, and it hands over to the real photo in the same frame once that photo is loaded. No fades, no size or quality jump.
- The photo keeps its colour in flight, both ways and in both themes: the flying copy carries its own backing in the colour the photo sits on and blends onto that (multiply in light mode), instead of depending on whatever it passes over (it went darker on the way in and lighter on the way out).

## [0.3.4] - 2026-11-04
### Changed
- **Photo morph no longer uses View Transitions.** Chrome shows the page as snapshots during a view transition and doesn't draw the glass refraction in them, so glass flashed clear and popped back in afterwards. The card ↔ detail morph is now a FLIP flight of a clone of the real photo (`FlipPhoto`), so the live page and glass stay on screen throughout. It works in both directions, including the browser back button and swipe, and survives React Strict Mode's dev-only double mount (which used to cancel the flight in `npm run dev`).
- **Theme switch is now a palette morph instead of the circular reveal.** Every colour token is a registered `<color>` custom property, so the page, room and live glass ease from one theme to the other together (650 ms), with nothing popping in afterwards.
- The detail panel's entrance is a plain CSS animation.

### Fixed
- No more resolution snap when the photo lands: the flying clone cross-fades into the real photo, and on the detail page the card thumbnail stays underneath until the full-size photo has fully faded in.

## [0.3.3] - 2026-11-04
### Changed
- **Refresh catalogue** folds from a pill into a circle on first press, with "Refreshed at 2:34 PM" (or the failure) beside it; pressing the circle refreshes again and updates the time.
- The product hero shows the card's already-cached photo first, so the morph lands on the same picture and the full-size photo fades in over it instead of popping in.

### Fixed
- **Back to catalogue** (and the breadcrumb) goes back in history when you came from the catalogue, restoring the same search, filters, page and scroll position, and the hero photo morphs back into its card (a hand-run View Transition, since history restores happen outside React transitions).

## [0.3.2] - 2026-11-04
### Fixed
- Card → detail morph now actually plays. The catalogue's root `loading.tsx` also wrapped product pages, so opening a product suspended into the catalogue skeleton and React never formed the shared-element pair. The catalogue page and its skeleton moved into a `(catalogue)` route group (URLs unchanged).
- Moving the pointer or focus off a product returns the room's light to neutral.
- The "Catalogue updated" message sits below the header bar instead of on its edge.

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
