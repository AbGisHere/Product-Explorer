import Link from "next/link";
import { Suspense } from "react";
import { isFixtureMode } from "@/lib/api";
import { RefreshButton } from "./RefreshButton";
import { SavedLink } from "./SavedLink";

// Server Component: static shell. Only the interactive bits are client components.
export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-auto rounded text-lg font-semibold tracking-tight">
          Product Explorer
        </Link>
        {isFixtureMode() && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
            Fixture mode: offline data
          </span>
        )}
        <nav aria-label="Primary" className="flex items-center gap-2">
          {/* useSearchParams in a layout needs a Suspense boundary */}
          <Suspense fallback={<span className="btn">Saved</span>}>
            <SavedLink />
          </Suspense>
          <RefreshButton />
        </nav>
      </div>
    </header>
  );
}
