"use client";

import { RouteError } from "@/components/RouteError";

export default function ProductError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError {...props} title="Couldn’t load this product" />;
}
