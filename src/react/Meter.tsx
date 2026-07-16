import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { resolveMeterConfig } from "../meterConfig";
import { renderDomMeter } from "../renderers/domMeter";
import { renderCanvasMeter } from "../renderers/canvasMeter";
import { renderSvgMeter } from "../renderers/svgMeter";
import { syncCanvasSize } from "../renderers/canvas2d";
import type { MeterConfigInput, MeterFrame, MeterHistoryPoint } from "../types";
import { DomSurface } from "./DomSurface";
import { SvgSurface } from "./SvgSurface";

export interface MeterProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  readonly ariaLabel?: string;
  readonly config?: MeterConfigInput;
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
  const label = meterAriaLabel(ariaLabel, data, resolvedConfig.measurement);
  const buildSvgScene = useCallback(
    (
      viewport: Parameters<typeof renderSvgMeter>[1],
      options: Parameters<typeof renderSvgMeter>[4],
    ) => renderSvgMeter(data, viewport, resolvedConfig, history, options),
    [data, history, resolvedConfig],
  );
  const buildDomScene = useCallback(
    (
      viewport: Parameters<typeof renderDomMeter>[1],
      options: Parameters<typeof renderDomMeter>[4],
    ) => renderDomMeter(data, viewport, resolvedConfig, history, options),
    [data, history, resolvedConfig],
  );
  if (config?.renderer === "dom")
    return (
      <DomSurface
        {...containerProps}
        ariaLabel={label}
        buildScene={buildDomScene}
        className={className}
        data-meter-layout={resolvedConfig.layout}
        data-meter-measurement={resolvedConfig.measurement}
        data-meter-mode={resolvedConfig.mode}
        data-meter-state={data.state}
        height={height}
        style={style}
      />
    );
  if (config?.renderer === "svg")
    return (
      <SvgSurface
        {...containerProps}
        ariaLabel={label}
        buildScene={buildSvgScene}
        className={className}
        data-meter-layout={resolvedConfig.layout}
        data-meter-measurement={resolvedConfig.measurement}
        data-meter-mode={resolvedConfig.mode}
        data-meter-state={data.state}
        height={height}
        style={style}
      />
    );
  return (
    <div {...containerProps} className={className} style={containerStyle}>
      <canvas
        ref={canvasRef}
        aria-label={label}
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
