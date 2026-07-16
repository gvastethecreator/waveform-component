import type {
  CanvasSpectrumConfig,
  SpectrumAnalysisConfig,
  SpectrumFrame,
  SpectrumFrequencyScale,
  SpectrumGeometry,
  SpectrumInterpolation,
  SpectrumWindow,
} from "./types";

export const SPECTRUM_FFT_SIZES = Object.freeze([
  32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
] as const);
export const GUARDED_SPECTRUM_FFT_SIZE = 65536;

export const DEFAULT_SPECTRUM_ANALYSIS_CONFIG: SpectrumAnalysisConfig = Object.freeze({
  allowLargeFft: false,
  fftSize: 2048,
  maximumDecibels: 0,
  minimumDecibels: -100,
  powerOfSineExponent: 2,
  window: "hann",
});

export const DEFAULT_SPECTRUM_CONFIG: CanvasSpectrumConfig = Object.freeze({
  renderer: "canvas2d",
  mode: "spectrum",
  backgroundColor: "#0b1012",
  barGap: 2,
  barWidth: 7,
  color: "#62dcf5",
  frequencyScale: "log",
  geometry: "curve",
  gridColor: "rgba(169, 190, 194, 0.16)",
  highFrequency: 20_000,
  interpolation: "catmull-rom",
  lineWidth: 1.5,
  lowFrequency: 20,
  maximumDecibels: 0,
  minimumDecibels: -100,
  padding: 20,
  showGrid: true,
});

export interface SpectrumFrequencyRange {
  readonly binWidth: number;
  readonly highFrequency: number;
  readonly lowFrequency: number;
  readonly nyquist: number;
}

export function resolveSpectrumAnalysisConfig(
  config: Partial<SpectrumAnalysisConfig> | undefined,
): SpectrumAnalysisConfig {
  const candidate = { ...DEFAULT_SPECTRUM_ANALYSIS_CONFIG, ...config };
  const range = normalizeDecibelRange(candidate.minimumDecibels, candidate.maximumDecibels);
  const allowLargeFft = candidate.allowLargeFft === true;
  return Object.freeze({
    allowLargeFft,
    fftSize: normalizeFftSize(candidate.fftSize, allowLargeFft),
    maximumDecibels: range.maximum,
    minimumDecibels: range.minimum,
    powerOfSineExponent: clampFinite(candidate.powerOfSineExponent, 0.1, 10, 2),
    window: isWindow(candidate.window) ? candidate.window : DEFAULT_SPECTRUM_ANALYSIS_CONFIG.window,
  });
}

export function resolveSpectrumConfig(
  config: Partial<CanvasSpectrumConfig> | undefined,
  frame?: SpectrumFrame,
): CanvasSpectrumConfig {
  const candidate = { ...DEFAULT_SPECTRUM_CONFIG, ...config };
  const range = normalizeDecibelRange(
    config?.minimumDecibels ?? frame?.minimumDecibels ?? candidate.minimumDecibels,
    config?.maximumDecibels ?? frame?.maximumDecibels ?? candidate.maximumDecibels,
  );
  const lowFrequency = clampFinite(candidate.lowFrequency, 0, 192_000, 20);
  const highFrequency = clampFinite(candidate.highFrequency, 1, 192_000, 20_000);
  return Object.freeze({
    renderer: "canvas2d",
    mode: "spectrum",
    backgroundColor: candidate.backgroundColor || DEFAULT_SPECTRUM_CONFIG.backgroundColor,
    barGap: clampFinite(candidate.barGap, 0, 32, DEFAULT_SPECTRUM_CONFIG.barGap),
    barWidth: clampFinite(candidate.barWidth, 1, 64, DEFAULT_SPECTRUM_CONFIG.barWidth),
    color: candidate.color || DEFAULT_SPECTRUM_CONFIG.color,
    frequencyScale: isFrequencyScale(candidate.frequencyScale)
      ? candidate.frequencyScale
      : DEFAULT_SPECTRUM_CONFIG.frequencyScale,
    geometry: isGeometry(candidate.geometry)
      ? candidate.geometry
      : DEFAULT_SPECTRUM_CONFIG.geometry,
    gridColor: candidate.gridColor || DEFAULT_SPECTRUM_CONFIG.gridColor,
    highFrequency: Math.max(lowFrequency, highFrequency),
    interpolation: isInterpolation(candidate.interpolation)
      ? candidate.interpolation
      : DEFAULT_SPECTRUM_CONFIG.interpolation,
    lineWidth: clampFinite(candidate.lineWidth, 0.5, 12, DEFAULT_SPECTRUM_CONFIG.lineWidth),
    lowFrequency: Math.min(lowFrequency, highFrequency),
    maximumDecibels: range.maximum,
    minimumDecibels: range.minimum,
    padding: clampFinite(candidate.padding, 0, 160, DEFAULT_SPECTRUM_CONFIG.padding),
    showGrid: Boolean(candidate.showGrid),
  });
}

export function resolveSpectrumFrequencyRange(
  frame: SpectrumFrame,
  config: CanvasSpectrumConfig,
): SpectrumFrequencyRange {
  const nyquist = frame.sampleRate / 2;
  const binWidth = frame.sampleRate / frame.fftSize;
  const minimum = config.frequencyScale === "log" ? Math.max(Number.EPSILON, binWidth) : 0;
  const lowFrequency = Math.min(nyquist, Math.max(minimum, config.lowFrequency));
  const requestedHigh = Math.min(nyquist, Math.max(minimum, config.highFrequency));
  const highFrequency = Math.max(lowFrequency, requestedHigh);
  return Object.freeze({ binWidth, highFrequency, lowFrequency, nyquist });
}

function normalizeFftSize(value: number, allowLargeFft: boolean): number {
  const fallback = DEFAULT_SPECTRUM_ANALYSIS_CONFIG.fftSize;
  const finite = Number.isFinite(value) ? Math.max(32, value) : fallback;
  const maximum = allowLargeFft ? GUARDED_SPECTRUM_FFT_SIZE : 32768;
  const exponent = Math.round(Math.log2(Math.min(maximum, finite)));
  return Math.min(maximum, Math.max(32, 2 ** exponent));
}

function normalizeDecibelRange(minimum: number, maximum: number) {
  const floor = clampFinite(minimum, -180, -1, -100);
  const ceiling = clampFinite(maximum, floor + 1, 12, 0);
  return { maximum: ceiling, minimum: floor };
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function isWindow(value: unknown): value is SpectrumWindow {
  return ["none", "hann", "hamming", "blackman", "blackman-harris", "power-of-sine"].includes(
    String(value),
  );
}

function isFrequencyScale(value: unknown): value is SpectrumFrequencyScale {
  return value === "linear" || value === "log";
}

function isGeometry(value: unknown): value is SpectrumGeometry {
  return value === "curve" || value === "bars";
}

function isInterpolation(value: unknown): value is SpectrumInterpolation {
  return value === "nearest" || value === "lanczos" || value === "catmull-rom";
}
