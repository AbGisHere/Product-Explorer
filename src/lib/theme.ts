"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type Theme = "light" | "dark";
export { THEME_KEY };

const listeners = new Set<() => void>();

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
  };
}

/** null on the server and first client render (no hydration mismatch). */
export function useTheme(): [Theme | null, (t: Theme) => void] {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null);
  const set = (t: Theme) => {
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* storage blocked: the theme still applies for this visit */
    }
    listeners.forEach((l) => l());
  };
  return [theme, set];
}
