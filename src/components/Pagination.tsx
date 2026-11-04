"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useCatalogueNav } from "./CatalogueNav";
import { Glass } from "./glass/Glass";

/** Same spring as the category lens. */
const EASE = "cubic-bezier(0.32, 1.08, 0.5, 1)";

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

const item = "grid h-10 min-w-10 place-items-center rounded-full px-3.5 text-sm tabular-nums transition-colors duration-300";

type GoFn = (e: MouseEvent, p: number) => void;

/**
 * One row of controls. Rendered twice: the real, interactive row, and an
 * inverted "ghost" copy inside the lens (so the selected number is always
 * readable exactly where the glass is, on every frame of the glide).
 */
function Row({ page, totalPages, go, hrefFor, ghost }: {
  page: number; totalPages: number; go: GoFn; hrefFor: (p: number) => string; ghost?: boolean;
}) {
  const tone = ghost ? "text-room" : "text-muted hover:bg-veil hover:text-ink";
  const link = (p: number, label: string | undefined, children: ReactNode) =>
    ghost ? <span className={`${item} ${tone}`}>{children}</span> : (
      <Link href={hrefFor(p)} onClick={(e) => go(e, p)} scroll={false} aria-label={label} className={`${item} ${tone}`}>
        {children}
      </Link>
    );
  const disabled = (children: ReactNode) => (
    <span aria-disabled={ghost ? undefined : "true"} className={`${item} ${ghost ? "text-room opacity-60" : "text-quiet opacity-60"}`}>{children}</span>
  );
  const List = ghost ? "div" : "ul";
  const Li = ghost ? "div" : "li";

  return (
    <>
      {page > 1 ? link(page - 1, "Previous page", "Previous") : disabled("Previous")}
      <List className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <Li key={`gap-${i}`} aria-hidden="true" className={`px-1 ${ghost ? "text-room" : "text-muted"}`}>…</Li>
          ) : (
            <Li key={p} data-page={ghost ? undefined : p} className={p === page ? "" : "hidden sm:block"}>
              {p === page ? (
                <span aria-current={ghost ? undefined : "page"} className={`${item} font-medium ${ghost ? "text-room" : "text-ink"}`}>
                  {!ghost && <span className="sr-only">Page </span>}{p}
                </span>
              ) : (
                link(p, `Page ${p}`, p)
              )}
            </Li>
          ),
        )}
      </List>
      {page < totalPages ? link(page + 1, "Next page", "Next") : disabled("Next")}
    </>
  );
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { hrefFor, navigate } = useCatalogueNav();
  // The lens moves the moment you click, not when the server answers.
  const [picked, setPicked] = useState<{ p: number; from: number } | null>(null);
  const current = picked && picked.from === page ? picked.p : page;
  const row = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [glide, setGlide] = useState(false);

  useLayoutEffect(() => {
    const box = row.current;
    const el = box?.querySelector<HTMLElement>(`[data-page="${current}"] > span`);
    if (!box || !el) return;
    const a = box.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const next = { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
    setLens((l) => (l && l.x === next.x && l.y === next.y && l.w === next.w ? l : next));
    if (!glide) requestAnimationFrame(() => setGlide(true));
  }, [current, glide, totalPages]);

  if (totalPages <= 1) return null;

  const go = (e: MouseEvent, p: number) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setPicked({ p, from: page });
    navigate({ page: p });
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("results-heading")?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };
  const to = (p: number) => hrefFor({ page: p });
  const t = (props: string) => (glide ? props.split(",").map((k) => `${k} 600ms ${EASE}`).join(", ") : "none");

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <Glass radius={30} bezel={16} bend={18} frost={2} className="p-1.5">
        <div ref={row} className="relative flex items-center gap-1">
          <Row page={current} totalPages={totalPages} go={go} hrefFor={to} />
          {lens && (
            <Glass
              aria-hidden="true"
              radius={20}
              bezel={10}
              bend={10}
              frost={0.3}
              dispersion={0.18}
              className="lens pointer-events-none absolute left-0 top-0 z-10 overflow-hidden"
              style={{
                width: lens.w,
                height: lens.h,
                transform: `translate(${lens.x}px, ${lens.y}px)`,
                transition: t("transform,width,height"),
              }}
            >
              {/* The ghost row, counter-shifted so each label sits over the real one */}
              <div
                className="absolute left-0 top-0 flex w-max items-center gap-1"
                style={{
                  transform: `translate(${-lens.x}px, ${-lens.y}px)`,
                  transition: t("transform"),
                }}
              >
                <Row page={current} totalPages={totalPages} go={go} hrefFor={to} ghost />
              </div>
            </Glass>
          )}
        </div>
      </Glass>
    </nav>
  );
}
