"use client";

import { useLayoutEffect } from "react";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

/**
 * The saved-theme script, in the server HTML only: it runs in <head> before
 * first paint (no theme flash). On the client it renders nothing, because a
 * client-rendered <script> never executes and React warns about it.
 *
 * When Next re-renders the root layout on the client (a streamed 404 does),
 * <html> loses the data-theme the script set, so the same snippet is
 * re-applied before paint. React 19 tolerates the leftover server node.
 */
export function ThemeScript() {
  useLayoutEffect(() => {
    new Function(THEME_INIT_SCRIPT)();
  }, []);
  if (typeof window !== "undefined") return null;
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
