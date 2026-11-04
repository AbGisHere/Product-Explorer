"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFavourites } from "@/lib/favourites";
import { HeartIcon } from "./icons";

/** "Saved (n)": links to the saved-only view, passing saved ids as a validated filter. */
export function SavedLink() {
  const { ids, ready } = useFavourites();
  const active = useSearchParams().has("saved");
  return (
    <Link
      href={`/?saved=${ids.join(",")}`}
      aria-current={active ? "page" : undefined}
      className={`btn ${active ? "border-accent bg-accent-soft text-accent" : ""}`}
    >
      <HeartIcon filled={active} className="size-4" />
      Saved
      {/* count only after hydration, so server + first client render match */}
      <span className="tabular-nums">{ready ? `(${ids.length})` : ""}</span>
    </Link>
  );
}
