import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "./spectrum";
import { BandEnergyInputError, createBandEnergyFrameFromSpectrum } from "./bands";

function spectrum(values: readonly number[]) {
  return createSpectrumFrame(Float32Array.from(values), {
    fftSize: values.length * 2,
    maximumDecibels: 0,
    minimumDecibels: -100,
    sampleRate: 8_000,
  });
}

describe("canonical band energy", () => {
  it("aggregates logarithmic frequency ranges into RMS amplitude energy", () => {
    const frame = createBandEnergyFrameFromSpectrum(
      spectrum(Array.from({ length: 16 }, () => -20)),
      {
        bandCount: 2,
        highFrequency: 4_000,
        lowFrequency: 500,
      },
    );
    expect(frame.state).toBe("ready");
    expect(frame.bands).toHaveLength(2);
    expect(frame.bands[0].energy).toBeCloseTo(0.1);
    expect(frame.bands[1].energy).toBeCloseTo(0.1);
    expect(frame.bands[0].lowFrequency).toBe(500);
    expect(frame.bands[0].highFrequency).toBeCloseTo(Math.sqrt(500 * 4_000));
    expect(frame.bands[1].highFrequency).toBe(4_000);
    expect(Object.isFrozen(frame.bands[0])).toBe(true);
  });

  it("preserves ordered band intent when upper bins carry more energy", () => {
    const frame = createBandEnergyFrameFromSpectrum(
      spectrum([-100, -100, -100, -100, -90, -80, -70, -60, -50, -40, -30, -20, -12, -6, -3, 0]),
      { bandCount: 4, highFrequency: 4_000, lowFrequency: 500 },
    );
    expect(frame.bands.map((band) => band.lowFrequency)).toEqual(
      [...frame.bands].map((band) => band.lowFrequency).sort((a, b) => a - b),
    );
    expect(frame.bands.at(-1)!.energy).toBeGreaterThan(frame.bands[0].energy);
    expect(frame.bands.every((band) => band.energy >= 0 && band.energy <= 1)).toBe(true);
  });

  it("returns one immutable empty frame without inventing energy", () => {
    const empty = createSpectrumFrame(new Float32Array(), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 8_000,
    });
    const frame = createBandEnergyFrameFromSpectrum(empty);
    expect(frame).toEqual({ bands: [], kind: "bands", state: "empty" });
    expect(Object.isFrozen(frame)).toBe(true);
    expect(() => createBandEnergyFrameFromSpectrum(empty, { bandCount: 17 })).toThrowError(
      BandEnergyInputError,
    );
  });

  it("rejects invalid density and frequency domains", () => {
    const source = spectrum(Array.from({ length: 16 }, () => -20));
    expect(() => createBandEnergyFrameFromSpectrum(source, { bandCount: 17 })).toThrowError(
      BandEnergyInputError,
    );
    expect(() =>
      createBandEnergyFrameFromSpectrum(source, { highFrequency: 5_000, lowFrequency: 500 }),
    ).toThrowError(/Nyquist \(4000 Hz\)/);
  });
});
