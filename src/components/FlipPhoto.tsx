"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Shared-element photo morph between a catalogue card and the product hero,
 * without View Transitions. View Transitions show the page as snapshots, and
 * the glass refraction isn't drawn in them, so glass flashed clear and popped
 * back in. Here the page stays live the whole time:
 *
 * 1. Before leaving (card click, Back to catalogue, browser back) the current
 *    photo is cloned along with its on-screen box.
 * 2. When the same product's photo mounts on the next page, the clone flies
 *    (fixed, above the page) from the old box to the new one, then hands over
 *    to the real photo.
 */
type Pending = { id: number; rect: DOMRect; clone: HTMLElement; at: number };
let pending: Pending | null = null;

export function rememberPhoto(id: number) {
  const el = document.querySelector<HTMLElement>(`[data-product-photo="${id}"]`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || rect.bottom < 0 || rect.top > innerHeight) return; // off screen: nothing to fly
  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-product-photo");
  pending = { id, rect, clone, at: performance.now() };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function FlipPhoto({ id, className, children }: { id: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const from = pending;
    if (!el || !from || from.id !== id || performance.now() - from.at > 8000) return;
    pending = null;
    let started = false;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { rect, clone } = from;
    Object.assign(clone.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "60",
      pointerEvents: "none",
      transformOrigin: "0 0",
    });
    clone.setAttribute("aria-hidden", "true");
    document.body.appendChild(clone);
    el.style.visibility = "hidden";

    let anim: Animation | null = null;
    // Two frames: after a history back, scroll restoration lands after mount,
    // so the destination is measured only once the page has settled.
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        started = true;
        const to = el.getBoundingClientRect();
        const done = () => {
          el.style.visibility = "";
          clone.remove();
        };
        // Land softly: show the real photo underneath and fade the clone out, so a
        // different resolution (small card thumbnail vs full-size hero) cross-fades
        // instead of snapping.
        const land = () => {
          el.style.visibility = "";
          clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-out", fill: "forwards" }).finished.then(done, done);
        };
        if (!to.width || !to.height) return done();
        // Uniform scale by width, top-left aligned: the card's photo area is the
        // top of a 4:5 box and the hero is square, so their pictures line up.
        const sc = to.width / rect.width;
        anim = clone.animate(
          [
            { transform: "none", filter: "blur(0px)" },
            { filter: "blur(1.5px)", offset: 0.4 },
            { transform: `translate(${to.left - rect.left}px, ${to.top - rect.top}px) scale(${sc})`, filter: "blur(0px)" },
          ],
          { duration: 620, easing: "cubic-bezier(0.2, 0.9, 0.1, 1)", fill: "forwards" },
        );
        anim.finished.then(land, done);
      });
    });
    return () => {
      // Unmounted before the flight began (e.g. React Strict Mode's dev-only
      // mount/unmount/mount): hand the photo back so the real mount can fly it.
      if (!started && !pending) pending = from;
      cancelAnimationFrame(raf);
      anim?.cancel();
      clone.remove();
      el.style.visibility = "";
    };
  }, [id]);

  return (
    <div ref={ref} data-product-photo={id} className={className}>
      {children}
    </div>
  );
}
