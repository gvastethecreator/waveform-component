import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "../analysis/spectrum";
import { buildSpectrumPoints, buildSpectrumRadialBars } from "../core/spectrumGeometry";
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import { renderSvgSpectrum } from "./svgSpectrum";

const frame = createSpectrumFrame(
  Array.from({ length: 1024 }, (_, index) => -90 + (index / 1023) * 78),
  { fftSize: 2048, maximumDecibels: 0, minimumDecibels: -100, sampleRate: 48_000 },
);

describe("renderSvgSpectrum", () => {
  it("matches canonical rectangular intent and emits stable local gradient references", () => {
    const viewport = { height: 240, width: 420 };
    const config = { colorMode: "gradient" as const, geometry: "curve" as const };
    const scene = renderSvgSpectrum(frame, viewport, config, { idPrefix: "signal-a" });
    const canonical = buildSpectrumPoints(frame, viewport, config);

    expect(scene.status).toBe("ready");
    expect(scene.sourcePointCount).toBe(canonical.length);
    expect(scene.renderedPointCount).toBe(canonical.length);
    expect(scene.definitions).toHaveLength(1);
    expect(scene.definitions[0].id).toBe("signal-a-spectrum-gradient");
    expect(
      scene.nodes.some(
        (node) => "fill" in node && node.fill === "url(#signal-a-spectrum-gradient)",
      ),
    ).toBe(true);
    expect(new Set(scene.nodes.map((node) => node.key)).size).toBe(scene.nodeCount);
    expect(JSON.stringify(scene)).not.toMatch(/NaN|Infinity/);
  });

  it("bounds dense radial bars while retaining canonical endpoints and capability copy", () => {
    const viewport = { height: 1200, width: 1200 };
    const config = {
      barGap: 0,
      barWidth: 1,
      colorMode: "range" as const,
      geometry: "bars" as const,
      layout: "radial" as const,
      radialArc: 300,
    };
    const canonical = buildSpectrumRadialBars(frame, viewport, config);
    const scene = renderSvgSpectrum(frame, viewport, config, { idPrefix: "radial" });

    expect(canonical.length).toBeGreaterThan(
      SVG_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints,
    );
    expect(scene.sourcePointCount).toBe(canonical.length);
    expect(scene.renderedPointCount).toBe(SVG_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints);
    expect(scene.messages[0]).toContain("512-point budget");
    expect(scene.nodes.filter((node) => node.key.startsWith("spectrum-radial-bar-"))).toHaveLength(
      SVG_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints,
    );
  });

  it("uses system roles in forced colors and renders a zero arc without signal nodes", () => {
    const forced = renderSvgSpectrum(
      frame,
      { height: 200, width: 320 },
      { colorMode: "range", geometry: "bars" },
      { forcedColors: true, idPrefix: "forced" },
    );
    const emptyArc = renderSvgSpectrum(
      frame,
      { height: 200, width: 320 },
      { geometry: "curve", layout: "radial", radialArc: 0, showGrid: false },
      { idPrefix: "empty" },
    );

    expect(forced.nodes.some((node) => "fill" in node && node.fill === "Canvas")).toBe(true);
    expect(
      forced.nodes.some(
        (node) =>
          "fill" in node && ["CanvasText", "GrayText", "Highlight"].includes(node.fill ?? ""),
      ),
    ).toBe(true);
    expect(emptyArc.nodes.map((node) => node.key)).toEqual(["spectrum-background"]);
  });
});
