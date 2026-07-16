import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { sanitizeSvgId, unsupportedSvgScene } from "../renderers/svgHelpers";
import type { SvgGradient, SvgNode, SvgRenderOptions, SvgScene } from "../renderers/svgTypes";
import type { WaveformViewport } from "../types";

export interface SvgSurfaceProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel: string;
  readonly buildScene: (viewport: WaveformViewport, options: SvgRenderOptions) => SvgScene;
  readonly height?: number | string;
  readonly width?: number | string;
}

export function SvgSurface({
  ariaLabel,
  buildScene,
  className,
  height = 240,
  style,
  width = "100%",
  ...containerProps
}: SvgSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const idPrefix = sanitizeSvgId(`waveform-${reactId}`);
  const titleId = `${idPrefix}-title`;
  const errorId = `${idPrefix}-error`;
  const [viewport, setViewport] = useState(() => initialViewport(width, height));
  const forcedColors = useForcedColors();
  const measure = useCallback(() => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setViewport((current) => {
      const next = {
        height: finiteDimension(bounds.height, current.height),
        width: finiteDimension(bounds.width, current.width),
      };
      return current.height === next.height && current.width === next.width ? current : next;
    });
  }, []);

  useEffect(() => {
    measure();
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  const scene = useMemo(() => {
    try {
      return buildScene(viewport, { forcedColors, idPrefix });
    } catch (error) {
      const code = errorCode(error);
      const message = error instanceof Error ? error.message : "The SVG config is invalid.";
      return unsupportedSvgScene(viewport.width, viewport.height, `${code}: ${message}`);
    }
  }, [buildScene, forcedColors, idPrefix, viewport]);
  const message = scene.messages.join(" ");
  const containerStyle: CSSProperties = {
    height,
    maxWidth: "100%",
    minHeight: 1,
    position: "relative",
    width,
    ...style,
  };

  return (
    <div {...containerProps} ref={containerRef} className={className} style={containerStyle}>
      <svg
        aria-describedby={scene.status === "unsupported" ? errorId : undefined}
        aria-labelledby={titleId}
        data-renderer="svg"
        data-svg-message={message || undefined}
        data-svg-node-count={scene.nodeCount}
        data-svg-render-status={scene.status}
        data-svg-rendered-points={scene.renderedPointCount}
        data-svg-source-points={scene.sourcePointCount}
        focusable="false"
        preserveAspectRatio="none"
        role="img"
        style={SVG_STYLE}
        viewBox={`0 0 ${Math.max(1, scene.width)} ${Math.max(1, scene.height)}`}
      >
        <title id={titleId}>{ariaLabel}</title>
        {scene.definitions.length > 0 ? <defs>{scene.definitions.map(renderGradient)}</defs> : null}
        {scene.nodes.map(renderNode)}
      </svg>
      {scene.status === "unsupported" ? (
        <p id={errorId} role="alert" style={ERROR_STYLE}>
          <strong>SVG_RENDER_UNSUPPORTED</strong>
          {message}
        </p>
      ) : message ? (
        <span style={VISUALLY_HIDDEN}>{message}</span>
      ) : null}
    </div>
  );
}

function renderGradient(gradient: SvgGradient) {
  if (gradient.kind === "linear-gradient")
    return (
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={gradient.id}
        key={gradient.id}
        x1={gradient.x1}
        x2={gradient.x2}
        y1={gradient.y1}
        y2={gradient.y2}
      >
        {gradient.stops.map((stop, index) => (
          <stop
            key={`${gradient.id}-${index}`}
            offset={stop.offset}
            stopColor={stop.color}
            stopOpacity={stop.opacity}
          />
        ))}
      </linearGradient>
    );
  return (
    <radialGradient
      cx={gradient.centerX}
      cy={gradient.centerY}
      fr={gradient.innerRadius}
      gradientUnits="userSpaceOnUse"
      id={gradient.id}
      key={gradient.id}
      r={gradient.outerRadius}
    >
      {gradient.stops.map((stop, index) => (
        <stop
          key={`${gradient.id}-${index}`}
          offset={stop.offset}
          stopColor={stop.color}
          stopOpacity={stop.opacity}
        />
      ))}
    </radialGradient>
  );
}

function renderNode(node: SvgNode) {
  if (node.kind === "rect")
    return (
      <rect
        data-svg-key={node.key}
        fill={node.fill}
        fillOpacity={node.fillOpacity}
        height={node.height}
        key={node.key}
        rx={node.radius}
        ry={node.radius}
        stroke={node.stroke}
        strokeLinecap={node.strokeLinecap}
        strokeOpacity={node.strokeOpacity}
        strokeWidth={node.strokeWidth}
        width={node.width}
        x={node.x}
        y={node.y}
      />
    );
  return (
    <path
      d={node.d}
      data-svg-key={node.key}
      fill={node.fill}
      fillOpacity={node.fillOpacity}
      key={node.key}
      stroke={node.stroke}
      strokeLinecap={node.strokeLinecap}
      strokeOpacity={node.strokeOpacity}
      strokeWidth={node.strokeWidth}
    />
  );
}

function useForcedColors(): boolean {
  const query = "(forced-colors: active)";
  const [active, setActive] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(query).matches === true,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(query);
    const update = () => setActive(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return active;
}

function initialViewport(width: number | string, height: number | string): WaveformViewport {
  return {
    height: typeof height === "number" ? Math.max(1, height) : 150,
    width: typeof width === "number" ? Math.max(1, width) : 300,
  };
}

function finiteDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function errorCode(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) return "SVG_RENDER_ERROR";
  const code = Reflect.get(error, "code");
  return typeof code === "string" ? code : "SVG_RENDER_ERROR";
}

const SVG_STYLE: CSSProperties = {
  display: "block",
  forcedColorAdjust: "auto",
  height: "100%",
  overflow: "visible",
  pointerEvents: "none",
  width: "100%",
};

const ERROR_STYLE: CSSProperties = {
  alignItems: "center",
  background: "rgb(28 12 18 / 0.94)",
  border: "1px solid rgb(255 120 146 / 0.45)",
  borderRadius: "0.35rem",
  color: "#ffd9e1",
  display: "flex",
  flexDirection: "column",
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.7rem",
  gap: "0.35rem",
  inset: "50% auto auto 50%",
  margin: 0,
  maxWidth: "calc(100% - 2rem)",
  padding: "0.75rem",
  position: "absolute",
  textAlign: "center",
  transform: "translate(-50%, -50%)",
};

const VISUALLY_HIDDEN: CSSProperties = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};
