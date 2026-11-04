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
    <div className="flex items-center gap-2">
      <button type="button" onClick={onClick} disabled={pending} className="btn btn-primary">
        <RefreshIcon className={`size-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Refreshing…" : "Refresh catalogue"}
      </button>
      <p role="status" aria-live="polite" className="text-xs">
        {result?.ok && (
          <span className="text-success">
            Updated {new Date(result.at).toLocaleTimeString()}
          </span>
        )}
        {result && !result.ok && (
          <span className="text-danger">Refresh failed. Try again.</span>
        )}
      </p>
    </div>
  );
}
