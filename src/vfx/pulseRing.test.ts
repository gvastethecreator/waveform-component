import { describe, expect, it } from "vitest";
import type { BandEnergyFrame } from "../types";
import {
  DEFAULT_PULSE_RING_CONFIG,
  PULSE_RING_CONTROL_DEFINITIONS,
  createPulseRingUniformState,
  parsePulseRingColor,
  resolvePulseRingConfig,
  resolvePulseRingTime,
} from "./pulseRing";

function bands(values: readonly number[]): BandEnergyFrame {
  return Object.freeze({
    bands: Object.freeze(
      values.map((energy, index) =>
        Object.freeze({
          energy,
          highFrequency: (index + 2) * 100,
          id: `test-${index}`,
          lowFrequency: (index + 1) * 100,
        }),
      ),
    ),
    kind: "bands",
    state: "ready",
  });
}

describe("Pulse Ring contract", () => {
  it("publishes named clean-room controls with bounded defaults", () => {
    expect(PULSE_RING_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "thickness",
      "glowStrength",
      "rotationSpeed",
      "bandReactivity",
      "backgroundColor",
      "primaryColor",
      "secondaryColor",
      "tertiaryColor",
      "sweepColor",
      "motion",
      "quality",
    ]);
    expect(new Set(PULSE_RING_CONTROL_DEFINITIONS.map((control) => control.id)).size).toBe(11);
    expect(Object.isFrozen(PULSE_RING_CONTROL_DEFINITIONS)).toBe(true);
    PULSE_RING_CONTROL_DEFINITIONS.forEach((control) => {
      expect(control.compatibleData).toEqual(["bands"]);
      expect(control.compatibleRenderers).toEqual(["webgl2"]);
      expect(control.constraints.length).toBeGreaterThan(0);
      expect(control.unit.length).toBeGreaterThan(0);
      expect(control.visibleWhen).toBe("always");
    });
  });

  it("clamps hostile numeric config and restores typed fixed fields", () => {
    expect(
      resolvePulseRingConfig({
        bandReactivity: Number.POSITIVE_INFINITY,
        glowStrength: -4,
        mode: "pulse-ring",
        renderer: "webgl2",
        rotationSpeed: 8,
        thickness: 0,
      }),
    ).toEqual({
      ...DEFAULT_PULSE_RING_CONFIG,
      glowStrength: 0,
      rotationSpeed: 1,
      thickness: 0.01,
    });
  });

  it("maps every named numeric/color input into deterministic uniform state", () => {
    const frame = bands([0.1, 0.5, 1]);
    const state = createPulseRingUniformState(frame, {
      backgroundColor: "#010203",
      bandReactivity: 1.4,
      glowStrength: 1.2,
      primaryColor: "#ff000080",
      rotationSpeed: -0.25,
      secondaryColor: "rgb(0, 255, 0)",
      sweepColor: "#ffffff",
      tertiaryColor: "var(--tertiary, #0000ff)",
      thickness: 0.09,
    });
    expect(state.bands).toEqual([0.1, 0.5, 1]);
    expect(state.energy).toBeCloseTo(Math.sqrt((0.01 + 0.25 + 1) / 3));
    expect(state.peak).toBe(1);
    expect(state.centroid).toBeCloseTo(1.25 / 1.6);
    expect(state.bandReactivity).toBe(1.4);
    expect(state.glowStrength).toBe(1.2);
    expect(state.rotationSpeed).toBe(-0.25);
    expect(state.thickness).toBe(0.09);
    expect(state.primaryColor).toEqual([1, 0, 0, 128 / 255]);
    expect(state.secondaryColor).toEqual([0, 1, 0, 1]);
    expect(state.tertiaryColor).toEqual([0, 0, 1, 1]);
    expect(state.sweepColor).toEqual([1, 1, 1, 1]);
    expect(state.backgroundColor[0]).toBeCloseTo(1 / 255);
  });

  it("samples excessive energy without losing order or the final peak", () => {
    const state = createPulseRingUniformState(
      bands(Array.from({ length: 64 }, (_, index) => index / 63)),
    );
    expect(state.bandCount).toBe(16);
    expect(state.bands[0]).toBeLessThan(state.bands.at(-1)!);
    expect(state.bands.at(-1)).toBe(1);
  });

  it("freezes time only for reduced motion and parses fallback colors", () => {
    expect(resolvePulseRingTime(12.5, false)).toBe(12.5);
    expect(resolvePulseRingTime(12.5, true)).toBe(0);
    expect(resolvePulseRingTime(Number.NaN, false)).toBe(0);
    expect(parsePulseRingColor("not-a-color", "#123456")).toEqual([
      0x12 / 255,
      0x34 / 255,
      0x56 / 255,
      1,
    ]);
  });
});
