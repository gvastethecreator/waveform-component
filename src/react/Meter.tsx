import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { resolveMeterConfig } from "../meterConfig";
import { renderCanvasMeter } from "../renderers/canvasMeter";
import { syncCanvasSize } from "../renderers/canvas2d";
import type { CanvasMeterConfigInput, MeterFrame, MeterHistoryPoint } from "../types";

export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: CanvasMeterConfigInput;
  readonly data: MeterFrame;
  readonly height?: number | string;
  readonly history?: readonly MeterHistoryPoint[];
}

export function Meter({
  ariaLabel = "Audio level meter",
  className,
  config,
  data,
  height = 240,
  history = [],
  style,
  ...containerProps
}: MeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolvedConfig = useMemo(() => resolveMeterConfig(config, data), [config, data]);
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
    renderCanvasMeter(
      context,
      data,
      { width: size.cssWidth, height: size.cssHeight },
      resolvedConfig,
      history,
    );
  }, [data, history, resolvedConfig]);

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
  return (
    <div {...containerProps} className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        aria-label={meterAriaLabel(ariaLabel, data, resolvedConfig.measurement)}
        data-meter-layout={resolvedConfig.layout}
        data-meter-measurement={resolvedConfig.measurement}
        data-meter-mode={resolvedConfig.mode}
        data-meter-state={data.state}
        role="img"
      >
        {ariaLabel}
      </canvas>
    </div>
  );
}

function meterAriaLabel(label: string, frame: MeterFrame, measurement: "peak" | "rms"): string {
  if (frame.state === "empty" || frame.channels.length === 0)
    return `${label}. Empty ${measurement.toUpperCase()} meter.`;
  const channelValues = frame.channels
    .map(
      (channel, index) =>
        `Channel ${index + 1}: RMS ${formatDecibels(channel.rmsDbfs)}, peak ${formatDecibels(channel.peakDbfs)}`,
    )
    .join(". ");
  return `${label}. ${measurement.toUpperCase()} display. ${channelValues}. Values use dBFS referenced to amplitude 1.`;
}

function formatDecibels(value: number): string {
  return `${value.toFixed(1)} dBFS`;
}
