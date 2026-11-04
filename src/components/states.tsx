import Link from "next/link";
import type { ReactNode } from "react";

/** Reusable Loading / Empty / Error states. */

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-3">
          <div className="skeleton aspect-square w-full rounded-lg" />
          <div className="skeleton mt-4 h-3 w-1/3" />
          <div className="skeleton mt-2 h-4 w-4/5" />
          <div className="mt-4 flex justify-between">
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogueSkeleton() {
  return (
    <div role="status" aria-live="polite" className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-6">
      <span className="sr-only">Loading products…</span>
      <div className="hidden space-y-3 lg:block">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="skeleton h-5 w-3/4" />
        ))}
      </div>
      <div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="skeleton h-10 flex-1" />
          <div className="skeleton h-10 sm:w-52" />
        </div>
        <div className="skeleton my-4 h-4 w-48" />
        <ProductGridSkeleton />
      </div>
    </div>
  );
}

export function StatePanel({
  title,
  children,
  action,
  tone = "neutral",
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center"
    >
      <h2 className={`text-lg font-semibold ${tone === "error" ? "text-danger" : ""}`}>{title}</h2>
      {children && <div className="text-sm text-muted">{children}</div>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function EmptyResults({ resetHref, savedView }: { resetHref: string; savedView: boolean }) {
  return (
    <StatePanel
      title={savedView ? "No saved products here" : "No products match"}
      action={
        <Link href={resetHref} className="btn btn-primary">
          {savedView ? "Clear filters" : "Reset filters"}
        </Link>
      }
    >
      {savedView
        ? "Save products with the heart button, or clear your search and category."
        : "Try a different search term or category."}
    </StatePanel>
  );
}
