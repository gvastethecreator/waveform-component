import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "../analysis/spectrum";
import { renderDomSpectrum } from "./domSpectrum";

function spectrum(binCount = 4096) {
  return createSpectrumFrame(
    Float32Array.from({ length: binCount }, (_, index) => -90 + (index / binCount) * 84),
    {
      fftSize: binCount * 2,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 48_000,
    },
  );
}

describe("DOM/CSS spectrum renderer", () => {
  it("renders bounded rectangular bars, keeps CSS roles, and reports density reduction", () => {
    const scene = renderDomSpectrum(
      spectrum(),
      { height: 240, width: 20_000 },
      {
        barGap: 0,
        barWidth: 1,
        colorMode: "gradient",
        colorRoles: { base: { alpha: 0.8, color: "var(--signal-base)" } },
        geometry: "bars",
        layout: "rectangular",
        renderer: "dom",
        showGrid: true,
      },
    );
    expect(scene.status).toBe("ready");
    expect(scene.sourcePointCount).toBeGreaterThan(256);
    expect(scene.renderedPointCount).toBe(256);
    expect(scene.nodeCount).toBe(259);
    expect(scene.messages.join(" ")).toContain("256");
    expect(scene.nodes.filter((node) => node.role === "spectrum-bar")).toHaveLength(256);
    expect(scene.nodes.some((node) => node.background?.includes("var(--signal-base)"))).toBe(true);
    expect(Object.isFrozen(scene.nodes)).toBe(true);
  });

  it("rejects curves and radial layouts with exact visible reasons", () => {
    const curve = renderDomSpectrum(
      spectrum(16),
      { height: 100, width: 200 },
      {
        geometry: "curve",
        renderer: "dom",
      },
    );
    expect(curve.status).toBe("unsupported");
    expect(curve.messages[0]).toBe("DOM/CSS does not support curve spectrum geometry.");

    const radial = renderDomSpectrum(
      spectrum(16),
      { height: 100, width: 200 },
      {
        geometry: "bars",
        layout: "radial",
        renderer: "dom",
      },
    );
    expect(radial.status).toBe("unsupported");
    expect(radial.messages[0]).toBe("DOM/CSS does not support radial layout.");
  });

  it("uses system colors under forced-colors policy", () => {
    const scene = renderDomSpectrum(
      spectrum(16),
      { height: 100, width: 200 },
      { colorMode: "solid", geometry: "bars", renderer: "dom", showGrid: false },
      { forcedColors: true },
    );
    expect(scene.background).toBe("Canvas");
    expect(scene.nodes.every((node) => node.background === "CanvasText")).toBe(true);
  });
});
