import { describe, expect, it } from "vitest";
import {
  createDemoWaveform,
  createEnvelopeFrameFromWaveform,
  createStaticEnvelopeFrame,
  createStaticWaveformFrame,
} from "./staticFrame";
import { WaveformInputError } from "../types";

describe("createStaticWaveformFrame", () => {
  it("preserves signed normalized samples and copies caller data", () => {
    const input = new Float32Array([-1, -0.25, 0, 0.5, 1]);
    const frame = createStaticWaveformFrame(input, { duration: 2, sampleRate: 48_000 });
    input[0] = 0;

    expect(frame).toMatchObject({
      kind: "waveform",
      state: "ready",
      sampleCount: 5,
      duration: 2,
      sampleRate: 48_000,
    });
    expect(Array.from(frame.channels[0])).toEqual([-1, -0.25, 0, 0.5, 1]);
  });

  it("retains explicit channels and reports the longest channel", () => {
    const frame = createStaticWaveformFrame([
      [-1, 0, 1],
      [0.5, -0.5],
    ]);

    expect(frame.channels).toHaveLength(2);
    expect(frame.sampleCount).toBe(3);
  });

  it("represents empty input without inventing a sample", () => {
    const frame = createStaticWaveformFrame([]);
    expect(frame.state).toBe("empty");
    expect(frame.sampleCount).toBe(0);
    expect(frame.channels).toHaveLength(1);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1.01, 1.01])(
    "rejects invalid normalized sample %s",
    (sample) => {
      expect(() => createStaticWaveformFrame([sample])).toThrow(WaveformInputError);
    },
  );
});

describe("createDemoWaveform", () => {
  it("is deterministic for the same options and responds to phase", () => {
    const first = createDemoWaveform({ phase: 0.2, sampleCount: 128 });
    const second = createDemoWaveform({ phase: 0.2, sampleCount: 128 });
    const shifted = createDemoWaveform({ phase: 0.4, sampleCount: 128 });

    expect(Array.from(first)).toEqual(Array.from(second));
    expect(Array.from(first)).not.toEqual(Array.from(shifted));
    expect(first).toHaveLength(128);
    expect(Math.max(...first)).toBeLessThanOrEqual(1);
    expect(Math.min(...first)).toBeGreaterThanOrEqual(-1);
  });
});

describe("static envelope frames", () => {
  it("keeps magnitude separate from signed waveform polarity", () => {
    const waveform = createStaticWaveformFrame([-1, -0.25, 0, 0.5, 1], {
      duration: 1,
      sampleRate: 48_000,
    });
    const envelope = createEnvelopeFrameFromWaveform(waveform);

    expect(envelope).toMatchObject({
      duration: 1,
      kind: "envelope",
      sampleRate: 48_000,
      state: "ready",
    });
    expect(Array.from(envelope.channels[0])).toEqual([1, 0.25, 0, 0.5, 1]);
  });

  it("rejects signed or over-range envelope magnitudes", () => {
    expect(() => createStaticEnvelopeFrame([-0.01, 0.5])).toThrow(WaveformInputError);
    expect(() => createStaticEnvelopeFrame([0.5, 1.01])).toThrow(WaveformInputError);
  });
});
