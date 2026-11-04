import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// `server-only` throws outside a server bundle; it's a no-op for tests.
vi.mock("server-only", () => ({}));

// Node >= 25 has its own experimental `localStorage` global that shadows
// jsdom's (and is unusable without --localstorage-file). Install a spec-shaped
// in-memory Storage so tests behave the same on every Node version.
class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}
Object.defineProperty(globalThis, "localStorage", { value: new MemoryStorage(), configurable: true });

afterEach(() => {
  cleanup();
  localStorage.clear();
});
