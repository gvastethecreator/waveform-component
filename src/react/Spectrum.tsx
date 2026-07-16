import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { renderCanvasSpectrum } from "../renderers/canvasSpectrum";
import { syncCanvasSize } from "../renderers/canvas2d";
import { resolveSpectrumConfig } from "../spectrumConfig";
import type { CanvasSpectrumConfig, SpectrumFrame } from "../types";

export interface SpectrumProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: Partial<CanvasSpectrumConfig>;
  readonly data: SpectrumFrame;
  readonly height?: number | string;
}

export function Spectrum({
  ariaLabel = "Audio spectrum",
  className,
  config,
  data,
  height = 240,
  style,
  ...containerProps
}: SpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedConfig = useMemo(() => resolveSpectrumConfig(config, data), [config, data]);
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.parentElement?.getBoundingClientRect();
    const cssWidth = bounds?.width || canvas.clientWidth || 300;
    const cssHeight = bounds?.height || canvas.clientHeight || 150;
    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const size = syncCanvasSize(canvas, cssWidth, cssHeight, dpr);
    const context = canvas.getContext("2d");
    if (!context) return;
    renderCanvasSpectrum(
      context,
      data,
      { width: size.cssWidth, height: size.cssHeight },
      resolvedConfig,
    );
  }, [data, resolvedConfig]);

  useEffect(() => {
    draw();
    const parent = canvasRef.current?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(draw);
    observer.observe(parent);
    return () => observer.disconnect();
  }, [draw]);

  const containerStyle: CSSProperties = {
    height,
    minHeight: 1,
    position: "relative",
    width: "100%",
    ...style,
  };
  const binLabel = `${data.bins.length} ordered ${data.bins.length === 1 ? "bin" : "bins"}`;
  return (
    <div {...containerProps} className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        aria-label={`${ariaLabel}. ${binLabel}, ${data.sampleRate} Hz sample rate.`}
        data-spectrum-state={data.state}
        role="img"
      >
        {ariaLabel}
      </canvas>
    </div>
  );
}
