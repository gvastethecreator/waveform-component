import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "../analysis/spectrum";
import {
  buildSpectrumBars,
  buildSpectrumPoints,
  buildSpectrumRadialBars,
  buildSpectrumRadialPoints,
  resampleSpectrum,
} from "./spectrumGeometry";

const bins = Float32Array.from({ length: 16 }, (_, index) => -100 + index * 5);
const frame = createSpectrumFrame(bins, {
  fftSize: 32,
  maximumDecibels: 0,
  minimumDecibels: -100,
  sampleRate: 32_000,
});

describe("spectrum geometry", () => {
  it("maps hertz to ordered bins on a linear axis", () => {
    const points = buildSpectrumPoints(
      frame,
      { height: 100, width: 50 },
      {
        frequencyScale: "linear",
        highFrequency: 6000,
        interpolation: "nearest",
        lowFrequency: 2000,
        padding: 0,
      },
    );
    expect(points[0]).toMatchObject({ decibels: -90, frequency: 2000, x: 0 });
    expect(points.at(-1)).toMatchObject({ decibels: -70, frequency: 6000, x: 50 });
  });

  it("keeps logarithmic extremes and degenerate viewport geometry finite", () => {
    const points = buildSpectrumPoints(
      frame,
      { height: 80, width: 120 },
      { frequencyScale: "log", highFrequency: Number.POSITIVE_INFINITY, lowFrequency: 0 },
    );
    expect(points.length).toBeGreaterThan(2);
    expect(points.every((point) => Object.values(point).every(Number.isFinite))).toBe(true);
    expect(buildSpectrumPoints(frame, { height: 0, width: 0 })).toEqual([]);
  });

  it("resamples with all public interpolation modes and bounds bar count", () => {
    const constant = new Float32Array([4, 4, 4, 4]);
    expect(resampleSpectrum(constant, 1.6, "nearest")).toBe(4);
    expect(resampleSpectrum(constant, 1.6, "catmull-rom")).toBeCloseTo(4);
    expect(resampleSpectrum(constant, 1.6, "lanczos")).toBeCloseTo(4);
    expect(resampleSpectrum(constant, Number.NaN, "lanczos")).toBe(4);
    const bars = buildSpectrumBars(frame, { height: 80, width: 100 }, { barGap: 2, barWidth: 10 });
    expect(bars).toHaveLength(5);
    expect(bars.every((bar) => bar.width === 10 && bar.height >= 0)).toBe(true);
    expect(
      buildSpectrumBars(frame, { height: 10, width: 3 }, { barGap: 20, barWidth: 20, padding: 0 }),
    ).toMatchObject([{ width: 3, x: 0 }]);
  });

  it("maps full and partial arcs with finite wraparound rotation", () => {
    const points = buildSpectrumRadialPoints(
      frame,
      { height: 200, width: 240 },
      { layout: "radial", padding: 10, radialArc: 360, radialDeadzone: 0.25, radialRotation: 630 },
    );
    expect(points.length).toBeGreaterThan(100);
    expect(points.every((point) => Object.values(point).every(Number.isFinite))).toBe(true);
    expect(points.at(-1)!.angle - points[0].angle).toBeCloseTo(Math.PI * 2, 8);
    expect(Math.cos(points[0].angle)).toBeCloseTo(Math.cos(points.at(-1)!.angle), 8);
    expect(Math.sin(points[0].angle)).toBeCloseTo(Math.sin(points.at(-1)!.angle), 8);
    expect(points[0].frequency).toBeLessThan(points.at(-1)!.frequency);

    const partial = buildSpectrumRadialBars(
      frame,
      { height: 120, width: 120 },
      { barGap: 3, barWidth: 5, radialArc: 180, radialRotation: 0 },
    );
    expect(partial.length).toBeGreaterThan(2);
    expect(partial[0].angle).toBeCloseTo(0);
    expect(partial.at(-1)!.angle).toBeCloseTo(Math.PI);
  });

  it("keeps zero arcs and deadzone/inversion extremes intentional", () => {
    expect(buildSpectrumRadialPoints(frame, { height: 100, width: 100 }, { radialArc: 0 })).toEqual(
      [],
    );
    const collapsed = buildSpectrumRadialPoints(
      frame,
      { height: 100, width: 100 },
      { padding: 0, radialDeadzone: 1 },
    );
    expect(collapsed.every((point) => point.radius === point.baselineRadius)).toBe(true);
    const outward = buildSpectrumRadialPoints(
      frame,
      { height: 100, width: 100 },
      { padding: 0, radialDeadzone: 0.2, radialInvert: false },
    );
    const inward = buildSpectrumRadialPoints(
      frame,
      { height: 100, width: 100 },
      { padding: 0, radialDeadzone: 0.2, radialInvert: true },
    );
    expect(outward[0].radius).toBeGreaterThan(outward[0].baselineRadius);
    expect(inward[0].radius).toBeLessThan(inward[0].baselineRadius);
  });
});
