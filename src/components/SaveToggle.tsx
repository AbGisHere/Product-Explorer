"use client";

import { useFavourites } from "@/lib/favourites";
import { HeartIcon } from "./icons";

/** Same component on cards and the detail page -> always consistent. */
export function SaveToggle({
  id,
  title,
  variant = "icon",
}: {
  id: number;
  title: string;
  variant?: "icon" | "full";
}) {
  const { has, toggle } = useFavourites();
  const saved = has(id);

  if (variant === "full") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => toggle(id)}
        className={`btn ${saved ? "border-accent bg-accent-soft text-accent" : ""}`}
      >
        <HeartIcon filled={saved} />
        {saved ? "Saved" : "Save product"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={`Save ${title}`}
      onClick={() => toggle(id)}
      className={`grid size-9 place-items-center rounded-full border bg-surface/95 shadow-sm transition-colors ${
        saved ? "border-accent text-accent" : "border-line text-muted hover:text-ink"
      }`}
    >
      <HeartIcon filled={saved} className="size-[18px]" />
    </button>
  );
}
