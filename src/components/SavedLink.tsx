"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFavourites } from "@/lib/favourites";
import { HeartIcon } from "./icons";

/** "Saved (n)": toggles the saved-only view (saved ids passed as a validated filter); pressed again it returns to all products. */
export function SavedLink() {
  const { ids, ready } = useFavourites();
  const active = useSearchParams().has("saved");
  return (
    <Link
      href={active ? "/" : `/?saved=${ids.join(",")}`}
      aria-current={active ? "page" : undefined}
      className={`btn btn-glass glass h-10 px-4 ${active ? "btn-primary" : ""}`}
    >
      <HeartIcon filled={active} className="size-4" />
      Saved
      {/* count only after hydration, so server + first client render match */}
      <span className="tabular-nums">{ready ? `(${ids.length})` : ""}</span>
      {active && <span className="sr-only">, showing saved only. Select to show all products</span>}
    </Link>
  );
}
