"use client";

import { SORT_OPTIONS, type SortKey } from "@/lib/catalogue";
import { useCatalogueNav } from "./CatalogueNav";
import { GlassSelect } from "./GlassSelect";

const OPTIONS = Object.entries(SORT_OPTIONS) as [SortKey, string][];

export function SortSelect() {
  const { query, navigate } = useCatalogueNav();
  return (
    <GlassSelect
      label="Sort"
      value={query.sort}
      options={OPTIONS}
      onChange={(sort) => navigate({ sort })}
      className="flex-1 md:w-56 md:flex-none"
      fieldClassName="max-md:rounded-t-none max-md:rounded-bl-none md:rounded-l-none"
    />
  );
}
