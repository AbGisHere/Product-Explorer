"use client";

import { SORT_OPTIONS, type SortKey } from "@/lib/catalogue";
import { useCatalogueNav } from "./CatalogueNav";

export function SortSelect() {
  const { query, navigate } = useCatalogueNav();
  return (
    <div className="flex min-w-0 items-center sm:w-56">
      <label htmlFor="sort" className="sr-only">
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
