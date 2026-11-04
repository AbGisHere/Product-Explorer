# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: GDG Tech reviewers grading Frontend Task II. They run the project locally or open the deployed URL, try every control
(search, category, sort, pagination, saved view, refresh), resize to 375 / 768 / 1280 px, tab through with a keyboard, break
the API on purpose, and then ask the author to explain and change the code. They are evaluating craft and correctness, not shopping.

The in-fiction user the interface serves is a shopper browsing a catalogue: finding products, opening details and saving favourites.

## Product Purpose
A responsive product discovery app over the public DummyJSON Products API. Its job is to show Next.js App Router architecture,
typed API integration and explicit server-side caching in a production build. Success means every functional, responsive,
accessibility and caching requirement in the brief can be shown working and explained.

Scoring weights: Tailwind and UI craft 25%, React and frontend behaviour 20%, Next.js implementation 20%, API fetching and
caching 25%, code quality and verification 10%. Core correctness comes before polish; extras earn no separate marks.

## Positioning
The catalogue is a real server-cached catalogue whose cache behaviour can be proven, not a static card grid. One shared
60-second cache entry serves every search, filter or sort URL. A manual Refresh invalidates it on the server. Origin-side
request logs (`npm run evidence`) prove cold, warm, timed, manual and failure scenarios.

## Operating Context
- Reviewers use a production build (`npm run build && npm start`) and/or the Vercel deployment.
- The DummyJSON API is the live data source. Fixture mode (`DATA_SOURCE=fixture`) is the labelled fallback.
- The local mock origin (`npm run mock-origin`) supports failure and recovery demos.
- Submission deliverables: the repo, the README, screenshots at 375 / 768 / 1280, a 3–5 minute demo video, cache evidence and an AI/authorship disclosure.

## Capabilities and Constraints
These are fixed by the task brief and must not regress:
- **Catalogue:**
  - Each card shows an image, title, category, price in USD, rating and a save toggle.
  - 12 products per page, with an accurate total of matching results.
- **Discovery:**
  - Case-insensitive title search, debounced by about 300 ms, plus a single category filter.
  - Sort by title A–Z, price ascending or price descending.
  - Changing search, category or sort resets to page 1.
  - Filtering, then sorting, then pagination run over the full dataset.
- **URL state:**
  - Search, category, sort and page live in the URL and are validated.
  - Refresh, direct links and back/forward restore the same view.
  - Older results never replace newer ones, and a pending state shows while navigation resolves.
- **Details:** `/products/[id]` shows the image, title, description, category, price, rating and stock, and calls `notFound()` for unknown or invalid ids.
- **Saved products:**
  - Favourites are kept in localStorage, with a saved-only view.
  - Save controls are consistent between the list and detail pages, with no hydration warnings.
- **Layout (from the wireframe):**
  - Header with the title, Saved (n) and Refresh catalogue.
  - Category sidebar, a search and sort toolbar, a "Showing x–y of n" line, the grid, and pagination below it.
  - At 1280 px: sidebar and three columns. At 768 px: two columns. At 375 px: one column with a category dropdown.
  - No horizontal scroll and no hidden primary actions at any width.
- **Required states:** loading skeletons inside a preserved shell, empty results with a reset action, a recoverable API error with retry, and a not-found page.
- **Images and metadata:** next/image with sizes and reserved space; long titles and missing images must not break the grid; product-specific metadata.
- **Caching:**
  - Catalogue revalidates every 60 s (tag `catalogue`). Each product revalidates every 60 s (tags `product`, `product-{id}`).
  - Refresh catalogue runs as a Server Action. It is disabled while pending and shows success or failure feedback.
  - `cacheComponents` is off on purpose.
- **Stack:**
  - Next.js 16 App Router, React 19, TypeScript and Tailwind 4, with exact pinned versions.
  - Icons and headless primitives are allowed. Pages and cards are hand-built.
- **Out of scope:** login, cart, checkout, payments, a database, persistent API mutations and a custom backend.
- **Allowed extras (unscored):** a persistent dark theme, reduced-motion-aware transitions, and extra accessibility improvements.

## Brand Commitments
- The name is "Product Explorer". It is a GDG Tech take-home submitted under the author's name.
- Typography, colours and imagery are the author's choice, but the wireframe's hierarchy and interactions must be kept.
- Product content comes from the API. Credit DummyJSON as the data source.

## Evidence on Hand
- `evidence/cache-evidence.md`: an automated run with all 14 scenarios passing, taken from the origin's request counter.
- 30 Vitest unit and integration tests.
- `fixtures/products.json` (194 products).
- Missing so far, and not to be faked: the screenshots, the demo video and the deployed URL. Never add fake reviews, stock claims, discounts or testimonials beyond the DummyJSON data.

## Product Principles
1. The brief is the spec. When the brief and taste conflict, follow the brief.
2. Correctness and explainability come before polish, because the author has to defend every line live.
3. The URL and the server cache are the source of truth, and client state is kept to a minimum.
4. Every state needs a design: loading, empty, error, not-found, pending and disabled.
5. Prefer low-risk, reversible changes to a working, graded submission.

## Accessibility & Inclusion
These are required by the brief:
- Semantic landmarks, labelled inputs and keyboard-operable controls with visible focus.
- Accessible names on icon buttons, meaningful alt text, and save toggles that expose their state (`aria-pressed`).
- Contrast at WCAG AA or better. Motion must respect `prefers-reduced-motion`.
