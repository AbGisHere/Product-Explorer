import Link from "next/link";
import type { Metadata } from "next";
import { StatePanel } from "@/components/states";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="py-8">
      <StatePanel
        title="Page not found"
        action={<Link href="/" className="btn btn-primary">Browse the catalogue</Link>}
      >
        We couldn’t find what you were looking for.
      </StatePanel>
    </div>
  );
}
