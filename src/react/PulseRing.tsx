import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import {
  createWebglPulseRingRenderer,
  type WebglPulseRingRenderer,
  type WebglRendererDiagnostics,
  type WebglRendererStatus,
} from "../renderers/webgl2PulseRing";
import type { WebglDrawingBufferSize } from "../renderers/webgl2Sizing";
import type { BandEnergyFrame } from "../types";
import {
  resolvePulseRingConfig,
  type PulseRingConfig,
  type PulseRingConfigInput,
} from "../vfx/pulseRing";

export interface PulseRingProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: PulseRingConfigInput;
  readonly data: BandEnergyFrame;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly width?: number | string;
}

interface LatestRenderInput {
  config: PulseRingConfig;
  data: BandEnergyFrame;
  reducedMotion: boolean;
}

export function PulseRing({
  ariaLabel = "Audio-reactive Pulse Ring",
  className,
  config: configInput,
  data,
  height = 240,
  onRendererStatusChange,
  style,
  width = "100%",
  ...containerProps
}: PulseRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebglPulseRingRenderer | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const statusId = `webgl2-${useId().replace(/[^a-zA-Z0-9_-]+/g, "-")}-status`;
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const forcedColors = useMediaQuery("(forced-colors: active)");
  const darkScheme = useMediaQuery("(prefers-color-scheme: dark)");
  const resolvedConfig = useMemo(() => resolvePulseRingConfig(configInput), [configInput]);
  const paintConfig = useMemo(
    () => forcedColorConfig(resolvedConfig, forcedColors, darkScheme),
    [darkScheme, forcedColors, resolvedConfig],
  );
  const reducedMotion =
    paintConfig.motion === "reduced" || (paintConfig.motion === "auto" && prefersReducedMotion);
  const latestRef = useRef<LatestRenderInput>({
    config: paintConfig,
    data,
    reducedMotion,
  });
  latestRef.current = { config: paintConfig, data, reducedMotion };
  const [status, setStatus] = useState<WebglRendererStatus>(INITIAL_STATUS);
  const [diagnostics, setDiagnostics] = useState<WebglRendererDiagnostics>(EMPTY_DIAGNOSTICS);
  const [size, setSize] = useState<WebglDrawingBufferSize | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const renderer = createWebglPulseRingRenderer(canvas);
    rendererRef.current = renderer;
    const update = () => {
      setStatus(renderer.getStatus());
      setDiagnostics(renderer.getDiagnostics());
    };
    const unsubscribe = renderer.subscribe(update);
    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const next = renderer.resize(
        finiteDimension(bounds.width, container.clientWidth || 300),
        finiteDimension(bounds.height, container.clientHeight || 150),
        window.devicePixelRatio || 1,
        latestRef.current.config,
      );
      setSize((current) => (sameSize(current, next) ? current : next));
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    observer?.observe(container);
    update();
    resize();
    return () => {
      observer?.disconnect();
      unsubscribe();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const container = containerRef.current;
    if (!renderer || !container) return;
    const bounds = container.getBoundingClientRect();
    const next = renderer.resize(
      finiteDimension(bounds.width, container.clientWidth || 300),
      finiteDimension(bounds.height, container.clientHeight || 150),
      window.devicePixelRatio || 1,
      paintConfig,
    );
    setSize((current) => (sameSize(current, next) ? current : next));
  }, [paintConfig.quality]);

  useEffect(() => {
    onRendererStatusChange?.(status);
  }, [onRendererStatusChange, status]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas || status.state !== "ready") return;
    if (reducedMotion) return;
    let active = true;
    let frameHandle = 0;
    const draw = (timestamp: number) => {
      if (!active) return;
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      renderer.render(latestRef.current.data, latestRef.current.config, {
        reducedMotion: false,
        timeSeconds: (timestamp - startTimeRef.current) / 1000,
      });
      updateCanvasDiagnostics(canvas, renderer);
      frameHandle = requestAnimationFrame(draw);
    };
    frameHandle = requestAnimationFrame(draw);
    return () => {
      active = false;
      cancelAnimationFrame(frameHandle);
    };
  }, [reducedMotion, status.state]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas || status.state !== "ready" || !reducedMotion) return;
    renderer.render(data, paintConfig, { reducedMotion: true, timeSeconds: 0 });
    updateCanvasDiagnostics(canvas, renderer);
  }, [data, paintConfig, reducedMotion, size, status.state]);

  const message = status.message;
  const fallbackVisible = status.state !== "ready";
  const semanticLabel = `${ariaLabel}. ${data.bands.length} energy ${data.bands.length === 1 ? "band" : "bands"}.`;
  const containerStyle: CSSProperties = {
    height,
    maxWidth: "100%",
    minHeight: 1,
    position: "relative",
    width,
    ...style,
  };
  const fallbackStyle: CSSProperties = {
    ...FALLBACK_STYLE,
    backgroundColor: paintConfig.backgroundColor,
    boxShadow: `inset 0 0 0 1px ${paintConfig.tertiaryColor}`,
  };
  const fallbackRingStyle: CSSProperties = {
    ...FALLBACK_RING_STYLE,
    borderColor: paintConfig.primaryColor,
    boxShadow: `0 0 1.35rem ${paintConfig.tertiaryColor}, inset 0 0 0.8rem ${paintConfig.tertiaryColor}`,
  };

  return (
    <div
      {...containerProps}
      ref={containerRef}
      className={className}
      data-pulse-ring-state={data.state}
      data-renderer="webgl2"
      data-webgl-animation={status.state === "ready" && !reducedMotion ? "running" : "static"}
      data-webgl-buffer-height={size?.bufferHeight}
      data-webgl-buffer-width={size?.bufferWidth}
      data-webgl-degraded={size?.degraded || undefined}
      data-webgl-dpr={size ? Number(size.effectivePixelRatio.toFixed(3)) : undefined}
      data-webgl-generation={status.generation}
      data-webgl-resources={`${diagnostics.activePrograms}/${diagnostics.activeBuffers}/${diagnostics.activeVertexArrays}`}
      data-webgl-state={status.state}
      style={containerStyle}
    >
      <canvas
        ref={canvasRef}
        aria-describedby={statusId}
        aria-label={semanticLabel}
        data-webgl-canvas="pulse-ring"
        role="img"
        style={{
          ...CANVAS_STYLE,
          opacity: fallbackVisible ? 0 : 1,
          transition: reducedMotion ? "none" : CANVAS_STYLE.transition,
        }}
      >
        {semanticLabel}
      </canvas>
      {fallbackVisible ? (
        <div aria-hidden="true" data-webgl-fallback={status.state} style={fallbackStyle}>
          <span style={fallbackRingStyle} />
        </div>
      ) : null}
      <p
        id={statusId}
        role="status"
        style={status.state === "ready" ? VISUALLY_HIDDEN : STATUS_STYLE}
      >
        <strong>
          {status.code ?? `WEBGL2_${status.state.toUpperCase().replaceAll("-", "_")}`}
        </strong>
        {message}
      </p>
    </div>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(query).matches === true,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [query]);
  return matches;
}

function forcedColorConfig(
  config: PulseRingConfig,
  forcedColors: boolean,
  darkScheme: boolean,
): PulseRingConfig {
  if (!forcedColors) return config;
  return Object.freeze({
    ...config,
    backgroundColor: darkScheme ? "#000000" : "#ffffff",
    primaryColor: darkScheme ? "#ffffff" : "#000000",
    secondaryColor: darkScheme ? "#ffff00" : "#0000ff",
    sweepColor: darkScheme ? "#00ffff" : "#9b006b",
    tertiaryColor: darkScheme ? "#00ffff" : "#400080",
  });
}

function updateCanvasDiagnostics(canvas: HTMLCanvasElement, renderer: WebglPulseRingRenderer) {
  const diagnostics = renderer.getDiagnostics();
  canvas.dataset.webglDrawCalls = String(diagnostics.drawCalls);
}

function sameSize(current: WebglDrawingBufferSize | null, next: WebglDrawingBufferSize): boolean {
  return (
    current?.bufferHeight === next.bufferHeight &&
    current.bufferWidth === next.bufferWidth &&
    current.cssHeight === next.cssHeight &&
    current.cssWidth === next.cssWidth &&
    current.effectivePixelRatio === next.effectivePixelRatio &&
    current.quality === next.quality
  );
}

function finiteDimension(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const INITIAL_STATUS: WebglRendererStatus = Object.freeze({
  generation: 0,
  message: "Initializing WebGL2.",
  recoverable: false,
  state: "initializing",
});

const EMPTY_DIAGNOSTICS: WebglRendererDiagnostics = Object.freeze({
  activeBuffers: 0,
  activePrograms: 0,
  activeVertexArrays: 0,
  buffersCreated: 0,
  buffersDeleted: 0,
  drawCalls: 0,
  generation: 0,
  programsCreated: 0,
  programsDeleted: 0,
  resourcesInvalidated: 0,
  vertexArraysCreated: 0,
  vertexArraysDeleted: 0,
});

const CANVAS_STYLE: CSSProperties = {
  display: "block",
  height: "100%",
  inset: 0,
  position: "absolute",
  transition: "opacity 120ms ease",
  width: "100%",
};

const FALLBACK_STYLE: CSSProperties = {
  display: "grid",
  inset: 0,
  placeItems: "center",
  position: "absolute",
};

const FALLBACK_RING_STYLE: CSSProperties = {
  aspectRatio: 1,
  border: "clamp(3px, 0.75vw, 8px) solid",
  borderRadius: "50%",
  width: "min(52%, 11rem)",
};

const STATUS_STYLE: CSSProperties = {
  alignItems: "center",
  background: "rgb(4 12 16 / 0.86)",
  border: "1px solid rgb(98 220 245 / 0.36)",
  borderRadius: "0.35rem",
  color: "#e8fbff",
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
