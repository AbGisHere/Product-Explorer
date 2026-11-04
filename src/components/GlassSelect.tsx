"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Glass } from "./glass/Glass";

/** Same spring as the category and page lenses. */
const EASE = "cubic-bezier(0.32, 1.08, 0.5, 1)";

type Option<V extends string> = readonly [value: V, label: string];

/**
 * A select made of glass: a button that opens a floating glass listbox, with
 * the tinted lens gliding to whichever option you point at or arrow to.
 *
 * Follows the ARIA "select-only combobox" pattern: the button carries
 * role=combobox, focus moves to the listbox while open, and the highlighted
 * option is announced via aria-activedescendant. Keyboard: arrows, Home/End,
 * PageUp/PageDown, Enter/Space to pick, Escape/Tab to close, type to jump.
 */
export function GlassSelect<V extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
  fieldClassName = "",
}: {
  label: string;
  value: V;
  options: readonly Option<V>[];
  onChange: (value: V) => void;
  className?: string;
  /** Extra classes for the button itself (e.g. corner shape inside a toolbar). */
  fieldClassName?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const button = useRef<HTMLButtonElement>(null);
  const listbox = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<{ left: number; top: number; width: number; maxH: number; up: boolean } | null>(null);
  const [lens, setLens] = useState<{ y: number; h: number } | null>(null);
  const [glide, setGlide] = useState(false);
  const typed = useRef({ text: "", at: 0 });

  const selectedIndex = Math.max(0, options.findIndex(([v]) => v === value));
  const current = options[selectedIndex];
  const optId = (i: number) => `${uid}-opt-${i}`;
  const placed = place !== null;

  const show = () => {
    setActive(selectedIndex);
    setGlide(false);
    setLens(null);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const pick = (i: number) => {
    close();
    if (options[i][0] !== value) onChange(options[i][0]);
  };

  // Float the panel under the button (or above it, when there's no room below).
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = button.current!.getBoundingClientRect();
      const width = Math.max(r.width + 12, 224);
      const left = Math.min(Math.max(8, r.left - 6), innerWidth - width - 8);
      const below = innerHeight - r.bottom - 16;
      const above = r.top - 16;
      const up = below < 240 && above > below;
      setPlace({ left, top: up ? r.top - 8 : r.bottom + 8, width, maxH: Math.min(up ? above : below, 400), up });
    };
    place();
    addEventListener("resize", place);
    addEventListener("scroll", place, true);
    return () => {
      removeEventListener("resize", place);
      removeEventListener("scroll", place, true);
    };
  }, [open]);

  // Focus the listbox once it exists; bring the selected row into view.
  useEffect(() => {
    if (!open || !placed) return;
    listbox.current?.focus({ preventScroll: true });
    document.getElementById(`${uid}-opt-${selectedIndex}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, placed, uid, selectedIndex]);

  // Lens: glide to the highlighted row (first placement is instant).
  useLayoutEffect(() => {
    const el = open && placed ? document.getElementById(`${uid}-opt-${active}`) : null;
    if (!el) return;
    const next = { y: el.offsetTop, h: el.offsetHeight };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measured layout drives the lens
    setLens((l) => (l && l.y === next.y && l.h === next.h ? l : next));
    if (!glide) requestAnimationFrame(() => setGlide(true));
  }, [open, placed, uid, active, glide]);

  // Click or tap anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!listbox.current?.parentElement?.contains(t) && !button.current?.contains(t)) close(false);
    };
    addEventListener("pointerdown", away, true);
    return () => removeEventListener("pointerdown", away, true);
  }, [open]);

  const move = (i: number) => {
    const n = Math.min(options.length - 1, Math.max(0, i));
    setActive(n);
    document.getElementById(optId(n))?.scrollIntoView?.({ block: "nearest" });
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const page = 6;
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active + 1),
      ArrowUp: () => move(active - 1),
      Home: () => move(0),
      End: () => move(options.length - 1),
      PageDown: () => move(active + page),
      PageUp: () => move(active - page),
      Enter: () => pick(active),
      " ": () => pick(active),
      Escape: () => close(),
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
      return;
    }
    if (e.key === "Tab") return close(false);
    // Typeahead: jump to the next option starting with what's been typed.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = e.timeStamp;
      const t = typed.current;
      t.text = now - t.at > 600 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
      t.at = now;
      const from = t.text.length === 1 ? active + 1 : active;
      for (let k = 0; k < options.length; k++) {
        const i = (from + k) % options.length;
        if (options[i][1].toLowerCase().startsWith(t.text)) return move(i);
      }
    }
  };

  const row = "flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm pointer-coarse:py-3";

  return (
    <div className={`relative flex min-w-0 ${className}`}>
      <span id={`${uid}-label`} className="sr-only">{label}</span>
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-labelledby={`${uid}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={onButtonKey}
        className={`field ${fieldClassName} flex cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{current?.[1]}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"
          className={`size-4 shrink-0 text-muted transition-transform duration-500 ease-out-expo ${open ? "rotate-180" : ""}`}>
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {open && place && createPortal(
        <div
          className="fixed z-50"
          style={{ left: place.left, width: place.width, ...(place.up ? { bottom: innerHeight - place.top } : { top: place.top }) }}
        >
          <Glass
            radius={24}
            bezel={16}
            bend={18}
            frost={10}
            className={`pop menu p-1.5 ${place.up ? "origin-bottom" : "origin-top"}`}
          >
            <div
              ref={listbox}
              id={`${uid}-list`}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={`${uid}-label`}
              aria-activedescendant={optId(active)}
              onKeyDown={onListKey}
              className="relative overflow-y-auto overscroll-contain outline-none"
              style={{ maxHeight: place.maxH }}
            >
              {options.map(([v, text], i) => (
                <div
                  key={v}
                  id={optId(i)}
                  role="option"
                  aria-selected={i === selectedIndex}
                  // Mouse/trackpad: the lens follows the pointer. Touch or pen (phone, iPad): it stays put while you
                  // scroll and glides only to the row you tap, then the panel closes.
                  onPointerMove={(e) => e.pointerType === "mouse" && active !== i && setActive(i)}
                  onClick={(e) => {
                    const kind = (e.nativeEvent as PointerEvent).pointerType;
                    const touch = kind === "touch" || kind === "pen"; // phones, iPads, Pencil
                    if (!touch || i === active) return pick(i);
                    setActive(i);
                    setTimeout(() => pick(i), 280);
                  }}
                  className={`${row} cursor-pointer ${i === selectedIndex ? "font-medium text-ink" : "text-muted"}`}
                >
                  <span className="truncate">{text}</span>
                  {i === selectedIndex && <Check />}
                </div>
              ))}
              {/* Tinted lens with its own inverted copy of the rows, as in the sidebar. */}
              {lens && (
                <Glass
                  aria-hidden="true"
                  radius={18}
                  bezel={10}
                  bend={14}
                  frost={0.3}
                  dispersion={0.18}
                  className="lens pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden"
                  style={{
                    height: lens.h,
                    transform: `translateY(${lens.y}px)`,
                    transition: glide ? `transform 500ms ${EASE}, height 500ms ${EASE}` : "none",
                  }}
                >
                  <div style={{ transform: `translateY(${-lens.y}px)`, transition: glide ? `transform 500ms ${EASE}` : "none" }}>
                    {options.map(([v, text], i) => (
                      <div key={v} className={`${row} text-ink ${i === selectedIndex ? "font-medium" : ""}`}>
                        <span className="truncate">{text}</span>
                        {i === selectedIndex && <Check />}
                      </div>
                    ))}
                  </div>
                </Glass>
              )}
            </div>
          </Glass>
        </div>,
        document.body,
      )}
    </div>
  );
}

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
