import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { createSpectrumFrame } from "../analysis/spectrum";
import { createStaticWaveformFrame } from "../core/staticFrame";
import { SVG_RENDERER_ADAPTER, renderSvgFrame } from "./svg";

describe("SVG renderer adapter", () => {
  it("routes canonical frame kinds through one capability-bearing seam", () => {
    const viewport = { height: 120, width: 320 };
    const waveform = createStaticWaveformFrame(new Float32Array([0, 0.5, -0.5]));
    const spectrum = createSpectrumFrame(new Float32Array(16).fill(-24), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 48_000,
    });
    const meter = analyzeMeter(new Float32Array([0.2, -0.8, 0.4]));

    expect(SVG_RENDERER_ADAPTER.id).toBe("svg");
    expect(SVG_RENDERER_ADAPTER.capabilities.modes).toContain("spectrum");
    expect(renderSvgFrame({ frame: waveform }, viewport).status).toBe("ready");
    expect(SVG_RENDERER_ADAPTER.render({ frame: spectrum }, viewport).status).toBe("ready");
    expect(SVG_RENDERER_ADAPTER.render({ frame: meter, history: [] }, viewport).status).toBe(
      "ready",
    );
  });
});
