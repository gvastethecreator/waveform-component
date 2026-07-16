import { describe, expect, it, vi } from "vitest";
import { createStaticWaveformFrame } from "../core/staticFrame";
import { renderCanvasWaveform, syncCanvasSize } from "./canvas2d";

describe("syncCanvasSize", () => {
  it("sets absolute DPR transform instead of accumulating scale", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const setTransform = vi.mocked(context.setTransform);

    syncCanvasSize(canvas, 200, 80, 2);
    syncCanvasSize(canvas, 200, 80, 2);

    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(160);
    expect(setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0);
  });
});

describe("renderCanvasWaveform", () => {
  it("clears, paints, and strokes a ready frame", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const frame = createStaticWaveformFrame([-1, -0.5, 0, 0.5, 1]);

    renderCanvasWaveform(context, frame, { width: 120, height: 60 });

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 120, 60);
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 120, 60);
    expect(context.stroke).toHaveBeenCalledTimes(3);
  });

  it("draws played and unplayed waveform paths from one canonical frame", () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const frame = createStaticWaveformFrame([-1, -0.5, 0, 0.5, 1]);

    renderCanvasWaveform(
      context,
      frame,
      { width: 120, height: 60 },
      { playbackProgress: 0.5, playedColor: "#ffffff" },
    );

    expect(context.stroke).toHaveBeenCalledTimes(5);
    expect(context.strokeStyle).toBe("#ffffff");
  });
});
