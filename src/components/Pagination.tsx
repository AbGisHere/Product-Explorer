"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useCatalogueNav } from "./CatalogueNav";
import { Glass } from "./glass/Glass";

/** Page numbers to show: 1 … (p-1) p (p+1) … last */
export function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

const item = "grid h-10 min-w-10 place-items-center rounded-full px-3.5 text-sm tabular-nums transition-colors duration-300";

type GoFn = (e: MouseEvent, p: number) => void;
function PageLink({ p, href, go, label, children }: { p: number; href: string; go: GoFn; label?: string; children: ReactNode }) {
  return (
    <Link href={href} onClick={(e) => go(e, p)} scroll={false} aria-label={label}
      className={`${item} text-muted hover:bg-veil hover:text-ink`}>
      {children}
    </Link>
  );
}
function Disabled({ children }: { children: ReactNode }) {
  return <span aria-disabled="true" className={`${item} text-quiet opacity-60`}>{children}</span>;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const { hrefFor, navigate } = useCatalogueNav();
  if (totalPages <= 1) return null;

  const go = (e: MouseEvent, p: number) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate({ page: p });
    document.getElementById("results-heading")?.scrollIntoView({ block: "start" });
  };

  return (
    <nav aria-label="Pagination" className="mt-12 flex justify-center">
      <Glass radius={30} bezel={16} bend={18} frost={2} className="flex flex-wrap items-center justify-center gap-1 p-1.5">
      {page > 1 ? <PageLink p={page - 1} href={hrefFor({ page: page - 1 })} go={go} label="Previous page">Previous</PageLink> : <Disabled>Previous</Disabled>}
      <ul className="flex flex-wrap items-center gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "…" ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted">…</li>
          ) : (
            <li key={p} className={p === page ? "" : "hidden sm:block"}>
              {p === page ? (
                <span aria-current="page" className={`${item} bg-ink font-medium text-room`}>
                  <span className="sr-only">Page </span>{p}
                </span>
              ) : (
                <PageLink p={p} href={hrefFor({ page: p })} go={go} label={`Page ${p}`}>{p}</PageLink>
              )}
            </li>
          ),
        )}
      </ul>
      {page < totalPages ? <PageLink p={page + 1} href={hrefFor({ page: page + 1 })} go={go} label="Next page">Next</PageLink> : <Disabled>Next</Disabled>}
      </Glass>
    </nav>
  );
}
