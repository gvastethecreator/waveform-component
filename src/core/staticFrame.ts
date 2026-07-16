import type { StaticWaveformInput, WaveformChannelInput, WaveformFrame } from "../types";
import { WaveformInputError } from "../types";

export interface StaticWaveformOptions {
  readonly duration?: number;
  readonly sampleRate?: number;
}

export interface DemoWaveformOptions {
  readonly phase?: number;
  readonly sampleCount?: number;
}

export function createStaticWaveformFrame(
  input: StaticWaveformInput,
  options: StaticWaveformOptions = {},
): WaveformFrame {
  const channelInputs = toChannelInputs(input);
  const channels = channelInputs.map((channel, channelIndex) =>
    validateAndCopyChannel(channel, channelIndex),
  );
  const sampleCount = channels.reduce((maximum, channel) => Math.max(maximum, channel.length), 0);

  return Object.freeze({
    kind: "waveform",
    state: sampleCount === 0 ? "empty" : "ready",
    channels: Object.freeze(channels),
    sampleCount,
    ...(isPositiveFinite(options.sampleRate) ? { sampleRate: options.sampleRate } : {}),
    ...(isNonNegativeFinite(options.duration) ? { duration: options.duration } : {}),
  });
}

export function createDemoWaveform(options: DemoWaveformOptions = {}): Float32Array {
  const sampleCount = Math.round(clampFinite(options.sampleCount ?? 2048, 32, 65_536));
  const phase = Number.isFinite(options.phase) ? (options.phase ?? 0) : 0;
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / Math.max(1, sampleCount - 1);
    const attack = Math.min(1, progress / 0.08);
    const release = Math.min(1, (1 - progress) / 0.12);
    const envelope = Math.sin(Math.PI * progress) ** 0.38 * attack * release;
    const carrier =
      Math.sin(Math.PI * 2 * (3 * progress + phase)) * 0.52 +
      Math.sin(Math.PI * 2 * (11 * progress + phase * 0.7)) * 0.23 +
      Math.sin(Math.PI * 2 * (29 * progress - phase * 0.35)) * 0.1;
    const transient = Math.exp(-Math.pow((progress - 0.68) / 0.045, 2)) * 0.42;
    samples[index] = Math.max(-1, Math.min(1, carrier * envelope + transient));
  }

  return samples;
}

function toChannelInputs(input: StaticWaveformInput): readonly WaveformChannelInput[] {
  if (input instanceof Float32Array) return [input];
  if (input.length === 0) return [input as readonly number[]];

  const first = input[0];
  if (typeof first === "number") return [input as readonly number[]];
  if (Array.isArray(first) || first instanceof Float32Array) {
    const channels = input as readonly WaveformChannelInput[];
    if (channels.length === 0) {
      throw new WaveformInputError(
        "EMPTY_CHANNEL_SET",
        "A waveform must include at least one channel.",
      );
    }
    return channels;
  }

  throw new WaveformInputError("INVALID_SAMPLE", "Waveform data must contain numeric samples.");
}

function validateAndCopyChannel(input: WaveformChannelInput, channelIndex: number): Float32Array {
  const output = new Float32Array(input.length);
  for (let sampleIndex = 0; sampleIndex < input.length; sampleIndex += 1) {
    const value = input[sampleIndex];
    if (!Number.isFinite(value) || value < -1 || value > 1) {
      throw new WaveformInputError(
        "INVALID_SAMPLE",
        `Channel ${channelIndex} sample ${sampleIndex} must be finite and between -1 and 1.`,
      );
    }
    output[sampleIndex] = value;
  }
  return output;
}

function isPositiveFinite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function clampFinite(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}
