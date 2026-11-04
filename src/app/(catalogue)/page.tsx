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
import { Glass } from "@/components/glass/Glass";

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
      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <CategoryFilter categories={categories} variant="sidebar" />

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end sm:mb-8 justify-between gap-x-6 gap-y-2">
            <h1
              id="results-heading"
              className="display scroll-mt-28 text-balance text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.01em]"
            >
              {heading}
            </h1>
            <ResultsSummary text={summary} />
          </div>

          <Glass
            role="search"
            radius={30}
            bezel={18}
            bend={20}
            frost={2}
            className="mb-6 flex flex-col divide-y sm:mb-8 divide-line p-1.5 md:flex-row md:items-center md:divide-x md:divide-y-0"
          >
            <SearchInput />
            <div className="flex divide-x divide-line">
              <CategoryFilter categories={categories} variant="select" />
              <SortSelect />
            </div>
          </Glass>

          <ResultsRegion>
            {result.total === 0 ? (
              <EmptyResults
                savedView={savedView}
                resetHref={"/" + buildQueryString({ saved: query.saved })}
              />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
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
