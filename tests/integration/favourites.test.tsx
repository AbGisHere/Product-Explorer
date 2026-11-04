import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SaveToggle } from "@/components/SaveToggle";
import { SavedLink } from "@/components/SavedLink";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const KEY = "product-explorer:favourites";

describe("favourites integration", () => {
  it("keeps card and detail toggles in sync, persists, and updates the Saved link", () => {
    render(
      <>
        <SavedLink />
        <SaveToggle id={7} title="Desk Lamp" />
        <SaveToggle id={7} title="Desk Lamp" variant="full" />
      </>,
    );
    const icon = screen.getByRole("button", { name: "Save Desk Lamp" });
    const full = screen.getByRole("button", { name: /save product/i });
    expect(icon).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(icon);
    expect(icon).toHaveAttribute("aria-pressed", "true");
    expect(full).toHaveAttribute("aria-pressed", "true"); // same store
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([7]);
    expect(screen.getByRole("link", { name: /saved/i })).toHaveAttribute("href", "/?saved=7");
    expect(screen.getByRole("link", { name: /saved/i })).toHaveTextContent("(1)");

    fireEvent.click(full);
    expect(icon).toHaveAttribute("aria-pressed", "false");
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual([]);
  });

  it("restores saved state after a reload (remount)", () => {
    localStorage.setItem(KEY, JSON.stringify([3]));
    render(<SaveToggle id={3} title="Chair" />);
    expect(screen.getByRole("button", { name: "Save Chair" })).toHaveAttribute("aria-pressed", "true");
  });

  it("ignores corrupted storage", () => {
    localStorage.setItem(KEY, "{not json");
    render(<SaveToggle id={3} title="Chair" />);
    expect(screen.getByRole("button", { name: "Save Chair" })).toHaveAttribute("aria-pressed", "false");
  });
});
