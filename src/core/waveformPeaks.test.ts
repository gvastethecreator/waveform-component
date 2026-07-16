import { describe, expect, it } from "vitest";
import { createWaveformFrameFromPeakLevel, extractWaveformPeakPyramid } from "./waveformPeaks";

describe("extractWaveformPeakPyramid", () => {
  it("preserves signed extrema while bounding the base level", () => {
    const samples = new Float32Array(1_000_000);
    samples[12_345] = -1;
    samples[543_210] = 0.875;
    const pyramid = extractWaveformPeakPyramid([samples], { maxBasePeaks: 4096 });
    const base = pyramid.levels[0];

    expect(pyramid.originalSampleCount).toBe(1_000_000);
    expect(base.peakCount).toBeLessThanOrEqual(4096);
    expect(Math.min(...base.channels[0].minimums)).toBe(-1);
    expect(Math.max(...base.channels[0].maximums)).toBe(0.875);
    expect(pyramid.levels.at(-1)?.peakCount).toBe(1);
  });

  it("builds deterministic lower-resolution levels and a renderable signed frame", () => {
    const samples = Float32Array.from({ length: 64 }, (_, index) =>
      index % 2 === 0 ? -index / 64 : index / 64,
    );
    const first = extractWaveformPeakPyramid([samples], {
      maxBasePeaks: 16,
      reductionFactor: 4,
    });
    const second = extractWaveformPeakPyramid([samples], {
      maxBasePeaks: 16,
      reductionFactor: 4,
    });

    expect(first.levels.map((level) => level.peakCount)).toEqual([16, 4, 1]);
    expect(first.levels.map((level) => Array.from(level.channels[0].minimums))).toEqual(
      second.levels.map((level) => Array.from(level.channels[0].minimums)),
    );

    const frame = createWaveformFrameFromPeakLevel(first.levels[0], {
      duration: 2,
      sampleRate: 48_000,
    });
    expect(frame).toMatchObject({ sampleCount: 32, duration: 2, sampleRate: 48_000 });
    expect(Math.min(...frame.channels[0])).toBeLessThan(0);
    expect(Math.max(...frame.channels[0])).toBeGreaterThan(0);
  });

  it("returns an explicit empty pyramid and frame", () => {
    const pyramid = extractWaveformPeakPyramid([]);
    expect(pyramid).toEqual({ levels: [], originalSampleCount: 0 });
    expect(createWaveformFrameFromPeakLevel(pyramid.levels[0]).state).toBe("empty");
  });
});
