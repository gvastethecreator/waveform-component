import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import {
  buildMeterArcs,
  buildMeterArcSegments,
  buildMeterRects,
  buildMeterSegments,
} from "./meterGeometry";

const stereo = analyzeMeter([
  new Float32Array([1, 0, 0, 0]),
  new Float32Array([0.5, 0.5, 0.5, 0.5]),
]);

describe("meter geometry", () => {
  it("keeps RMS and peak geometry distinct with minimum visible size", () => {
    const rms = buildMeterRects(
      stereo,
      { height: 80, width: 200 },
      {
        measurement: "rms",
        minimumDecibels: -60,
        padding: 10,
      },
    );
    const peak = buildMeterRects(
      stereo,
      { height: 80, width: 200 },
      {
        measurement: "peak",
        minimumDecibels: -60,
        padding: 10,
      },
    );
    expect(rms).toHaveLength(2);
    expect(peak[0].width).toBeGreaterThan(rms[0].width);
    const silence = analyzeMeter(new Float32Array(8));
    expect(
      buildMeterRects(silence, { height: 40, width: 80 }, { minimumSize: 3, padding: 0 })[0].width,
    ).toBe(3);
  });

  it("lays out stereo horizontal and vertical meters without overlap", () => {
    const horizontal = buildMeterRects(
      stereo,
      { height: 100, width: 200 },
      {
        barWidth: 12,
        channelGap: 8,
        padding: 10,
      },
    );
    expect(horizontal[0].y + horizontal[0].height).toBeLessThan(horizontal[1].y);
    const vertical = buildMeterRects(
      stereo,
      { height: 200, width: 100 },
      {
        barWidth: 12,
        channelGap: 8,
        orientation: "vertical",
        padding: 10,
      },
    );
    expect(vertical[0].x + vertical[0].width).toBeLessThan(vertical[1].x);
    expect(vertical.every((rect) => rect.y >= 10)).toBe(true);
  });

  it("builds ordered stepped tracks with explicit active state", () => {
    const segments = buildMeterSegments(
      stereo,
      { height: 90, width: 180 },
      {
        measurement: "rms",
        minimumDecibels: -60,
        padding: 10,
        stepGap: 2,
        stepWidth: 8,
      },
    );
    const firstChannel = segments.filter((segment) => segment.channelIndex === 0);
    expect(firstChannel.length).toBeGreaterThan(10);
    expect(firstChannel.some((segment) => segment.active)).toBe(true);
    expect(firstChannel.some((segment) => !segment.active)).toBe(true);
    expect(
      firstChannel.every(({ active: _active, ...geometry }) =>
        Object.values(geometry).every(Number.isFinite),
      ),
    ).toBe(true);
  });

  it("maps continuous and stepped meters onto finite partial radial arcs", () => {
    const arcs = buildMeterArcs(
      stereo,
      { height: 200, width: 240 },
      {
        layout: "radial",
        radialArc: 240,
        radialDeadzone: 0.25,
        radialInvert: true,
        radialRotation: 450,
      },
    );
    expect(arcs).toHaveLength(2);
    expect(arcs[0].endAngle).toBeLessThan(arcs[0].startAngle);
    expect(arcs.every((arc) => Object.values(arc).every(Number.isFinite))).toBe(true);
    const steps = buildMeterArcSegments(
      stereo,
      { height: 200, width: 240 },
      {
        radialArc: 180,
        stepGap: 3,
        stepWidth: 7,
      },
    );
    expect(steps.length).toBeGreaterThan(10);
    expect(steps.some((segment) => segment.active)).toBe(true);
    expect(steps.some((segment) => !segment.active)).toBe(true);
    const channelSteps = steps.filter((segment) => segment.channelIndex === 0);
    const visibleGap =
      (channelSteps[1].startAngle - channelSteps[0].endAngle) * channelSteps[0].radius -
      channelSteps[0].width;
    expect(visibleGap).toBeCloseTo(3, 2);
  });

  it("returns empty output for empty frames and degenerate viewports", () => {
    const empty = analyzeMeter(new Float32Array());
    expect(buildMeterRects(empty, { height: 100, width: 100 })).toEqual([]);
    expect(buildMeterSegments(stereo, { height: 0, width: 0 })).toEqual([]);
    expect(buildMeterArcs(stereo, { height: Number.NaN, width: 100 })).toEqual([]);
    expect(buildMeterArcSegments(stereo, { height: 100, width: 100 }, { radialArc: 0 })).toEqual(
      [],
    );
  });
});
