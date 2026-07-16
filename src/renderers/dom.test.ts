import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { createSpectrumFrame } from "../analysis/spectrum";
import { createStaticWaveformFrame } from "../core/staticFrame";
import { DOM_RENDERER_ADAPTER, renderDomFrame } from "./dom";

describe("DOM/CSS renderer adapter", () => {
  it("routes supported canonical frames through one capability-bearing seam", () => {
    const spectrum = createSpectrumFrame(new Float32Array(16).fill(-24), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 48_000,
    });
    const spectrumScene = DOM_RENDERER_ADAPTER.render(
      { config: { geometry: "bars", renderer: "dom" }, frame: spectrum },
      { height: 100, width: 300 },
    );
    expect(DOM_RENDERER_ADAPTER.id).toBe("dom");
    expect(spectrumScene.status).toBe("ready");

    const meterScene = renderDomFrame(
      { config: { renderer: "dom" }, frame: analyzeMeter(new Float32Array([0.3, -0.4])) },
      { height: 100, width: 300 },
    );
    expect(meterScene.status).toBe("ready");
  });

  it("returns a bounded unsupported scene for time-domain curves", () => {
    const scene = renderDomFrame(
      { frame: createStaticWaveformFrame(new Float32Array([0, 0.5, -0.5])) },
      { height: 100, width: 300 },
    );
    expect(scene.status).toBe("unsupported");
    expect(scene.messages[0]).toContain("does not support waveform mode");
    expect(scene.nodeCount).toBe(0);
  });
});
