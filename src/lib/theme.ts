"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type Theme = "light" | "dark";
export { THEME_KEY };

const listeners = new Set<() => void>();
let morphTimer: ReturnType<typeof setTimeout> | undefined;

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
    const root = document.documentElement;
    // .theme-morph turns on transitions for the colour tokens (globals.css), so
    // the whole palette eases across while the glass stays live.
    root.classList.add("theme-morph");
    root.dataset.theme = t;
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* storage blocked: the theme still applies for this visit */
    }
    listeners.forEach((l) => l());
    clearTimeout(morphTimer);
    morphTimer = setTimeout(() => root.classList.remove("theme-morph"), 700);
  };
  return [theme, set];
}
