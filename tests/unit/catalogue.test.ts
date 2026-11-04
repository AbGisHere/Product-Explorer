import { describe, expect, it } from "vitest";
import {
  applyQuery,
  buildQueryString,
  DEFAULT_SORT,
  deriveCategories,
  PAGE_SIZE,
  parseQuery,
  type CatalogueQuery,
} from "@/lib/catalogue";
import { pageWindow } from "@/components/Pagination";

// 30 products across 3 categories, deterministic titles/prices.
const products = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  title: i % 2 === 0 ? `Phone ${String(i).padStart(2, "0")}` : `Lamp ${String(i).padStart(2, "0")}`,
  category: ["beauty", "furniture", "groceries"][i % 3],
  price: ((i * 37) % 100) + 1,
}));
const categories = deriveCategories(products);
const q = (over: Partial<CatalogueQuery> = {}): CatalogueQuery => ({
  q: "",
  category: null,
  sort: DEFAULT_SORT,
  page: 1,
  saved: null,
  ...over,
});

describe("parseQuery (URL validation)", () => {
  it("accepts valid values", () => {
    expect(parseQuery({ q: " phone ", category: "beauty", sort: "price-desc", page: "2" }, categories)).toEqual({
      q: "phone",
      category: "beauty",
      sort: "price-desc",
      page: 2,
      saved: null,
    });
  });

  it("falls back to defaults for invalid values", () => {
    const r = parseQuery({ category: "nope", sort: "random", page: "-3" }, categories);
    expect(r).toMatchObject({ category: null, sort: DEFAULT_SORT, page: 1 });
    expect(parseQuery({ page: "1.5" }, categories).page).toBe(1);
    expect(parseQuery({ page: "abc" }, categories).page).toBe(1);
    expect(parseQuery({ page: "0" }, categories).page).toBe(1);
  });

  it("uses the first value when a param is repeated", () => {
    expect(parseQuery({ sort: ["price-asc", "price-desc"] }, categories).sort).toBe("price-asc");
  });

  it("caps search length", () => {
    expect(parseQuery({ q: "x".repeat(500) }, categories).q).toHaveLength(100);
  });

  it("parses saved ids, dropping junk and duplicates", () => {
    expect(parseQuery({ saved: "3,abc,3,7,-1" }, categories).saved).toEqual([3, 7]);
    expect(parseQuery({ saved: "" }, categories).saved).toEqual([]);
    expect(parseQuery({}, categories).saved).toBeNull();
  });
});

describe("applyQuery (filter -> sort -> paginate on the full dataset)", () => {
  it("paginates 12 per page with correct totals", () => {
    const r = applyQuery(products, q());
    expect(r.items).toHaveLength(PAGE_SIZE);
    expect(r).toMatchObject({ total: 30, totalPages: 3, page: 1, start: 1, end: 12 });
    const last = applyQuery(products, q({ page: 3 }));
    expect(last).toMatchObject({ start: 25, end: 30 });
    expect(last.items).toHaveLength(6);
  });

  it("searches titles case-insensitively", () => {
    const r = applyQuery(products, q({ q: "PHONE" }));
    expect(r.total).toBe(15);
    expect(r.items.every((p) => p.title.startsWith("Phone"))).toBe(true);
  });

  it("combines search + category + sort + pagination", () => {
    const expected = products
      .filter((p) => p.title.toLowerCase().includes("phone") && p.category === "beauty")
      .sort((a, b) => b.price - a.price || a.id - b.id);

    const r = applyQuery(products, q({ q: "phone", category: "beauty", sort: "price-desc" }));
    expect(r.total).toBe(expected.length);
    expect(r.items.map((p) => p.id)).toEqual(expected.slice(0, 12).map((p) => p.id));
  });

  it("filters BEFORE paginating (a match on page 3 of the unfiltered list is found)", () => {
    const target = products[29]; // last product, would be on page 3 unfiltered
    const r = applyQuery(products, q({ q: target.title }));
    expect(r.items.map((p) => p.id)).toEqual([target.id]);
  });

  it("sorts by price asc / desc and title A–Z", () => {
    const asc = applyQuery(products, q({ sort: "price-asc" })).items.map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = applyQuery(products, q({ sort: "price-desc" })).items.map((p) => p.price);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    const titles = applyQuery(products, q({ sort: "title-asc" })).items.map((p) => p.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it("clamps out-of-range pages", () => {
    expect(applyQuery(products, q({ page: 99 })).page).toBe(3);
  });

  it("handles empty results", () => {
    const r = applyQuery(products, q({ q: "zzz" }));
    expect(r).toMatchObject({ total: 0, totalPages: 1, page: 1, start: 0, end: 0, items: [] });
  });

  it("saved-only view filters by id", () => {
    const r = applyQuery(products, q({ saved: [2, 5, 999] }));
    expect(r.items.map((p) => p.id).sort()).toEqual([2, 5]);
    expect(applyQuery(products, q({ saved: [] })).total).toBe(0);
  });
});

describe("buildQueryString", () => {
  it("omits defaults and round-trips through parseQuery", () => {
    expect(buildQueryString(q())).toBe("");
    const query = q({ q: "phone x", category: "beauty", sort: "price-asc", page: 2 });
    const qs = buildQueryString(query);
    const parsed = parseQuery(Object.fromEntries(new URLSearchParams(qs)), categories);
    expect(parsed).toEqual(query);
  });
});

describe("deriveCategories", () => {
  it("returns unique sorted categories from the full set", () => {
    expect(categories).toEqual(["beauty", "furniture", "groceries"]);
  });
});

describe("pageWindow", () => {
  it("shows first, last and neighbours with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 10)).toEqual([1, "…", 4, 5, 6, "…", 10]);
  });
});
