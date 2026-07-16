import { selectTimeDomainChannels } from "./channels";
import { createStaticWaveformFrame } from "../core/staticFrame";
import type {
  MeterChannel,
  MeterFrame,
  StaticWaveformInput,
  WaveformChannelMode,
  WaveformChannelSelection,
  WaveformFrame,
} from "../types";

export interface AnalyzeMeterOptions {
  readonly channelIndex?: number;
  readonly channelMode?: WaveformChannelMode;
  readonly minimumDecibels?: number;
  readonly sampleRate?: number;
}

export interface AnalyzeMeterWindowsOptions extends AnalyzeMeterOptions {
  readonly windowSize: number;
}

export function analyzeMeter(
  input: StaticWaveformInput | WaveformFrame,
  options: AnalyzeMeterOptions = {},
): MeterFrame {
  const waveform = isWaveformFrame(input)
    ? input
    : createStaticWaveformFrame(input, { sampleRate: options.sampleRate });
  const selection = meterSelection(options.channelMode ?? "source", options.channelIndex);
  const selected = selectTimeDomainChannels(waveform, selection);
  const minimumDecibels = clampFinite(options.minimumDecibels ?? -120, -240, -1, -120);
  const channels = selected.channels.map((channel, index) =>
    analyzeChannel(channel, selected.sourceChannelIndices[index], minimumDecibels),
  );
  const sampleCount = selected.channels.reduce(
    (maximum, channel) => Math.max(maximum, channel.length),
    0,
  );
  return Object.freeze({
    channels: Object.freeze(channels),
    kind: "meter",
    maximumDecibels: 0,
    minimumDecibels,
    referenceAmplitude: 1,
    sampleCount,
    sampleRate: waveform.sampleRate ?? options.sampleRate ?? 48_000,
    state: sampleCount === 0 ? "empty" : "ready",
  });
}

export function analyzeMeterWindows(
  input: StaticWaveformInput | WaveformFrame,
  options: AnalyzeMeterWindowsOptions,
): readonly MeterFrame[] {
  const waveform = isWaveformFrame(input)
    ? input
    : createStaticWaveformFrame(input, { sampleRate: options.sampleRate });
  const windowSize = clampInteger(options.windowSize, 1, 1_048_576, 1024);
  if (waveform.sampleCount === 0) return Object.freeze([]);
  const count = Math.ceil(waveform.sampleCount / windowSize);
  return Object.freeze(
    Array.from({ length: count }, (_, index) => {
      const start = index * windowSize;
      const channels = waveform.channels.map((channel) => channel.slice(start, start + windowSize));
      return analyzeMeter(channels, {
        channelIndex: options.channelIndex,
        channelMode: options.channelMode,
        minimumDecibels: options.minimumDecibels,
        sampleRate: waveform.sampleRate ?? options.sampleRate,
      });
    }),
  );
}

export function linearAmplitudeToDbfs(value: number, minimumDecibels = -120): number {
  const floor = clampFinite(minimumDecibels, -240, -1, -120);
  if (!Number.isFinite(value) || value <= 0) return floor;
  return Math.max(floor, 20 * Math.log10(value));
}

function analyzeChannel(
  channel: Float32Array,
  sourceChannelIndex: number,
  minimumDecibels: number,
): MeterChannel {
  let peak = 0;
  let sumSquares = 0;
  for (const sample of channel) {
    const magnitude = Math.abs(sample);
    peak = Math.max(peak, magnitude);
    sumSquares += sample * sample;
  }
  const rms = channel.length === 0 ? 0 : Math.sqrt(sumSquares / channel.length);
  return Object.freeze({
    linearPeak: peak,
    linearRms: rms,
    peakDbfs: linearAmplitudeToDbfs(peak, minimumDecibels),
    rmsDbfs: linearAmplitudeToDbfs(rms, minimumDecibels),
    sourceChannelIndex,
  });
}

function meterSelection(
  channelMode: WaveformChannelMode,
  channelIndex: number | undefined,
): WaveformChannelSelection {
  if (channelMode === "single")
    return { channelIndex: Math.max(0, channelIndex ?? 0), channelMode };
  return { channelMode };
}

function isWaveformFrame(value: StaticWaveformInput | WaveformFrame): value is WaveformFrame {
  return (
    typeof value === "object" && value !== null && "kind" in value && value.kind === "waveform"
  );
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

function clampInteger(value: number, minimum: number, maximum: number, fallback: number): number {
  return Math.round(clampFinite(value, minimum, maximum, fallback));
}
