import { describe, expect, it, vi } from "vitest";
import { createSpectrumFrame } from "../analysis/spectrum";
import { renderCanvasSpectrum } from "./canvasSpectrum";

const frame = createSpectrumFrame(new Float32Array(16).fill(-40), {
  fftSize: 32,
  maximumDecibels: 0,
  minimumDecibels: -100,
  sampleRate: 32_000,
});

describe("renderCanvasSpectrum", () => {
  it("draws a bounded curve and grid", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasSpectrum(context, frame, { height: 80, width: 120 }, { geometry: "curve" });
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 120, 80);
    expect(context.stroke).toHaveBeenCalledTimes(2);
    expect(context.lineTo).toHaveBeenCalled();
  });

  it("draws bars without a curve stroke", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const fillRect = vi.mocked(context.fillRect);
    renderCanvasSpectrum(context, frame, { height: 80, width: 120 }, { geometry: "bars" });
    expect(fillRect.mock.calls.length).toBeGreaterThan(2);
    expect(context.stroke).toHaveBeenCalledTimes(1);
  });
});
