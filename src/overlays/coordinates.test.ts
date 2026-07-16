import { describe, expect, it } from "vitest";
import {
  assignOverlayCollisionLanes,
  assignOverlayRangeCollisionLanes,
  keyboardNormalizedValue,
  normalizeOverlayRange,
  normalizedToValue,
  normalizedValueFromPoint,
  positionForNormalizedValue,
  valueToNormalized,
} from "./coordinates";

const bounds = { height: 100, left: 10, top: 20, width: 200 };

describe("overlay coordinate contract", () => {
  it("maps pointer/touch coordinates through horizontal, vertical, RTL, and cross axes", () => {
    expect(normalizedValueFromPoint({ clientX: 60, clientY: 45 }, bounds)).toBe(0.25);
    expect(
      normalizedValueFromPoint({ clientX: 60, clientY: 45 }, bounds, { direction: "rtl" }),
    ).toBe(0.75);
    expect(
      normalizedValueFromPoint({ clientX: 60, clientY: 45 }, bounds, {
        orientation: "vertical",
      }),
    ).toBe(0.25);
    expect(normalizedValueFromPoint({ clientX: 60, clientY: 45 }, bounds, { axis: "cross" })).toBe(
      0.75,
    );
    expect(
      normalizedValueFromPoint({ clientX: 60, clientY: 45 }, bounds, {
        orientation: "vertical",
        reversed: true,
      }),
    ).toBe(0.75);
  });

  it("keeps forward and inverse positions finite at degenerate bounds", () => {
    expect(positionForNormalizedValue(0.25, bounds)).toEqual({ x: 50, y: 50 });
    expect(
      positionForNormalizedValue(0.25, bounds, { axis: "cross", orientation: "horizontal" }),
    ).toEqual({ x: 100, y: 75 });
    expect(
      positionForNormalizedValue(0.25, bounds, { orientation: "vertical", reversed: true }),
    ).toEqual({ x: 100, y: 75 });
    expect(normalizedValueFromPoint({ clientX: 10, clientY: 20 }, { ...bounds, width: 0 })).toBe(0);
  });

  it("normalizes ranges and maps linear/log values with bounded steps", () => {
    expect(normalizeOverlayRange(1.4, -0.2)).toEqual({ end: 1, start: 0 });
    expect(valueToNormalized(1000, 10, 10_000, "log")).toBeCloseTo(2 / 3, 8);
    expect(normalizedToValue(2 / 3, 10, 10_000, "log", 10)).toBe(1000);
    expect(normalizedToValue(0.51, -60, 0, "linear", 1)).toBe(-29);
  });

  it("uses orientation- and direction-aware keyboard semantics", () => {
    expect(keyboardNormalizedValue(0.5, "ArrowRight", { step: 0.1 })).toBe(0.6);
    expect(keyboardNormalizedValue(0.5, "ArrowRight", { direction: "rtl", step: 0.1 })).toBe(0.4);
    expect(keyboardNormalizedValue(0.5, "ArrowDown", { orientation: "vertical", step: 0.1 })).toBe(
      0.6,
    );
    expect(keyboardNormalizedValue(0.5, "ArrowUp", { axis: "cross", step: 0.1 })).toBe(0.6);
    expect(
      keyboardNormalizedValue(0.5, "ArrowUp", {
        orientation: "vertical",
        reversed: true,
        step: 0.1,
      }),
    ).toBe(0.6);
    expect(keyboardNormalizedValue(0.5, "Home")).toBe(0);
    expect(keyboardNormalizedValue(0.5, "End")).toBe(1);
    expect(keyboardNormalizedValue(0.5, "KeyA")).toBeNull();
  });

  it("assigns deterministic collision lanes without changing caller order", () => {
    const layout = assignOverlayCollisionLanes([
      { id: "second", position: 0.51 },
      { id: "first", position: 0.5 },
      { axis: "cross", id: "cross", position: 0.5 },
      { id: "clear", position: 0.8 },
    ]);
    expect(layout.map(({ id, lane }) => ({ id, lane }))).toEqual([
      { id: "second", lane: 1 },
      { id: "first", lane: 0 },
      { id: "cross", lane: 0 },
      { id: "clear", lane: 0 },
    ]);
  });

  it("gives intersecting regions independent lanes while reusing clear space", () => {
    expect(
      assignOverlayRangeCollisionLanes([
        { end: 0.76, id: "loop", start: 0.56 },
        { end: 0.42, id: "selection", start: 0.18 },
        { end: 0.72, id: "annotation", start: 0.64 },
      ]).map(({ id, lane }) => ({ id, lane })),
    ).toEqual([
      { id: "loop", lane: 0 },
      { id: "selection", lane: 0 },
      { id: "annotation", lane: 1 },
    ]);
  });
});
