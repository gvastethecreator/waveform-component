import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { buildMeterArcSegments, buildMeterRects } from "../core/meterGeometry";
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import { renderSvgMeter } from "./svgMeter";

const frame = analyzeMeter([
  new Float32Array([0.1, 0.25, -0.5, 0.8]),
  new Float32Array([0.05, -0.2, 0.4, -0.6]),
]);

describe("renderSvgMeter", () => {
  it("uses canonical rectangular geometry and one stable gradient definition", () => {
    const viewport = { height: 120, width: 360 };
    const config = { colorMode: "gradient" as const, orientation: "horizontal" as const };
    const scene = renderSvgMeter(frame, viewport, config, [], { idPrefix: "meter-a" });
    const canonical = buildMeterRects(frame, viewport, config);

    expect(scene.status).toBe("ready");
    expect(scene.definitions.map((definition) => definition.id)).toEqual([
      "meter-a-meter-gradient",
    ]);
    expect(scene.nodes.filter((node) => node.key.startsWith("current-meter-"))).toHaveLength(
      canonical.length,
    );
    expect(new Set(scene.nodes.map((node) => node.key)).size).toBe(scene.nodeCount);
    expect(JSON.stringify(scene)).not.toMatch(/NaN|Infinity/);
  });

  it("samples history to the public SVG layer budget and keeps keys unique", () => {
    const history = Array.from({ length: 40 }, (_, index) => ({ frame, timestampMs: index * 16 }));
    const scene = renderSvgMeter(
      frame,
      { height: 120, width: 360 },
      { colorMode: "solid", showHistory: true },
      history,
      { idPrefix: "history" },
    );

    expect(scene.messages[0]).toContain(
      `${SVG_RENDERER_CAPABILITIES.limits.maximumHistoryLayers}-layer budget`,
    );
    expect(
      new Set(
        scene.nodes
          .map((node) => /^history-(\d+)-/.exec(node.key)?.[1])
          .filter((value): value is string => Boolean(value)),
      ).size,
    ).toBe(SVG_RENDERER_CAPABILITIES.limits.maximumHistoryLayers);
    expect(new Set(scene.nodes.map((node) => node.key)).size).toBe(scene.nodeCount);
  });

  it("keeps radial stepped geometry distinct and fails visibly above the channel limit", () => {
    const config = {
      layout: "radial" as const,
      mode: "stepped-meter" as const,
      radialArc: 270,
      roundedCaps: true,
    };
    const viewport = { height: 320, width: 320 };
    const canonical = buildMeterArcSegments(frame, viewport, config);
    const scene = renderSvgMeter(frame, viewport, config, [], { idPrefix: "steps" });
    expect(scene.nodes.filter((node) => node.key.startsWith("current-arc-segment-"))).toHaveLength(
      canonical.filter((segment) => segment.active).length,
    );

    const tooManyChannels = {
      ...frame,
      channels: Array.from({ length: 33 }, () => frame.channels[0]),
    };
    const unsupported = renderSvgMeter(tooManyChannels, viewport);
    expect(unsupported.status).toBe("unsupported");
    expect(unsupported.messages[0]).toContain("at most 32 meter channels");
  });

  it("rejects an excessive stepped shape count instead of growing the DOM without bound", () => {
    const scene = renderSvgMeter(
      frame,
      { height: 120, width: 6000 },
      {
        mode: "stepped-meter",
        showHistory: false,
        stepGap: 0,
        stepWidth: 1,
      },
    );

    expect(scene.status).toBe("unsupported");
    expect(scene.messages[0]).toMatch(/node budget exceeded.*use Canvas 2D/i);
    expect(scene.nodeCount).toBe(0);
  });
});
