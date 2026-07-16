import { linearAmplitudeToDbfs } from "./meter";
import type { MeterFrame, MeterHistoryPoint, MeterMeasurement } from "../types";

export interface MeterDynamicsConfig {
  readonly attackMs: number;
  readonly fastPeaks: boolean;
  readonly historyDurationMs: number;
  readonly historyIntervalMs: number;
  readonly inertiaMs: number;
  readonly maximumHistoryEntries: number;
  readonly peakThresholdDb: number;
  readonly reactThresholdDb: number;
  readonly releaseMs: number;
}

export interface MeterDynamicsInput {
  readonly sourceEpoch: number;
  readonly timestampMs: number;
}

export interface MeterDynamicsResult {
  readonly frame: MeterFrame;
  readonly history: readonly MeterHistoryPoint[];
  readonly historyCapacity: number;
  readonly peaking: boolean;
  readonly reacting: boolean;
  readonly resetOccurred: boolean;
}

export interface MeterDynamicsProcessor {
  process(
    frame: MeterFrame,
    config?: Partial<MeterDynamicsConfig>,
    input?: Partial<MeterDynamicsInput>,
  ): MeterDynamicsResult;
  reset(): void;
}

export interface MeterPreset {
  readonly config: Readonly<Partial<MeterDynamicsConfig>>;
  readonly id: "broadcast-rms" | "fast-peak" | "slow-rms";
  readonly label: string;
  readonly measurement: MeterMeasurement;
}

export const DEFAULT_METER_DYNAMICS_CONFIG: MeterDynamicsConfig = Object.freeze({
  attackMs: 80,
  fastPeaks: true,
  historyDurationMs: 2000,
  historyIntervalMs: 50,
  inertiaMs: 0,
  maximumHistoryEntries: 4096,
  peakThresholdDb: -6,
  reactThresholdDb: -48,
  releaseMs: 420,
});

export const METER_PRESETS: readonly MeterPreset[] = Object.freeze([
  Object.freeze({
    config: Object.freeze({ attackMs: 80, fastPeaks: false, releaseMs: 420 }),
    id: "broadcast-rms",
    label: "Broadcast RMS",
    measurement: "rms",
  }),
  Object.freeze({
    config: Object.freeze({ attackMs: 0, fastPeaks: true, releaseMs: 180 }),
    id: "fast-peak",
    label: "Fast peak",
    measurement: "peak",
  }),
  Object.freeze({
    config: Object.freeze({ attackMs: 320, fastPeaks: false, inertiaMs: 180, releaseMs: 1200 }),
    id: "slow-rms",
    label: "Slow RMS",
    measurement: "rms",
  }),
]);

export function resolveMeterDynamicsConfig(
  config: Partial<MeterDynamicsConfig> | undefined,
  frame?: Pick<MeterFrame, "maximumDecibels" | "minimumDecibels">,
): MeterDynamicsConfig {
  const candidate = { ...DEFAULT_METER_DYNAMICS_CONFIG, ...config };
  const minimum = frame?.minimumDecibels ?? -120;
  const maximum = frame?.maximumDecibels ?? 0;
  const react = clampFinite(candidate.reactThresholdDb, minimum, maximum, Math.max(minimum, -48));
  const peak = clampFinite(candidate.peakThresholdDb, minimum, maximum, Math.max(minimum, -6));
  return Object.freeze({
    attackMs: clampFinite(candidate.attackMs, 0, 10_000, 80),
    fastPeaks: Boolean(candidate.fastPeaks),
    historyDurationMs: clampFinite(candidate.historyDurationMs, 10, 600_000, 2000),
    historyIntervalMs: clampFinite(candidate.historyIntervalMs, 1, 60_000, 50),
    inertiaMs: clampFinite(candidate.inertiaMs, 0, 10_000, 0),
    maximumHistoryEntries: Math.round(
      clampFinite(candidate.maximumHistoryEntries, 1, 16_384, 4096),
    ),
    peakThresholdDb: Math.max(react, peak),
    reactThresholdDb: Math.min(react, peak),
    releaseMs: clampFinite(candidate.releaseMs, 0, 10_000, 420),
  });
}

export function meterHistoryCapacity(config: MeterDynamicsConfig): number {
  return Math.max(
    1,
    Math.min(
      config.maximumHistoryEntries,
      Math.floor(config.historyDurationMs / config.historyIntervalMs) + 1,
    ),
  );
}

export function createMeterDynamicsProcessor(): MeterDynamicsProcessor {
  let previousFrame: MeterFrame | null = null;
  let previousTimestampMs: number | null = null;
  let sourceEpoch: number | null = null;
  let history: MeterHistoryPoint[] = [];

  const reset = () => {
    previousFrame = null;
    previousTimestampMs = null;
    history = [];
  };

  return {
    process(frame, configInput, input = {}) {
      const config = resolveMeterDynamicsConfig(configInput, frame);
      const timestampMs = Number.isFinite(input.timestampMs) ? input.timestampMs! : 0;
      const nextEpoch = Number.isFinite(input.sourceEpoch) ? Math.round(input.sourceEpoch!) : 0;
      const incompatible =
        sourceEpoch !== null &&
        (sourceEpoch !== nextEpoch ||
          previousFrame?.channels.length !== frame.channels.length ||
          previousFrame.sampleRate !== frame.sampleRate ||
          (previousTimestampMs !== null && timestampMs < previousTimestampMs));
      if (incompatible) reset();
      const resetOccurred = Boolean(incompatible);
      sourceEpoch = nextEpoch;
      const deltaSeconds =
        previousTimestampMs === null
          ? 0
          : Math.max(0, Math.min(10, (timestampMs - previousTimestampMs) / 1000));
      const outputFrame = smoothMeterFrame(frame, previousFrame, deltaSeconds, config);
      const capacity = meterHistoryCapacity(config);
      const lastHistoryTime = history.at(-1)?.timestampMs;
      if (
        lastHistoryTime === undefined ||
        timestampMs - lastHistoryTime >= config.historyIntervalMs
      )
        history.push(Object.freeze({ frame: outputFrame, timestampMs }));
      const cutoff = timestampMs - config.historyDurationMs;
      while (history.length > 0 && (history[0].timestampMs < cutoff || history.length > capacity))
        history.shift();
      previousFrame = outputFrame;
      previousTimestampMs = timestampMs;
      return Object.freeze({
        frame: outputFrame,
        history: Object.freeze([...history]),
        historyCapacity: capacity,
        peaking: outputFrame.channels.some((channel) => channel.peakDbfs >= config.peakThresholdDb),
        reacting: outputFrame.channels.some(
          (channel) => channel.rmsDbfs >= config.reactThresholdDb,
        ),
        resetOccurred,
      });
    },
    reset() {
      reset();
      sourceEpoch = null;
    },
  };
}

function smoothMeterFrame(
  frame: MeterFrame,
  previous: MeterFrame | null,
  deltaSeconds: number,
  config: MeterDynamicsConfig,
): MeterFrame {
  const channels = frame.channels.map((channel, index) => {
    const prior = previous?.channels[index];
    const linearPeak = smoothValue(
      channel.linearPeak,
      prior?.linearPeak,
      deltaSeconds,
      config,
      config.fastPeaks,
    );
    const linearRms = smoothValue(channel.linearRms, prior?.linearRms, deltaSeconds, config, false);
    return Object.freeze({
      linearPeak,
      linearRms,
      peakDbfs: linearAmplitudeToDbfs(linearPeak, frame.minimumDecibels),
      rmsDbfs: linearAmplitudeToDbfs(linearRms, frame.minimumDecibels),
      sourceChannelIndex: channel.sourceChannelIndex,
    });
  });
  return Object.freeze({ ...frame, channels: Object.freeze(channels) });
}

function smoothValue(
  current: number,
  previous: number | undefined,
  deltaSeconds: number,
  config: MeterDynamicsConfig,
  fastRise: boolean,
): number {
  if (previous === undefined || deltaSeconds <= 0) return current;
  if (fastRise && current >= previous) return current;
  const responseMs = current >= previous ? config.attackMs : config.releaseMs;
  const timeConstantMs = Math.hypot(responseMs, config.inertiaMs);
  if (timeConstantMs <= 0) return current;
  const alpha = 1 - Math.exp(-deltaSeconds / (timeConstantMs / 1000));
  return previous + (current - previous) * alpha;
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}
