import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import type { MeterHistoryPoint } from "../types";
import { renderDomMeter } from "./domMeter";

const frame = analyzeMeter([
  new Float32Array([0.1, -0.8, 0.3]),
  new Float32Array([0.2, -0.5, 0.1]),
]);
const history: readonly MeterHistoryPoint[] = Array.from({ length: 12 }, (_, index) => ({
  frame,
  timestampMs: index * 16,
}));

describe("DOM/CSS meter renderer", () => {
  it("renders continuous meters and four bounded history layers", () => {
    const scene = renderDomMeter(
      frame,
      { height: 120, width: 400 },
      { layout: "rectangular", mode: "meter", renderer: "dom", showHistory: true },
      history,
    );
    expect(scene.status).toBe("ready");
    expect(scene.nodes.filter((node) => node.role === "track")).toHaveLength(2);
    expect(scene.nodes.filter((node) => node.role === "meter")).toHaveLength(2);
    expect(scene.nodes.filter((node) => node.role === "history")).toHaveLength(8);
    expect(scene.messages).toEqual(["DOM/CSS samples meter history to 4 layers."]);
    expect(scene.nodeCount).toBe(12);
  });

  it("renders stepped bars within budget and rejects an excessive step density before building it", () => {
    const bounded = renderDomMeter(
      frame,
      { height: 120, width: 600 },
      {
        layout: "rectangular",
        mode: "stepped-meter",
        renderer: "dom",
        showHistory: false,
        stepGap: 3,
        stepWidth: 8,
      },
    );
    expect(bounded.status).toBe("ready");
    expect(bounded.nodeCount).toBeLessThanOrEqual(1024);
    expect(bounded.nodes.some((node) => node.role === "step")).toBe(true);

    const excessive = renderDomMeter(
      frame,
      { height: 120, width: 20_000 },
      {
        layout: "rectangular",
        mode: "stepped-meter",
        renderer: "dom",
        showHistory: true,
        stepGap: 0,
        stepWidth: 1,
      },
      history,
    );
    expect(excessive.status).toBe("unsupported");
    expect(excessive.nodeCount).toBe(0);
    expect(excessive.messages[0]).toContain("node budget exceeded");
  });

  it("rejects radial meters rather than approximating them silently", () => {
    const scene = renderDomMeter(
      frame,
      { height: 120, width: 200 },
      {
        layout: "radial",
        renderer: "dom",
      },
    );
    expect(scene.status).toBe("unsupported");
    expect(scene.messages[0]).toBe("DOM/CSS does not support radial layout.");
  });
});
