import "server-only";
import { parseCatalogue, parseProduct, Product, UpstreamError } from "./types";

/**
 * Shared, typed data access. SERVER ONLY.
 *
 * Caching (Next.js 16, Cache Components OFF -> classic fetch cache):
 *   - Catalogue: one fetch of /products?limit=0, `revalidate: 60`, tag "catalogue".
 *     Every search/filter/sort/page URL calls this same fetch, so they all share
 *     ONE cache entry (the cache key is the URL + options, not the page's query).
 *   - Product detail: /products/{id}, `revalidate: 60`, tags "product" and
 *     "product-{id}" -> each product is cached independently.
 *   - Time-based revalidation is stale-while-revalidate: after 60 s the next
 *     request gets the stale copy instantly and triggers a background refetch.
 *   - Manual refresh uses updateTag("catalogue") in a Server Action (see
 *     src/app/actions.ts), which expires the entry immediately so the very next
 *     render blocks on a fresh origin fetch.
 *
 * Data source (env):
 *   DATA_SOURCE=api      (default) fetch from API_BASE_URL
 *   DATA_SOURCE=fixture  read fixtures/products.json (same shape), for when
 *                        DummyJSON is down. Clearly labelled in the UI.
 *   API_BASE_URL         default https://dummyjson.com. Point at the local mock
 *                        origin (scripts/mock-origin.mjs) to log real origin hits.
 */

export const REVALIDATE_SECONDS = 60;
export const CATALOGUE_TAG = "catalogue";

const API_BASE_URL = (process.env.API_BASE_URL ?? "https://dummyjson.com").replace(/\/$/, "");
const TIMEOUT_MS = 8000;

export const isFixtureMode = () => process.env.DATA_SOURCE === "fixture";

async function loadFixture(): Promise<unknown> {
  // Dynamic import so the 300 KB fixture is only loaded in fixture mode.
  return (await import("../../fixtures/products.json")).default;
}

/** fetch + timeout + status check. Network failures become UpstreamError. */
async function fetchJson(
  url: string,
  init: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
): Promise<{ status: number; body: unknown }> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new UpstreamError(
      `Request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw new UpstreamError(`Upstream responded ${res.status}`, res.status);
  try {
    return { status: res.status, body: await res.json() };
  } catch {
    throw new UpstreamError("Upstream returned invalid JSON", res.status);
  }
}

/** The full catalogue. Throws UpstreamError on failure. */
export async function getCatalogue(): Promise<Product[]> {
  if (isFixtureMode()) return parseCatalogue(await loadFixture());

  const { status, body } = await fetchJson(`${API_BASE_URL}/products?limit=0`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [CATALOGUE_TAG] },
  });
  if (status === 404) throw new UpstreamError("Catalogue endpoint not found", 404);
  return parseCatalogue(body);
}

/**
 * One product by id.
 *   - returns null   -> product genuinely doesn't exist (caller calls notFound())
 *   - throws         -> upstream failure (caller's error boundary shows retry)
 */
export async function getProduct(id: number): Promise<Product | null> {
  if (isFixtureMode()) {
    return parseCatalogue(await loadFixture()).find((p) => p.id === id) ?? null;
  }

  const { status, body } = await fetchJson(`${API_BASE_URL}/products/${id}`, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["product", `product-${id}`] },
  });
  if (status === 404) return null;
  const product = parseProduct(body);
  if (!product) throw new UpstreamError(`Product ${id} response failed validation`);
  return product;
}
