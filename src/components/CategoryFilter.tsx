"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { formatCategory } from "@/lib/catalogue";
import { useCatalogueNav } from "./CatalogueNav";
import { Glass } from "./glass/Glass";
import { GlassSelect } from "./GlassSelect";

/** The lens glide (same spring as the reference tab bar). */
const EASE = "cubic-bezier(0.32, 1.08, 0.5, 1)";

/**
 * Desktop (lg+): sidebar list of real links (works without JS, middle-click,
 * aria-current). Below lg: a glass dropdown (GlassSelect).
 */
export function CategoryFilter({
  categories,
  variant,
}: {
  categories: string[];
  variant: "sidebar" | "select";
}) {
  const { query, hrefFor, navigate } = useCatalogueNav();
  // The lens moves the moment you click, not when the server answers.
  const [picked, setPicked] = useState<{ slug: string | null; from: string | null } | null>(null);
  const current = picked && picked.from === query.category ? picked.slug : query.category;
  const list = useRef<HTMLUListElement>(null);
  const [lens, setLens] = useState<{ y: number; h: number } | null>(null);
  const [glide, setGlide] = useState(false);

  // Measure the selected row; the glass lens glides to it (as in a tab bar).
  useLayoutEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-slug="${current ?? ""}"]`);
    if (!el) return;
    const next = { y: el.offsetTop, h: el.offsetHeight };
    setLens((l) => (l && l.y === next.y && l.h === next.h ? l : next));
    if (!glide) requestAnimationFrame(() => setGlide(true)); // no glide on first placement
  }, [current, glide, variant]);

  // Plain left-click -> transition navigation (pending state). Modified clicks -> browser default.
  const onClick = (e: MouseEvent, category: string | null) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    setPicked({ slug: category, from: query.category });
    navigate({ category });
  };

  const items: [string | null, string][] = [
    [null, "All products"],
    ...categories.map((c): [string, string] => [c, formatCategory(c)]),
  ];

  if (variant === "sidebar") return (
      <nav aria-labelledby="cat-heading" className="hidden lg:block">
        <Glass radius={26} bezel={18} bend={20} frost={2} className="sticky top-24 flex max-h-[calc(100dvh-17rem)] flex-col p-2">
          <h2 id="cat-heading" className="tracked px-3 pb-2 pt-3 text-muted">
            Categories
          </h2>
          <ul ref={list} className="relative min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain">
            {items.map(([slug, label]) => {
              const active = current === slug;
              return (
                <li key={slug ?? "all"} data-slug={slug ?? ""} className="relative">
                  <Link
                    href={hrefFor({ category: slug })}
                    onClick={(e) => onClick(e, slug)}
                    aria-current={active ? "page" : undefined}
                    scroll={false}
                    className={`block rounded-full px-3 py-2 text-sm pointer-coarse:py-3 transition-[color,background-color] duration-300 ease-out-expo ${
                      active ? "font-medium text-ink" : "text-muted hover:bg-veil/60 hover:text-ink"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            {/* The lens paints above the list and carries its own inverted copy of the
                labels, counter-shifted so each sits exactly over the real one. The
                lens clips that copy, so the inverted text is always exactly where the
                glass is, on every frame of the glide. */}
            {lens && (
              <Glass
                aria-hidden="true"
                radius={18}
                bezel={10}
                bend={10}
                frost={0.3}
                dispersion={0.18}
                className="lens pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden"
                style={{
                  height: lens.h,
                  transform: `translateY(${lens.y}px)`,
                  transition: glide ? `transform 600ms ${EASE}, height 600ms ${EASE}` : "none",
                }}
              >
                <div
                  className="space-y-0.5"
                  style={{
                    transform: `translateY(${-lens.y}px)`,
                    transition: glide ? `transform 600ms ${EASE}` : "none",
                  }}
                >
                  {items.map(([slug, label]) => (
                    <div key={slug ?? "all"} className="px-3 py-2 text-sm font-medium text-ink pointer-coarse:py-3">
                      {label}
                    </div>
                  ))}
                </div>
              </Glass>
            )}
          </ul>
        </Glass>
      </nav>
  );

  return (
    <GlassSelect
      label="Category"
      value={query.category ?? ""}
      options={items.map(([slug, label]) => [slug ?? "", label] as const)}
      onChange={(v) => navigate({ category: v || null })}
      className="flex-1 lg:hidden md:w-56 md:flex-none"
    />
  );
}
