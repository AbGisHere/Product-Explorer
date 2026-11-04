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
export function useTheme(): [Theme | null, (t: Theme, origin?: { x: number; y: number }) => void] {
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null);
  const set = (t: Theme, origin?: { x: number; y: number }) => {
    const apply = () => {
      document.documentElement.dataset.theme = t;
      try {
        localStorage.setItem(THEME_KEY, t);
      } catch {
        /* storage blocked: the theme still applies for this visit */
      }
      listeners.forEach((l) => l());
    };
    // The new theme spreads out as a circle from the toggle (View Transitions API).
    // No API support or reduced motion: switch instantly.
    const root = document.documentElement;
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    const { x, y } = origin ?? { x: innerWidth / 2, y: innerHeight / 2 };
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add("theme-vt");
    const vt = document.startViewTransition(apply);
    vt.ready
      .then(() =>
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
        ),
      )
      .catch(() => {});
    vt.finished.finally(() => root.classList.remove("theme-vt"));
  };
  return [theme, set];
}
