"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalogueNav } from "./CatalogueNav";
import { SearchIcon } from "./icons";

export const SEARCH_DEBOUNCE_MS = 300;

export function SearchInput() {
  const { query, navigate } = useCatalogueNav();
  const [value, setValue] = useState(query.q);
  const lastSent = useRef(query.q);

  // URL changed from outside (back/forward, reset link): reflect it in the box.
  // Skip if it's just the echo of what we typed, so typing isn't clobbered.
  useEffect(() => {
    if (query.q !== lastSent.current) {
      lastSent.current = query.q;
      setValue(query.q);
    }
  }, [query.q]);

  // Debounce: navigate ~300 ms after the user stops typing.
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = trimmed;
      navigate({ q: trimmed });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, navigate]);

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor="search" className="sr-only">
        Search products by title
      </label>
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-quiet" />
      <input
        id="search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search the collection"
        maxLength={100}
        autoComplete="off"
        className="field pl-11 max-md:rounded-b-none md:rounded-r-none"
      />
    </div>
  );
}
