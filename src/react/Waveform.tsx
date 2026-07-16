import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { resolveWaveformConfig } from "../config";
import { createStaticWaveformFrame } from "../core/staticFrame";
import { renderCanvasWaveform, syncCanvasSize } from "../renderers/canvas2d";
import type { CanvasWaveformConfig, StaticWaveformInput, WaveformFrame } from "../types";

export interface WaveformProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: Partial<CanvasWaveformConfig>;
  readonly data: StaticWaveformInput | WaveformFrame;
  readonly height?: number | string;
}

export function Waveform({
  ariaLabel = "Audio waveform",
  className,
  config,
  data,
  height = 240,
  style,
  ...containerProps
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useMemo(
    () => (isWaveformFrame(data) ? data : createStaticWaveformFrame(data)),
    [data],
  );
  const resolvedConfig = useMemo(() => resolveWaveformConfig(config), [config]);

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
    renderCanvasWaveform(
      context,
      frame,
      { width: size.cssWidth, height: size.cssHeight },
      resolvedConfig,
    );
  }, [frame, resolvedConfig]);

  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
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

  return (
    <div {...containerProps} className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        aria-label={`${ariaLabel}. ${frame.channels.length} channel${frame.channels.length === 1 ? "" : "s"}, ${frame.sampleCount} samples.`}
        data-waveform-state={frame.state}
        role="img"
      >
        {ariaLabel}
      </canvas>
    </div>
  );
}

function isWaveformFrame(value: StaticWaveformInput | WaveformFrame): value is WaveformFrame {
  return (
    typeof value === "object" && value !== null && "kind" in value && value.kind === "waveform"
  );
}
