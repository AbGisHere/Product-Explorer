import Link from "next/link";
import { StatePanel } from "@/components/states";

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
