import { createStaticWaveformFrame } from "./staticFrame";
import type {
  WaveformFrame,
  WaveformPeakChannel,
  WaveformPeakLevel,
  WaveformPeakPyramid,
} from "../types";

export interface WaveformPeakOptions {
  readonly maxBasePeaks?: number;
  readonly reductionFactor?: number;
}

export function extractWaveformPeakPyramid(
  channels: readonly Float32Array[],
  options: WaveformPeakOptions = {},
): WaveformPeakPyramid {
  const maxBasePeaks = clampInteger(options.maxBasePeaks ?? 65_536, 16, 1_048_576);
  const reductionFactor = clampInteger(options.reductionFactor ?? 4, 2, 16);
  const originalSampleCount = channels.reduce(
    (maximum, channel) => Math.max(maximum, channel.length),
    0,
  );
  if (channels.length === 0 || originalSampleCount === 0) {
    return Object.freeze({ levels: Object.freeze([]), originalSampleCount });
  }

  const samplesPerPeak = Math.max(1, Math.ceil(originalSampleCount / maxBasePeaks));
  const levels: WaveformPeakLevel[] = [createBaseLevel(channels, samplesPerPeak)];

  while (levels.at(-1)!.peakCount > 1) {
    levels.push(reduceLevel(levels.at(-1)!, reductionFactor));
  }

  return Object.freeze({ levels: Object.freeze(levels), originalSampleCount });
}

export function createWaveformFrameFromPeakLevel(
  level: WaveformPeakLevel | undefined,
  options: { readonly duration?: number; readonly sampleRate?: number } = {},
): WaveformFrame {
  if (!level) return createStaticWaveformFrame([], options);
  const channels = level.channels.map((channel) => {
    const output = new Float32Array(channel.minimums.length * 2);
    for (let index = 0; index < channel.minimums.length; index += 1) {
      output[index * 2] = channel.minimums[index];
      output[index * 2 + 1] = channel.maximums[index];
    }
    return output;
  });
  return createStaticWaveformFrame(channels, options);
}

function createBaseLevel(
  channels: readonly Float32Array[],
  samplesPerPeak: number,
): WaveformPeakLevel {
  const peakCount = channels.reduce(
    (maximum, channel) => Math.max(maximum, Math.ceil(channel.length / samplesPerPeak)),
    0,
  );
  const peakChannels = channels.map((channel) => aggregateChannel(channel, samplesPerPeak));
  return freezeLevel(peakChannels, peakCount, samplesPerPeak);
}

function aggregateChannel(channel: Float32Array, samplesPerPeak: number): WaveformPeakChannel {
  const peakCount = Math.ceil(channel.length / samplesPerPeak);
  const minimums = new Float32Array(peakCount);
  const maximums = new Float32Array(peakCount);
  for (let peakIndex = 0; peakIndex < peakCount; peakIndex += 1) {
    const start = peakIndex * samplesPerPeak;
    const end = Math.min(channel.length, start + samplesPerPeak);
    let minimum = 1;
    let maximum = -1;
    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      const sample = Number.isFinite(channel[sampleIndex]) ? channel[sampleIndex] : 0;
      minimum = Math.min(minimum, sample);
      maximum = Math.max(maximum, sample);
    }
    minimums[peakIndex] = minimum;
    maximums[peakIndex] = maximum;
  }
  return Object.freeze({ maximums, minimums });
}

function reduceLevel(level: WaveformPeakLevel, reductionFactor: number): WaveformPeakLevel {
  const channels = level.channels.map((channel) => {
    const peakCount = Math.ceil(channel.minimums.length / reductionFactor);
    const minimums = new Float32Array(peakCount);
    const maximums = new Float32Array(peakCount);
    for (let peakIndex = 0; peakIndex < peakCount; peakIndex += 1) {
      const start = peakIndex * reductionFactor;
      const end = Math.min(channel.minimums.length, start + reductionFactor);
      let minimum = 1;
      let maximum = -1;
      for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1) {
        minimum = Math.min(minimum, channel.minimums[sourceIndex]);
        maximum = Math.max(maximum, channel.maximums[sourceIndex]);
      }
      minimums[peakIndex] = minimum;
      maximums[peakIndex] = maximum;
    }
    return Object.freeze({ maximums, minimums });
  });
  const peakCount = channels.reduce(
    (maximum, channel) => Math.max(maximum, channel.minimums.length),
    0,
  );
  return freezeLevel(channels, peakCount, level.samplesPerPeak * reductionFactor);
}

function freezeLevel(
  channels: readonly WaveformPeakChannel[],
  peakCount: number,
  samplesPerPeak: number,
): WaveformPeakLevel {
  return Object.freeze({ channels: Object.freeze(channels), peakCount, samplesPerPeak });
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.round(Math.min(maximum, Math.max(minimum, value)));
}
