import { resolveWaveformConfig } from "../config";
import { buildTimeDomainSegments } from "../core/waveformGeometry";
import type {
  CanvasWaveformConfig,
  CanvasWaveformConfigInput,
  TimeDomainFrame,
  WaveformColumn,
  WaveformFrame,
  WaveformViewport,
} from "../types";

export interface CanvasSize {
  readonly cssHeight: number;
  readonly cssWidth: number;
  readonly dpr: number;
}

export function syncCanvasSize(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  requestedDpr = 1,
): CanvasSize {
  const width = finiteDimension(cssWidth);
  const height = finiteDimension(cssHeight);
  const dpr = clampFinite(requestedDpr, 1, 4, 1);
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { cssHeight: height, cssWidth: width, dpr };
}

export function renderCanvasWaveform(
  context: CanvasRenderingContext2D,
  frame: WaveformFrame,
  viewport: WaveformViewport,
  config?: CanvasWaveformConfigInput,
): void {
  renderCanvasTimeDomain(context, frame, viewport, config);
}

export function renderCanvasTimeDomain(
  context: CanvasRenderingContext2D,
  frame: TimeDomainFrame,
  viewport: WaveformViewport,
  config?: CanvasWaveformConfigInput,
): void {
  const resolved = resolveWaveformConfig(config, frame.kind);
  const columns = buildTimeDomainSegments(frame, viewport, resolved);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);

  context.clearRect(0, 0, width, height);
  context.fillStyle = resolved.backgroundColor;
  context.fillRect(0, 0, width, height);

  if (resolved.showCenterLine) drawGuides(context, columns, viewport, resolved);
  if (columns.length === 0) return;
  context.lineCap = "round";
  strokeColumns(context, columns, resolved, false);
  strokeColumns(context, columns, resolved, true);
}

function drawGuides(
  context: CanvasRenderingContext2D,
  columns: readonly WaveformColumn[],
  viewport: WaveformViewport,
  config: CanvasWaveformConfig,
): void {
  const guides = new Set(
    columns.map((column) =>
      config.orientation === "horizontal" ? column.centerY : column.centerX,
    ),
  );
  if (guides.size === 0) return;
  const padding = Math.min(
    config.padding,
    finiteDimension(viewport.width) / 2,
    finiteDimension(viewport.height) / 2,
  );
  context.beginPath();
  context.strokeStyle = config.centerLineColor;
  context.lineWidth = 1;
  for (const guide of guides) {
    if (config.orientation === "horizontal") {
      context.moveTo(padding, guide);
      context.lineTo(Math.max(padding, viewport.width - padding), guide);
    } else {
      context.moveTo(guide, padding);
      context.lineTo(guide, Math.max(padding, viewport.height - padding));
    }
  }
  context.stroke();
}

function strokeColumns(
  context: CanvasRenderingContext2D,
  columns: readonly WaveformColumn[],
  config: CanvasWaveformConfig,
  played: boolean,
): void {
  const byChannel = new Map<number, WaveformColumn[]>();
  for (const column of columns) {
    if (
      played
        ? column.progress > config.playbackProgress
        : column.progress <= config.playbackProgress
    )
      continue;
    const group = byChannel.get(column.channelIndex) ?? [];
    group.push(column);
    byChannel.set(column.channelIndex, group);
  }
  for (const [channelIndex, group] of byChannel) {
    const color = played
      ? config.playedColor
      : (config.channelColors[channelIndex] ?? config.color);
    context.strokeStyle = color;
    context.lineWidth = config.lineWidth;
    context.beginPath();
    for (const column of group) {
      context.moveTo(column.x1, column.y1);
      context.lineTo(column.x2, column.y2);
    }
    context.stroke();

    context.beginPath();
    group.forEach((column, index) => {
      const x = (column.x1 + column.x2) / 2;
      const y = (column.y1 + column.y2) / 2;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}
