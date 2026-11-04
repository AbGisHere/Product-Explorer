"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

/**
 * The room the glass stands in: a fixed backdrop lit by colour taken from the
 * product you point at (hover/focus on a card, the open product on its page).
 * Colours are never hand-picked per product; with nothing to sample the room
 * falls back to its neutral light.
 */
type Tint = [string, string, string];
const Ctx = createContext<(t: Tint | null) => void>(() => {});
export const useRoomLight = () => useContext(Ctx);

export function Room({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const setTint = useCallback((t: Tint | null) => {
    const el = ref.current;
    if (!el) return;
    if (!t) {
      el.style.removeProperty("--room-a");
      el.style.removeProperty("--room-b");
      el.style.removeProperty("--room-c");
      return;
    }
    el.style.setProperty("--room-a", t[0]);
    el.style.setProperty("--room-b", t[1]);
    el.style.setProperty("--room-c", t[2]);
  }, []);

  return (
    <Ctx.Provider value={setTint}>
      <div ref={ref} aria-hidden="true" className="room" />
      {children}
    </Ctx.Provider>
  );
}

const sampled = new WeakMap<HTMLImageElement, Tint | null>();

/**
 * Three tones from an image: its most vibrant colour, plus the average of the
 * top and bottom halves. Transparent and near-white/near-black pixels (the
 * studio background of product shots) are ignored.
 */
export function sampleTint(img: HTMLImageElement): Tint | null {
  if (sampled.has(img)) return sampled.get(img)!;
  let out: Tint | null = null;
  try {
    const s = 24;
    const c = document.createElement("canvas");
    c.width = s;
    c.height = s;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (ctx && img.naturalWidth) {
      ctx.drawImage(img, 0, 0, s, s);
      const d = ctx.getImageData(0, 0, s, s).data;
      let best = { sat: -1, rgb: [0, 0, 0] };
      const sum = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      for (let i = 0; i < d.length; i += 4) {
        const [r, g, b, a] = [d[i], d[i + 1], d[i + 2], d[i + 3]];
        if (a < 200) continue;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max > 245 && min > 235) continue; // studio white
        if (max < 18) continue; // pure black
        const sat = max === 0 ? 0 : (max - min) / max;
        if (sat * (max / 255) > best.sat) best = { sat: sat * (max / 255), rgb: [r, g, b] };
        const half = i / 4 < (s * s) / 2 ? 0 : 1;
        sum[half][0] += r;
        sum[half][1] += g;
        sum[half][2] += b;
        sum[half][3]++;
      }
      const avg = (k: number) =>
        sum[k][3] ? `rgb(${sum[k].slice(0, 3).map((v) => Math.round(v / sum[k][3])).join(" ")})` : null;
      const top = avg(0);
      const bottom = avg(1);
      if (best.sat >= 0 && (top || bottom)) {
        out = [`rgb(${best.rgb.join(" ")})`, top ?? bottom!, bottom ?? top!];
      }
    }
  } catch {
    out = null; // tainted canvas or decode failure: keep the neutral room
  }
  sampled.set(img, out);
  return out;
}
