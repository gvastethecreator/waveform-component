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
    renderCanvasSpectrum(
      context,
      frame,
      { height: 80, width: 120 },
      { colorMode: "solid", geometry: "bars" },
    );
    expect(fillRect).toHaveBeenCalledOnce();
    expect(context.fill).toHaveBeenCalled();
    expect(context.stroke).toHaveBeenCalledTimes(1);
  });

  it("draws radial bars with finite grid arcs, rounded caps, and gradient roles", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasSpectrum(
      context,
      frame,
      { height: 160, width: 200 },
      {
        colorMode: "gradient",
        colorRoles: {
          base: { alpha: 0.4, color: "#0000ff" },
          crest: { alpha: 0.8, color: "#ff0000" },
        },
        geometry: "bars",
        gradientRatio: 2,
        layout: "radial",
        radialArc: 270,
        roundedCaps: true,
      },
    );

    expect(context.arc).toHaveBeenCalledTimes(3);
    expect(context.createRadialGradient).toHaveBeenCalledOnce();
    expect(context.lineCap).toBe("round");
    expect(vi.mocked(context.stroke).mock.calls.length).toBeGreaterThan(3);
  });

  it("uses line outlines and range-specific fills as distinct bar color modes", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasSpectrum(
      context,
      frame,
      { height: 80, width: 120 },
      {
        colorMode: "line",
        cornerRadius: 4,
        geometry: "bars",
        showGrid: false,
      },
    );
    expect(context.roundRect).toHaveBeenCalled();
    expect(context.fill).not.toHaveBeenCalled();

    vi.clearAllMocks();
    renderCanvasSpectrum(
      context,
      frame,
      { height: 80, width: 120 },
      {
        colorMode: "range",
        geometry: "bars",
        showGrid: false,
      },
    );
    expect(context.fill).toHaveBeenCalled();
  });

  it("switches transparent custom roles to system colors in forced-colors mode", () => {
    const media = vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasSpectrum(
      context,
      frame,
      { height: 80, width: 120 },
      {
        colorMode: "line",
        colorRoles: { base: { alpha: 0, color: "transparent" } },
        showGrid: false,
      },
    );
    expect(context.strokeStyle).toBe("CanvasText");
    media.mockRestore();
  });
});
