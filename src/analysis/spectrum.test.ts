import { describe, expect, it } from "vitest";
import {
  analyzeSpectrum,
  createSpectrumFrame,
  createWindowCoefficients,
  fractionalBinForFrequency,
  frequencyForBin,
  SpectrumAnalysisError,
} from "./spectrum";

describe("spectrum analysis", () => {
  it("matches literal five-point window fixtures", () => {
    expect(Array.from(createWindowCoefficients(5, "none"))).toEqual([1, 1, 1, 1, 1]);
    expect(Array.from(createWindowCoefficients(5, "hann"))).toEqual(
      expectArrayCloseTo([0, 0.5, 1, 0.5, 0]),
    );
    expect(Array.from(createWindowCoefficients(5, "hamming"))).toEqual(
      expectArrayCloseTo([0.08, 0.54, 1, 0.54, 0.08]),
    );
    expect(Array.from(createWindowCoefficients(5, "blackman"))).toEqual(
      expectArrayCloseTo([0, 0.34, 1, 0.34, 0]),
    );
    expect(Array.from(createWindowCoefficients(5, "blackman-harris"))).toEqual(
      expectArrayCloseTo([0.00006, 0.21747, 1, 0.21747, 0.00006]),
    );
    expect(Array.from(createWindowCoefficients(5, "power-of-sine", 2))).toEqual(
      expectArrayCloseTo([0, 0.5, 1, 0.5, 0]),
    );
  });

  it("places an exact-bin full-scale sine at the correct hertz", () => {
    const fftSize = 1024;
    const sampleRate = 48_000;
    const expectedBin = 64;
    const samples = Float32Array.from({ length: fftSize }, (_, index) =>
      Math.sin((2 * Math.PI * expectedBin * index) / fftSize),
    );
    const frame = analyzeSpectrum(samples, {
      fftSize,
      maximumDecibels: 0,
      minimumDecibels: -120,
      sampleRate,
      window: "none",
    });
    const peakBin = frame.bins.reduce(
      (best, value, index) => (value > frame.bins[best] ? index : best),
      0,
    );

    expect(peakBin).toBe(expectedBin);
    expect(frame.bins[expectedBin]).toBeCloseTo(0, 3);
    expect(frequencyForBin(expectedBin, fftSize, sampleRate)).toBe(3000);
    expect(fractionalBinForFrequency(3000, fftSize, sampleRate)).toBe(expectedBin);
  });

  it("makes empty and malformed frames explicit", () => {
    expect(analyzeSpectrum([], { sampleRate: 48_000 }).state).toBe("empty");
    expect(() => analyzeSpectrum([0, Number.NaN], { fftSize: 32, sampleRate: 48_000 })).toThrow(
      SpectrumAnalysisError,
    );
    expect(() => analyzeSpectrum([0], { sampleRate: 0 })).toThrowError(
      expect.objectContaining({ code: "INVALID_SAMPLE_RATE" }),
    );
    expect(() =>
      createSpectrumFrame([-10, -20], {
        fftSize: 32,
        maximumDecibels: 0,
        minimumDecibels: -100,
        sampleRate: 48_000,
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_BIN_COUNT" }));
  });
});

function expectArrayCloseTo(expected: readonly number[]) {
  return expected.map((value) => expect.closeTo(value, 5));
}
