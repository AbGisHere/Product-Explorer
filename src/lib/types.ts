/**
 * Product types + runtime validation for DummyJSON responses.
 *
 * We only validate the fields the UI actually depends on. Everything else in
 * the upstream payload is ignored, so new/removed optional fields upstream
 * can't crash the app.
 */

export interface Product {
  id: number;
  title: string;
  description: string;
  category: string; // slug, e.g. "home-decoration"
  price: number; // USD
  rating: number;
  stock: number;
  thumbnail: string | null; // null = missing image -> UI shows placeholder
  images: string[];
  brand: string | null; // optional upstream
}

/** The slimmed-down shape sent to client components (keeps payload small). */
export type ProductSummary = Pick<
  Product,
  "id" | "title" | "category" | "price" | "rating" | "thumbnail"
> & {
  /** The detail page's first photo, preloaded on hover so the card -> detail flight stays sharp. */
  hero: string | null;
};

export function toSummary(p: Product): ProductSummary {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    price: p.price,
    rating: p.rating,
    thumbnail: p.thumbnail,
    hero: p.images[0] ?? p.thumbnail,
  };
}

/** Thrown when upstream responds but the data isn't usable / isn't 2xx. */
export class UpstreamError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "UpstreamError";
  }
}

// ---------- validation helpers ----------

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const nonEmptyStr = (v: unknown): string | null =>
  isStr(v) && v.trim() !== "" ? v : null;

/**
 * Parse one raw product. Returns null if a *required* field is missing/invalid
 * (that product is skipped rather than breaking the whole catalogue).
 */
export function parseProduct(raw: unknown): Product | null {
  if (!isObj(raw)) return null;
  const { id, title, price, category } = raw;
  if (!isNum(id) || !nonEmptyStr(title) || !isNum(price) || !nonEmptyStr(category)) {
    return null;
  }
  const images = Array.isArray(raw.images) ? raw.images.filter(isStr) : [];
  return {
    id,
    title: (title as string).trim(),
    description: isStr(raw.description) ? raw.description : "",
    category: category as string,
    price,
    rating: isNum(raw.rating) ? raw.rating : 0,
    stock: isNum(raw.stock) ? raw.stock : 0,
    thumbnail: nonEmptyStr(raw.thumbnail) ?? images[0] ?? null,
    images,
    brand: nonEmptyStr(raw.brand),
  };
}

export function parseCatalogue(raw: unknown): Product[] {
  if (!isObj(raw) || !Array.isArray(raw.products)) {
    throw new UpstreamError("Catalogue response missing `products` array");
  }
  return raw.products
    .map(parseProduct)
    .filter((p): p is Product => p !== null);
}
