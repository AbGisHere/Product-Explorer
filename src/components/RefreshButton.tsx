"use client";

import { useState, useTransition } from "react";
import { refreshCatalogue, type RefreshResult } from "@/app/actions";
import { RefreshIcon } from "./icons";

const time = (at: string | number) =>
  new Date(at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Calls the refreshCatalogue Server Action (server cache invalidation).
 *
 * First press: the "Refresh catalogue" pill folds into a circle and the result
 * appears beside it ("Refreshed at 2:34 PM"). It stays that way; pressing the
 * circle refreshes again and updates the time. Disabled while pending; the
 * result is announced through a polite live region.
 */
export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshResult | null>(null);
  const folded = pending || result !== null;

  const onClick = () =>
    startTransition(async () => {
      try {
        setResult(await refreshCatalogue());
      } catch {
        setResult({ ok: false, error: "Could not reach the server" });
      }
    });

  const status = pending
    ? "Refreshing…"
    : result?.ok
      ? `Refreshed at ${time(result.at)}`
      : result
        ? "Refresh failed. Try again"
        : "";

  return (
    <div className="flex items-center gap-2.5">
      <p
        role="status"
        aria-live="polite"
        className={`whitespace-nowrap text-xs tabular-nums transition-[opacity,translate] duration-500 ease-out-expo max-sm:sr-only ${
          folded ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0"
        } ${result && !result.ok && !pending ? "font-medium text-danger" : "text-muted"}`}
      >
        {status}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={folded ? "Refresh catalogue again" : undefined}
        className={`btn btn-primary h-10 overflow-hidden transition-[padding,gap,background-color] duration-500 ease-out-expo disabled:opacity-100 ${
          folded ? "gap-0 px-3" : "gap-2 px-4 max-sm:gap-0 max-sm:px-3"
        }`}
      >
        <RefreshIcon className={`size-4 ${pending ? "animate-spin" : ""}`} />
        <span
          className={`grid transition-[grid-template-columns,opacity] duration-500 ease-out-expo ${
            folded ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100 max-sm:grid-cols-[0fr] max-sm:opacity-0"
          }`}
        >
          {/* 0fr -> 1fr animates the label's real width, so the pill folds smoothly into a circle */}
          <span className="min-w-0 overflow-hidden whitespace-nowrap">Refresh catalogue</span>
        </span>
      </button>
    </div>
  );
}
