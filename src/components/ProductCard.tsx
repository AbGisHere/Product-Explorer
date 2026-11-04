import Link from "next/link";
import { ViewTransition } from "react";
import type { ProductSummary } from "@/lib/types";
import { formatCategory, formatPrice } from "@/lib/catalogue";
import { Glass } from "./glass/Glass";
import { ProductImage } from "./ProductImage";
import { RoomLight } from "./RoomLight";
import { SaveToggle } from "./SaveToggle";
import { StarIcon } from "./icons";

/** Catalogue number, e.g. 7 -> "No. 007". */
export const itemNo = (id: number) => `No. ${String(id).padStart(3, "0")}`;

/**
 * The product floats in the room; its caption is a glass plate laid over the
 * lower edge of the photo, so the photo bends through the plate's rim.
 * The image is a shared element: it morphs into the detail page hero.
 */
export function ProductCard({ product, priority }: { product: ProductSummary; priority?: boolean }) {
  const { id, title, category, price, rating, thumbnail } = product;
  return (
    <RoomLight className="h-full">
      <article className="group relative h-full">
        <div className="relative overflow-hidden rounded-[28px] bg-well">
          <ViewTransition name={`product-${id}`} share="morph" default="none">
            <div className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]">
              <ProductImage
                src={thumbnail}
                alt={title}
                priority={priority}
                sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                className="aspect-[4/5]"
                liftBottom={24}
              />
            </div>
          </ViewTransition>

          <Glass
            radius={20}
            bezel={14}
            bend={16}
            frost={1.5}
            className="absolute inset-x-2.5 bottom-2.5 px-4 pb-3.5 pt-3"
          >
            <h3 className="font-medium leading-snug break-words">
              {/* Stretched link: whole card is clickable, but there's ONE link in the tab order */}
              <Link
                href={`/products/${id}`}
                className="line-clamp-2 rounded-sm outline-offset-4 after:absolute after:-inset-[400%] after:content-['']"
              >
                {title}
              </Link>
            </h3>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-muted">
                <span className="tabular-nums">{itemNo(id)}</span> · {formatCategory(category)}
              </p>
              <p className="flex shrink-0 items-baseline gap-2.5">
                <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted">
                  <StarIcon className="size-3" />
                  {rating.toFixed(1)}
                  <span className="sr-only">out of 5</span>
                </span>
                <span className="font-semibold tabular-nums">{formatPrice(price)}</span>
              </p>
            </div>
          </Glass>

          {/* z-10 keeps the toggle above the stretched link */}
          <div className="absolute right-3 top-3 z-10">
            <SaveToggle id={id} title={title} />
          </div>
        </div>
      </article>
    </RoomLight>
  );
}
