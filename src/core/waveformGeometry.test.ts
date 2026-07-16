import { describe, expect, it } from "vitest";
import { WaveformConfigError } from "../config";
import { createStaticEnvelopeFrame, createStaticWaveformFrame } from "./staticFrame";
import { buildTimeDomainSegments, buildWaveformColumns } from "./waveformGeometry";

describe("time-domain geometry", () => {
  it("maps signed polarity around the centered waveform baseline", () => {
    const frame = createStaticWaveformFrame([-1, 1]);
    const columns = buildWaveformColumns(frame, { width: 100, height: 60 }, { padding: 10 });

    expect(columns).toHaveLength(2);
    expect(columns[0].y1).toBeGreaterThan(columns[0].centerY);
    expect(columns[1].y1).toBeLessThan(columns[1].centerY);
  });

  it("preserves channel identity in stacked, split, and overlay layouts", () => {
    const frame = createStaticWaveformFrame([
      [-1, 1, -1, 1],
      [1, -1, 1, -1],
    ]);
    const stacked = buildWaveformColumns(
      frame,
      { width: 160, height: 100 },
      { channelGap: 10, channelLayout: "stacked", channelMode: "source", padding: 10 },
    );
    const split = buildWaveformColumns(
      frame,
      { width: 160, height: 100 },
      { channelGap: 10, channelLayout: "split", channelMode: "stereo", padding: 10 },
    );
    const overlay = buildWaveformColumns(
      frame,
      { width: 160, height: 100 },
      { channelLayout: "overlay", channelMode: "source", padding: 10 },
    );

    expect(new Set(stacked.map((column) => column.centerY))).toHaveLength(2);
    expect(new Set(split.map((column) => column.centerY))).toHaveLength(1);
    const firstSplitX = split
      .filter((column) => column.channelIndex === 0)
      .map((column) => column.x1);
    const secondSplitX = split
      .filter((column) => column.channelIndex === 1)
      .map((column) => column.x1);
    expect(Math.max(...firstSplitX)).toBeLessThan(Math.min(...secondSplitX));
    expect(new Set(overlay.map((column) => column.centerY))).toHaveLength(1);
    expect(new Set(overlay.map((column) => column.channelIndex))).toEqual(new Set([0, 1]));
    expect(new Set(overlay.map((column) => column.sourceChannelIndex))).toEqual(new Set([0, 1]));
  });

  it("keeps positive-only and negative-only waveform placement explicit", () => {
    const frame = createStaticWaveformFrame([-1, 1]);
    const positive = buildWaveformColumns(
      frame,
      { width: 100, height: 60 },
      { amplitudePlacement: "positive-only" },
    );
    const negative = buildWaveformColumns(
      frame,
      { width: 100, height: 60 },
      { amplitudePlacement: "negative-only" },
    );

    expect(positive[0].y1).toBe(positive[0].centerY);
    expect(positive[1].y1).toBeLessThan(positive[1].centerY);
    expect(negative[0].y2).toBeGreaterThan(negative[0].centerY);
    expect(negative[1].y1).toBe(negative[1].centerY);
  });

  it("renders magnitude envelopes from a baseline or mirrored center without signed samples", () => {
    const frame = createStaticEnvelopeFrame([0, 0.5, 1]);
    const baseline = buildTimeDomainSegments(
      frame,
      { width: 120, height: 80 },
      { mode: "envelope" },
    );
    const mirrored = buildTimeDomainSegments(
      frame,
      { width: 120, height: 80 },
      { amplitudePlacement: "mirrored", mode: "envelope" },
    );

    expect(baseline[2].y1).toBeLessThan(baseline[2].centerY);
    expect(baseline[2].y2).toBe(baseline[2].centerY);
    expect(mirrored[2].y1).toBeLessThan(mirrored[2].centerY);
    expect(mirrored[2].y2).toBeGreaterThan(mirrored[2].centerY);
  });

  it("rotates time and amplitude axes for vertical orientation", () => {
    const frame = createStaticWaveformFrame([-1, 1]);
    const columns = buildWaveformColumns(
      frame,
      { width: 80, height: 120 },
      { orientation: "vertical", padding: 10 },
    );

    expect(columns[0].y1).toBeLessThan(columns[1].y1);
    expect(columns[0].x1).toBeLessThan(columns[0].centerX);
    expect(columns[1].x1).toBeGreaterThan(columns[1].centerX);
    expect(columns.every((column) => Object.values(column).every(Number.isFinite))).toBe(true);
  });

  it("returns finite empty geometry for zero channels, dimensions, and extreme spacing", () => {
    const empty = createStaticWaveformFrame([]);
    expect(buildWaveformColumns(empty, { width: 100, height: 100 })).toEqual([]);

    const ready = createStaticWaveformFrame([
      [-1, 0, 1],
      [1, 0, -1],
    ]);
    expect(buildWaveformColumns(ready, { width: Number.NaN, height: 100 })).toEqual([]);
    expect(
      buildWaveformColumns(
        ready,
        { width: 10, height: 10 },
        { channelGap: 96, channelMode: "stereo", padding: 0 },
      ),
    ).toEqual([]);
  });

  it("rejects layouts and frame/config pairings that cannot preserve their meaning", () => {
    const mono = createStaticWaveformFrame([-1, 1]);
    expect(() =>
      buildWaveformColumns(mono, { width: 100, height: 60 }, { channelLayout: "overlay" }),
    ).toThrowError(expect.objectContaining({ code: "MULTI_CHANNEL_LAYOUT_REQUIRED" }));
    expect(() =>
      buildWaveformColumns(mono, { width: 100, height: 60 }, { channelLayout: "split" }),
    ).toThrowError(expect.objectContaining({ code: "STEREO_REQUIRES_TWO_CHANNELS" }));
    expect(() =>
      buildTimeDomainSegments(mono, { width: 100, height: 60 }, { mode: "envelope" }),
    ).toThrow(WaveformConfigError);
  });
});
