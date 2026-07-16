import { describe, expect, it } from "vitest";
import { analyzeMeter } from "./meter";
import {
  createMeterDynamicsProcessor,
  meterHistoryCapacity,
  resolveMeterDynamicsConfig,
} from "./meterDynamics";

const silence = analyzeMeter(new Float32Array(64), { minimumDecibels: -100 });
const full = analyzeMeter(new Float32Array(64).fill(1), { minimumDecibels: -100 });

describe("meter dynamics and bounded history", () => {
  it("keeps attack/release response stable across frame cadences", () => {
    const valueAt = (cadence: number) => {
      const processor = createMeterDynamicsProcessor();
      processor.process(silence, { attackMs: 300, fastPeaks: false }, { timestampMs: 0 });
      let result = processor.process(
        silence,
        { attackMs: 300, fastPeaks: false },
        {
          timestampMs: 0,
        },
      );
      for (let index = 1; index <= cadence; index += 1)
        result = processor.process(
          full,
          { attackMs: 300, fastPeaks: false },
          { timestampMs: (index * 1000) / cadence },
        );
      return result.frame.channels[0].linearRms;
    };
    expect(valueAt(30)).toBeCloseTo(valueAt(120), 5);
    expect(valueAt(60)).toBeCloseTo(1 - Math.exp(-1 / 0.3), 4);
  });

  it("lets peak rise immediately while RMS retains configured attack", () => {
    const processor = createMeterDynamicsProcessor();
    processor.process(silence, { attackMs: 1000, fastPeaks: true }, { timestampMs: 0 });
    const result = processor.process(
      full,
      { attackMs: 1000, fastPeaks: true },
      { timestampMs: 10 },
    );
    expect(result.frame.channels[0].linearPeak).toBe(1);
    expect(result.frame.channels[0].linearRms).toBeLessThan(0.02);
    expect(result.peaking).toBe(true);
  });

  it("follows a decay monotonically without conflating peak and RMS", () => {
    const processor = createMeterDynamicsProcessor();
    const levels = [1, 0.5, 0.25, 0.125].map((level) =>
      analyzeMeter(
        Float32Array.from(
          { length: 64 },
          (_, index) => Math.sin((index / 64) * Math.PI * 2) * level,
        ),
        { minimumDecibels: -100 },
      ),
    );
    const output = levels.map((frame, index) =>
      processor.process(
        frame,
        { attackMs: 0, fastPeaks: false, releaseMs: 100 },
        { timestampMs: index * 100 },
      ),
    );
    expect(output.map((result) => result.frame.channels[0].linearRms)).toEqual(
      [...output]
        .map((result) => result.frame.channels[0].linearRms)
        .sort((left, right) => right - left),
    );
    expect(output.at(-1)!.frame.channels[0].linearRms).toBeGreaterThan(0.125);
    expect(output.at(-1)!.frame.channels[0].linearPeak).toBeGreaterThan(
      output.at(-1)!.frame.channels[0].linearRms,
    );
    expect(output.every((result) => Number.isFinite(result.frame.channels[0].rmsDbfs))).toBe(true);
  });

  it("bounds history by duration, interval, and a hard entry ceiling", () => {
    const processor = createMeterDynamicsProcessor();
    const config = {
      historyDurationMs: 100,
      historyIntervalMs: 10,
      maximumHistoryEntries: 5,
    };
    let result = processor.process(full, config, { timestampMs: 0 });
    for (let index = 1; index <= 30; index += 1)
      result = processor.process(full, config, { timestampMs: index * 10 });
    expect(result.historyCapacity).toBe(5);
    expect(result.history).toHaveLength(5);
    expect(result.history[0].timestampMs).toBeGreaterThanOrEqual(200);
    expect(meterHistoryCapacity(resolveMeterDynamicsConfig(config))).toBe(5);
  });

  it("resets stale history on source epoch, channel, and backwards-time replacement", () => {
    const processor = createMeterDynamicsProcessor();
    processor.process(full, undefined, { sourceEpoch: 1, timestampMs: 100 });
    const epoch = processor.process(full, undefined, { sourceEpoch: 2, timestampMs: 110 });
    expect(epoch.resetOccurred).toBe(true);
    expect(epoch.history).toHaveLength(1);
    const stereo = analyzeMeter([new Float32Array([1]), new Float32Array([0.5])]);
    const channels = processor.process(stereo, undefined, { sourceEpoch: 2, timestampMs: 120 });
    expect(channels.resetOccurred).toBe(true);
    const backwards = processor.process(stereo, undefined, { sourceEpoch: 2, timestampMs: 10 });
    expect(backwards.resetOccurred).toBe(true);
    expect(backwards.history).toHaveLength(1);
  });
});
