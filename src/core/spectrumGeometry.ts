import { fractionalBinForFrequency } from "../analysis/spectrum";
import { resolveSpectrumConfig, resolveSpectrumFrequencyRange } from "../spectrumConfig";
import type {
  CanvasSpectrumConfig,
  SpectrumBar,
  SpectrumFrame,
  SpectrumInterpolation,
  SpectrumPoint,
  WaveformViewport,
} from "../types";

const MAX_CURVE_POINTS = 4096;

export function buildSpectrumPoints(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: Partial<CanvasSpectrumConfig>,
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
  config?: Partial<CanvasSpectrumConfig>,
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
    x: config.padding + ratio * innerWidth,
    y: config.padding + (1 - level) * innerHeight,
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
