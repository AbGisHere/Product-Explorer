"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FlipPhoto, HERO_SIZES, rememberPhoto } from "./FlipPhoto";
import { ProductImage } from "./ProductImage";
import { sampleTint, useRoomLight } from "./glass/Room";

/**
 * Hero image (shared element: the card's photo morphs into it) plus the other
 * angles as small glass lenses. The open product lights the room.
 */
export function DetailGallery({
  id,
  title,
  images,
  thumbnail,
}: {
  id: number;
  title: string;
  images: string[];
  /** The card's photo: shown at once (already cached) so the morph lands on the same picture. */
  thumbnail: string | null;
}) {
  const [index, setIndex] = useState(0);
  const [sharp, setSharp] = useState(false); // full-size photo decoded
  const light = useRoomLight();
  useEffect(() => () => light(null), [light]); // leaving the page returns the room to neutral
  // Browser back / swipe: remember the hero so it flies back into its card.
  // The Navigation API's "navigate" fires before the page swaps; popstate is the fallback.
  useEffect(() => {
    const onPop = () => rememberPhoto(id);
    const nav = (window as unknown as { navigation?: EventTarget }).navigation;
    nav?.addEventListener("navigate", onPop);
    addEventListener("popstate", onPop, { capture: true });
    return () => {
      nav?.removeEventListener("navigate", onPop);
      removeEventListener("popstate", onPop, { capture: true });
    };
  }, [id]);

  const src = images[index] ?? null;
  return (
    <div>
      <div className="relative overflow-hidden rounded-[36px] bg-well shadow-[inset_0_0_0_1px_var(--well-rim)]">
        <FlipPhoto id={id} className="relative">
            {/* Same URL + sizes as the card, so it comes straight from the browser cache:
                the morph flies the card photo into place, then the full-size photo fades in over it. */}
            {index === 0 && thumbnail && !sharp && (
              <div className="absolute inset-0" aria-hidden="true">
                <ProductImage
                  src={thumbnail}
                  alt=""
                  priority
                  sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
                  className="aspect-square"
                />
              </div>
            )}
            {/* Shown the moment it's decoded (no fade): after a flight the clone
                covers this box until then, so the swap is never visible. */}
            <div
              data-photo-layer
              className={`relative ${index === 0 && thumbnail && !sharp ? "opacity-0" : "opacity-100"}`}
            >
            <ProductImage
              key={src ?? "none"}
              src={src}
              alt={images.length > 1 ? `${title}, view ${index + 1} of ${images.length}` : title}
              priority
              sizes={HERO_SIZES}
              className="aspect-square"
              onLoad={(img) => {
                light(sampleTint(img));
                img.decode().catch(() => {}).finally(() => setSharp(true));
              }}
            />
            </div>
        </FlipPhoto>
      </div>

      {images.length > 1 && (
        <div role="group" aria-label="Product views" className="mt-4 flex flex-wrap gap-2.5">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              aria-label={`View ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`glass relative size-16 overflow-hidden transition-[opacity,scale] duration-300 ease-out-expo sm:size-[4.5rem] ${
                i === index ? "scale-105 opacity-100" : "opacity-60 hover:opacity-100"
              }`}
              style={{ "--glass-r": "18px" } as import("react").CSSProperties}
            >
              <Image src={img} alt="" fill sizes="72px" className="-z-10 object-contain p-2" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
