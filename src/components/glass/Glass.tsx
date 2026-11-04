"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { refractionMap, supportsRefraction } from "./optics";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type GlassProps = {
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Corner radius in px; the shader clamps it to a capsule. */
  radius?: number;
  /** Width of the curved rim in px. */
  bezel?: number;
  /** How far (px) light is pulled inward at the very edge. */
  bend?: number;
  /** Diffusion (frost) in px; 0 = clear glass. */
  frost?: number;
  /** Red bends this much more than blue (0.1 = 10%). */
  dispersion?: number;
} & Record<string, unknown>;

/**
 * A slab of real glass over whatever is behind it.
 *
 * Chromium: the backdrop is frosted, then refracted through a per-size
 * displacement map (circular bezel), once per colour channel at slightly
 * different strengths, so the rim shows thin colour fringes. Then it is
 * saturated, as light through glass is.
 * Other browsers: the same slab with frost, saturation and the rim light only
 * (CSS `.glass` fallback); nothing breaks.
 */
export function Glass({
  as: Tag = "div",
  children,
  className = "",
  style,
  radius = 22,
  bezel = 18,
  bend = 28,
  frost = 3,
  dispersion = 0.12,
  ...rest
}: GlassProps) {
  const ref = useRef<HTMLElement>(null);
  const id = "glass" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !supportsRefraction()) return;
    const measure = () => {
      // Round so tiny layout jitter doesn't regenerate the map.
      const w = Math.max(2, Math.round(el.offsetWidth / 2) * 2);
      const h = Math.max(2, Math.round(el.offsetHeight / 2) * 2);
      setSize((s) => (s && s.w === w && s.h === h ? s : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // size is only ever set in the browser, so this never runs on the server.
  const map = useMemo(() => (size ? refractionMap(size.w, size.h, radius, bezel) : ""), [size, radius, bezel]);

  const live = Boolean(size && map);
  const filterStyle: CSSProperties | undefined = live
    ? { backdropFilter: `url(#${id})`, WebkitBackdropFilter: `url(#${id})` }
    : undefined;

  const channel = (scale: number, keep: 0 | 1 | 2, result: string) => {
    const rows = [0, 1, 2].map((c) => (c === keep ? rowFor(c) : "0 0 0 0 0")).join(" ");
    return (
      <>
        <feDisplacementMap in="frosted" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result={`${result}d`} />
        <feColorMatrix in={`${result}d`} type="matrix" values={`${rows} 0 0 0 1 0`} result={result} />
      </>
    );
  };

  return (
    <Tag
      ref={ref}
      className={`glass ${className}`}
      style={{ "--glass-r": `${radius}px`, ...style, ...filterStyle } as CSSProperties}
      {...rest}
    >
      {live && size && (
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <filter
            id={id}
            x="0"
            y="0"
            width={size.w}
            height={size.h}
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation={frost} result="frosted" />
            <feImage href={map} x="0" y="0" width={size.w} height={size.h} preserveAspectRatio="none" result="map" />
            {channel(bend * 2 * (1 + dispersion), 0, "red")}
            {channel(bend * 2, 1, "green")}
            {channel(bend * 2 * (1 - dispersion), 2, "blue")}
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="rgb" />
            <feColorMatrix in="rgb" type="saturate" values="1.45" result="sat" />
            <feComponentTransfer in="sat">
              <feFuncR type="linear" slope="1.06" />
              <feFuncG type="linear" slope="1.06" />
              <feFuncB type="linear" slope="1.06" />
            </feComponentTransfer>
          </filter>
        </svg>
      )}
      {children}
    </Tag>
  );
}

function rowFor(c: number) {
  return ["1 0 0 0 0", "0 1 0 0 0", "0 0 1 0 0"][c];
}
