export default function ProductLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-5xl">
      <span className="sr-only">Loading product…</span>
      <div className="skeleton mb-6 h-4 w-64" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="skeleton aspect-square w-full rounded-xl" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-9 w-4/5" />
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-10 w-44" />
        </div>
      </div>
    </div>
  );
}
