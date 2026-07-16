import type {
  CanvasSpectrumConfigInput,
  CanvasSpectrumConfig,
  SpectrumAnalysisConfig,
  SpectrumFrame,
  SpectrumFrequencyScale,
  SpectrumGeometry,
  SpectrumInterpolation,
  SpectrumLayout,
  SpectrumColorMode,
  SpectrumColorRole,
  SpectrumColorRoles,
  SpectrumPulseMode,
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
  colorMode: "line",
  colorRoles: Object.freeze({
    accent: Object.freeze({ alpha: 1, color: "#ff7892" }),
    base: Object.freeze({ alpha: 1, color: "#62dcf5" }),
    crest: Object.freeze({ alpha: 1, color: "#f8d65c" }),
    middle: Object.freeze({ alpha: 1, color: "#a7f59c" }),
  }),
  cornerRadius: 3,
  crestDecibels: -12,
  frequencyScale: "log",
  geometry: "curve",
  gradientRatio: 1,
  gridColor: "rgba(169, 190, 194, 0.16)",
  highFrequency: 20_000,
  interpolation: "catmull-rom",
  layout: "rectangular",
  lineWidth: 1.5,
  lowFrequency: 20,
  maximumDecibels: 0,
  minimumDecibels: -100,
  padding: 20,
  pulseMode: "peak-magnitude",
  radialArc: 360,
  radialDeadzone: 0.28,
  radialInvert: false,
  radialRotation: 270,
  middleDecibels: -36,
  roundedCaps: true,
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
  config: CanvasSpectrumConfigInput | undefined,
  frame?: SpectrumFrame,
): CanvasSpectrumConfig {
  const candidate = { ...DEFAULT_SPECTRUM_CONFIG, ...config };
  const range = normalizeDecibelRange(
    config?.minimumDecibels ?? frame?.minimumDecibels ?? candidate.minimumDecibels,
    config?.maximumDecibels ?? frame?.maximumDecibels ?? candidate.maximumDecibels,
  );
  const lowFrequency = clampFinite(candidate.lowFrequency, 0, 192_000, 20);
  const highFrequency = clampFinite(candidate.highFrequency, 1, 192_000, 20_000);
  const firstThreshold = clampFinite(
    candidate.middleDecibels,
    range.minimum,
    range.maximum,
    Math.max(range.minimum, -36),
  );
  const secondThreshold = clampFinite(
    candidate.crestDecibels,
    range.minimum,
    range.maximum,
    Math.max(range.minimum, -12),
  );
  const colorRoles = resolveColorRoles(config, candidate.color || DEFAULT_SPECTRUM_CONFIG.color);
  return Object.freeze({
    renderer:
      candidate.renderer === "svg" || candidate.renderer === "dom"
        ? candidate.renderer
        : "canvas2d",
    mode: "spectrum",
    backgroundColor: candidate.backgroundColor || DEFAULT_SPECTRUM_CONFIG.backgroundColor,
    barGap: clampFinite(candidate.barGap, 0, 32, DEFAULT_SPECTRUM_CONFIG.barGap),
    barWidth: clampFinite(candidate.barWidth, 1, 64, DEFAULT_SPECTRUM_CONFIG.barWidth),
    color: colorRoles.base.color,
    colorMode: isColorMode(candidate.colorMode)
      ? candidate.colorMode
      : DEFAULT_SPECTRUM_CONFIG.colorMode,
    colorRoles,
    cornerRadius: clampFinite(candidate.cornerRadius, 0, 128, DEFAULT_SPECTRUM_CONFIG.cornerRadius),
    crestDecibels: Math.max(firstThreshold, secondThreshold),
    frequencyScale: isFrequencyScale(candidate.frequencyScale)
      ? candidate.frequencyScale
      : DEFAULT_SPECTRUM_CONFIG.frequencyScale,
    geometry: isGeometry(candidate.geometry)
      ? candidate.geometry
      : DEFAULT_SPECTRUM_CONFIG.geometry,
    gridColor: candidate.gridColor || DEFAULT_SPECTRUM_CONFIG.gridColor,
    gradientRatio: clampFinite(
      candidate.gradientRatio,
      0,
      4,
      DEFAULT_SPECTRUM_CONFIG.gradientRatio,
    ),
    highFrequency: Math.max(lowFrequency, highFrequency),
    interpolation: isInterpolation(candidate.interpolation)
      ? candidate.interpolation
      : DEFAULT_SPECTRUM_CONFIG.interpolation,
    lineWidth: clampFinite(candidate.lineWidth, 0.5, 12, DEFAULT_SPECTRUM_CONFIG.lineWidth),
    layout: isLayout(candidate.layout) ? candidate.layout : DEFAULT_SPECTRUM_CONFIG.layout,
    lowFrequency: Math.min(lowFrequency, highFrequency),
    maximumDecibels: range.maximum,
    minimumDecibels: range.minimum,
    padding: clampFinite(candidate.padding, 0, 160, DEFAULT_SPECTRUM_CONFIG.padding),
    pulseMode: isPulseMode(candidate.pulseMode)
      ? candidate.pulseMode
      : DEFAULT_SPECTRUM_CONFIG.pulseMode,
    radialArc: clampFinite(candidate.radialArc, 0, 360, DEFAULT_SPECTRUM_CONFIG.radialArc),
    radialDeadzone: clampFinite(
      candidate.radialDeadzone,
      0,
      1,
      DEFAULT_SPECTRUM_CONFIG.radialDeadzone,
    ),
    radialInvert: Boolean(candidate.radialInvert),
    radialRotation: normalizeDegrees(candidate.radialRotation),
    middleDecibels: Math.min(firstThreshold, secondThreshold),
    roundedCaps: Boolean(candidate.roundedCaps),
    showGrid: Boolean(candidate.showGrid),
  });
}

function resolveColorRoles(
  config: CanvasSpectrumConfigInput | undefined,
  legacyColor: string,
): SpectrumColorRoles {
  const input = config?.colorRoles;
  return Object.freeze({
    accent: resolveColorRole(input?.accent, DEFAULT_SPECTRUM_CONFIG.colorRoles.accent),
    base: resolveColorRole(
      { ...input?.base, color: input?.base?.color ?? legacyColor },
      DEFAULT_SPECTRUM_CONFIG.colorRoles.base,
    ),
    crest: resolveColorRole(input?.crest, DEFAULT_SPECTRUM_CONFIG.colorRoles.crest),
    middle: resolveColorRole(input?.middle, DEFAULT_SPECTRUM_CONFIG.colorRoles.middle),
  });
}

function resolveColorRole(
  input: Partial<SpectrumColorRole> | undefined,
  fallback: SpectrumColorRole,
): SpectrumColorRole {
  return Object.freeze({
    alpha: clampFinite(input?.alpha ?? fallback.alpha, 0, 1, fallback.alpha),
    color: input?.color?.trim() || fallback.color,
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

function isLayout(value: unknown): value is SpectrumLayout {
  return value === "radial" || value === "rectangular";
}

function isColorMode(value: unknown): value is SpectrumColorMode {
  return ["gradient", "line", "pulse", "range", "solid"].includes(String(value));
}

function isPulseMode(value: unknown): value is SpectrumPulseMode {
  return value === "peak-frequency" || value === "peak-magnitude";
}

function normalizeDegrees(value: number): number {
  const finite = Number.isFinite(value) ? value : DEFAULT_SPECTRUM_CONFIG.radialRotation;
  return ((finite % 360) + 360) % 360;
}

function isInterpolation(value: unknown): value is SpectrumInterpolation {
  return value === "nearest" || value === "lanczos" || value === "catmull-rom";
}
