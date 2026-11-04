"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { formatCategory } from "@/lib/catalogue";
import { useCatalogueNav } from "./CatalogueNav";

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

  // Plain left-click -> transition navigation (pending state). Modified clicks -> browser default.
  const onClick = (e: MouseEvent, category: string | null) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate({ category });
  };

  const items: [string | null, string][] = [
    [null, "All products"],
    ...categories.map((c): [string, string] => [c, formatCategory(c)]),
  ];

  if (variant === "sidebar") return (
      <nav aria-labelledby="cat-heading" className="hidden lg:block">
        <div className="sticky top-20 rounded-xl border border-line bg-surface p-3">
          <h2 id="cat-heading" className="px-2 pb-2 text-sm font-semibold">
            Categories
          </h2>
          <ul className="max-h-[calc(100dvh-10rem)] space-y-0.5 overflow-y-auto">
            {items.map(([slug, label]) => {
              const active = query.category === slug;
              return (
                <li key={slug ?? "all"}>
                  <Link
                    href={hrefFor({ category: slug })}
                    onClick={(e) => onClick(e, slug)}
                    aria-current={active ? "page" : undefined}
                    scroll={false}
                    className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                      active ? "bg-accent-soft font-medium text-accent" : "text-ink hover:bg-canvas"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
  );

  return (
      <div className="flex items-center gap-2 lg:hidden sm:w-60">
        <label htmlFor="category" className="shrink-0 text-sm text-muted">
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
