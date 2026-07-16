import type {
  CanvasEnvelopeModeConfig,
  CanvasWaveformConfig,
  CanvasWaveformConfigInput,
  CanvasWaveformModeConfig,
  EnvelopeAmplitudePlacement,
  WaveformAmplitudePlacement,
  WaveformChannelLayout,
  WaveformChannelMode,
  WaveformOrientation,
} from "./types";

export class WaveformConfigError extends TypeError {
  readonly code:
    | "FRAME_MODE_MISMATCH"
    | "INVALID_AMPLITUDE_PLACEMENT"
    | "INVALID_CHANNEL_INDEX"
    | "INVALID_CHANNEL_LAYOUT"
    | "INVALID_CHANNEL_MODE"
    | "INVALID_MODE"
    | "INVALID_ORIENTATION"
    | "MULTI_CHANNEL_LAYOUT_REQUIRED"
    | "STEREO_REQUIRES_TWO_CHANNELS";

  constructor(code: WaveformConfigError["code"], message: string) {
    super(message);
    this.name = "WaveformConfigError";
    this.code = code;
  }
}

const BASE_DEFAULTS = Object.freeze({
  amplitude: 0.86,
  backgroundColor: "#0b1012",
  centerLineColor: "rgba(169, 190, 194, 0.16)",
  channelColors: Object.freeze([]) as readonly string[],
  channelGap: 12,
  channelLayout: "stacked" as const,
  channelMode: "source" as const,
  color: "#62dcf5",
  lineWidth: 1.5,
  orientation: "horizontal" as const,
  padding: 20,
  playbackProgress: 0,
  playedColor: "#ecfdff",
  renderer: "canvas2d" as const,
  showCenterLine: true,
});

export const DEFAULT_WAVEFORM_CONFIG: CanvasWaveformModeConfig & {
  readonly channelMode: "source";
} = Object.freeze({
  ...BASE_DEFAULTS,
  amplitudePlacement: "centered",
  mode: "waveform",
});

export const DEFAULT_ENVELOPE_CONFIG: CanvasEnvelopeModeConfig & {
  readonly channelMode: "source";
} = Object.freeze({
  ...BASE_DEFAULTS,
  amplitudePlacement: "baseline",
  mode: "envelope",
});

export function resolveWaveformConfig(
  config: CanvasWaveformConfigInput | undefined,
  expectedMode?: "envelope" | "waveform",
): CanvasWaveformConfig {
  const supplied = Object.fromEntries(
    Object.entries(config ?? {}).filter(([, value]) => value !== undefined),
  ) as Record<string, unknown>;
  const suppliedMode = supplied.mode;
  if (suppliedMode !== undefined && suppliedMode !== "waveform" && suppliedMode !== "envelope")
    throw new WaveformConfigError(
      "INVALID_MODE",
      'Time-domain mode must be either "waveform" or "envelope".',
    );
  if (expectedMode && suppliedMode !== undefined && suppliedMode !== expectedMode)
    throw new WaveformConfigError(
      "FRAME_MODE_MISMATCH",
      `A ${expectedMode} frame cannot use ${String(suppliedMode)} rendering config.`,
    );
  const mode = expectedMode ?? suppliedMode ?? "waveform";
  const defaults = mode === "envelope" ? DEFAULT_ENVELOPE_CONFIG : DEFAULT_WAVEFORM_CONFIG;
  const candidate = { ...defaults, ...supplied } as Record<string, unknown>;
  const channelMode = resolveChannelMode(candidate.channelMode);
  const selection = resolveChannelSelection(channelMode, candidate.channelIndex);
  const channelLayout = resolveChannelLayout(candidate.channelLayout);
  const orientation = resolveOrientation(candidate.orientation);
  const amplitudePlacement = resolveAmplitudePlacement(mode, candidate.amplitudePlacement);
  const result = {
    amplitude: clampFinite(candidate.amplitude, 0, 2, defaults.amplitude),
    amplitudePlacement,
    backgroundColor: nonEmptyString(candidate.backgroundColor, defaults.backgroundColor),
    centerLineColor: nonEmptyString(candidate.centerLineColor, defaults.centerLineColor),
    channelColors: resolveColors(candidate.channelColors),
    channelGap: clampFinite(candidate.channelGap, 0, 96, defaults.channelGap),
    channelLayout,
    color: nonEmptyString(candidate.color, defaults.color),
    lineWidth: clampFinite(candidate.lineWidth, 0.5, 12, defaults.lineWidth),
    mode,
    orientation,
    padding: clampFinite(candidate.padding, 0, 160, defaults.padding),
    playbackProgress: clampFinite(candidate.playbackProgress, 0, 1, 0),
    playedColor: nonEmptyString(candidate.playedColor, defaults.playedColor),
    renderer: resolveRenderer(candidate.renderer),
    showCenterLine: Boolean(candidate.showCenterLine),
    ...selection,
  };
  return Object.freeze(result) as CanvasWaveformConfig;
}

function resolveChannelSelection(channelMode: WaveformChannelMode, value: unknown) {
  if (channelMode !== "single") return { channelMode } as const;
  if (!Number.isInteger(value) || (value as number) < 0)
    throw new WaveformConfigError(
      "INVALID_CHANNEL_INDEX",
      "Single-channel mode requires a non-negative integer channelIndex.",
    );
  return { channelIndex: value as number, channelMode } as const;
}

function resolveChannelMode(value: unknown): WaveformChannelMode {
  if (value === "mono" || value === "single" || value === "source" || value === "stereo")
    return value;
  throw new WaveformConfigError(
    "INVALID_CHANNEL_MODE",
    'channelMode must be "source", "mono", "stereo", or "single".',
  );
}

function resolveChannelLayout(value: unknown): WaveformChannelLayout {
  if (value === "overlay" || value === "split" || value === "stacked") return value;
  throw new WaveformConfigError(
    "INVALID_CHANNEL_LAYOUT",
    'channelLayout must be "stacked", "split", or "overlay".',
  );
}

function resolveOrientation(value: unknown): WaveformOrientation {
  if (value === "horizontal" || value === "vertical") return value;
  throw new WaveformConfigError(
    "INVALID_ORIENTATION",
    'orientation must be "horizontal" or "vertical".',
  );
}

function resolveRenderer(value: unknown): "canvas2d" | "svg" {
  return value === "svg" ? "svg" : "canvas2d";
}

function resolveAmplitudePlacement(
  mode: "envelope" | "waveform",
  value: unknown,
): EnvelopeAmplitudePlacement | WaveformAmplitudePlacement {
  if (mode === "envelope" && (value === "baseline" || value === "mirrored")) return value;
  if (
    mode === "waveform" &&
    (value === "centered" || value === "negative-only" || value === "positive-only")
  )
    return value;
  throw new WaveformConfigError(
    "INVALID_AMPLITUDE_PLACEMENT",
    mode === "envelope"
      ? 'Envelope placement must be "baseline" or "mirrored".'
      : 'Waveform placement must be "centered", "positive-only", or "negative-only".',
  );
}

function resolveColors(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return BASE_DEFAULTS.channelColors;
  return Object.freeze(value.filter((color): color is string => nonEmptyString(color, "") !== ""));
}

function nonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function clampFinite(value: unknown, minimum: number, maximum: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}
