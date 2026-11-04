"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { StatePanel } from "./states";

/**
 * Shared error boundary UI. "Try again" must re-run the SERVER render
 * (router.refresh) and reset the boundary, since reset() alone only
 * re-renders on the client, which would just re-throw the same error.
 */
export function RouteError({
  error,
  reset,
  title,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-8">
      {/* React 19 hoists this into <head>: the tab names the problem, not the page that failed. */}
      <title>{`${title} · Product Explorer`}</title>
      <StatePanel
        tone="error"
        title={title}
        action={
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  router.refresh();
                  reset();
                })
              }
            >
              {pending ? "Retrying…" : "Try again"}
            </button>
            <Link href="/" className="btn">
              Back to catalogue
            </Link>
          </>
        }
      >
        The product service didn’t respond. This is usually temporary.
        {error.digest && <span className="mt-1 block font-mono text-xs">Ref: {error.digest}</span>}
      </StatePanel>
    </div>
  );
}
