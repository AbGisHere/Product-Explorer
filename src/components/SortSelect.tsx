"use client";

import { SORT_OPTIONS, type SortKey } from "@/lib/catalogue";
import { useCatalogueNav } from "./CatalogueNav";

export function SortSelect() {
  const { query, navigate } = useCatalogueNav();
  return (
    <div className="flex items-center gap-2 sm:w-60">
      <label htmlFor="sort" className="shrink-0 text-sm text-muted">
        Sort
      </label>
      <select
        id="sort"
        value={query.sort}
        onChange={(e) => navigate({ sort: e.target.value as SortKey })}
        className="field cursor-pointer"
      >
        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
