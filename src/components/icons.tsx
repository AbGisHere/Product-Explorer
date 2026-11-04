// Small inline SVG icons (no icon library). All decorative -> aria-hidden.
type P = { className?: string };
const base = "shrink-0";

export const HeartIcon = ({ filled, className = "size-5" }: P & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`}
    fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const StarIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="currentColor">
    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
  </svg>
);

export const RefreshIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />
  </svg>
);

export const SearchIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const ImageIcon = ({ className = "size-8" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none"
    stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);

export const MoonIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
  </svg>
);

export const SunIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`${base} ${className}`} fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
