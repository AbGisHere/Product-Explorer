"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "./icons";

/**
 * next/image in a fixed-ratio box (space reserved -> no layout shift).
 * Missing URL or load error -> neutral placeholder, grid stays intact.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-canvas">
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-4"
          onError={() => setFailed(true)}
        />
      ) : (
        <div role="img" aria-label={`${alt} (image unavailable)`} className="grid size-full place-items-center text-muted">
          <ImageIcon />
        </div>
      )}
    </div>
  );
}
