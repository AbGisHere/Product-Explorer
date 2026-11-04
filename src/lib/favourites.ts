"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Favourites: user-local, in localStorage, never touches the server cache.
 *
 * useSyncExternalStore with a server snapshot of [] means the server HTML and
 * the first client (hydration) render agree -> no hydration warnings. React
 * then immediately re-renders with the real localStorage value.
 * Every SaveToggle / Saved link subscribes to the same store, so list and
 * detail pages always agree, and the "storage" event syncs other tabs.
 */

const KEY = "product-explorer:favourites";
const EMPTY: number[] = [];
const listeners = new Set<() => void>();

let cacheRaw: string | null = null;
let cacheIds: number[] = EMPTY;

function read(): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cacheIds; // storage blocked (private mode etc.): keep in-memory state
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cacheIds = Array.isArray(parsed)
        ? parsed.filter((n): n is number => Number.isSafeInteger(n) && n > 0)
        : EMPTY;
    } catch {
      cacheIds = EMPTY; // corrupted value: treat as empty
    }
  }
  return cacheIds; // same reference if unchanged (required by useSyncExternalStore)
}

function write(ids: number[]) {
  cacheIds = ids;
  cacheRaw = JSON.stringify(ids);
  try {
    localStorage.setItem(KEY, cacheRaw);
  } catch {
    /* storage full/blocked: state still updates in memory for this tab */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};

export function useFavourites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  // false during SSR + hydration render, true after: lets callers avoid acting on [].
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const toggle = useCallback((id: number) => {
    const cur = read();
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);

  return { ids, ready, toggle, has: (id: number) => ids.includes(id) };
}
