"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export const LAST_CATALOGUE_KEY = "product-explorer:last-catalogue";

/**
 * "Back to catalogue": when you came from the catalogue in this tab, it goes
 * *back* in history, so the same search/filter/page and scroll position return
 * (and the photo morphs back into its card). Opened directly, it's a plain link.
 */
/**
 * History back is restored straight from the client cache, outside a React
 * transition, so React's <ViewTransition> can't animate it. Do the same morph
 * by hand: name the hero photo, go back, wait for its card (and the restored
 * scroll position) to be on screen, name the card photo, and let the browser
 * fly one into the other.
 */
function morphBack(go: () => void) {
  const hero = document.querySelector<HTMLElement>("article [data-product-photo]");
  const id = hero?.dataset.productPhoto;
  if (!hero || !id || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    go();
    return;
  }
  const name = `product-${id}`;
  const tag = (el: HTMLElement) => {
    el.style.viewTransitionName = name;
    el.style.setProperty("view-transition-class", "morph");
  };
  tag(hero);
  let card: HTMLElement | null = null;
  const vt = document.startViewTransition(async () => {
    go();
    // Rendering is paused inside the update callback, so poll with timers, not rAF.
    const tick = () => new Promise((r) => setTimeout(r, 16));
    const until = performance.now() + 1500;
    while (performance.now() < until) {
      await tick();
      card = document.querySelector<HTMLElement>(`li [data-product-photo="${id}"]`);
      if (card) break;
    }
    await tick(); // let scroll restoration land
    if (card) tag(card);
  });
  vt.finished.finally(() => {
    for (const el of [hero, card]) {
      el?.style.removeProperty("view-transition-name");
      el?.style.removeProperty("view-transition-class");
    }
  });
}

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
    morphBack(() => router.back());
  };
  return (
    <Link href="/" onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
