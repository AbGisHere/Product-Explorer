"use client";

import { useState, useTransition } from "react";
import { refreshCatalogue, type RefreshResult } from "@/app/actions";
import { RefreshIcon } from "./icons";

/**
 * Calls the refreshCatalogue Server Action (server cache invalidation).
 * Disabled while pending; result announced via a polite live region.
 */
export function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RefreshResult | null>(null);

  const onClick = () =>
    startTransition(async () => {
      setResult(null);
      try {
        setResult(await refreshCatalogue());
      } catch {
        setResult({ ok: false, error: "Could not reach the server" });
      }
    });

  return (
    <div className="relative">
      <button type="button" onClick={onClick} disabled={pending} className="btn btn-primary h-10 px-4 max-sm:w-10 max-sm:px-0">
        <RefreshIcon className={`size-4 ${pending ? "animate-spin" : ""}`} />
        <span className="max-sm:sr-only">{pending ? "Refreshing…" : "Refresh catalogue"}</span>
      </button>
      <p role="status" aria-live="polite" className="pointer-events-none absolute right-0 top-[calc(100%+14px)] whitespace-nowrap text-xs">
        {result?.ok && (
          <span className="rounded-full bg-ink px-3 py-1.5 text-room">
            Catalogue updated {new Date(result.at).toLocaleTimeString()}
          </span>
        )}
        {result && !result.ok && (
          <span className="rounded-full bg-danger px-3 py-1.5 font-medium text-room">Refresh failed. Try again.</span>
        )}
      </p>
    </div>
  );
}
