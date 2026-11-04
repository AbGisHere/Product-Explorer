"use client";

import { useRouter } from "next/navigation";
import { LAST_CATALOGUE_KEY } from "./BackToCatalogue";
import { createContext, useCallback, useContext, useEffect, useTransition, type ReactNode } from "react";
import { buildQueryString, type CatalogueQuery } from "@/lib/catalogue";
import { useFavourites } from "@/lib/favourites";

/**
 * The URL is the single source of truth for search/category/sort/page/saved.
 * The server parses it, and this context hands the *validated* query to the
 * client controls plus a navigate() that pushes a new URL inside a transition.
 *
 * Why a transition: the old results stay visible (dimmed, aria-busy) while the
 * server renders the new ones, and controls stay usable. If the user changes
 * something again mid-flight, Next's router abandons the older navigation, so a
 * slow old response can never replace newer results.
 */

interface NavCtx {
  query: CatalogueQuery;
  isPending: boolean;
  hrefFor: (patch: Partial<CatalogueQuery>) => string;
  navigate: (patch: Partial<CatalogueQuery>) => void;
}

const Ctx = createContext<NavCtx | null>(null);

export function useCatalogueNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalogueNav must be used inside <CatalogueNavProvider>");
  return ctx;
}

export function CatalogueNavProvider({ query, children }: { query: CatalogueQuery; children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Any change other than `page` itself resets to page 1.
  const hrefFor = useCallback(
    (patch: Partial<CatalogueQuery>) =>
      "/" + buildQueryString({ ...query, page: 1, ...patch }),
    [query],
  );

  const navigate = useCallback(
    (patch: Partial<CatalogueQuery>) =>
      startTransition(() => router.push(hrefFor(patch), { scroll: false })),
    [hrefFor, router],
  );

  // Saved-only view: keep the ?saved= ids in sync when the user un/saves.
  const { ids, ready } = useFavourites();
  // Remember that this tab has a catalogue view in its history (see BackToCatalogue).
  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_CATALOGUE_KEY, "1");
    } catch {
      /* storage blocked: back link stays a plain link */
    }
  }, []);

  useEffect(() => {
    if (!ready || !query.saved) return;
    const same = ids.length === query.saved.length && ids.every((id) => query.saved!.includes(id));
    if (!same) {
      startTransition(() =>
        router.replace("/" + buildQueryString({ ...query, saved: ids }), { scroll: false }),
      );
    }
  }, [ids, ready, query, router]);

  return <Ctx.Provider value={{ query, isPending, hrefFor, navigate }}>{children}</Ctx.Provider>;
}

/** Wraps results: dims + aria-busy while a navigation is in flight. */
export function ResultsRegion({ children }: { children: ReactNode }) {
  const { isPending } = useCatalogueNav();
  return (
    <div
      aria-busy={isPending}
      className={`transition-[opacity,filter] duration-300 ${isPending ? "pointer-events-none opacity-50 blur-[2px]" : ""}`}
    >
      {children}
    </div>
  );
}

/** Live "Showing x–y of N" line + pending indicator. */
export function ResultsSummary({ text }: { text: string }) {
  const { isPending } = useCatalogueNav();
  return (
    <p role="status" aria-live="polite" className="pb-1 text-sm tabular-nums text-muted">
      {text}
      {isPending && <span className="ml-2 text-ink">Updating…</span>}
    </p>
  );
}
