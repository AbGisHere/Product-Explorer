import Link from "next/link";
import type { ReactNode } from "react";

/** Reusable Loading / Empty / Error states. */

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton aspect-[4/5] rounded-[28px]" />
      ))}
    </div>
  );
}

export function CatalogueSkeleton() {
  return (
    <div role="status" aria-live="polite" className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
      <span className="sr-only">Loading products…</span>
      <div className="skeleton hidden h-[32rem] rounded-[26px] lg:block" />
      <div>
        <div className="mb-8 flex items-end justify-between">
          <div className="skeleton h-12 w-72" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="skeleton mb-8 h-14 rounded-full" />
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
      className="glass mx-auto flex max-w-md flex-col items-center gap-3 px-8 py-14 text-center"
    >
      <h2 className={`display text-xl ${tone === "error" ? "text-danger" : ""}`}>{title}</h2>
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
        ? "Save pieces with the heart, or clear your search and category."
        : "Try a different search term or category."}
    </StatePanel>
  );
}
