"use client";

import Image from "next/image";
import { useEffect, useState, ViewTransition } from "react";
import { ProductImage } from "./ProductImage";
import { sampleTint, useRoomLight } from "./glass/Room";

/**
 * Hero image (shared element: the card's photo morphs into it) plus the other
 * angles as small glass lenses. The open product lights the room.
 */
export function DetailGallery({ id, title, images }: { id: number; title: string; images: string[] }) {
  const [index, setIndex] = useState(0);
  const light = useRoomLight();
  useEffect(() => () => light(null), [light]); // leaving the page returns the room to neutral

  const src = images[index] ?? null;
  return (
    <div>
      <div className="relative overflow-hidden rounded-[36px] bg-well">
        <ViewTransition name={`product-${id}`} share="morph" default="none">
          <div>
            <ProductImage
              key={src ?? "none"}
              src={src}
              alt={images.length > 1 ? `${title}, view ${index + 1} of ${images.length}` : title}
              priority
              sizes="(min-width: 1024px) 640px, 92vw"
              className="aspect-square"
              onLoad={(img) => light(sampleTint(img))}
            />
          </div>
        </ViewTransition>
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
