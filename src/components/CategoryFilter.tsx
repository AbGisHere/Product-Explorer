"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { formatCategory } from "@/lib/catalogue";
import { useCatalogueNav } from "./CatalogueNav";
import { Glass } from "./glass/Glass";

/**
 * Desktop (lg+): sidebar list of real links (works without JS, middle-click,
 * aria-current). Below lg: a native <select>, the most usable mobile picker.
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
            {lens && (
              <Glass
                aria-hidden="true"
                radius={18}
                bezel={10}
                bend={10}
                frost={0.3}
                dispersion={0.18}
                className="lens pointer-events-none absolute inset-x-0 top-0"
                style={{
                  height: lens.h,
                  transform: `translateY(${lens.y}px)`,
                  transition: glide
                    ? "transform 600ms cubic-bezier(0.32, 1.08, 0.5, 1), height 600ms cubic-bezier(0.32, 1.08, 0.5, 1)"
                    : "none",
                }}
              />
            )}
            {items.map(([slug, label]) => {
              const active = current === slug;
              return (
                <li key={slug ?? "all"} data-slug={slug ?? ""} className="relative">
                  <Link
                    href={hrefFor({ category: slug })}
                    onClick={(e) => onClick(e, slug)}
                    aria-current={active ? "page" : undefined}
                    scroll={false}
                    className={`block rounded-full px-3 py-2 text-sm pointer-coarse:py-3 transition-[color,background-color,translate] duration-300 ease-out-expo ${
                      active ? "translate-x-1 font-medium text-ink" : "text-muted hover:bg-veil/60 hover:text-ink"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Glass>
      </nav>
  );

  return (
      <div className="flex min-w-0 items-center lg:hidden sm:w-56">
        <label htmlFor="category" className="sr-only">
          Category
        </label>
        <select
          id="category"
          value={query.category ?? ""}
          onChange={(e) => navigate({ category: e.target.value || null })}
          className="field cursor-pointer"
        >
          {items.map(([slug, label]) => (
            <option key={slug ?? "all"} value={slug ?? ""}>
              {label}
            </option>
          ))}
        </select>
      </div>
  );
}
