"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary: replaces the root layout when the layout itself
 * throws, so it brings its own <html>, fonts-free type and theme handling.
 * Without it Next shows its own unbranded error screen.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-room px-4 text-ink">
        <title>Something went wrong · Product Explorer</title>
        <main className="glass flex max-w-md flex-col items-center gap-3 px-8 py-14 text-center" style={{ "--glass-r": "34px" } as React.CSSProperties}>
          <p className="tracked text-xs text-muted">Product Explorer</p>
          <h1 className="display text-xl text-danger">Something went wrong</h1>
          <p className="text-sm text-muted">
            The page couldn’t be shown. Try again, or reload to start fresh.
            {error.digest && <span className="mt-1 block font-mono text-xs">Ref: {error.digest}</span>}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => reset()}>
              Try again
            </button>
            {/* A full reload on purpose: the app shell itself failed, so start clean. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn">
              Back to catalogue
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
