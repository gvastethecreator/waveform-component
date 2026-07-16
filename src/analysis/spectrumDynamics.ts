import { createSpectrumFrame } from "./spectrum";
import type { SpectrumFrame } from "../types";

export type SpectrumSmoothingMode = "none" | "ema" | "time-variant-ema";
export type SpectrumInputState = "muted" | "ready" | "silent";
export type SpectrumDynamicsPolicy = "hidden-silent" | "held-muted" | "processed";

export interface SpectrumDynamicsConfig {
  readonly attackMs: number;
  readonly fastPeaks: boolean;
  readonly gaussianRadius: number;
  readonly hideSilent: boolean;
  readonly highFrequencySlopeDbPerOctave: number;
  readonly highFrequencySlopeReference: number;
  readonly inertiaMs: number;
  readonly lowFrequency: number;
  readonly highFrequency: number;
  readonly normalizationEnabled: boolean;
  readonly normalizationMaxGainDb: number;
  readonly normalizationTargetDb: number;
  readonly peakThresholdDb: number;
  readonly processMuted: boolean;
  readonly reactThresholdDb: number;
  readonly releaseMs: number;
  readonly rolloffAttenuationDb: number;
  readonly rolloffBandwidthHz: number;
  readonly silenceThresholdDb: number;
  readonly smoothingFactor: number;
  readonly smoothingMode: SpectrumSmoothingMode;
}

export interface SpectrumDynamicsInput {
  readonly sourceState?: SpectrumInputState;
  readonly timestampMs: number;
}

export interface SpectrumDynamicsResult {
  readonly appliedGainDb: number;
  readonly frame: SpectrumFrame;
  readonly peakActive: boolean;
  readonly peakDb: number;
  readonly policy: SpectrumDynamicsPolicy;
  readonly reacting: boolean;
  readonly visible: boolean;
}

export interface SpectrumDynamicsProcessor {
  process(
    frame: SpectrumFrame,
    config?: Partial<SpectrumDynamicsConfig>,
    input?: Partial<SpectrumDynamicsInput>,
  ): SpectrumDynamicsResult;
  reset(): void;
}

export interface VisualSyncCapability {
  readonly canLookAhead: boolean;
  readonly sourceKind: string;
}

export interface VisualSyncResolution {
  readonly enabled: boolean;
  readonly offsetMs: number;
  readonly reason?: string;
}

export const DEFAULT_SPECTRUM_DYNAMICS_CONFIG: SpectrumDynamicsConfig = Object.freeze({
  attackMs: 35,
  fastPeaks: false,
  gaussianRadius: 0,
  hideSilent: false,
  highFrequencySlopeDbPerOctave: 0,
  highFrequencySlopeReference: 1000,
  inertiaMs: 0,
  lowFrequency: 20,
  highFrequency: 20_000,
  normalizationEnabled: false,
  normalizationMaxGainDb: 12,
  normalizationTargetDb: -12,
  peakThresholdDb: -12,
  processMuted: false,
  reactThresholdDb: -60,
  releaseMs: 240,
  rolloffAttenuationDb: 0,
  rolloffBandwidthHz: 0,
  silenceThresholdDb: -96,
  smoothingFactor: 0.72,
  smoothingMode: "none",
});

export function resolveSpectrumDynamicsConfig(
  config: Partial<SpectrumDynamicsConfig> | undefined,
  frame?: Pick<SpectrumFrame, "maximumDecibels" | "minimumDecibels" | "sampleRate">,
): SpectrumDynamicsConfig {
  const candidate = { ...DEFAULT_SPECTRUM_DYNAMICS_CONFIG, ...config };
  const frequencyMaximum = frame ? frame.sampleRate / 2 : 192_000;
  const decibelMinimum = frame?.minimumDecibels ?? -180;
  const decibelMaximum = frame?.maximumDecibels ?? 12;
  const lowFrequency = clampFinite(candidate.lowFrequency, 0, frequencyMaximum, 20);
  const highFrequency = clampFinite(
    candidate.highFrequency,
    0,
    frequencyMaximum,
    Math.min(20_000, frequencyMaximum),
  );
  const reactThresholdDb = clampFinite(
    candidate.reactThresholdDb,
    decibelMinimum,
    decibelMaximum,
    Math.max(decibelMinimum, -60),
  );
  const peakThresholdDb = clampFinite(
    candidate.peakThresholdDb,
    decibelMinimum,
    decibelMaximum,
    Math.max(decibelMinimum, -12),
  );
  return Object.freeze({
    attackMs: clampFinite(candidate.attackMs, 0, 10_000, 35),
    fastPeaks: Boolean(candidate.fastPeaks),
    gaussianRadius: clampFinite(candidate.gaussianRadius, 0, 32, 0),
    hideSilent: Boolean(candidate.hideSilent),
    highFrequencySlopeDbPerOctave: clampFinite(candidate.highFrequencySlopeDbPerOctave, -24, 24, 0),
    highFrequencySlopeReference: clampFinite(
      candidate.highFrequencySlopeReference,
      20,
      24_000,
      1000,
    ),
    inertiaMs: clampFinite(candidate.inertiaMs, 0, 10_000, 0),
    lowFrequency: Math.min(lowFrequency, highFrequency),
    highFrequency: Math.max(lowFrequency, highFrequency),
    normalizationEnabled: Boolean(candidate.normalizationEnabled),
    normalizationMaxGainDb: clampFinite(candidate.normalizationMaxGainDb, 0, 60, 12),
    normalizationTargetDb: clampFinite(
      candidate.normalizationTargetDb,
      decibelMinimum,
      decibelMaximum,
      Math.max(decibelMinimum, Math.min(decibelMaximum, -12)),
    ),
    peakThresholdDb: Math.max(reactThresholdDb, peakThresholdDb),
    processMuted: Boolean(candidate.processMuted),
    reactThresholdDb: Math.min(reactThresholdDb, peakThresholdDb),
    releaseMs: clampFinite(candidate.releaseMs, 0, 10_000, 240),
    rolloffAttenuationDb: clampFinite(candidate.rolloffAttenuationDb, 0, 120, 0),
    rolloffBandwidthHz: clampFinite(candidate.rolloffBandwidthHz, 0, 48_000, 0),
    silenceThresholdDb: clampFinite(
      candidate.silenceThresholdDb,
      decibelMinimum,
      decibelMaximum,
      Math.max(decibelMinimum, Math.min(decibelMaximum, -96)),
    ),
    smoothingFactor: clampFinite(candidate.smoothingFactor, 0, 0.9999, 0.72),
    smoothingMode: isSmoothingMode(candidate.smoothingMode)
      ? candidate.smoothingMode
      : DEFAULT_SPECTRUM_DYNAMICS_CONFIG.smoothingMode,
  });
}

export function createSpectrumDynamicsProcessor(): SpectrumDynamicsProcessor {
  let previous: Float32Array | null = null;
  let previousTimestampMs: number | null = null;
  let previousFrame: SpectrumFrame | null = null;
  return {
    process(frame, configInput, input = {}) {
      const config = resolveSpectrumDynamicsConfig(configInput, frame);
      const timestampMs = Number.isFinite(input.timestampMs) ? input.timestampMs! : 0;
      const sourceState = input.sourceState ?? "ready";
      const compatible =
        previous?.length === frame.bins.length &&
        previousFrame?.fftSize === frame.fftSize &&
        previousFrame.sampleRate === frame.sampleRate;
      if (!compatible) {
        previous = null;
        previousFrame = null;
        previousTimestampMs = null;
      }
      if (sourceState === "muted" && !config.processMuted && previousFrame) {
        const peakDb = maximum(previousFrame.bins, previousFrame.minimumDecibels);
        const visible = !(config.hideSilent && peakDb <= config.silenceThresholdDb);
        return result(previousFrame, 0, peakDb, config, "held-muted", visible);
      }
      if (sourceState === "muted" && !config.processMuted) {
        const heldFrame = createSpectrumFrame(
          new Float32Array(frame.bins.length).fill(frame.minimumDecibels),
          frame,
        );
        return result(
          heldFrame,
          0,
          frame.minimumDecibels,
          config,
          "held-muted",
          !config.hideSilent,
        );
      }

      const transformed = transformSpectrumBins(frame, config);
      const deltaSeconds =
        previousTimestampMs === null
          ? 0
          : Math.max(0, Math.min(10, (timestampMs - previousTimestampMs) / 1000));
      const temporal = applyTemporalResponse(transformed.bins, previous, deltaSeconds, config);
      const outputFrame = createSpectrumFrame(temporal, {
        fftSize: frame.fftSize,
        maximumDecibels: frame.maximumDecibels,
        minimumDecibels: frame.minimumDecibels,
        sampleRate: frame.sampleRate,
      });
      const peakDb = maximum(outputFrame.bins, outputFrame.minimumDecibels);
      const silent = sourceState === "silent" || peakDb <= config.silenceThresholdDb;
      previous = new Float32Array(outputFrame.bins);
      previousFrame = outputFrame;
      previousTimestampMs = timestampMs;
      return result(
        outputFrame,
        transformed.appliedGainDb,
        peakDb,
        config,
        silent && config.hideSilent ? "hidden-silent" : "processed",
        !(silent && config.hideSilent),
      );
    },
    reset() {
      previous = null;
      previousFrame = null;
      previousTimestampMs = null;
    },
  };
}

export function gaussianFilterSpectrum(bins: Float32Array, radius: number): Float32Array {
  const sigma = clampFinite(radius, 0, 32, 0);
  if (sigma <= 0 || bins.length < 2) return new Float32Array(bins);
  const extent = Math.max(1, Math.ceil(sigma * 3));
  const weights = new Float64Array(extent * 2 + 1);
  let total = 0;
  for (let offset = -extent; offset <= extent; offset += 1) {
    const weight = Math.exp(-(offset ** 2) / (2 * sigma ** 2));
    weights[offset + extent] = weight;
    total += weight;
  }
  const output = new Float32Array(bins.length);
  for (let index = 0; index < bins.length; index += 1) {
    let value = 0;
    for (let offset = -extent; offset <= extent; offset += 1) {
      const source = Math.min(bins.length - 1, Math.max(0, index + offset));
      value += bins[source] * (weights[offset + extent] / total);
    }
    output[index] = value;
  }
  return output;
}

export function resolveVisualSyncOffset(
  requestedOffsetMs: number,
  capability: VisualSyncCapability,
): VisualSyncResolution {
  const offsetMs = clampFinite(requestedOffsetMs, -5000, 5000, 0);
  if (offsetMs < 0 && !capability.canLookAhead)
    return Object.freeze({
      enabled: false,
      offsetMs: 0,
      reason: `${capability.sourceKind} cannot provide future audio frames for negative visual sync.`,
    });
  return Object.freeze({ enabled: true, offsetMs });
}

export class SpectrumFrameDelay {
  readonly #entries: Array<{ frame: SpectrumFrame; timestampMs: number }> = [];
  readonly #maximumEntries: number;

  constructor(maximumEntries = 600) {
    this.#maximumEntries = Math.max(2, Math.round(maximumEntries));
  }

  push(frame: SpectrumFrame, timestampMs: number, offsetMs: number): SpectrumFrame | null {
    if (!Number.isFinite(timestampMs)) return null;
    this.#entries.push({ frame, timestampMs });
    while (this.#entries.length > this.#maximumEntries) this.#entries.shift();
    if (offsetMs <= 0) return frame;
    const target = timestampMs - offsetMs;
    let selected: SpectrumFrame | null = null;
    while (this.#entries.length > 1 && this.#entries[1].timestampMs <= target)
      selected = this.#entries.shift()!.frame;
    if (this.#entries[0]?.timestampMs <= target) selected = this.#entries[0].frame;
    return selected;
  }

  clear(): void {
    this.#entries.length = 0;
  }
}

function transformSpectrumBins(frame: SpectrumFrame, config: SpectrumDynamicsConfig) {
  const bins = new Float32Array(frame.bins);
  const inputPeak = maximum(bins, frame.minimumDecibels);
  const isValidSignal = inputPeak > frame.minimumDecibels + 0.001;
  const appliedGainDb =
    config.normalizationEnabled && isValidSignal
      ? Math.min(config.normalizationMaxGainDb, config.normalizationTargetDb - inputPeak)
      : 0;
  for (let index = 0; index < bins.length; index += 1) {
    const frequency = (index * frame.sampleRate) / frame.fftSize;
    let value = bins[index] + appliedGainDb;
    if (frequency > config.highFrequencySlopeReference)
      value +=
        config.highFrequencySlopeDbPerOctave *
        Math.log2(frequency / config.highFrequencySlopeReference);
    value -= rolloffForFrequency(frequency, config);
    bins[index] = Math.min(frame.maximumDecibels, Math.max(frame.minimumDecibels, value));
  }
  return { appliedGainDb, bins: gaussianFilterSpectrum(bins, config.gaussianRadius) };
}

function rolloffForFrequency(frequency: number, config: SpectrumDynamicsConfig): number {
  if (config.rolloffBandwidthHz <= 0 || config.rolloffAttenuationDb <= 0) return 0;
  const lowEnd = config.lowFrequency + config.rolloffBandwidthHz;
  if (frequency >= config.lowFrequency && frequency < lowEnd)
    return (
      config.rolloffAttenuationDb *
      (1 - (frequency - config.lowFrequency) / config.rolloffBandwidthHz)
    );
  const highStart = config.highFrequency - config.rolloffBandwidthHz;
  if (frequency > highStart && frequency <= config.highFrequency)
    return (
      config.rolloffAttenuationDb *
      (1 - (config.highFrequency - frequency) / config.rolloffBandwidthHz)
    );
  if (frequency < config.lowFrequency || frequency > config.highFrequency)
    return config.rolloffAttenuationDb;
  return 0;
}

function applyTemporalResponse(
  target: Float32Array,
  previous: Float32Array | null,
  deltaSeconds: number,
  config: SpectrumDynamicsConfig,
): Float32Array {
  if (!previous || previous.length !== target.length || deltaSeconds <= 0)
    return new Float32Array(target);
  const output = new Float32Array(target.length);
  for (let index = 0; index < target.length; index += 1) {
    const rising = target[index] > previous[index];
    let value = target[index];
    if (!(config.fastPeaks && rising)) {
      const timeConstantSeconds =
        smoothingTimeConstantSeconds(config, rising) + config.inertiaMs / 1000;
      if (timeConstantSeconds > 0) {
        const alpha = Math.exp(-deltaSeconds / timeConstantSeconds);
        value = previous[index] * alpha + target[index] * (1 - alpha);
      }
    }
    output[index] = value;
  }
  return output;
}

function smoothingTimeConstantSeconds(config: SpectrumDynamicsConfig, rising: boolean): number {
  if (config.smoothingMode === "time-variant-ema")
    return (rising ? config.attackMs : config.releaseMs) / 1000;
  if (config.smoothingMode === "ema" && config.smoothingFactor > 0)
    return -1 / (60 * Math.log(config.smoothingFactor));
  return 0;
}

function result(
  frame: SpectrumFrame,
  appliedGainDb: number,
  peakDb: number,
  config: SpectrumDynamicsConfig,
  policy: SpectrumDynamicsPolicy,
  visible: boolean,
): SpectrumDynamicsResult {
  return Object.freeze({
    appliedGainDb,
    frame,
    peakActive: peakDb >= config.peakThresholdDb,
    peakDb,
    policy,
    reacting: peakDb >= config.reactThresholdDb,
    visible,
  });
}

function maximum(values: Float32Array, fallback: number): number {
  let result = fallback;
  for (const value of values) result = Math.max(result, value);
  return result;
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function isSmoothingMode(value: unknown): value is SpectrumSmoothingMode {
  return value === "none" || value === "ema" || value === "time-variant-ema";
}
