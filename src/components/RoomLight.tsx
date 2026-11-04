"use client";

import type { ReactNode } from "react";
import { preloadHero, rememberPhoto } from "./FlipPhoto";
import { sampleTint, useRoomLight } from "./glass/Room";

/** Pointing at a product (hover or keyboard focus) lights the room with its colours; moving away returns it to neutral. */
export function RoomLight({
  children,
  className,
  productId,
  hero = null,
}: {
  children: ReactNode;
  className?: string;
  productId?: number;
  hero?: string | null;
}) {
  const light = useRoomLight();
  const on = (el: HTMLElement) => {
    if (productId !== undefined) preloadHero(productId, hero);
    const img = el.querySelector("img");
    if (img?.complete) light(sampleTint(img));
  };
  return (
    <div
      className={className}
      onPointerEnter={(e) => on(e.currentTarget)}
      onFocus={(e) => on(e.currentTarget)}
      onClickCapture={() => productId !== undefined && rememberPhoto(productId)}
      onPointerLeave={() => light(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) light(null);
      }}
    >
      {children}
    </div>
  );
}
