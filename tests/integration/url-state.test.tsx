import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogueNavProvider } from "@/components/CatalogueNav";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Pagination } from "@/components/Pagination";
import { SearchInput } from "@/components/SearchInput";
import { SortSelect } from "@/components/SortSelect";
import { DEFAULT_SORT, type CatalogueQuery } from "@/lib/catalogue";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const base: CatalogueQuery = { q: "", category: null, sort: DEFAULT_SORT, page: 1, saved: null };

function renderControls(query: Partial<CatalogueQuery> = {}) {
  const q = { ...base, ...query };
  const ui = (qq: CatalogueQuery) => (
    <CatalogueNavProvider query={qq}>
      <SearchInput />
      <CategoryFilter categories={["beauty", "furniture"]} variant="select" />
      <SortSelect />
      <Pagination page={qq.page} totalPages={3} />
    </CatalogueNavProvider>
  );
  const r = render(ui(q));
  return { ...r, rerenderWith: (next: Partial<CatalogueQuery>) => r.rerender(ui({ ...q, ...next })) };
}

describe("URL state integration", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    vi.useFakeTimers();
  });

  it("debounces search (~300 ms), keeps other params and resets to page 1", () => {
    renderControls({ category: "beauty", sort: "price-desc", page: 3 });
    const input = screen.getByLabelText(/search products/i);

    fireEvent.change(input, { target: { value: "p" } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: "ph" } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: "phone" } });
    act(() => vi.advanceTimersByTime(299));
    expect(push).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(push).toHaveBeenCalledTimes(1); // rapid typing -> ONE navigation
    expect(push).toHaveBeenCalledWith("/?q=phone&category=beauty&sort=price-desc", { scroll: false });
  });

  it("sort and category changes write the URL and reset the page", () => {
    renderControls({ q: "lamp", page: 2 });
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "price-asc" } });
    expect(push).toHaveBeenLastCalledWith("/?q=lamp&sort=price-asc", { scroll: false });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "furniture" } });
    expect(push).toHaveBeenLastCalledWith("/?q=lamp&category=furniture", { scroll: false });
  });

  it("pagination links carry the full query", () => {
    renderControls({ q: "lamp", category: "beauty", page: 2 });
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute("href", "/?q=lamp&category=beauty&page=3");
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "/?q=lamp&category=beauty");
    expect(screen.getByText("2").closest("[aria-current]")).toHaveAttribute("aria-current", "page");
  });

  it("restores controls when the URL changes externally (back/forward)", () => {
    const { rerenderWith } = renderControls({ q: "phone", sort: "price-desc" });
    expect(screen.getByLabelText(/search products/i)).toHaveValue("phone");
    rerenderWith({ q: "lamp", sort: "title-asc" });
    expect(screen.getByLabelText(/search products/i)).toHaveValue("lamp");
    expect(screen.getByLabelText("Sort")).toHaveValue("title-asc");
    act(() => vi.advanceTimersByTime(500));
    expect(push).not.toHaveBeenCalled(); // restoring must not trigger a new navigation
  });
});
