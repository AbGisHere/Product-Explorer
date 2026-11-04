import Link from "next/link";
import type { ProductSummary } from "@/lib/types";
import { formatCategory, formatPrice } from "@/lib/catalogue";
import { ProductImage } from "./ProductImage";
import { SaveToggle } from "./SaveToggle";
import { StarIcon } from "./icons";

export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const { id, title, category, price, rating, thumbnail } = product;
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-line bg-surface p-3 transition-shadow hover:shadow-md focus-within:shadow-md">
      <ProductImage
        src={thumbnail}
        alt={title}
        priority={priority}
        sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
      />
      <div className="flex flex-1 flex-col gap-1 px-1 pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {formatCategory(category)}
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug break-words">
          {/* Stretched link: whole card is clickable, but there's ONE link in the tab order */}
          <Link href={`/products/${id}`} className="rounded after:absolute after:inset-0 after:rounded-xl group-hover:text-accent">
            {title}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="text-base font-semibold tabular-nums">{formatPrice(price)}</span>
          <span className="inline-flex items-center gap-1 text-muted">
            <StarIcon className="size-4 text-amber-500" />
            <span className="tabular-nums">{rating.toFixed(1)}</span>
            <span className="sr-only">out of 5</span>
          </span>
        </div>
      </div>
      {/* z-10 keeps the toggle above the stretched link */}
      <div className="absolute right-5 top-5 z-10">
        <SaveToggle id={id} title={title} />
      </div>
    </article>
  );
}
