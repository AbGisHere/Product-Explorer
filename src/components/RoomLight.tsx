"use client";

import type { ReactNode } from "react";
import { sampleTint, useRoomLight } from "./glass/Room";

/** Pointing at a product (hover or keyboard focus) lights the room with its colours. */
export function RoomLight({ children, className }: { children: ReactNode; className?: string }) {
  const light = useRoomLight();
  const on = (el: HTMLElement) => {
    const img = el.querySelector("img");
    if (img?.complete) light(sampleTint(img));
  };
  return (
    <div
      className={className}
      onPointerEnter={(e) => on(e.currentTarget)}
      onFocus={(e) => on(e.currentTarget)}
    >
      {children}
    </div>
  );
}
