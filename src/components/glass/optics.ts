/**
 * Refraction map for a rounded-rectangle glass slab.
 *
 * Same optics as a real slab with a circular bezel: flat in the middle, and
 * inside the rim (width `bezel`) the surface curves down along
 *   m(t) = 1 - sqrt(1 - t^2),   t = 0 at the inner edge of the bezel, 1 at the rim
 * so light is pulled inward hardest right at the edge. The vector is encoded
 * for <feDisplacementMap>: R = x offset, G = y offset, 128 = no bend.
 */
const cache = new Map<string, string>();

export function refractionMap(w: number, h: number, radius: number, bezel: number): string {
  const key = `${w}x${h}r${radius}b${bezel}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const d = img.data;

  const hw = w / 2;
  const hh = h / 2;
  const r = Math.min(radius, hw, hh);
  const b = Math.max(1, Math.min(bezel, hw * 0.85, hh * 0.85));

  // Signed distance to the rounded rect (negative inside).
  const sdf = (x: number, y: number) => {
    const qx = Math.abs(x - hw) - (hw - r);
    const qy = Math.abs(y - hh) - (hh - r);
    const ox = Math.max(qx, 0);
    const oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;
      const inset = -sdf(px, py); // distance from the rim, inward
      let vx = 0;
      let vy = 0;
      if (inset > 0 && inset < b) {
        const t = 1 - inset / b;
        const m = 1 - Math.sqrt(Math.max(0, 1 - t * t));
        // Outward normal = SDF gradient; light is pulled inward (-normal).
        const nx = sdf(px + 1, py) - sdf(px - 1, py);
        const ny = sdf(px, py + 1) - sdf(px, py - 1);
        const len = Math.hypot(nx, ny) || 1;
        vx = (-nx / len) * m;
        vy = (-ny / len) * m;
      }
      d[i] = 128 + vx * 127;
      d[i + 1] = 128 + vy * 127;
      d[i + 2] = 128;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

/** SVG displacement filters only apply as backdrop-filter in Chromium. */
export function supportsRefraction(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\//.test(ua);
}
