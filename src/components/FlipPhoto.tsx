"use client";

import { getImageProps } from "next/image";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Shared-element photo flight between a catalogue card and the product hero,
 * without View Transitions (their snapshots drop the glass refraction).
 *
 * The flying element is a plain <img> placed exactly over the *painted*
 * picture (object-contain inside padding), so it starts on the pixels you
 * see and lands on the pixels the next page draws. To keep quality constant,
 * the card's full-size hero photo is preloaded when you point at the card;
 * the flight uses it, and it only hands over once the destination photo is
 * loaded and visible, in the same frame, so nothing fades or snaps.
 */

export const HERO_SIZES = "(min-width: 1024px) 640px, 92vw";

type Pending = { id: number; rect: DOMRect; src: string; well: string; at: number };
let pending: Pending | null = null;
const preloaded = new Map<number, HTMLImageElement>();

/** Warm the exact full-size image the detail hero will request (same srcset + sizes). */
export function preloadHero(id: number, url: string | null) {
  if (!url || preloaded.has(id)) return;
  const { props } = getImageProps({ src: url, alt: "", fill: true, sizes: HERO_SIZES });
  const img = new Image();
  img.decoding = "async";
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
  img.decode().catch(() => {});
  preloaded.set(id, img);
}

/** The photo you can see inside a [data-product-photo] box (the labelled, non-placeholder one). */
function visibleImg(box: Element | null): HTMLImageElement | null {
  if (!box) return null;
  const imgs = [...box.querySelectorAll<HTMLImageElement>("img:not([alt=''])")];
  return imgs.find((i) => i.complete && i.naturalWidth > 0) ?? null;
}

/** Where object-contain actually paints the picture inside the img's content box. */
function paintedRect(img: HTMLImageElement): DOMRect {
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  const pl = parseFloat(cs.paddingLeft);
  const pr = parseFloat(cs.paddingRight);
  const pt = parseFloat(cs.paddingTop);
  const pb = parseFloat(cs.paddingBottom);
  const cw = r.width - pl - pr;
  const ch = r.height - pt - pb;
  const s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  return new DOMRect(r.left + pl + (cw - w) / 2, r.top + pt + (ch - h) / 2, w, h);
}

/** The colour the photo sits on: its nearest painted background, composited over the page. */
function wellColour(img: HTMLElement): string {
  const parse = (c: string) => {
    const m = c.match(/[\d.]+/g)?.map(Number) ?? [];
    return { r: m[0] ?? 0, g: m[1] ?? 0, b: m[2] ?? 0, a: m.length > 3 ? m[3] : 1 };
  };
  const page = parse(getComputedStyle(document.body).backgroundColor);
  for (let n = img.parentElement; n && n !== document.body; n = n.parentElement) {
    const c = parse(getComputedStyle(n).backgroundColor);
    if (c.a > 0) {
      const mix = (k: "r" | "g" | "b") => Math.round(c[k] * c.a + page[k] * (1 - c.a));
      return `rgb(${mix("r")} ${mix("g")} ${mix("b")})`;
    }
  }
  return `rgb(${page.r} ${page.g} ${page.b})`;
}

export function rememberPhoto(id: number) {
  const img = visibleImg(document.querySelector(`[data-product-photo="${id}"]`));
  if (!img) return;
  const rect = paintedRect(img);
  if (!rect.width || rect.bottom < 0 || rect.top > innerHeight) return; // off screen: nothing to fly
  // Prefer the preloaded full-size photo (same picture, more pixels) when it's ready.
  const hi = preloaded.get(id);
  const src = hi?.complete && hi.naturalWidth ? hi.currentSrc : img.currentSrc;
  pending = { id, rect, src, well: wellColour(img), at: performance.now() };
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function FlipPhoto({ id, className, children }: { id: number; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    const from = pending;
    if (!el || !from || from.id !== id || performance.now() - from.at > 8000) return;
    pending = null;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let started = false;
    let cancelled = false;
    // The flying photo carries its own backing in the colour it sits on, and
    // blends onto that (multiply in light mode), so its studio white looks the
    // same in flight as on the page, whatever it passes over.
    const clone = document.createElement("div");
    const photo = document.createElement("img");
    photo.src = from.src;
    photo.alt = "";
    photo.className = "product-photo";
    Object.assign(photo.style, { width: "100%", height: "100%", display: "block", objectFit: "contain" });
    clone.appendChild(photo);
    clone.setAttribute("aria-hidden", "true");
    Object.assign(clone.style, {
      position: "fixed",
      left: `${from.rect.left}px`,
      top: `${from.rect.top}px`,
      width: `${from.rect.width}px`,
      height: `${from.rect.height}px`,
      zIndex: "60",
      pointerEvents: "none",
      transformOrigin: "0 0",
      isolation: "isolate",
      background: from.well,
    });
    document.body.appendChild(clone);
    el.style.visibility = "hidden";

    const finish = () => {
      el.style.visibility = "";
      clone.remove();
    };

    (async () => {
      // Two frames: after a history back, scroll restoration lands after mount.
      await nextFrame();
      await nextFrame();
      if (cancelled) return;
      started = true;
      // Destination picture: wait (briefly) until it has loaded so we know its painted box.
      const t0 = performance.now();
      let target = visibleImg(el);
      while (!target && performance.now() - t0 < 1200) {
        await nextFrame();
        if (cancelled) return;
        target = visibleImg(el);
      }
      if (!target) return finish();
      const to = paintedRect(target);
      const s = to.width / from.rect.width;
      const anim = clone.animate(
        [
          { transform: "none" },
          { transform: `translate(${to.left - from.rect.left}px, ${to.top - from.rect.top}px) scale(${s})` },
        ],
        { duration: 600, easing: "cubic-bezier(0.2, 0.9, 0.1, 1)", fill: "forwards" },
      );
      await anim.finished.catch(() => {});
      if (cancelled) return;
      // Hand over only when the real photo is loaded and visible: same picture,
      // same box, same frame, so the swap can't be seen.
      const t1 = performance.now();
      while (performance.now() - t1 < 1200) {
        const img = visibleImg(el);
        const layer = img?.closest<HTMLElement>("[data-photo-layer]");
        if (img && (!layer || getComputedStyle(layer).opacity === "1")) break;
        await nextFrame();
        if (cancelled) return;
      }
      finish();
    })();

    return () => {
      cancelled = true;
      // Unmounted before the flight began (React Strict Mode's dev-only
      // remount): hand the photo back so the real mount can fly it.
      if (!started && !pending) pending = from;
      finish();
    };
  }, [id]);

  return (
    <div ref={ref} data-product-photo={id} className={className}>
      {children}
    </div>
  );
}
