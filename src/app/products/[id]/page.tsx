import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProduct } from "@/lib/api";
import { formatCategory, formatPrice } from "@/lib/catalogue";
import { ViewTransition } from "react";
import { DetailGallery } from "@/components/DetailGallery";
import { Glass } from "@/components/glass/Glass";
import { SaveToggle } from "@/components/SaveToggle";
import { StarIcon } from "@/components/icons";
import { itemNo } from "@/components/ProductCard";

type Params = Promise<{ id: string }>;

/**
 * Validate the id, then fetch (server, per-product 60 s cache).
 * React cache() dedupes the call between generateMetadata and the page.
 *   invalid id / 404 -> notFound()       (not-found.tsx)
 *   upstream failure -> throws           (error.tsx, retry)
 * Works on a direct visit: nothing depends on the catalogue having loaded.
 */
const load = cache(async (rawId: string) => {
  if (!/^\d{1,9}$/.test(rawId) || Number(rawId) < 1) notFound();
  const product = await getProduct(Number(rawId));
  if (!product) notFound();
  return product;
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await load((await params).id);
  const description = p.description.slice(0, 160) || `${p.title}, ${formatPrice(p.price)}`;
  return {
    title: p.title,
    description,
    openGraph: { title: p.title, description, images: p.thumbnail ? [p.thumbnail] : [] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const p = await load((await params).id);
  const stockLabel = p.stock === 0 ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left` : `${p.stock} in stock`;

  const rows: [string, React.ReactNode][] = [
    [
      "Rating",
      <span key="r" className="inline-flex items-center gap-1.5">
        <StarIcon className="size-3.5" />
        {p.rating.toFixed(1)}
        <span className="text-quiet">/ 5</span>
      </span>,
    ],
    [
      "Availability",
      <span key="s" className={p.stock === 0 ? "text-danger" : ""}>
        {stockLabel}
      </span>,
    ],
    ["Category", formatCategory(p.category)],
    ...(p.brand ? [["Maker", p.brand] as [string, React.ReactNode]] : []),
    ["Reference", itemNo(p.id)],
  ];
  const images = p.images.length ? p.images : p.thumbnail ? [p.thumbnail] : [];

  return (
    <article>
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="rounded-full hover:text-ink">Catalogue</Link>
          </li>
          <li aria-hidden="true" className="text-quiet">/</li>
          <li>
            <Link href={`/?category=${p.category}`} className="rounded-full hover:text-ink">
              {formatCategory(p.category)}
            </Link>
          </li>
          <li aria-hidden="true" className="text-quiet">/</li>
          <li aria-current="page" className="max-w-[16rem] truncate text-ink">{p.title}</li>
        </ol>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <DetailGallery id={p.id} title={p.title} images={images} />

        <ViewTransition enter="rise" exit="rise" default="none">
          <Glass radius={34} bezel={24} bend={26} frost={2.5} className="p-7 sm:p-9 lg:sticky lg:top-24">
            <h1 className="display text-balance text-[clamp(1.75rem,3.4vw,2.75rem)] leading-[0.98] break-words">
              {p.title}
            </h1>
            <p className="mt-6 text-3xl font-light tabular-nums tracking-tight">{formatPrice(p.price)}</p>

            {p.description ? (
              <p className="mt-6 max-w-[60ch] leading-relaxed text-muted">{p.description}</p>
            ) : (
              <p className="mt-6 text-muted">No description available.</p>
            )}

            <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <dt className="tracked text-quiet">{label}</dt>
                  <dd className="text-right tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-2">
              <SaveToggle id={p.id} title={p.title} variant="full" />
              <Link href="/" className="btn">Back to catalogue</Link>
            </div>
          </Glass>
        </ViewTransition>
      </div>
    </article>
  );
}
