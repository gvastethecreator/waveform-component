import { resolveWaveformConfig } from "../config";
import { buildWaveformColumns } from "../core/waveformGeometry";
import type { CanvasWaveformConfig, WaveformFrame, WaveformViewport } from "../types";

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
  config?: Partial<CanvasWaveformConfig>,
): void {
  const resolved = resolveWaveformConfig(config);
  const columns = buildWaveformColumns(frame, viewport, resolved);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);

  context.clearRect(0, 0, width, height);
  context.fillStyle = resolved.backgroundColor;
  context.fillRect(0, 0, width, height);

  const centers = new Set(columns.map((column) => column.centerY));
  if (resolved.showCenterLine) {
    context.beginPath();
    context.strokeStyle = resolved.centerLineColor;
    context.lineWidth = 1;
    for (const centerY of centers) {
      context.moveTo(resolved.padding, centerY);
      context.lineTo(Math.max(resolved.padding, width - resolved.padding), centerY);
    }
    context.stroke();
  }

  if (columns.length === 0) return;
  context.lineCap = "round";
  const progressX = resolved.padding + (width - resolved.padding * 2) * resolved.playbackProgress;
  strokeColumns(
    context,
    columns,
    resolved.color,
    resolved.lineWidth,
    (column) => column.x > progressX,
  );
  strokeColumns(
    context,
    columns,
    resolved.playedColor,
    resolved.lineWidth,
    (column) => column.x <= progressX,
  );
}

function strokeColumns(
  context: CanvasRenderingContext2D,
  columns: readonly ReturnType<typeof buildWaveformColumns>[number][],
  color: string,
  lineWidth: number,
  include: (column: ReturnType<typeof buildWaveformColumns>[number]) => boolean,
): void {
  const selected = columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => include(column));
  if (selected.length === 0) return;
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  for (const { column } of selected) {
    context.moveTo(column.x, column.yMin);
    context.lineTo(column.x, column.yMax);
  }
  context.stroke();

  context.beginPath();
  let previousChannel = -1;
  let previousIndex = -2;
  for (const { column, index } of selected) {
    const midpoint = (column.yMin + column.yMax) / 2;
    if (column.channelIndex !== previousChannel || index !== previousIndex + 1) {
      context.moveTo(column.x, midpoint);
    } else {
      context.lineTo(column.x, midpoint);
    }
    previousChannel = column.channelIndex;
    previousIndex = index;
  }
  context.stroke();
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}
