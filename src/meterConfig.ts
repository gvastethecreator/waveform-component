import type {
  CanvasColorRole,
  CanvasColorRoles,
  CanvasMeterConfig,
  CanvasMeterConfigInput,
  MeterColorMode,
  MeterFrame,
  MeterGeometry,
  MeterMeasurement,
  SpectrumLayout,
  WaveformOrientation,
} from "./types";

export const DEFAULT_METER_CONFIG: CanvasMeterConfig = Object.freeze({
  renderer: "canvas2d",
  mode: "meter",
  backgroundColor: "#0b1012",
  barWidth: 14,
  channelGap: 12,
  colorMode: "gradient",
  colorRoles: Object.freeze({
    accent: Object.freeze({ alpha: 1, color: "#ff7892" }),
    base: Object.freeze({ alpha: 1, color: "#62dcf5" }),
    crest: Object.freeze({ alpha: 1, color: "#f8d65c" }),
    middle: Object.freeze({ alpha: 1, color: "#a7f59c" }),
  }),
  cornerRadius: 7,
  crestDecibels: -12,
  historyOpacity: 0.22,
  layout: "rectangular",
  maximumDecibels: 0,
  measurement: "rms",
  middleDecibels: -36,
  minimumDecibels: -60,
  minimumSize: 2,
  orientation: "horizontal",
  padding: 20,
  peakThresholdDb: -6,
  radialArc: 300,
  radialDeadzone: 0.34,
  radialInvert: false,
  radialRotation: 120,
  reactThresholdDb: -48,
  roundedCaps: true,
  showHistory: true,
  stepGap: 3,
  stepWidth: 8,
  trackColor: "rgba(169, 190, 194, 0.14)",
});

export function resolveMeterConfig(
  config: CanvasMeterConfigInput | undefined,
  frame?: MeterFrame,
): CanvasMeterConfig {
  const candidate = { ...DEFAULT_METER_CONFIG, ...config };
  const range = normalizeDecibelRange(
    config?.minimumDecibels ?? frame?.minimumDecibels ?? candidate.minimumDecibels,
    config?.maximumDecibels ?? frame?.maximumDecibels ?? candidate.maximumDecibels,
  );
  const react = clampFinite(
    candidate.reactThresholdDb,
    range.minimum,
    range.maximum,
    Math.max(range.minimum, -48),
  );
  const peak = clampFinite(
    candidate.peakThresholdDb,
    range.minimum,
    range.maximum,
    Math.max(range.minimum, -6),
  );
  const middle = clampFinite(
    candidate.middleDecibels,
    range.minimum,
    range.maximum,
    Math.max(range.minimum, -36),
  );
  const crest = clampFinite(
    candidate.crestDecibels,
    range.minimum,
    range.maximum,
    Math.max(range.minimum, -12),
  );
  return Object.freeze({
    renderer: candidate.renderer === "svg" ? "svg" : "canvas2d",
    mode: isGeometry(candidate.mode) ? candidate.mode : DEFAULT_METER_CONFIG.mode,
    backgroundColor: candidate.backgroundColor || DEFAULT_METER_CONFIG.backgroundColor,
    barWidth: clampFinite(candidate.barWidth, 1, 128, DEFAULT_METER_CONFIG.barWidth),
    channelGap: clampFinite(candidate.channelGap, 0, 128, DEFAULT_METER_CONFIG.channelGap),
    colorMode: isColorMode(candidate.colorMode)
      ? candidate.colorMode
      : DEFAULT_METER_CONFIG.colorMode,
    colorRoles: resolveColorRoles(config),
    cornerRadius: clampFinite(candidate.cornerRadius, 0, 128, DEFAULT_METER_CONFIG.cornerRadius),
    crestDecibels: Math.max(middle, crest),
    historyOpacity: clampFinite(
      candidate.historyOpacity,
      0,
      1,
      DEFAULT_METER_CONFIG.historyOpacity,
    ),
    layout: isLayout(candidate.layout) ? candidate.layout : DEFAULT_METER_CONFIG.layout,
    maximumDecibels: range.maximum,
    measurement: isMeasurement(candidate.measurement)
      ? candidate.measurement
      : DEFAULT_METER_CONFIG.measurement,
    middleDecibels: Math.min(middle, crest),
    minimumDecibels: range.minimum,
    minimumSize: clampFinite(candidate.minimumSize, 0, 64, DEFAULT_METER_CONFIG.minimumSize),
    orientation: isOrientation(candidate.orientation)
      ? candidate.orientation
      : DEFAULT_METER_CONFIG.orientation,
    padding: clampFinite(candidate.padding, 0, 160, DEFAULT_METER_CONFIG.padding),
    peakThresholdDb: Math.max(react, peak),
    radialArc: clampFinite(candidate.radialArc, 0, 360, DEFAULT_METER_CONFIG.radialArc),
    radialDeadzone: clampFinite(
      candidate.radialDeadzone,
      0,
      1,
      DEFAULT_METER_CONFIG.radialDeadzone,
    ),
    radialInvert: Boolean(candidate.radialInvert),
    radialRotation: normalizeDegrees(candidate.radialRotation),
    reactThresholdDb: Math.min(react, peak),
    roundedCaps: Boolean(candidate.roundedCaps),
    showHistory: Boolean(candidate.showHistory),
    stepGap: clampFinite(candidate.stepGap, 0, 64, DEFAULT_METER_CONFIG.stepGap),
    stepWidth: clampFinite(candidate.stepWidth, 1, 128, DEFAULT_METER_CONFIG.stepWidth),
    trackColor: candidate.trackColor || DEFAULT_METER_CONFIG.trackColor,
  });
}

function resolveColorRoles(config: CanvasMeterConfigInput | undefined): CanvasColorRoles {
  return Object.freeze({
    accent: resolveColorRole(config?.colorRoles?.accent, DEFAULT_METER_CONFIG.colorRoles.accent),
    base: resolveColorRole(config?.colorRoles?.base, DEFAULT_METER_CONFIG.colorRoles.base),
    crest: resolveColorRole(config?.colorRoles?.crest, DEFAULT_METER_CONFIG.colorRoles.crest),
    middle: resolveColorRole(config?.colorRoles?.middle, DEFAULT_METER_CONFIG.colorRoles.middle),
  });
}

function resolveColorRole(
  input: Partial<CanvasColorRole> | undefined,
  fallback: CanvasColorRole,
): CanvasColorRole {
  return Object.freeze({
    alpha: clampFinite(input?.alpha ?? fallback.alpha, 0, 1, fallback.alpha),
    color: input?.color?.trim() || fallback.color,
  });
}

function normalizeDecibelRange(minimum: number, maximum: number) {
  const floor = clampFinite(minimum, -180, -1, DEFAULT_METER_CONFIG.minimumDecibels);
  const ceiling = clampFinite(maximum, floor + 1, 12, DEFAULT_METER_CONFIG.maximumDecibels);
  return { maximum: ceiling, minimum: floor };
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function isGeometry(value: unknown): value is MeterGeometry {
  return value === "meter" || value === "stepped-meter";
}

function isColorMode(value: unknown): value is MeterColorMode {
  return value === "gradient" || value === "range" || value === "solid";
}

function isMeasurement(value: unknown): value is MeterMeasurement {
  return value === "peak" || value === "rms";
}

function isLayout(value: unknown): value is SpectrumLayout {
  return value === "radial" || value === "rectangular";
}

function isOrientation(value: unknown): value is WaveformOrientation {
  return value === "horizontal" || value === "vertical";
}

function normalizeDegrees(value: number): number {
  const finite = Number.isFinite(value) ? value : DEFAULT_METER_CONFIG.radialRotation;
  return ((finite % 360) + 360) % 360;
}
