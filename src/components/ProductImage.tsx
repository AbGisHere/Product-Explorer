"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "./icons";

/**
 * next/image in a fixed-ratio box (space reserved -> no layout shift).
 * Missing URL or load error -> quiet placeholder, grid stays intact.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
  className = "aspect-square",
  onLoad,
  liftBottom = 0,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  onLoad?: (img: HTMLImageElement) => void;
  /** Keep this share (%) of the box free at the bottom, e.g. for a caption plate. */
  liftBottom?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-x-0 top-0" style={{ bottom: `${liftBottom}%` }}>
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="product-photo object-contain p-[9%]"
          onLoad={(e) => onLoad?.(e.currentTarget)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div role="img" aria-label={`${alt} (image unavailable)`} className="absolute inset-0 grid place-items-center text-quiet">
          <ImageIcon />
        </div>
      )}
      </div>
    </div>
  );
}
