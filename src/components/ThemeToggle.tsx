"use client";

import { useTheme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

/** Persistent light/dark switch. State is exposed via aria-pressed once known. */
export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      aria-label="Dark theme"
      aria-pressed={theme === null ? undefined : dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="btn size-10 px-0"
    >
      {dark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  );
}
