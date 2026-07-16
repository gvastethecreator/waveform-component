import { describe, expect, it } from "vitest";
import { createDemoWaveform, createStaticWaveformFrame } from "../core/staticFrame";
import { buildTimeDomainSegments } from "../core/waveformGeometry";
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import { renderSvgTimeDomain } from "./svgTimeDomain";

describe("renderSvgTimeDomain", () => {
  it("uses canonical geometry with stable grouped paths and played/unplayed intent", () => {
    const frame = createStaticWaveformFrame([
      createDemoWaveform({ sampleCount: 96 }),
      createDemoWaveform({ phase: 0.2, sampleCount: 96 }),
    ]);
    const viewport = { height: 120, width: 320 };
    const config = {
      channelLayout: "stacked" as const,
      channelMode: "source" as const,
      playbackProgress: 0.4,
    };
    const scene = renderSvgTimeDomain(frame, viewport, config, { idPrefix: "stable" });
    const canonical = buildTimeDomainSegments(frame, viewport, config);

    expect(scene.status).toBe("ready");
    expect(scene.sourcePointCount).toBe(canonical.length);
    expect(scene.renderedPointCount).toBe(canonical.length);
    expect(scene.nodes.map((node) => node.key)).toEqual([
      "time-background",
      "time-guides",
      "time-unplayed-channel-0-extrema",
      "time-unplayed-channel-0-continuity",
      "time-unplayed-channel-1-extrema",
      "time-unplayed-channel-1-continuity",
      "time-played-channel-0-extrema",
      "time-played-channel-0-continuity",
      "time-played-channel-1-extrema",
      "time-played-channel-1-continuity",
    ]);
    expect(new Set(scene.nodes.map((node) => node.key)).size).toBe(scene.nodeCount);
    expect(JSON.stringify(scene)).not.toMatch(/NaN|Infinity/);
  });

  it("bounds dense columns and exposes the degradation", () => {
    const frame = createStaticWaveformFrame([
      createDemoWaveform({ sampleCount: 8192 }),
      createDemoWaveform({ phase: 0.2, sampleCount: 8192 }),
    ]);
    const scene = renderSvgTimeDomain(frame, { height: 180, width: 4096 });

    expect(scene.sourcePointCount).toBeGreaterThan(
      SVG_RENDERER_CAPABILITIES.limits.maximumTimeDomainColumns,
    );
    expect(scene.renderedPointCount).toBeLessThanOrEqual(
      SVG_RENDERER_CAPABILITIES.limits.maximumTimeDomainColumns,
    );
    expect(scene.messages[0]).toMatch(/column budget/);
  });

  it("fails visibly when selected channels exceed the SVG capability", () => {
    const channels = Array.from({ length: 33 }, () => new Float32Array([0, 0.5, -0.5]));
    const frame = createStaticWaveformFrame(channels);
    const scene = renderSvgTimeDomain(frame, { height: 120, width: 320 });

    expect(scene.status).toBe("unsupported");
    expect(scene.messages[0]).toContain("at most 32 selected channels");
    expect(scene.nodes).toHaveLength(0);
  });
});
