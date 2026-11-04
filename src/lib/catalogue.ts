/**
 * Pure catalogue logic: URL query parsing + filter -> sort -> paginate.
 * No framework imports, so it's trivially unit-testable and usable on
 * both server and client.
 */

export const PAGE_SIZE = 12;

export const SORT_OPTIONS = {
  "title-asc": "Title: A–Z",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
export type SortKey = keyof typeof SORT_OPTIONS;
export const DEFAULT_SORT: SortKey = "title-asc";

export interface CatalogueQuery {
  q: string; // search text ("" = none)
  category: string | null; // slug, null = all
  sort: SortKey;
  page: number; // 1-based, requested (may be clamped later)
  saved: number[] | null; // saved-only view: list of ids, null = off
}

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const MAX_Q = 100;
const MAX_SAVED = 200;

/**
 * Validate untrusted URL params. Anything invalid falls back to a default
 * rather than erroring. `categories` = the valid slugs from the catalogue.
 */
export function parseQuery(params: RawParams, categories: readonly string[]): CatalogueQuery {
  const q = (first(params.q) ?? "").trim().slice(0, MAX_Q);

  const rawCat = first(params.category);
  const category = rawCat && categories.includes(rawCat) ? rawCat : null;

  const rawSort = first(params.sort);
  const sort = rawSort && rawSort in SORT_OPTIONS ? (rawSort as SortKey) : DEFAULT_SORT;

  const rawPage = first(params.page);
  const n = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page = n >= 1 && Number.isSafeInteger(n) ? n : 1;

  // saved=1,5,9 -> [1,5,9]; "saved=" (empty) -> [] (saved view with nothing saved)
  const rawSaved = first(params.saved);
  const saved =
    rawSaved === undefined
      ? null
      : [...new Set(rawSaved.split(",").filter((s) => /^\d+$/.test(s)).map(Number))].slice(
          0,
          MAX_SAVED,
        );

  return { q, category, sort, page, saved };
}

/** Serialize back to a query string, omitting defaults (keeps URLs clean). */
export function buildQueryString(query: Partial<CatalogueQuery>): string {
  const sp = new URLSearchParams();
  if (query.q) sp.set("q", query.q);
  if (query.category) sp.set("category", query.category);
  if (query.sort && query.sort !== DEFAULT_SORT) sp.set("sort", query.sort);
  if (query.saved) sp.set("saved", query.saved.join(","));
  if (query.page && query.page > 1) sp.set("page", String(query.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Unique sorted categories derived from the FULL catalogue. */
export function deriveCategories(products: readonly { category: string }[]): string[] {
  return [...new Set(products.map((p) => p.category))].sort();
}

interface Filterable {
  id: number;
  title: string;
  category: string;
  price: number;
}

export interface PageResult<T> {
  items: T[];
  total: number; // matching results across ALL pages
  page: number; // clamped to [1, totalPages]
  totalPages: number; // >= 1
  start: number; // 1-based index of first item shown (0 if empty)
  end: number;
}

/** filter -> sort -> paginate, over the full dataset. */
export function applyQuery<T extends Filterable>(
  products: readonly T[],
  query: CatalogueQuery,
): PageResult<T> {
  const needle = query.q.toLocaleLowerCase();
  const savedSet = query.saved ? new Set(query.saved) : null;

  const filtered = products.filter(
    (p) =>
      (!needle || p.title.toLocaleLowerCase().includes(needle)) &&
      (!query.category || p.category === query.category) &&
      (!savedSet || savedSet.has(p.id)),
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (query.sort) {
      case "price-asc":
        return a.price - b.price || a.id - b.id; // id tiebreak = stable, deterministic
      case "price-desc":
        return b.price - a.price || a.id - b.id;
      default:
        return a.title.localeCompare(b.title, "en", { sensitivity: "base" }) || a.id - b.id;
    }
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const offset = (page - 1) * PAGE_SIZE;
  const items = sorted.slice(offset, offset + PAGE_SIZE);

  return {
    items,
    total,
    page,
    totalPages,
    start: total === 0 ? 0 : offset + 1,
    end: offset + items.length,
  };
}

/** "home-decoration" -> "Home Decoration" */
export function formatCategory(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const formatPrice = (usd: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd);
