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

type Pending = { id: number; rect: DOMRect; face: HTMLElement; at: number };
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

/**
 * In light mode the page multiplies product photos onto their backing so the
 * studio white disappears. A flying copy can't rely on blending (it passes over
 * different things, and in a fixed layer the blend doesn't take), so instead
 * the white is turned into transparency ("colour to alpha"): the photo then
 * looks the same over anything, with no box around it.
 */
function whiteToAlpha(img: HTMLImageElement): HTMLCanvasElement | null {
  try {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    // Always scale explicitly: with srcset, naturalWidth is density-corrected
    // (a 2x pick reports half its pixels), so an unscaled draw shows one corner.
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const im = ctx.getImageData(0, 0, c.width, c.height);
    const d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const a0 = d[i + 3] / 255;
      if (!a0) continue;
      const min = Math.min(d[i], d[i + 1], d[i + 2]);
      const a = Math.max(1 - min / 255, 0); // how far from white
      if (a >= 0.999) continue;
      for (let k = 0; k < 3; k++) d[i + k] = a > 0 ? Math.round((d[i + k] - 255 * (1 - a)) / a) : 0;
      d[i + 3] = Math.round(a * a0 * 255);
    }
    ctx.putImageData(im, 0, 0);
    return c;
  } catch {
    return null; // tainted or failed: fly the plain photo
  }
}

export function rememberPhoto(id: number) {
  const img = visibleImg(document.querySelector(`[data-product-photo="${id}"]`));
  if (!img) return;
  const rect = paintedRect(img);
  if (!rect.width || rect.bottom < 0 || rect.top > innerHeight) return; // off screen: nothing to fly
  // Prefer the preloaded full-size photo (same picture, more pixels) when it's ready.
  const hi = preloaded.get(id);
  const source = hi?.complete && hi.naturalWidth ? hi : img;
  const blended = getComputedStyle(img).mixBlendMode === "multiply";
  let face: HTMLElement | null = blended ? whiteToAlpha(source) : null;
  if (!face) {
    const plain = document.createElement("img");
    plain.src = source.currentSrc;
    plain.alt = "";
    face = plain;
  }
  pending = { id, rect, face, at: performance.now() };
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
    const clone = from.face;
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
      objectFit: "contain",
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
