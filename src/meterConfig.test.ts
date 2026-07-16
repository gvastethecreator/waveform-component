import { describe, expect, it } from "vitest";
import { analyzeMeter } from "./analysis/meter";
import { DEFAULT_METER_CONFIG, resolveMeterConfig } from "./meterConfig";

describe("meter config", () => {
  it("exposes production defaults for a continuous RMS meter", () => {
    expect(DEFAULT_METER_CONFIG).toMatchObject({
      colorMode: "gradient",
      layout: "rectangular",
      measurement: "rms",
      mode: "meter",
      renderer: "canvas2d",
      showHistory: true,
    });
  });

  it("inherits frame range and normalizes thresholds and finite geometry", () => {
    const frame = analyzeMeter(new Float32Array([0.5]), { minimumDecibels: -90 });
    const resolved = resolveMeterConfig(
      {
        barWidth: Number.POSITIVE_INFINITY,
        colorRoles: { base: { alpha: 2, color: "  #fff  " } },
        crestDecibels: -70,
        middleDecibels: -10,
        peakThresholdDb: -80,
        radialRotation: -90,
        reactThresholdDb: -20,
        stepGap: -1,
      },
      frame,
    );
    expect(resolved).toMatchObject({
      barWidth: DEFAULT_METER_CONFIG.barWidth,
      crestDecibels: -10,
      middleDecibels: -70,
      maximumDecibels: 0,
      minimumDecibels: -90,
      peakThresholdDb: -20,
      radialRotation: 270,
      reactThresholdDb: -80,
      stepGap: 0,
    });
    expect(resolved.colorRoles.base).toEqual({ alpha: 1, color: "#fff" });
    expect(resolveMeterConfig({ renderer: "svg" }).renderer).toBe("svg");
    expect(resolveMeterConfig({ renderer: "dom" }).renderer).toBe("dom");
  });
});
