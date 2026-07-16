import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { unsupportedDomScene } from "../renderers/domHelpers";
import type { DomNode, DomRenderOptions, DomScene } from "../renderers/domTypes";
import type { WaveformViewport } from "../types";

export interface DomSurfaceProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel: string;
  readonly buildScene: (viewport: WaveformViewport, options: DomRenderOptions) => DomScene;
  readonly height?: number | string;
  readonly width?: number | string;
}

export function DomSurface({
  ariaLabel,
  buildScene,
  className,
  height = 240,
  style,
  width = "100%",
  ...containerProps
}: DomSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9_-]+/g, "-");
  const errorId = `waveform-dom-${reactId}-error`;
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
      return buildScene(viewport, { forcedColors });
    } catch (error) {
      const code = errorCode(error);
      const message = error instanceof Error ? error.message : "The DOM/CSS config is invalid.";
      return unsupportedDomScene(viewport.width, viewport.height, `${code}: ${message}`);
    }
  }, [buildScene, forcedColors, viewport]);
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
      <div
        aria-describedby={scene.status === "unsupported" ? errorId : undefined}
        aria-label={ariaLabel}
        data-dom-message={message || undefined}
        data-dom-node-count={scene.nodeCount}
        data-dom-render-status={scene.status}
        data-dom-rendered-points={scene.renderedPointCount}
        data-dom-source-points={scene.sourcePointCount}
        data-renderer="dom"
        role="img"
        style={{ ...SURFACE_STYLE, background: scene.background }}
      >
        {scene.nodes.map(renderNode)}
      </div>
      {scene.status === "unsupported" ? (
        <p id={errorId} role="alert" style={ERROR_STYLE}>
          <strong>DOM_RENDER_UNSUPPORTED</strong>
          {message}
        </p>
      ) : message ? (
        <span style={VISUALLY_HIDDEN}>{message}</span>
      ) : null}
    </div>
  );
}

function renderNode(node: DomNode) {
  const gradient = node.background?.includes("gradient(") === true;
  const style: CSSProperties = {
    backgroundColor: gradient ? undefined : node.background,
    backgroundImage: gradient ? node.background : undefined,
    backgroundPosition: node.backgroundPosition,
    backgroundRepeat: "no-repeat",
    backgroundSize: node.backgroundSize,
    borderColor: node.borderColor,
    borderRadius: node.radius,
    borderStyle: node.borderWidth ? "solid" : undefined,
    borderWidth: node.borderWidth,
    boxSizing: "border-box",
    height: node.height,
    left: node.x,
    opacity: node.opacity,
    position: "absolute",
    top: node.y,
    width: node.width,
  };
  return (
    <span
      aria-hidden="true"
      data-dom-key={node.key}
      data-dom-node="box"
      data-dom-role={node.role}
      key={node.key}
      style={style}
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
  if (typeof error !== "object" || error === null || !("code" in error)) return "DOM_RENDER_ERROR";
  const code = Reflect.get(error, "code");
  return typeof code === "string" ? code : "DOM_RENDER_ERROR";
}

const SURFACE_STYLE: CSSProperties = {
  contain: "layout paint style",
  forcedColorAdjust: "none",
  inset: 0,
  isolation: "isolate",
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
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
