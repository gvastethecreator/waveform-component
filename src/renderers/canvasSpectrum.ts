import { buildSpectrumBars, buildSpectrumPoints } from "../core/spectrumGeometry";
import { resolveSpectrumConfig } from "../spectrumConfig";
import type { CanvasSpectrumConfig, SpectrumFrame, WaveformViewport } from "../types";

export function renderCanvasSpectrum(
  context: CanvasRenderingContext2D,
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: Partial<CanvasSpectrumConfig>,
): void {
  const resolved = resolveSpectrumConfig(config, frame);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  context.clearRect(0, 0, width, height);
  context.fillStyle = resolved.backgroundColor;
  context.fillRect(0, 0, width, height);

  if (resolved.showGrid) {
    context.strokeStyle = resolved.gridColor;
    context.lineWidth = 1;
    context.beginPath();
    for (const ratio of [0, 0.5, 1]) {
      const y = resolved.padding + (height - resolved.padding * 2) * ratio;
      context.moveTo(resolved.padding, y);
      context.lineTo(Math.max(resolved.padding, width - resolved.padding), y);
    }
    context.stroke();
  }
  if (frame.state === "empty") return;

  if (resolved.geometry === "bars") {
    const baseline = Math.max(resolved.padding, height - resolved.padding);
    context.fillStyle = resolved.color;
    for (const bar of buildSpectrumBars(frame, viewport, resolved))
      context.fillRect(bar.x, Math.min(bar.y, baseline), bar.width, bar.height);
    return;
  }

  const points = buildSpectrumPoints(frame, viewport, resolved);
  if (points.length === 0) return;
  context.strokeStyle = resolved.color;
  context.lineWidth = resolved.lineWidth;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1)
    context.lineTo(points[index].x, points[index].y);
  context.stroke();
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
