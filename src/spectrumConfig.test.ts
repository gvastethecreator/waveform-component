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

  it("normalizes radial extremes, threshold order, and nested color roles", () => {
    const config = resolveSpectrumConfig({
      color: "#123456",
      colorMode: "range",
      colorRoles: {
        accent: { alpha: 2, color: "var(--signal-accent, #ff0000)" },
        base: { alpha: -1 },
      },
      crestDecibels: -80,
      gradientRatio: 99,
      middleDecibels: -10,
      radialArc: 999,
      radialDeadzone: 2,
      radialRotation: -90,
    });

    expect(config).toMatchObject({
      color: "#123456",
      crestDecibels: -10,
      gradientRatio: 4,
      middleDecibels: -80,
      radialArc: 360,
      radialDeadzone: 1,
      radialRotation: 270,
    });
    expect(config.colorRoles).toMatchObject({
      accent: { alpha: 1, color: "var(--signal-accent, #ff0000)" },
      base: { alpha: 0, color: "#123456" },
    });
    expect(Object.isFrozen(config.colorRoles)).toBe(true);
    expect(resolveSpectrumConfig({ renderer: "svg" }).renderer).toBe("svg");
  });
});
