import { revalidateTag } from "next/cache";
import { CATALOGUE_TAG } from "@/lib/api";

/**
 * POST /api/refresh: scriptable twin of the "Refresh catalogue" Server Action
 * (used by scripts/cache-evidence.mjs and curl).
 *
 * updateTag() is Server-Action-only, so here we use revalidateTag with
 * { expire: 0 }: the entry is expired immediately and the next request for the
 * catalogue blocks on a fresh origin fetch (no stale serve).
 */
export async function POST() {
  revalidateTag(CATALOGUE_TAG, { expire: 0 });
  return Response.json({ ok: true, revalidated: CATALOGUE_TAG, at: new Date().toISOString() });
}
