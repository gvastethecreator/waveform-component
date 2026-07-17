import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { WebglRendererDiagnostics, WebglRendererStatus } from "../renderers/webgl2BandVfx";
import type { WebglDrawingBufferSize } from "../renderers/webgl2Sizing";
import type { BandEnergyFrame } from "../types";
import type { VfxSurfaceConfig } from "../vfx/schema";

export interface BandVfxSurfaceProps<Config extends VfxSurfaceConfig> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "color"
> {
  readonly ariaLabel: string;
  readonly config: Config;
  readonly createRenderer: (canvas: HTMLCanvasElement) => BandVfxRendererHandle<Config>;
  readonly data: BandEnergyFrame;
  readonly effectId: Config["mode"];
  readonly fallback: (config: Config) => ReactNode;
  readonly forcedColorConfig: (config: Config, darkScheme: boolean) => Config;
  readonly height?: number | string;
  readonly onRendererStatusChange?: (status: WebglRendererStatus) => void;
  readonly stateAttribute: `data-${string}-state`;
  readonly width?: number | string;
}

interface BandVfxRendererHandle<Config extends VfxSurfaceConfig> {
  destroy(): void;
  getDiagnostics(): WebglRendererDiagnostics;
  getStatus(): WebglRendererStatus;
  render(
    frame: BandEnergyFrame,
    config: Config,
    options: {
      readonly reducedMotion?: boolean;
      readonly timeSeconds?: number;
    },
  ): boolean;
  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    config: Config,
  ): WebglDrawingBufferSize;
  subscribe(listener: () => void): () => void;
}

interface LatestRenderInput<Config extends VfxSurfaceConfig> {
  config: Config;
  data: BandEnergyFrame;
  reducedMotion: boolean;
}

export function BandVfxSurface<Config extends VfxSurfaceConfig>({
  ariaLabel,
  className,
  config,
  createRenderer,
  data,
  effectId,
  fallback,
  forcedColorConfig,
  height = 240,
  onRendererStatusChange,
  stateAttribute,
  style,
  width = "100%",
  ...containerProps
}: BandVfxSurfaceProps<Config>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<BandVfxRendererHandle<Config> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const statusId = `webgl2-${useId().replace(/[^a-zA-Z0-9_-]+/g, "-")}-status`;
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const forcedColors = useMediaQuery("(forced-colors: active)");
  const darkScheme = useMediaQuery("(prefers-color-scheme: dark)");
  const paintConfig = useMemo(
    () => (forcedColors ? forcedColorConfig(config, darkScheme) : config),
    [config, darkScheme, forcedColorConfig, forcedColors],
  );
  const reducedMotion =
    paintConfig.motion === "reduced" || (paintConfig.motion === "auto" && prefersReducedMotion);
  const latestRef = useRef<LatestRenderInput<Config>>({
    config: paintConfig,
    data,
    reducedMotion,
  });
  latestRef.current = { config: paintConfig, data, reducedMotion };
  const [status, setStatus] = useState<WebglRendererStatus>(INITIAL_STATUS);
  const [diagnostics, setDiagnostics] = useState<WebglRendererDiagnostics>(EMPTY_DIAGNOSTICS);
  const [isIntersecting, setIsIntersecting] = useState(true);
  const [size, setSize] = useState<WebglDrawingBufferSize | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const renderer = createRenderer(canvas);
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
    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              const entry = entries.find((candidate) => candidate.target === container);
              if (entry) setIsIntersecting(entry.isIntersecting && entry.intersectionRatio > 0);
            },
            { rootMargin: "64px" },
          );
    observer?.observe(container);
    intersectionObserver?.observe(container);
    update();
    resize();
    return () => {
      observer?.disconnect();
      intersectionObserver?.disconnect();
      unsubscribe();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [createRenderer]);

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
    if (!renderer || !canvas || status.state !== "ready" || reducedMotion || !isIntersecting)
      return;
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
  }, [isIntersecting, reducedMotion, status.state]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas || status.state !== "ready" || !reducedMotion) return;
    renderer.render(data, paintConfig, { reducedMotion: true, timeSeconds: 0 });
    updateCanvasDiagnostics(canvas, renderer);
  }, [data, paintConfig, reducedMotion, size, status.state]);

  const fallbackVisible = status.state !== "ready";
  const semanticLabel = `${ariaLabel}. ${data.bands.length} energy ${data.bands.length === 1 ? "band" : "bands"}.`;
  const stateAttributes = { [stateAttribute]: data.state };

  return (
    <div
      {...containerProps}
      {...stateAttributes}
      ref={containerRef}
      className={className}
      data-renderer="webgl2"
      data-vfx-mode={effectId}
      data-vfx-state={data.state}
      data-webgl-animation={
        status.state === "ready" && !reducedMotion
          ? isIntersecting
            ? "running"
            : "paused"
          : "static"
      }
      data-webgl-buffer-height={size?.bufferHeight}
      data-webgl-buffer-width={size?.bufferWidth}
      data-webgl-degraded={size?.degraded || undefined}
      data-webgl-dpr={size ? Number(size.effectivePixelRatio.toFixed(3)) : undefined}
      data-webgl-effect={effectId}
      data-webgl-generation={status.generation}
      data-webgl-resources={`${diagnostics.activePrograms}/${diagnostics.activeBuffers}/${diagnostics.activeVertexArrays}`}
      data-webgl-state={status.state}
      data-webgl-visible={isIntersecting ? "true" : "false"}
      style={{
        height,
        maxWidth: "100%",
        minHeight: 1,
        position: "relative",
        width,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        aria-describedby={statusId}
        aria-label={semanticLabel}
        data-webgl-canvas={effectId}
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
        <div
          aria-hidden="true"
          data-webgl-fallback={status.state}
          style={{
            ...FALLBACK_STYLE,
            backgroundColor: paintConfig.backgroundColor,
          }}
        >
          {fallback(paintConfig)}
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
        {status.message}
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

function updateCanvasDiagnostics<Config extends VfxSurfaceConfig>(
  canvas: HTMLCanvasElement,
  renderer: BandVfxRendererHandle<Config>,
) {
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
  overflow: "hidden",
  placeItems: "center",
  position: "absolute",
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
