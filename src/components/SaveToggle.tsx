"use client";

import type { CSSProperties } from "react";
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
        className={`stamp btn btn-glass glass ${saved ? "btn-primary" : ""}`}
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
      style={{ "--glass-r": "999px" } as CSSProperties}
      className={`stamp glass grid size-10 place-items-center transition-colors duration-300 ${
        saved ? "text-ink" : "text-muted hover:text-ink"
      }`}
    >
      <HeartIcon filled={saved} className="size-[17px]" />
    </button>
  );
}
