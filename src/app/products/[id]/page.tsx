import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getProduct } from "@/lib/api";
import { formatCategory, formatPrice } from "@/lib/catalogue";
import { ProductImage } from "@/components/ProductImage";
import { SaveToggle } from "@/components/SaveToggle";
import { StarIcon } from "@/components/icons";

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

  return (
    <article className="mx-auto max-w-5xl">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="rounded hover:text-accent">Catalogue</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/?category=${p.category}`} className="rounded hover:text-accent">
              {formatCategory(p.category)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="max-w-[16rem] truncate text-ink">{p.title}</li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <ProductImage src={p.images[0] ?? p.thumbnail} alt={p.title} priority sizes="(min-width: 768px) 480px, 90vw" />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted">
              {formatCategory(p.category)}
              {p.brand && <> · {p.brand}</>}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight break-words">{p.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-2xl font-semibold tabular-nums">{formatPrice(p.price)}</span>
            <span className="inline-flex items-center gap-1 text-sm text-muted">
              <StarIcon className="size-4 text-amber-500" />
              <span className="tabular-nums">{p.rating.toFixed(1)}</span>
              <span className="sr-only">out of 5</span>
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                p.stock === 0 ? "bg-red-50 text-danger" : "bg-green-50 text-success"
              }`}
            >
              {stockLabel}
            </span>
          </div>

          {p.description ? (
            <p className="leading-relaxed text-muted">{p.description}</p>
          ) : (
            <p className="italic text-muted">No description available.</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <SaveToggle id={p.id} title={p.title} variant="full" />
            <Link href="/" className="btn">← Back to catalogue</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
