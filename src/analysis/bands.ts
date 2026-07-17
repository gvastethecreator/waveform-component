import type { BandEnergyFrame, EnergyBand, SpectrumFrame, SpectrumFrequencyScale } from "../types";

export const MAX_VFX_BANDS = 16;

export interface SpectrumBandEnergyOptions {
  readonly bandCount?: number;
  readonly frequencyScale?: SpectrumFrequencyScale;
  readonly highFrequency?: number;
  readonly lowFrequency?: number;
}

export class BandEnergyInputError extends RangeError {
  readonly code: "INVALID_BAND_COUNT" | "INVALID_FREQUENCY_RANGE";

  constructor(code: BandEnergyInputError["code"], message: string) {
    super(message);
    this.name = "BandEnergyInputError";
    this.code = code;
  }
}

export function createBandEnergyFrameFromSpectrum(
  frame: SpectrumFrame,
  options: SpectrumBandEnergyOptions = {},
): BandEnergyFrame {
  const bandCount = resolveBandCount(options.bandCount);
  const nyquist = frame.sampleRate / 2;
  const firstPositiveBin = frame.sampleRate / frame.fftSize;
  const lowFrequency = options.lowFrequency ?? Math.max(20, firstPositiveBin);
  const highFrequency = options.highFrequency ?? nyquist;
  validateFrequencyRange(lowFrequency, highFrequency, nyquist);
  if (frame.state === "empty" || frame.bins.length === 0) return EMPTY_BAND_ENERGY_FRAME;

  const frequencyScale = options.frequencyScale ?? "log";
  const ratio = highFrequency / lowFrequency;
  const edges = Array.from({ length: bandCount + 1 }, (_, index) => {
    if (index === bandCount) return highFrequency;
    const position = index / bandCount;
    return frequencyScale === "linear"
      ? lowFrequency + (highFrequency - lowFrequency) * position
      : lowFrequency * Math.pow(ratio, position);
  });
  const bands = Array.from({ length: bandCount }, (_, index) =>
    createBand(frame, index, edges[index], edges[index + 1]),
  );
  return Object.freeze({
    bands: Object.freeze(bands),
    kind: "bands",
    state: "ready",
  });
}

function createBand(
  frame: SpectrumFrame,
  index: number,
  lowFrequency: number,
  highFrequency: number,
): EnergyBand {
  const firstIndex = frequencyToBin(lowFrequency, frame, "ceil");
  const highIndex =
    highFrequency >= frame.sampleRate / 2
      ? frame.bins.length
      : frequencyToBin(highFrequency, frame, "ceil");
  const endIndex = Math.min(frame.bins.length, Math.max(firstIndex + 1, highIndex));
  let power = 0;
  let count = 0;
  for (let binIndex = firstIndex; binIndex < endIndex; binIndex += 1) {
    const decibels = clamp(frame.bins[binIndex], frame.minimumDecibels, frame.maximumDecibels);
    power += Math.pow(10, decibels / 10);
    count += 1;
  }
  if (count === 0) {
    const center = Math.sqrt(lowFrequency * highFrequency);
    const nearestIndex = frequencyToBin(center, frame, "round");
    const decibels = clamp(frame.bins[nearestIndex], frame.minimumDecibels, frame.maximumDecibels);
    power = Math.pow(10, decibels / 10);
    count = 1;
  }
  return Object.freeze({
    energy: clamp(Math.sqrt(power / count), 0, 1),
    highFrequency,
    id: `band-${index + 1}`,
    lowFrequency,
  });
}

function frequencyToBin(
  frequency: number,
  frame: SpectrumFrame,
  policy: "ceil" | "floor" | "round",
): number {
  const raw = (frequency * frame.fftSize) / frame.sampleRate;
  const index =
    policy === "ceil" ? Math.ceil(raw) : policy === "floor" ? Math.floor(raw) : Math.round(raw);
  return Math.min(frame.bins.length - 1, Math.max(0, index));
}

function resolveBandCount(value: number | undefined): number {
  const bandCount = value ?? 8;
  if (!Number.isInteger(bandCount) || bandCount < 1 || bandCount > MAX_VFX_BANDS)
    throw new BandEnergyInputError(
      "INVALID_BAND_COUNT",
      `bandCount must be an integer from 1 to ${MAX_VFX_BANDS}.`,
    );
  return bandCount;
}

function validateFrequencyRange(lowFrequency: number, highFrequency: number, nyquist: number) {
  if (
    !Number.isFinite(lowFrequency) ||
    !Number.isFinite(highFrequency) ||
    lowFrequency <= 0 ||
    highFrequency <= lowFrequency ||
    highFrequency > nyquist
  )
    throw new BandEnergyInputError(
      "INVALID_FREQUENCY_RANGE",
      `Band frequencies must satisfy 0 < lowFrequency < highFrequency <= Nyquist (${nyquist} Hz).`,
    );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

const EMPTY_BAND_ENERGY_FRAME: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([]),
  kind: "bands",
  state: "empty",
});
