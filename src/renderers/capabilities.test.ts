import { describe, expect, it } from "vitest";
import {
  CANVAS2D_RENDERER_CAPABILITIES,
  CORE_RENDERER_CATALOG,
  SVG_RENDERER_CAPABILITIES,
  getRendererSupport,
} from "./capabilities";

describe("renderer capabilities", () => {
  it("publishes immutable Canvas and SVG core contracts with distinct budgets", () => {
    expect(CORE_RENDERER_CATALOG.canvas2d).toBe(CANVAS2D_RENDERER_CAPABILITIES);
    expect(CORE_RENDERER_CATALOG.svg).toBe(SVG_RENDERER_CAPABILITIES);
    expect(SVG_RENDERER_CAPABILITIES.modes).toEqual([
      "waveform",
      "envelope",
      "spectrum",
      "meter",
      "stepped-meter",
    ]);
    expect(SVG_RENDERER_CAPABILITIES.semanticOverlays).toBe("shared-dom");
    expect(SVG_RENDERER_CAPABILITIES.supportsDenseRealtime).toBe(false);
    expect(SVG_RENDERER_CAPABILITIES.limits.maximumNodes).toBeGreaterThan(0);
    expect(Object.isFrozen(SVG_RENDERER_CAPABILITIES.limits)).toBe(true);
  });

  it("rejects frame/mode mismatches and reports SVG degradation instead of ignoring it", () => {
    expect(
      getRendererSupport("svg", {
        frameKind: "bands",
        mode: "spectrum",
        pointCount: 8192,
      }),
    ).toEqual({
      enabled: false,
      reasons: ["spectrum mode requires a spectrum frame, not bands."],
      warnings: ["SVG samples spectrum geometry to 512 points."],
    });
    expect(
      getRendererSupport("svg", {
        channelCount: 2,
        frameKind: "meter",
        historyCount: 64,
        mode: "stepped-meter",
      }),
    ).toEqual({
      enabled: true,
      reasons: [],
      warnings: ["SVG samples meter history to 16 layers."],
    });
  });
});
