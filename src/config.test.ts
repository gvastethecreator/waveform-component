import { describe, expect, it } from "vitest";
import { DEFAULT_ENVELOPE_CONFIG, DEFAULT_WAVEFORM_CONFIG, resolveWaveformConfig } from "./config";

describe("resolveWaveformConfig", () => {
  it("returns a complete public default contract", () => {
    expect(resolveWaveformConfig(undefined)).toEqual(DEFAULT_WAVEFORM_CONFIG);
    expect(resolveWaveformConfig({ orientation: undefined })).toEqual(DEFAULT_WAVEFORM_CONFIG);
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

  it("resolves discriminated waveform, envelope, and single-channel contracts", () => {
    expect(resolveWaveformConfig({ mode: "envelope" })).toEqual(DEFAULT_ENVELOPE_CONFIG);
    expect(resolveWaveformConfig({ channelIndex: 3, channelMode: "single" })).toMatchObject({
      channelIndex: 3,
      channelMode: "single",
      mode: "waveform",
    });
    const colors = ["#00ffff", "#ffff00"];
    const resolved = resolveWaveformConfig({ channelColors: colors });
    colors[0] = "#000000";
    expect(resolved.channelColors).toEqual(["#00ffff", "#ffff00"]);
  });

  it("rejects invalid mode, placement, orientation, and incomplete selection", () => {
    expect(() =>
      resolveWaveformConfig({ amplitudePlacement: "centered", mode: "envelope" } as never),
    ).toThrowError(expect.objectContaining({ code: "INVALID_AMPLITUDE_PLACEMENT" }));
    expect(() => resolveWaveformConfig({ channelMode: "single" } as never)).toThrowError(
      expect.objectContaining({ code: "INVALID_CHANNEL_INDEX" }),
    );
    expect(() => resolveWaveformConfig({ orientation: "diagonal" } as never)).toThrowError(
      expect.objectContaining({ code: "INVALID_ORIENTATION" }),
    );
  });
});
