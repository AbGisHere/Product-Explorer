"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";
import { rememberPhoto } from "./FlipPhoto";

export const LAST_CATALOGUE_KEY = "product-explorer:last-catalogue";

/**
 * "Back to catalogue": when you came from the catalogue in this tab, it goes
 * *back* in history, so the same search/filter/page and scroll position return
 * (and the photo flies back into its card, see FlipPhoto). Opened directly, it's a plain link.
 */
export function BackToCatalogue({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  const onClick = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    let cameFromCatalogue = false;
    try {
      cameFromCatalogue = sessionStorage.getItem(LAST_CATALOGUE_KEY) !== null && window.history.length > 1;
    } catch {
      /* storage blocked: fall back to the link */
    }
    if (!cameFromCatalogue) return;
    e.preventDefault();
    const hero = document.querySelector<HTMLElement>("article [data-product-photo]");
    if (hero?.dataset.productPhoto) rememberPhoto(Number(hero.dataset.productPhoto));
    router.back();
  };
  return (
    <Link href="/" onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
