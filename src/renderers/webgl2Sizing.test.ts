import { describe, expect, it } from "vitest";
import {
  WEBGL2_MAX_DRAWING_BUFFER_DIMENSION,
  WEBGL2_MAX_DRAWING_BUFFER_PIXELS,
  resolveWebglDrawingBufferSize,
} from "./webgl2Sizing";

describe("WebGL2 drawing-buffer sizing", () => {
  it("maps named quality to actual bounded DPR", () => {
    expect(resolveWebglDrawingBufferSize(800, 400, 3, "low")).toMatchObject({
      bufferHeight: 400,
      bufferWidth: 800,
      degraded: true,
      effectivePixelRatio: 1,
    });
    expect(resolveWebglDrawingBufferSize(800, 400, 3, "balanced")).toMatchObject({
      bufferHeight: 600,
      bufferWidth: 1200,
      effectivePixelRatio: 1.5,
    });
    expect(resolveWebglDrawingBufferSize(800, 400, 3, "high")).toMatchObject({
      bufferHeight: 800,
      bufferWidth: 1600,
      effectivePixelRatio: 2,
    });
  });

  it("bounds hostile ultrawide pixel allocation while preserving aspect", () => {
    const size = resolveWebglDrawingBufferSize(20_000, 4_000, 4, "high");
    expect(size.bufferWidth).toBeLessThanOrEqual(WEBGL2_MAX_DRAWING_BUFFER_DIMENSION);
    expect(size.bufferHeight).toBeLessThanOrEqual(WEBGL2_MAX_DRAWING_BUFFER_DIMENSION);
    expect(size.bufferWidth * size.bufferHeight).toBeLessThanOrEqual(
      WEBGL2_MAX_DRAWING_BUFFER_PIXELS,
    );
    expect(size.bufferWidth / size.bufferHeight).toBeCloseTo(5, 1);
    expect(size.degraded).toBe(true);
  });

  it("recovers finite one-pixel backing storage from zero and invalid dimensions", () => {
    expect(resolveWebglDrawingBufferSize(Number.NaN, 0, Number.NaN, "balanced")).toMatchObject({
      bufferHeight: 1,
      bufferWidth: 1,
      cssHeight: 0,
      cssWidth: 0,
      effectivePixelRatio: 1,
    });
  });
});
