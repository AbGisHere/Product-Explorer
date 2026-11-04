# Product Explorer

**Version:** `v0.3.0`

A responsive product discovery app (GDG Tech Frontend Task II): browse the DummyJSON
catalogue, search / filter / sort / paginate, view product details and save favourites,
with an explicit, **proven** server-side caching strategy.

Built with **Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS 4**.

- [Quick start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Caching](#caching)
- [Testing & verification](#testing--verification)
- [Scaling to a larger dataset](#scaling-to-a-larger-dataset)
- [Known limitations](#known-limitations)
- [Libraries, assets & authorship](#libraries-assets--authorship)

---

## Quick start

**Prerequisites:** Node.js ≥ 20.9 (developed on 25.7, CI on 24 — see `.nvmrc`), npm ≥ 10.

```bash
npm ci                 # exact versions from package-lock.json (also installs git hooks)
cp .env.example .env.local   # optional, defaults work out of the box

npm run dev            # development  → http://localhost:3000
npm run build && npm start   # production → http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (caching behaves differently in dev; verify caching with a production build) |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit + integration tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm run mock-origin` | Local mock of DummyJSON on :4000 that logs every origin hit |
| `npm run evidence` | Runs all cache scenarios against a production build (run `npm run build` first) |
| `npm run release -- <patch\|minor\|major>` | Bump the version everywhere (see [CONTRIBUTING](CONTRIBUTING.md)) |

### Configuration (`.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `DATA_SOURCE` | `api` | `api` = live API. `fixture` = offline mode, reads `fixtures/products.json` (same response shape). A **"Fixture mode"** badge shows in the header. |
| `API_BASE_URL` | `https://dummyjson.com` | Upstream origin. Set to `http://localhost:4000` to use the mock origin. |

Switch to fixture mode if DummyJSON is down: `DATA_SOURCE=fixture npm run dev`.
The normal API integration is untouched; fixture mode is a branch inside the same data-access functions.

---

## Features

- **Catalogue:** image, title, category, USD price, rating and save toggle; 12 per page; correct total of matching results.
- **Discovery:** case-insensitive title search (300 ms debounce) + single category filter + sort (Title A–Z, Price ↑, Price ↓). Any change resets to page 1.
- **URL state:** `q`, `category`, `sort`, `page`, `saved` live in the URL. Refresh, deep links and back/forward restore the exact view. Invalid values (unknown category, bad sort, `page=-4`, page beyond the end) fall back to safe defaults or are clamped.
- **Details:** `/products/[id]` with image, title, description, category, brand, price, rating and stock, plus product-specific `<title>`, description and Open Graph metadata. Works on a direct visit. Unknown or invalid ids show a helpful not-found page.
- **Saved products:** favourites stored in `localStorage`. The **Saved (n)** link opens a saved-only view, and toggles stay in sync between cards, the detail page and other tabs. No hydration warnings.
- **Refresh catalogue:** a Server Action that invalidates the server cache. The button is disabled while pending and shows a success or failure message.
- **States:** catalogue loading skeleton (the header shell stays in place), empty results with a reset action, an upstream error with **Try again**, and not-found pages.
- **Responsive:** 3-column grid with a sidebar at ≥1280 px; 2 columns with a category dropdown at 768 px; 1 column with stacked controls at 375 px.
- **Accessibility:** landmarks (`header`/`nav`/`main`/`footer`, `role="search"`), skip link, labelled inputs, a single visible focus style, `aria-current` on the active category and page, `aria-pressed` on save toggles, accessible names on icon buttons, live regions for result counts and refresh status, and `prefers-reduced-motion` support.
- **Design ("atelier glass"):** real refractive glass surfaces (`components/glass/`): an SVG displacement map with a circular-bezel profile bends the backdrop, red/green/blue are displaced by slightly different amounts (dispersion), then frosted and saturated, with a rim light and sheen. Chromium refracts; Safari/Firefox get frosted glass. The background "room" is lit by colour sampled from the product you hover/focus. Archivo Expanded + Hanken Grotesk, monochrome ink controls.
- **Dark theme:** persistent light/dark toggle; follows the system until chosen; applied before paint (no flash, no hydration warning).
- **Card → detail morph:** the card photo morphs into the detail hero with React `<ViewTransition>`; the detail glass panel rises in, and an angle gallery switches views. Respects `prefers-reduced-motion`.
- **Images:** `next/image` with `sizes` and `remotePatterns`, in fixed aspect-ratio boxes so space is reserved. Missing or broken images fall back to a placeholder without breaking the grid.

---

## Architecture

```
src/
  app/
    layout.tsx              Root shell: skip link, Header, <main>, footer
    page.tsx                Catalogue (Server Component): fetch → validate URL → filter/sort/paginate
    loading.tsx error.tsx not-found.tsx
    actions.ts              "use server" refreshCatalogue (updateTag)
    api/refresh/route.ts    POST twin of the action for scripts/curl
    products/[id]/          page.tsx (+ generateMetadata), error, not-found
  components/
    Header, RefreshButton, SavedLink            header
    CatalogueNav                                URL-state context, pending state, saved-view sync
    SearchInput, SortSelect, CategoryFilter     discovery controls
    ProductCard, ProductImage, SaveToggle, Pagination, DetailGallery, ThemeToggle
    glass/Glass, glass/optics, glass/Room, RoomLight   refracting glass + product-lit backdrop
    states.tsx, RouteError.tsx                  reusable Loading / Empty / Error
  lib/
    api.ts          server-only typed data access + cache config
    types.ts        Product types + response validation
    catalogue.ts    pure query parsing + filter/sort/paginate (unit-tested)
    favourites.ts   localStorage store (useSyncExternalStore)
scripts/            mock-origin.mjs, cache-evidence.mjs, version.mjs
tests/              unit/ + integration/
```

### Server / client boundary

| Server Components | Client Components (`"use client"`) |
|---|---|
| Catalogue and detail pages, Header, ProductCard, states | Search, sort and category controls, Pagination, SaveToggle, SavedLink, RefreshButton, ProductImage (error fallback), error boundaries |

- **The full catalogue (194 products, ~300 KB) never leaves the server.** The page sends only the 12 visible products, as slim `ProductSummary` objects (6 fields), plus the category list.
- **The URL is the single source of truth.** The server parses and validates it, then passes the *validated* query into `CatalogueNavProvider`. Controls call `navigate(patch)`, which runs `router.push` inside `startTransition`. The current results stay visible (dimmed, `aria-busy`) until the new render arrives, and the controls stay usable. If a newer navigation starts, Next's router discards the older one, so stale results can't overwrite newer ones. The debounce also collapses rapid typing into a single navigation.
- **Saved-only view boundary:** saved ids are passed in the URL (`/?saved=3,7,12`) and **validated on the server** (numeric, de-duplicated, capped at 200), then applied as one more filter before sort and pagination. That way the saved view reuses the same cached catalogue and the same pagination and sort code, and the client never needs product data. When the user un-saves an item in this view, `CatalogueNav` replaces the URL so the list stays in sync with `localStorage`.
- **Favourites are user-local:** they stay in `localStorage` only and never touch the shared server cache. `useSyncExternalStore` with an empty server snapshot means the SSR markup and the hydration render match, then React re-renders with the stored ids.

### Data access & errors

`lib/api.ts` (`import "server-only"`) wraps `fetch` with an 8 s timeout, checks the status, parses JSON and validates fields:

- Required fields (`id`, `title`, `price`, `category`): an invalid product is **skipped** instead of failing the whole catalogue.
- Optional fields (`description`, `rating`, `stock`, `thumbnail`, `brand`, `images`) get defaults. A missing thumbnail falls back to the first image, then to a placeholder.
- **Not found and upstream failure are handled differently.** `getProduct` returns `null` on a 404, and the page calls `notFound()`. Network errors, 5xx responses, invalid JSON or a bad shape throw `UpstreamError`, which goes to `error.tsx`. Its **Try again** button calls `router.refresh()` + `reset()` so the *server* render actually reruns.

---

## Caching

**Next.js 16.4.5, Cache Components OFF** (`cacheComponents: false` in `next.config.ts`; `create-next-app` 16.4 turns it on by default). I use the classic **Data Cache**, configured explicitly on every fetch, because the policy is visible at the call site and easy to prove with origin logs.

| Data | Fetch | Cache key / tags | Revalidate |
|---|---|---|---|
| Catalogue | `GET {API}/products?limit=0` | key = URL + options · tag `catalogue` | 60 s |
| Product detail | `GET {API}/products/{id}` | key per id · tags `product`, `product-{id}` | 60 s |

- **One catalogue entry for every view.** Every search, filter, sort, page or saved URL calls the *same* fetch, so they share one cache entry. Filtering happens in memory after the cached fetch.
- **The 60-second timer serves stale data while refreshing.** After 60 s, the next request gets the stale copy immediately and starts a background refetch; the request after that gets the fresh data. (See rows 7–8 of the evidence.)
- **Manual refresh blocks for fresh data.** The **Refresh catalogue** button calls a Server Action that runs `updateTag("catalogue")`. This expires the entry immediately, so the next read waits for the origin, and the action fetches from the origin itself before reporting success or failure. Next then re-renders the current route with the new data in the same response. `POST /api/refresh` does the same through `revalidateTag("catalogue", { expire: 0 })` (`updateTag` only works in Server Actions) and is what the evidence script uses.
- **Product pages are also route-cached (ISR).** `/products/[id]` exports `revalidate = 60` and an empty `generateStaticParams`, so each product page is rendered on its first visit and kept for 60 s, on top of its Data Cache entry. That lets `<Link>` prefetch the whole page, so opening a product is instant and the image morph works. Both layers use the same 60 s window, so this doesn't change when product data refreshes (the evidence still passes).
- **Failures are not cached.** A failed fetch throws and stores nothing, so every retry goes back to the origin.
- **Duplicate fetches in one render are removed.** `generateMetadata` and the detail page share one call through React `cache()`.

**List and detail data can briefly disagree.** The two caches expire independently. For example, the catalogue could be cached at 10:00:05 and product 1 at 10:00:50. If the price changes upstream at 10:00:30, the list shows the old price until about 10:01:05 and the detail page until about 10:01:50. **Refresh catalogue** only invalidates the `catalogue` tag; product details catch up within their own 60-second window. That's acceptable for browsing. A store would invalidate the `product-{id}` tags too, or use shorter windows for prices.

### Evidence

`npm run build && npm run evidence` starts the **mock origin** and `next start` with a **wiped fetch cache**, then runs every scenario. **Origin hits are counted by the origin server itself**, so a 0 really means Next's server cache answered (it isn't logged before the fetch call). Latest run: **[evidence/cache-evidence.md](evidence/cache-evidence.md)** (14/14 passed). CI runs it on every push and attaches the report to the job summary.

| Scenario | Origin hits |
|---|---|
| Cold request, then a warm repeat within 60 s | 1, then 0 |
| 4 different filter/sort/page/saved URLs | 0 (shared entry) |
| Detail id 1 cold/warm, id 2 cold | 1 / 0 / 1 |
| After 60 s: stale served + background revalidation, then follow-up | 1, then 0 |
| Upstream price bumped → still cached → manual refresh | 0, then 1 (new price shown) |
| Outage: refresh → error page; retry while down; recover; cached again | 1, 1, 1, 0 |

To reproduce by hand:

```bash
npm run mock-origin                                       # terminal 1: watch the origin log
API_BASE_URL=http://localhost:4000 npm run build && \
API_BASE_URL=http://localhost:4000 npm start              # terminal 2
curl -s localhost:4000/__fail?on=1    # simulate outage (on=0 to recover)
curl -s localhost:4000/__delay?ms=3000  # simulate slow origin
curl -s localhost:4000/__bump         # change product 1's price upstream
curl -s -XPOST localhost:3000/api/refresh   # invalidate catalogue cache
```

---

## Testing & verification

```bash
npm test
```

**30 tests, all passing** (Vitest 3 + Testing Library + jsdom):

| File | Covers |
|---|---|
| `tests/unit/catalogue.test.ts` (16) | URL validation and fallbacks, combined search + category + sort + pagination, filtering *before* pagination, page clamping, empty results, saved filter, query-string round-trip, page window |
| `tests/unit/api.test.ts` (7) | Response validation and defaults, cache options/tags passed to `fetch`, 404 → `null` vs. 5xx/network/bad-shape → `UpstreamError` |
| `tests/integration/url-state.test.tsx` (4) | Debounce (several keystrokes → **one** push after 300 ms), other params kept and page reset, sort and category write the URL, pagination hrefs, controls restored on back/forward without a new navigation |
| `tests/integration/favourites.test.tsx` (3) | Card and detail toggles in sync, `aria-pressed`, persistence after remount, Saved link count and href, corrupted storage ignored |

**CI** (`.github/workflows/ci.yml`) runs on every push and PR: version consistency, commit message format (PRs), lint, typecheck, tests, build, then the cache-evidence job.

**Manual checks** (done on the production build): combined controls, URL restoration on refresh and back/forward, saved state after reload, keyboard-only navigation (Tab, Enter, Space, arrow keys in selects), and 375 / 768 / 1280 px widths. Screenshots: `evidence/screenshots/` *(to be added)*.

---

## Scaling to a larger dataset

Fetching everything with `limit=0` works for 194 products and makes combined filters unambiguous, but it wouldn't scale. With a much larger dataset:

- **Push filtering, sorting and pagination to the backend:** `/products/search?q=`, `/products/category/{slug}`, `sortBy`/`order`, `limit=12&skip=…` (or a search service such as Algolia, Meilisearch or Postgres full-text). Each page would fetch only its own items.
- **Cache keys follow the query.** Each normalized query becomes its own cache entry (sorted params, so equivalent URLs share an entry), all tagged `catalogue` so one refresh still clears everything. Popular queries could be warmed ahead of time.
- **Use cursor pagination** for deep pages, and a dedicated `/categories` endpoint instead of deriving categories from all products.
- **Saved view:** fetch by ids (`/products?ids=…`, batched) instead of filtering the full set.
- **Faster invalidation:** webhooks from the product system call `revalidateTag("product-{id}")` for just the changed items.

---

## Known limitations

- **No skeleton on the detail route.** `products/[id]/loading.tsx` was removed so the card → detail morph can pair (React only morphs when the destination renders in the same commit as the navigation). The trade-off: opening a product waits for its data instead of showing a skeleton.
- **Unknown products return HTTP 200, not 404.** The root layout's streamed shell commits the status before `notFound()` runs; the not-found UI and a `noindex` meta tag are still sent.
- **Refraction is Chromium-only.** SVG filters in `backdrop-filter` are only supported by Chromium; other browsers get frosted glass with the same rim light.
- `?page=` beyond the last page is clamped when rendering, but the URL keeps the original value.
- `next dev` doesn't behave like production for caching. Verify caching with `npm run build && npm start`.
- Fixture mode has no network, so remote product images may not load; the placeholder appears instead.
- The saved view reflects *your* favourites. Opening someone else's `?saved=` link replaces the ids in the URL with your own.

---

## Libraries, assets & authorship

| Package | Purpose |
|---|---|
| `next` 16.4.5, `react` / `react-dom` 19.3.0 | Framework |
| `tailwindcss` 4.3.4, `@tailwindcss/turbopack` 4.3.4 | Styling |
| `server-only` 0.0.1 | Stops server data access from being imported on the client |
| `typescript` 5.9.3, `eslint` 9.39.5, `eslint-config-next` 16.4.5 | Tooling |
| `vitest` 3.2.7, `@testing-library/react` 16.3.3, `@testing-library/jest-dom` 7.0.1, `@testing-library/user-event` 14.6.8, `jsdom` 29.1.1, `@vitejs/plugin-react` 6.2.1, `vite-tsconfig-paths` 6.1.1 | Tests |

All versions are pinned exactly (`.npmrc` → `save-exact=true`) and locked in `package-lock.json`.

- **Data and images:** [DummyJSON](https://dummyjson.com/docs/products) (`cdn.dummyjson.com`). `fixtures/products.json` is a snapshot of `GET /products?limit=0`.
- **Font:** Geist (via `next/font/google`). **Icons:** hand-written inline SVGs; no icon library. No UI component libraries; all components are custom.
- **AI assistance:** built with Claude Code (Anthropic) as a pair programmer. Code was written step by step, then reviewed and verified by me (tests, production build and cache evidence).

Development workflow, commit convention and releases: see [CONTRIBUTING.md](CONTRIBUTING.md). Change history: [CHANGELOG.md](CHANGELOG.md).
