"use client";

import { useLinkStatus } from "next/link";

/** Inside a card's <Link>: if the page wasn't prefetched yet, a thin light sweeps along the caption while it opens. */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-5 top-0 z-10 h-px origin-left bg-ink transition-[scale,opacity] duration-700 ease-out-expo ${
        pending ? "scale-x-75 opacity-100" : "scale-x-0 opacity-0"
      }`}
    />
  );
}
