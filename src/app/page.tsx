import type { Metadata } from "next";
import { getCatalogue } from "@/lib/api";
import { applyQuery, buildQueryString, deriveCategories, formatCategory, parseQuery } from "@/lib/catalogue";
import { toSummary } from "@/lib/types";
import { CatalogueNavProvider, ResultsRegion, ResultsSummary } from "@/components/CatalogueNav";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/components/ProductCard";
import { SearchInput } from "@/components/SearchInput";
import { SortSelect } from "@/components/SortSelect";
import { EmptyResults } from "@/components/states";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  return { title: sp.saved !== undefined ? "Saved products" : "Catalogue" };
}

/**
 * Server Component. Fetches the FULL catalogue (shared 60 s cache entry),
 * validates the URL, then filter -> sort -> paginate on the server.
 * Only the 12 visible products (as slim summaries) + category list are sent
 * to the client. Upstream failures throw -> app/error.tsx (retry).
 */
export default async function CataloguePage({ searchParams }: { searchParams: SP }) {
  const products = await getCatalogue();
  const categories = deriveCategories(products);
  const query = parseQuery(await searchParams, categories);
  const result = applyQuery(products, query);
  const savedView = query.saved !== null;

  const heading = savedView
    ? "Saved products"
    : query.category
      ? formatCategory(query.category)
      : "All products";

  const summary =
    result.total === 0
      ? "No matching products"
      : `Showing ${result.start}–${result.end} of ${result.total} matching product${result.total === 1 ? "" : "s"}`;

  return (
    <CatalogueNavProvider query={{ ...query, page: result.page }}>
      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-6">
        <CategoryFilter categories={categories} variant="sidebar" />

        <section aria-labelledby="results-heading" className="min-w-0">
          <h1 id="results-heading" className="mb-4 scroll-mt-24 text-2xl font-semibold tracking-tight">
            {heading}
          </h1>

          <div role="search" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            <SearchInput />
            <CategoryFilter categories={categories} variant="select" />
            <SortSelect />
          </div>

          <div className="mb-4 mt-4">
            <ResultsSummary text={summary} />
          </div>

          <ResultsRegion>
            {result.total === 0 ? (
              <EmptyResults
                savedView={savedView}
                resetHref={"/" + buildQueryString({ saved: query.saved })}
              />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {result.items.map((p, i) => (
                    <li key={p.id}>
                      <ProductCard product={toSummary(p)} priority={i < 3} />
                    </li>
                  ))}
                </ul>
                <Pagination page={result.page} totalPages={result.totalPages} />
              </>
            )}
          </ResultsRegion>
        </section>
      </div>
    </CatalogueNavProvider>
  );
}
