import { resolveSpectrumAnalysisConfig } from "../spectrumConfig";
import type {
  SpectrumAnalysisConfig,
  SpectrumFrame,
  SpectrumWindow,
  WaveformChannelInput,
} from "../types";

export interface AnalyzeSpectrumOptions extends Partial<SpectrumAnalysisConfig> {
  readonly sampleRate: number;
}

export interface SpectrumFrameOptions {
  readonly fftSize: number;
  readonly maximumDecibels: number;
  readonly minimumDecibels: number;
  readonly sampleRate: number;
}

export class SpectrumAnalysisError extends TypeError {
  readonly code:
    | "INVALID_BIN_COUNT"
    | "INVALID_FFT_SIZE"
    | "INVALID_SAMPLE"
    | "INVALID_SAMPLE_RATE"
    | "INVALID_WINDOW";

  constructor(code: SpectrumAnalysisError["code"], message: string) {
    super(message);
    this.name = "SpectrumAnalysisError";
    this.code = code;
  }
}

export function analyzeSpectrum(
  input: WaveformChannelInput,
  options: AnalyzeSpectrumOptions,
): SpectrumFrame {
  assertSampleRate(options.sampleRate);
  const config = resolveSpectrumAnalysisConfig(options);
  if (input.length === 0)
    return createSpectrumFrame([], {
      ...config,
      sampleRate: options.sampleRate,
    });

  const real = new Float64Array(config.fftSize);
  const imaginary = new Float64Array(config.fftSize);
  const window = createWindowCoefficients(
    config.fftSize,
    config.window,
    config.powerOfSineExponent,
  );
  const copiedSamples = Math.min(input.length, config.fftSize);
  const inputOffset = input.length - copiedSamples;
  const outputOffset = config.fftSize - copiedSamples;
  let coherentGain = 0;
  for (let index = 0; index < config.fftSize; index += 1) {
    const sampleIndex = index - outputOffset + inputOffset;
    const sample = sampleIndex >= inputOffset ? input[sampleIndex] : 0;
    if (!Number.isFinite(sample))
      throw new SpectrumAnalysisError(
        "INVALID_SAMPLE",
        `Spectrum sample ${sampleIndex} must be finite.`,
      );
    real[index] = sample * window[index];
    coherentGain += window[index];
  }

  fftInPlace(real, imaginary);
  const bins = new Float32Array(config.fftSize / 2);
  const normalization = Math.max(Number.EPSILON, coherentGain);
  for (let index = 0; index < bins.length; index += 1) {
    const magnitude = Math.hypot(real[index], imaginary[index]);
    const amplitude = (index === 0 ? magnitude : magnitude * 2) / normalization;
    const decibels = amplitude > 0 ? 20 * Math.log10(amplitude) : config.minimumDecibels;
    bins[index] = Math.min(config.maximumDecibels, Math.max(config.minimumDecibels, decibels));
  }
  return createSpectrumFrame(bins, { ...config, sampleRate: options.sampleRate });
}

export function createSpectrumFrame(
  input: readonly number[] | Float32Array,
  options: SpectrumFrameOptions,
): SpectrumFrame {
  assertSampleRate(options.sampleRate);
  if (!isValidFftSize(options.fftSize))
    throw new SpectrumAnalysisError(
      "INVALID_FFT_SIZE",
      "Spectrum fftSize must be a power of two from 32 through 65536.",
    );
  const range = resolveSpectrumAnalysisConfig({
    maximumDecibels: options.maximumDecibels,
    minimumDecibels: options.minimumDecibels,
  });
  const state = input.length === 0 ? "empty" : "ready";
  if (state === "ready" && input.length !== options.fftSize / 2)
    throw new SpectrumAnalysisError(
      "INVALID_BIN_COUNT",
      `Spectrum data must contain exactly ${options.fftSize / 2} ordered bins.`,
    );
  const bins = new Float32Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    const value = input[index];
    if (!Number.isFinite(value))
      throw new SpectrumAnalysisError("INVALID_SAMPLE", `Spectrum bin ${index} must be finite.`);
    bins[index] = Math.min(range.maximumDecibels, Math.max(range.minimumDecibels, value));
  }
  return Object.freeze({
    bins,
    fftSize: options.fftSize,
    kind: "spectrum",
    maximumDecibels: range.maximumDecibels,
    minimumDecibels: range.minimumDecibels,
    sampleRate: options.sampleRate,
    state,
  });
}

export function createWindowCoefficients(
  size: number,
  window: SpectrumWindow,
  powerOfSineExponent = 2,
): Float64Array {
  if (!Number.isInteger(size) || size < 2)
    throw new SpectrumAnalysisError(
      "INVALID_FFT_SIZE",
      "Window size must be an integer above one.",
    );
  const coefficients = new Float64Array(size);
  const denominator = size - 1;
  for (let index = 0; index < size; index += 1) {
    const phase = (2 * Math.PI * index) / denominator;
    switch (window) {
      case "none":
        coefficients[index] = 1;
        break;
      case "hann":
        coefficients[index] = 0.5 - 0.5 * Math.cos(phase);
        break;
      case "hamming":
        coefficients[index] = 0.54 - 0.46 * Math.cos(phase);
        break;
      case "blackman":
        coefficients[index] = 0.42 - 0.5 * Math.cos(phase) + 0.08 * Math.cos(phase * 2);
        break;
      case "blackman-harris":
        coefficients[index] =
          0.35875 -
          0.48829 * Math.cos(phase) +
          0.14128 * Math.cos(phase * 2) -
          0.01168 * Math.cos(phase * 3);
        break;
      case "power-of-sine":
        coefficients[index] = Math.sin((Math.PI * index) / denominator) ** powerOfSineExponent;
        break;
      default:
        throw new SpectrumAnalysisError("INVALID_WINDOW", `Unsupported spectrum window: ${window}`);
    }
  }
  return coefficients;
}

export function frequencyForBin(index: number, fftSize: number, sampleRate: number): number {
  return (index * sampleRate) / fftSize;
}

export function fractionalBinForFrequency(
  frequency: number,
  fftSize: number,
  sampleRate: number,
): number {
  return (frequency * fftSize) / sampleRate;
}

function fftInPlace(real: Float64Array, imaginary: Float64Array): void {
  const size = real.length;
  for (let index = 1, reversed = 0; index < size; index += 1) {
    let bit = size >> 1;
    for (; reversed & bit; bit >>= 1) reversed ^= bit;
    reversed ^= bit;
    if (index < reversed) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
      [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]];
    }
  }
  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    for (let offset = 0; offset < size; offset += length) {
      let twiddleReal = 1;
      let twiddleImaginary = 0;
      const half = length >> 1;
      for (let index = 0; index < half; index += 1) {
        const even = offset + index;
        const odd = even + half;
        const oddReal = real[odd] * twiddleReal - imaginary[odd] * twiddleImaginary;
        const oddImaginary = real[odd] * twiddleImaginary + imaginary[odd] * twiddleReal;
        real[odd] = real[even] - oddReal;
        imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal;
        imaginary[even] += oddImaginary;
        const nextReal = twiddleReal * stepReal - twiddleImaginary * stepImaginary;
        twiddleImaginary = twiddleReal * stepImaginary + twiddleImaginary * stepReal;
        twiddleReal = nextReal;
      }
    }
  }
}

function assertSampleRate(sampleRate: number): void {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0)
    throw new SpectrumAnalysisError(
      "INVALID_SAMPLE_RATE",
      "Spectrum sampleRate must be a positive finite value in hertz.",
    );
}

function isValidFftSize(value: number): boolean {
  return Number.isInteger(value) && value >= 32 && value <= 65536 && (value & (value - 1)) === 0;
}
