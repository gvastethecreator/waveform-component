import { describe, expect, it } from "vitest";
import { DEFAULT_WAVEFORM_CONFIG, resolveWaveformConfig } from "./config";

describe("resolveWaveformConfig", () => {
  it("returns a complete public default contract", () => {
    expect(resolveWaveformConfig(undefined)).toEqual(DEFAULT_WAVEFORM_CONFIG);
  });

  it("clamps numeric boundaries and repairs non-finite values", () => {
    expect(
      resolveWaveformConfig({ amplitude: 50, channelGap: -2, lineWidth: Number.NaN, padding: 500 }),
    ).toMatchObject({
      amplitude: 2,
      channelGap: 0,
      lineWidth: DEFAULT_WAVEFORM_CONFIG.lineWidth,
      padding: 160,
    });
  });
});
