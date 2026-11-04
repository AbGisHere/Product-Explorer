import { afterEach, describe, expect, it, vi } from "vitest";
import { CATALOGUE_TAG, getCatalogue, getProduct, REVALIDATE_SECONDS } from "@/lib/api";
import { parseProduct, UpstreamError } from "@/lib/types";

const good = { id: 1, title: "Mascara", price: 9.99, category: "beauty", rating: 4.5, stock: 3, thumbnail: "https://cdn.dummyjson.com/a.webp", images: [] };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("parseProduct (response validation)", () => {
  it("rejects products missing required fields", () => {
    expect(parseProduct({ ...good, id: "1" })).toBeNull();
    expect(parseProduct({ ...good, title: "  " })).toBeNull();
    expect(parseProduct({ ...good, price: Number.NaN })).toBeNull();
    expect(parseProduct(null)).toBeNull();
  });

  it("defaults missing optional fields", () => {
    const p = parseProduct({ id: 2, title: "X", price: 1, category: "c" })!;
    expect(p).toMatchObject({ description: "", rating: 0, stock: 0, thumbnail: null, images: [], brand: null });
  });

  it("falls back to the first image when thumbnail is missing", () => {
    expect(parseProduct({ ...good, thumbnail: "", images: ["https://x/1.png"] })!.thumbnail).toBe("https://x/1.png");
  });
});

describe("getCatalogue", () => {
  it("uses the shared 60 s cache entry with the catalogue tag", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ products: [good, { bad: true }] }));
    vi.stubGlobal("fetch", fetchMock);

    const products = await getCatalogue();
    expect(products).toHaveLength(1); // invalid product skipped
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/products\?limit=0$/);
    expect(init.next).toEqual({ revalidate: REVALIDATE_SECONDS, tags: [CATALOGUE_TAG] });
  });

  it("throws UpstreamError on 5xx, network failure and bad shape", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 503)));
    await expect(getCatalogue()).rejects.toBeInstanceOf(UpstreamError);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(getCatalogue()).rejects.toBeInstanceOf(UpstreamError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ nope: 1 })));
    await expect(getCatalogue()).rejects.toBeInstanceOf(UpstreamError);
  });
});

describe("getProduct", () => {
  it("caches each product independently", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(good));
    vi.stubGlobal("fetch", fetchMock);
    await getProduct(1);
    expect(fetchMock.mock.calls[0][1].next).toEqual({ revalidate: 60, tags: ["product", "product-1"] });
  });

  it("distinguishes not-found (null) from upstream failure (throws)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ message: "not found" }, 404)));
    await expect(getProduct(99999)).resolves.toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 500)));
    await expect(getProduct(1)).rejects.toBeInstanceOf(UpstreamError);
  });
});
