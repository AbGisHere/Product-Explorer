import Link from "next/link";
import type { Metadata } from "next";
import { StatePanel } from "@/components/states";

export const metadata: Metadata = { title: "Product not found", robots: { index: false } };

export default function ProductNotFound() {
  return (
    <div className="py-8">
      <StatePanel
        title="Product not found"
        action={<Link href="/" className="btn btn-primary">Browse all products</Link>}
      >
        This product doesn’t exist or may have been removed. Check the link, or find it in the catalogue.
      </StatePanel>
    </div>
  );
}
