import { describe, expect, it } from "vitest";
import { WaveformConfigError } from "../config";
import { createStaticWaveformFrame } from "../core/staticFrame";
import { mixChannels, selectTimeDomainChannels } from "./channels";

describe("time-domain channel selection", () => {
  const stereo = createStaticWaveformFrame([
    [-1, -0.5, 0.5, 1],
    [1, 0.5, -0.5, -1],
  ]);

  it("keeps source and stereo channel identity ordered", () => {
    expect(
      selectTimeDomainChannels(stereo, { channelMode: "source" }).sourceChannelIndices,
    ).toEqual([0, 1]);
    const selected = selectTimeDomainChannels(stereo, { channelMode: "stereo" });
    expect(selected.channels).toHaveLength(2);
    expect(Array.from(selected.channels[1])).toEqual([1, 0.5, -0.5, -1]);
  });

  it("mixes phase-inverted stereo without clipping or losing odd channel tails", () => {
    expect(Array.from(mixChannels(stereo.channels))).toEqual([0, 0, 0, 0]);
    expect(
      Array.from(mixChannels([Float32Array.from([1, -1, 0.5]), Float32Array.from([-1, 1])])),
    ).toEqual([0, 0, 0.5]);
  });

  it("selects one source channel and rejects unavailable stereo/index requests", () => {
    const selected = selectTimeDomainChannels(stereo, { channelIndex: 1, channelMode: "single" });
    expect(selected.sourceChannelIndices).toEqual([1]);
    expect(Array.from(selected.channels[0])).toEqual([1, 0.5, -0.5, -1]);

    const mono = createStaticWaveformFrame([0, 1]);
    expect(() => selectTimeDomainChannels(mono, { channelMode: "stereo" })).toThrowError(
      expect.objectContaining({ code: "STEREO_REQUIRES_TWO_CHANNELS" }),
    );
    expect(() =>
      selectTimeDomainChannels(stereo, { channelIndex: 4, channelMode: "single" }),
    ).toThrow(WaveformConfigError);
  });
});
