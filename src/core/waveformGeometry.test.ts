import { describe, expect, it } from "vitest";
import { createStaticWaveformFrame } from "./staticFrame";
import { buildWaveformColumns } from "./waveformGeometry";

describe("buildWaveformColumns", () => {
  it("maps positive samples above center and negative samples below center", () => {
    const frame = createStaticWaveformFrame([-1, 1]);
    const columns = buildWaveformColumns(frame, { width: 100, height: 60 }, { padding: 10 });

    expect(columns).toHaveLength(2);
    expect(columns[0].yMax).toBeGreaterThan(columns[0].centerY);
    expect(columns[1].yMin).toBeLessThan(columns[1].centerY);
  });

  it("stacks channels with finite, distinct centers", () => {
    const frame = createStaticWaveformFrame([
      [-1, 1, -1, 1],
      [1, -1, 1, -1],
    ]);
    const columns = buildWaveformColumns(
      frame,
      { width: 160, height: 100 },
      { channelGap: 10, padding: 10 },
    );
    const centers = [...new Set(columns.map((column) => column.centerY))];

    expect(centers).toHaveLength(2);
    expect(centers[1]).toBeGreaterThan(centers[0]);
    expect(columns.every((column) => Object.values(column).every(Number.isFinite))).toBe(true);
  });

  it("returns no geometry for empty or degenerate viewports", () => {
    const frame = createStaticWaveformFrame([]);
    expect(buildWaveformColumns(frame, { width: 100, height: 100 })).toEqual([]);

    const ready = createStaticWaveformFrame([-1, 0, 1]);
    expect(buildWaveformColumns(ready, { width: Number.NaN, height: 100 })).toEqual([]);
  });
});
