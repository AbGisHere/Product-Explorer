import Link from "next/link";
import { Suspense } from "react";
import { isFixtureMode } from "@/lib/api";
import { Glass } from "./glass/Glass";
import { RefreshButton } from "./RefreshButton";
import { SavedLink } from "./SavedLink";
import { ThemeToggle } from "./ThemeToggle";

// Server Component shell. The bar is a floating glass capsule; content scrolls under it and bends through its rim.
export function Header() {
  return (
    <header className="sticky top-3 z-30 px-3 sm:px-5">
      <Glass
        radius={30}
        bezel={20}
        bend={22}
        frost={2}
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 py-2 pl-5 pr-2 sm:pl-6"
      >
        <Link href="/" className="display mr-auto rounded-full py-2 text-[0.75rem] tracking-[0.16em] sm:text-[0.8125rem] sm:tracking-[0.18em]">
          Product Explorer
        </Link>
        {isFixtureMode() && (
          <span className="rounded-full px-3 py-1 text-xs text-muted ring-1 ring-line max-sm:order-last max-sm:w-full max-sm:text-center">Fixture data</span>
        )}
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1.5">
          {/* useSearchParams in a layout needs a Suspense boundary */}
          <Suspense fallback={<span className="btn h-10 px-4">Saved</span>}>
            <SavedLink />
          </Suspense>
          <RefreshButton />
          <ThemeToggle />
        </nav>
      </Glass>
    </header>
  );
}
