import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "./analysis/spectrum";
import {
  resolveSpectrumAnalysisConfig,
  resolveSpectrumConfig,
  resolveSpectrumFrequencyRange,
} from "./spectrumConfig";

describe("spectrum config", () => {
  it("normalizes FFT sizes, guarded cost, and decibel ordering", () => {
    expect(resolveSpectrumAnalysisConfig({ fftSize: 1000 }).fftSize).toBe(1024);
    expect(resolveSpectrumAnalysisConfig({ fftSize: 65536 }).fftSize).toBe(32768);
    expect(resolveSpectrumAnalysisConfig({ allowLargeFft: true, fftSize: 65536 }).fftSize).toBe(
      65536,
    );
    expect(
      resolveSpectrumAnalysisConfig({ maximumDecibels: -120, minimumDecibels: 10 }),
    ).toMatchObject({ maximumDecibels: 0, minimumDecibels: -1 });
    expect(resolveSpectrumAnalysisConfig({ window: "mystery" as never }).window).toBe("hann");
  });

  it("orders cutoffs and clamps them in hertz against Nyquist", () => {
    const config = resolveSpectrumConfig({
      frequencyScale: "log",
      highFrequency: 1000,
      lowFrequency: 12_000,
    });
    expect(config).toMatchObject({ highFrequency: 12_000, lowFrequency: 1000 });
    const frame = createSpectrumFrame(new Float32Array(16).fill(-60), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 32_000,
    });
    expect(resolveSpectrumFrequencyRange(frame, config)).toMatchObject({
      binWidth: 1000,
      highFrequency: 12_000,
      lowFrequency: 1000,
      nyquist: 16_000,
    });
    expect(
      resolveSpectrumFrequencyRange(frame, resolveSpectrumConfig({ highFrequency: 99_000 })),
    ).toMatchObject({ highFrequency: 16_000 });
  });

  it("normalizes frame dB metadata and clamps native-style bin input", () => {
    const frame = createSpectrumFrame(new Float32Array(16).fill(-40), {
      fftSize: 32,
      maximumDecibels: -120,
      minimumDecibels: 10,
      sampleRate: 48_000,
    });
    expect(frame).toMatchObject({ maximumDecibels: 0, minimumDecibels: -1 });
    expect(frame.bins.every((value) => value === -1)).toBe(true);
  });
});
