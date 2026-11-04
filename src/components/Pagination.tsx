"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useCatalogueNav } from "./CatalogueNav";
import { Glass } from "./glass/Glass";

/** Same spring as the category lens. */
const EASE = "cubic-bezier(0.32, 1.08, 0.5, 1)";
const GLIDE_MS = 600;

/** Page numbers to show: 1 … (p-1) p (p+1) … last */
export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const item =
  "grid h-10 min-w-9 shrink-0 place-items-center rounded-full px-2.5 text-sm tabular-nums transition-colors duration-300 sm:min-w-10 sm:px-3.5";
const gap = "grid h-10 shrink-0 place-items-center rounded-full px-1.5 text-sm";

const Arrow = ({ dir }: { dir: "prev" | "next" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="size-4 sm:hidden">
    <path d={dir === "prev" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"} />
  </svg>
);

/**
 * The pager. Collapsed, it shows 1 … p-1 p p+1 … last. Clicking a "…", or
 * swiping / scrolling sideways over the numbers, unfolds it into a scrollable
 * strip of every page; the swipe that opened it keeps scrolling it. Picking a
 * page glides the lens there, then the strip folds back around it.
 */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { hrefFor, navigate } = useCatalogueNav();
  // The lens moves the moment you click, not when the server answers.
  const [picked, setPicked] = useState<{ p: number; from: number } | null>(null);
  const current = picked && picked.from === page ? picked.p : page;

  const [open, setOpen] = useState(false);
  const [openW, setOpenW] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [lens, setLens] = useState<{ x: number; w: number } | null>(null);
  const [glide, setGlide] = useState(false);
  // Page to centre right after the strip unfolds.
  const aim = useRef<number | null>(null);
  // A sideways drag: may start collapsed, and keeps scrolling once open.
  const drag = useRef<{ id: number; x0: number; y0: number; base: number | null; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const expand = (centre: number) => {
    if (open || !strip.current) return;
    setOpenW(strip.current.offsetWidth);
    aim.current = centre;
    setGlide(false); // the layout changes completely: place the lens, don't fly it
    setOpen(true);
  };
  const collapse = () => {
    setGlide(false);
    setOpen(false);
  };

  // Lens: the current page's slot, relative to the list (so it scrolls with it).
  useLayoutEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-page="${current}"]`);
    if (!el) return;
    const next = { x: el.offsetLeft, w: el.offsetWidth };
     
    setLens((l) => (l && l.x === next.x && l.w === next.w ? l : next));
    if (!glide) requestAnimationFrame(() => setGlide(true));
  }, [current, glide, open, totalPages]);

  // Just unfolded: centre the aimed page; an ongoing swipe continues from there.
  useLayoutEffect(() => {
    const s = strip.current;
    if (!open || !s || aim.current === null) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-page="${aim.current}"]`);
    if (el) s.scrollLeft = el.offsetLeft + el.offsetWidth / 2 - s.clientWidth / 2;
    aim.current = null;
    if (drag.current) drag.current.base = s.scrollLeft;
  }, [open]);

  // Fold back on a click elsewhere or Escape.
  useEffect(() => {
    if (!open) return;
    const away = (e: globalThis.PointerEvent) => {
      if (!strip.current?.closest("nav")?.contains(e.target as Node)) collapse();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") collapse();
    };
    addEventListener("pointerdown", away, true);
    addEventListener("keydown", esc);
    return () => {
      removeEventListener("pointerdown", away, true);
      removeEventListener("keydown", esc);
    };
  }, [open]);

  // Wheel / trackpad. Collapsed: a sideways scroll unfolds it. Open: the wheel
  // scrolls the strip (vertical too, for plain mice) until it reaches an end.
  // A native listener, because React's onWheel is passive.
  useEffect(() => {
    const s = strip.current;
    if (!s) return;
    const onWheel = (e: WheelEvent) => {
      const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!open) {
        if (sideways && Math.abs(e.deltaX) > 2) {
          e.preventDefault();
          expand(current);
        }
        return;
      }
      const d = sideways ? e.deltaX : e.deltaY;
      const atStart = s.scrollLeft <= 0 && d < 0;
      const atEnd = s.scrollLeft >= s.scrollWidth - s.clientWidth - 1 && d > 0;
      if (!sideways && (atStart || atEnd)) return; // let the page scroll on
      e.preventDefault();
      s.scrollLeft += d;
    };
    s.addEventListener("wheel", onWheel, { passive: false });
    return () => s.removeEventListener("wheel", onWheel);
  });

  // Drags: a sideways swipe on the collapsed pager unfolds it and keeps
  // scrolling under the finger; a mouse can also drag the open strip.
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (open && e.pointerType !== "mouse") return; // open + touch: native scrolling, with momentum
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, base: open ? strip.current!.scrollLeft : null, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      const dx = e.clientX - d.x0;
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - d.y0)) return;
      d.moved = true;
      strip.current?.setPointerCapture(e.pointerId);
      if (!open) {
        d.x0 = e.clientX; // carry on from here once it has unfolded
        expand(current);
        return;
      }
    }
    if (d.base !== null && strip.current) strip.current.scrollLeft = d.base - (e.clientX - d.x0);
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    // A drag that ends on a number isn't a click: swallow the click that follows (if any).
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 0);
  };

  if (totalPages <= 1) return null;

  const go = (e: MouseEvent, p: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setPicked({ p, from: page });
    navigate({ page: p });
    if (open) setTimeout(collapse, GLIDE_MS); // let the lens land, then fold back around it
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("results-heading")?.scrollIntoView?.({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };

  const numbers: (number | "…")[] = open ? Array.from({ length: totalPages }, (_, i) => i + 1) : pageWindow(current, totalPages);
  const t = (props: string) => (glide ? props.split(",").map((k) => `${k} ${GLIDE_MS}ms ${EASE}`).join(", ") : "none");

  // The numbers, drawn twice: the real links, and a copy inside the lens.
  const numbersRow = (ghost: boolean) =>
    numbers.map((p, i) => {
      if (p === "…") {
        const before = numbers[i - 1] as number;
        const after = numbers[i + 1] as number;
        if (ghost) return <span key={`gap-${i}`} className={gap}>…</span>;
        return (
          <li key={`gap-${i}`} className="shrink-0">
            <button
              type="button"
              onClick={() => expand(Math.round((before + after) / 2))}
              aria-label={`Show pages ${before + 1} to ${after - 1}`}
              className={`${gap} cursor-pointer text-muted hover:bg-veil hover:text-ink`}
            >
              …
            </button>
          </li>
        );
      }
      const isCurrent = p === current;
      if (ghost) return <span key={p} className={`${item} text-ink ${isCurrent ? "font-medium" : ""}`}>{p}</span>;
      return (
        <li key={p} data-page={p} className="shrink-0">
          {isCurrent ? (
            <span aria-current="page" className={`${item} font-medium text-ink`}>
              <span className="sr-only">Page </span>
              {p}
            </span>
          ) : (
            <Link href={hrefFor({ page: p })} onClick={(e) => go(e, p)} scroll={false} aria-label={`Page ${p}`} draggable={false}
              className={`${item} text-muted hover:bg-veil hover:text-ink`}>
              {p}
            </Link>
          )}
        </li>
      );
    });

  const step = (p: number, label: string, text: string, dir: "prev" | "next") => {
    const inner = (
      <>
        <Arrow dir={dir} />
        <span className="max-sm:hidden">{text}</span>
      </>
    );
    return p >= 1 && p <= totalPages ? (
      <Link href={hrefFor({ page: p })} onClick={(e) => go(e, p)} scroll={false} aria-label={label}
        className={`${item} text-muted hover:bg-veil hover:text-ink`}>
        {inner}
      </Link>
    ) : (
      <span aria-disabled="true" className={`${item} text-quiet opacity-60`}>{inner}</span>
    );
  };

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <Glass radius={30} bezel={16} bend={18} frost={2} className="flex max-w-full items-center gap-1 p-1.5">
        {step(current - 1, "Previous page", "Previous", "prev")}
        <div
          ref={strip}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`min-w-0 ${open ? "pager-open overflow-x-auto overscroll-x-contain" : "overflow-hidden"}`}
          style={{ touchAction: open ? "pan-x pan-y" : "pan-y", ...(open ? { width: Math.max(openW, 200) } : null) }}
        >
          <ul ref={list} className="relative flex w-max items-center gap-1">
            {numbersRow(false)}
            {lens && (
              <Glass
                aria-hidden="true"
                radius={20}
                bezel={10}
                bend={10}
                frost={0.3}
                dispersion={0.18}
                className="lens pointer-events-none absolute left-0 top-0 z-10 h-10 overflow-hidden"
                style={{ width: lens.w, transform: `translateX(${lens.x}px)`, transition: t("transform,width") }}
              >
                {/* Copy of the strip, counter-shifted so the number under the lens sits over the real one */}
                <div className="absolute left-0 top-0 flex w-max items-center gap-1"
                  style={{ transform: `translateX(${-lens.x}px)`, transition: t("transform") }}>
                  {numbersRow(true)}
                </div>
              </Glass>
            )}
          </ul>
        </div>
        {step(current + 1, "Next page", "Next", "next")}
      </Glass>
    </nav>
  );
}
