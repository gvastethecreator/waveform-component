import { describe, expect, it } from "vitest";
import { analyzeMeter, analyzeMeterWindows, linearAmplitudeToDbfs } from "./meter";

describe("meter analysis", () => {
  it("keeps RMS and peak distinct for steady and transient signals", () => {
    const steady = analyzeMeter(new Float32Array([0.5, 0.5, 0.5, 0.5]));
    expect(steady.channels[0]).toMatchObject({ linearPeak: 0.5, linearRms: 0.5 });
    expect(steady.channels[0].peakDbfs).toBeCloseTo(-6.0206, 3);
    expect(steady.channels[0].rmsDbfs).toBeCloseTo(-6.0206, 3);

    const impulse = analyzeMeter(new Float32Array([1, 0, 0, 0]));
    expect(impulse.channels[0].linearPeak).toBe(1);
    expect(impulse.channels[0].linearRms).toBe(0.5);
    expect(impulse.channels[0].peakDbfs).toBe(0);
    expect(impulse.channels[0].rmsDbfs).toBeCloseTo(-6.0206, 3);
  });

  it("matches full-scale sine RMS and a literal silence floor", () => {
    const sine = Float32Array.from({ length: 64 }, (_, index) =>
      Math.sin((index * Math.PI * 2) / 64),
    );
    const frame = analyzeMeter(sine, { minimumDecibels: -96, sampleRate: 48_000 });
    expect(frame.channels[0].linearPeak).toBeCloseTo(1, 6);
    expect(frame.channels[0].linearRms).toBeCloseTo(Math.SQRT1_2, 6);
    expect(frame.channels[0].rmsDbfs).toBeCloseTo(-3.0103, 3);
    expect(analyzeMeter(new Float32Array(8), { minimumDecibels: -96 }).channels[0]).toMatchObject({
      peakDbfs: -96,
      rmsDbfs: -96,
    });
    expect(linearAmplitudeToDbfs(0, -80)).toBe(-80);
  });

  it("preserves stereo identity and makes mono phase cancellation explicit", () => {
    const left = new Float32Array([1, -1, 1, -1]);
    const right = new Float32Array([-1, 1, -1, 1]);
    const stereo = analyzeMeter([left, right], { channelMode: "stereo" });
    expect(stereo.channels).toHaveLength(2);
    expect(stereo.channels.map((channel) => channel.sourceChannelIndex)).toEqual([0, 1]);
    const mono = analyzeMeter([left, right], { channelMode: "mono" });
    expect(mono.channels[0]).toMatchObject({ linearPeak: 0, linearRms: 0, sourceChannelIndex: -1 });
  });

  it("windows uneven input without leaking samples across boundaries", () => {
    const windows = analyzeMeterWindows(new Float32Array([1, 0, 0, 0, 0.5]), {
      windowSize: 4,
    });
    expect(windows).toHaveLength(2);
    expect(windows[0].channels[0].linearRms).toBe(0.5);
    expect(windows[1].sampleCount).toBe(1);
    expect(windows[1].channels[0].linearRms).toBe(0.5);
  });
});
