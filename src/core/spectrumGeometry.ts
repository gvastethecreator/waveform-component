import { fractionalBinForFrequency } from "../analysis/spectrum";
import { resolveSpectrumConfig, resolveSpectrumFrequencyRange } from "../spectrumConfig";
import type {
  CanvasSpectrumConfigInput,
  CanvasSpectrumConfig,
  SpectrumBar,
  SpectrumFrame,
  SpectrumInterpolation,
  SpectrumPoint,
  SpectrumRadialBar,
  SpectrumRadialPoint,
  WaveformViewport,
} from "../types";

const MAX_CURVE_POINTS = 4096;

export function buildSpectrumPoints(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: CanvasSpectrumConfigInput,
): readonly SpectrumPoint[] {
  if (frame.state === "empty" || frame.bins.length === 0) return [];
  const resolved = resolveSpectrumConfig(config, frame);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const innerWidth = Math.max(0, width - resolved.padding * 2);
  const innerHeight = Math.max(0, height - resolved.padding * 2);
  if (innerWidth <= 0 || innerHeight <= 0) return [];
  const count = Math.min(MAX_CURVE_POINTS, Math.max(2, Math.floor(innerWidth) + 1));
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return spectrumPoint(frame, resolved, ratio, innerWidth, innerHeight);
  });
}

export function buildSpectrumBars(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: CanvasSpectrumConfigInput,
): readonly SpectrumBar[] {
  if (frame.state === "empty" || frame.bins.length === 0) return [];
  const resolved = resolveSpectrumConfig(config, frame);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const innerWidth = Math.max(0, width - resolved.padding * 2);
  const innerHeight = Math.max(0, height - resolved.padding * 2);
  if (innerWidth <= 0 || innerHeight <= 0) return [];
  const barWidth = Math.min(resolved.barWidth, innerWidth);
  const barGap = Math.min(resolved.barGap, innerWidth);
  const slotWidth = barWidth + barGap;
  const count = Math.max(1, Math.floor((innerWidth + barGap) / slotWidth));
  const usedWidth = count * barWidth + Math.max(0, count - 1) * barGap;
  const offset = resolved.padding + Math.max(0, (innerWidth - usedWidth) / 2);
  return Array.from({ length: count }, (_, index) => {
    const ratio = count === 1 ? 0.5 : index / (count - 1);
    const point = spectrumPoint(frame, resolved, ratio, innerWidth, innerHeight);
    const baseline = height - resolved.padding;
    return Object.freeze({
      ...point,
      height: Math.max(0, baseline - point.y),
      width: barWidth,
      x: offset + index * slotWidth,
    });
  });
}

export function buildSpectrumRadialPoints(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: CanvasSpectrumConfigInput,
): readonly SpectrumRadialPoint[] {
  if (frame.state === "empty" || frame.bins.length === 0) return [];
  const resolved = resolveSpectrumConfig({ ...config, layout: "radial" }, frame);
  const metrics = radialMetrics(viewport, resolved);
  if (!metrics || metrics.arc === 0) return [];
  const count = Math.min(
    MAX_CURVE_POINTS,
    Math.max(2, Math.floor(metrics.arc * Math.max(1, metrics.maximumRadius)) + 1),
  );
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return radialPoint(frame, resolved, ratio, metrics);
  });
}

export function buildSpectrumRadialBars(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: CanvasSpectrumConfigInput,
): readonly SpectrumRadialBar[] {
  if (frame.state === "empty" || frame.bins.length === 0) return [];
  const resolved = resolveSpectrumConfig({ ...config, layout: "radial" }, frame);
  const metrics = radialMetrics(viewport, resolved);
  if (!metrics || metrics.arc === 0) return [];
  const referenceRadius = (metrics.minimumRadius + metrics.maximumRadius) / 2;
  const arcLength = Math.max(0, metrics.arc * referenceRadius);
  const slot = Math.max(1, resolved.barWidth + resolved.barGap);
  const count = Math.min(
    MAX_CURVE_POINTS,
    Math.max(1, Math.floor((arcLength + resolved.barGap) / slot)),
  );
  return Array.from({ length: count }, (_, index) => {
    const ratio =
      count === 1 ? 0.5 : resolved.radialArc === 360 ? (index + 0.5) / count : index / (count - 1);
    const point = radialPoint(frame, resolved, ratio, metrics);
    return Object.freeze({
      ...point,
      width: Math.min(resolved.barWidth, Math.max(1, arcLength)),
      x1: point.baseX,
      x2: point.x,
      y1: point.baseY,
      y2: point.y,
    });
  });
}

export function resampleSpectrum(
  bins: Float32Array,
  fractionalIndex: number,
  interpolation: SpectrumInterpolation,
): number {
  if (bins.length === 0) return 0;
  if (!Number.isFinite(fractionalIndex)) return bins[0];
  const position = Math.min(bins.length - 1, Math.max(0, fractionalIndex));
  if (interpolation === "nearest") return bins[Math.round(position)];
  if (interpolation === "catmull-rom") {
    const index = Math.floor(position);
    const ratio = position - index;
    const p0 = sampleAt(bins, index - 1);
    const p1 = sampleAt(bins, index);
    const p2 = sampleAt(bins, index + 1);
    const p3 = sampleAt(bins, index + 2);
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * ratio +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * ratio ** 2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * ratio ** 3)
    );
  }
  const center = Math.floor(position);
  let weighted = 0;
  let totalWeight = 0;
  for (let index = center - 2; index <= center + 3; index += 1) {
    const distance = position - index;
    const weight = lanczosKernel(distance, 3);
    weighted += sampleAt(bins, index) * weight;
    totalWeight += weight;
  }
  return totalWeight === 0 ? sampleAt(bins, center) : weighted / totalWeight;
}

function spectrumPoint(
  frame: SpectrumFrame,
  config: CanvasSpectrumConfig,
  ratio: number,
  innerWidth: number,
  innerHeight: number,
): SpectrumPoint {
  const range = resolveSpectrumFrequencyRange(frame, config);
  const frequency = frequencyAtRatio(
    ratio,
    range.lowFrequency,
    range.highFrequency,
    config.frequencyScale,
  );
  const bin = fractionalBinForFrequency(frequency, frame.fftSize, frame.sampleRate);
  const rawDecibels = resampleSpectrum(frame.bins, bin, config.interpolation);
  const decibels = Math.min(config.maximumDecibels, Math.max(config.minimumDecibels, rawDecibels));
  const level =
    (decibels - config.minimumDecibels) / (config.maximumDecibels - config.minimumDecibels);
  return Object.freeze({
    decibels,
    frequency,
    level,
    x: config.padding + ratio * innerWidth,
    y: config.padding + (1 - level) * innerHeight,
  });
}

interface RadialMetrics {
  readonly arc: number;
  readonly baselineRadius: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly direction: -1 | 1;
  readonly extent: number;
  readonly maximumRadius: number;
  readonly minimumRadius: number;
  readonly rotation: number;
}

function radialMetrics(
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
): RadialMetrics | null {
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const padding = Math.min(config.padding, width / 2, height / 2);
  const maximumRadius = Math.max(0, Math.min(width - padding * 2, height - padding * 2) / 2);
  if (maximumRadius === 0) return null;
  const minimumRadius = maximumRadius * config.radialDeadzone;
  const direction = config.radialInvert ? -1 : 1;
  return Object.freeze({
    arc: (config.radialArc * Math.PI) / 180,
    baselineRadius: config.radialInvert ? maximumRadius : minimumRadius,
    centerX: width / 2,
    centerY: height / 2,
    direction,
    extent: maximumRadius - minimumRadius,
    maximumRadius,
    minimumRadius,
    rotation: (config.radialRotation * Math.PI) / 180,
  });
}

function radialPoint(
  frame: SpectrumFrame,
  config: CanvasSpectrumConfig,
  ratio: number,
  metrics: RadialMetrics,
): SpectrumRadialPoint {
  const sampled = spectrumPoint(frame, config, ratio, 0, 0);
  const angle = metrics.rotation + metrics.arc * ratio;
  const radius = clamp(
    metrics.baselineRadius + metrics.direction * sampled.level * metrics.extent,
    metrics.minimumRadius,
    metrics.maximumRadius,
  );
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return Object.freeze({
    ...sampled,
    angle,
    baselineRadius: metrics.baselineRadius,
    baseX: metrics.centerX + cosine * metrics.baselineRadius,
    baseY: metrics.centerY + sine * metrics.baselineRadius,
    centerX: metrics.centerX,
    centerY: metrics.centerY,
    radius,
    x: metrics.centerX + cosine * radius,
    y: metrics.centerY + sine * radius,
  });
}

function frequencyAtRatio(
  ratio: number,
  lowFrequency: number,
  highFrequency: number,
  scale: CanvasSpectrumConfig["frequencyScale"],
): number {
  if (lowFrequency === highFrequency) return lowFrequency;
  if (scale === "log") return lowFrequency * (highFrequency / lowFrequency) ** ratio;
  return lowFrequency + (highFrequency - lowFrequency) * ratio;
}

function sampleAt(bins: Float32Array, index: number): number {
  return bins[Math.min(bins.length - 1, Math.max(0, index))];
}

function lanczosKernel(value: number, radius: number): number {
  if (value === 0) return 1;
  if (Math.abs(value) >= radius) return 0;
  const piValue = Math.PI * value;
  return (Math.sin(piValue) / piValue) * (Math.sin(piValue / radius) / (piValue / radius));
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
