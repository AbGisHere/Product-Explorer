"use server";

import { updateTag } from "next/cache";
import { CATALOGUE_TAG, getCatalogue } from "@/lib/api";

export type RefreshResult = { ok: true; at: string; count: number } | { ok: false; error: string };

/**
 * "Refresh catalogue" Server Action.
 *
 * updateTag (Next 16, Server Actions only) immediately EXPIRES every cache entry
 * tagged "catalogue". Unlike revalidateTag(tag, "max") it doesn't serve stale:
 * the next read blocks on a fresh origin fetch. We do that read right here, so:
 *   - the action reports success only if the origin actually answered
 *   - on failure the user gets an error message (and the next render retries)
 * Next then re-renders the current route with the fresh data in the same
 * round trip, so the visible list updates without a separate router.refresh().
 */
export async function refreshCatalogue(): Promise<RefreshResult> {
  updateTag(CATALOGUE_TAG);
  try {
    const products = await getCatalogue();
    return { ok: true, at: new Date().toISOString(), count: products.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
