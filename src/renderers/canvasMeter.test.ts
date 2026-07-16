import { describe, expect, it, vi } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { renderCanvasMeter } from "./canvasMeter";

const stereo = analyzeMeter([
  new Float32Array([1, 0, 0, 0]),
  new Float32Array([0.25, 0.25, 0.25, 0.25]),
]);

describe("renderCanvasMeter", () => {
  it("draws rounded continuous tracks, values, and bounded history ghosts", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const history = Array.from({ length: 200 }, (_, timestampMs) => ({
      frame: stereo,
      timestampMs,
    }));
    renderCanvasMeter(
      context,
      stereo,
      { height: 100, width: 240 },
      { colorMode: "gradient", roundedCaps: true },
      history,
    );
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 240, 100);
    expect(context.createLinearGradient).toHaveBeenCalled();
    expect(context.roundRect).toHaveBeenCalled();
    expect(vi.mocked(context.fill).mock.calls.length).toBeLessThan(300);
  });

  it("renders stepped inactive tracks separately from active range colors", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasMeter(
      context,
      stereo,
      { height: 100, width: 240 },
      {
        colorMode: "range",
        minimumDecibels: -60,
        mode: "stepped-meter",
        showHistory: false,
      },
    );
    expect(context.fill).toHaveBeenCalled();
    expect(context.createLinearGradient).not.toHaveBeenCalled();
  });

  it("draws radial continuous and stepped arcs with invert direction", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasMeter(
      context,
      stereo,
      { height: 200, width: 240 },
      {
        layout: "radial",
        radialArc: 270,
        radialInvert: true,
        roundedCaps: true,
        showHistory: false,
      },
    );
    expect(context.arc).toHaveBeenCalled();
    expect(context.lineCap).toBe("round");
    expect(context.stroke).toHaveBeenCalled();

    vi.clearAllMocks();
    renderCanvasMeter(
      context,
      stereo,
      { height: 200, width: 240 },
      {
        layout: "radial",
        mode: "stepped-meter",
        showHistory: false,
      },
    );
    expect(vi.mocked(context.arc).mock.calls.length).toBeGreaterThan(10);
  });

  it("uses system colors when forced colors are active", () => {
    const media = vi
      .spyOn(window, "matchMedia")
      .mockReturnValue({ matches: true } as MediaQueryList);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    renderCanvasMeter(
      context,
      stereo,
      { height: 100, width: 240 },
      {
        colorMode: "solid",
        colorRoles: { base: { alpha: 0, color: "transparent" } },
        showHistory: false,
      },
    );
    expect(context.fillStyle).toBe("CanvasText");
    media.mockRestore();
  });
});
