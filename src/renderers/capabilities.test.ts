import { describe, expect, it } from "vitest";
import {
  CANVAS2D_RENDERER_CAPABILITIES,
  CORE_RENDERER_CATALOG,
  DOM_RENDERER_CAPABILITIES,
  SVG_RENDERER_CAPABILITIES,
  getRendererSupport,
} from "./capabilities";

describe("renderer capabilities", () => {
  it("publishes immutable Canvas, SVG, and DOM/CSS contracts with distinct budgets", () => {
    expect(CORE_RENDERER_CATALOG.canvas2d).toBe(CANVAS2D_RENDERER_CAPABILITIES);
    expect(CORE_RENDERER_CATALOG.svg).toBe(SVG_RENDERER_CAPABILITIES);
    expect(CORE_RENDERER_CATALOG.dom).toBe(DOM_RENDERER_CAPABILITIES);
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
    expect(DOM_RENDERER_CAPABILITIES.modes).toEqual(["spectrum", "meter", "stepped-meter"]);
    expect(DOM_RENDERER_CAPABILITIES.layouts).toEqual(["rectangular"]);
    expect(DOM_RENDERER_CAPABILITIES.spectrumGeometries).toEqual(["bars"]);
    expect(DOM_RENDERER_CAPABILITIES.limits.maximumNodes).toBe(1024);
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

  it("explains unsupported DOM/CSS curves and radial layouts while reporting bounded sampling", () => {
    expect(
      getRendererSupport("dom", {
        frameKind: "spectrum",
        layout: "radial",
        mode: "spectrum",
        pointCount: 4096,
        spectrumGeometry: "curve",
      }),
    ).toEqual({
      enabled: false,
      reasons: [
        "DOM/CSS does not support radial layout.",
        "DOM/CSS does not support curve spectrum geometry.",
      ],
      warnings: ["DOM/CSS samples spectrum geometry to 256 points."],
    });
    expect(
      getRendererSupport("dom", {
        frameKind: "waveform",
        mode: "waveform",
        pointCount: 2048,
      }),
    ).toEqual({
      enabled: false,
      reasons: ["DOM/CSS does not support waveform mode."],
      warnings: [],
    });
  });
});
