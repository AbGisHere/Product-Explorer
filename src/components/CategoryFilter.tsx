"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
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
        <Glass radius={26} bezel={18} bend={20} frost={2} className="sticky top-24 flex max-h-[calc(100dvh-17rem)] flex-col p-2">
          <h2 id="cat-heading" className="tracked px-3 pb-2 pt-3 text-muted">
            Categories
          </h2>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain">
            {items.map(([slug, label]) => {
              const active = query.category === slug;
              return (
                <li key={slug ?? "all"}>
                  <Link
                    href={hrefFor({ category: slug })}
                    onClick={(e) => onClick(e, slug)}
                    aria-current={active ? "page" : undefined}
                    scroll={false}
                    className={`block rounded-full px-3 py-2 text-sm transition-colors duration-300 ${
                      active
                        ? "bg-ink font-medium text-room"
                        : "text-muted hover:bg-veil hover:text-ink"
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
