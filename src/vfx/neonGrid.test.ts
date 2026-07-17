import { describe, expect, it } from "vitest";
import type { BandEnergyFrame } from "../types";
import {
  DEFAULT_EQUALIZER_GRID_CONFIG,
  EQUALIZER_GRID_CONTROL_DEFINITIONS,
  EQUALIZER_GRID_PRESETS,
  MAX_EQUALIZER_GRID_COLUMNS,
  MAX_EQUALIZER_GRID_ROWS,
  MIN_EQUALIZER_GRID_COLUMNS,
  MIN_EQUALIZER_GRID_ROWS,
  createEqualizerGridUniformState,
  getEqualizerGridPreset,
  resolveEqualizerGridConfig,
} from "./equalizerGrid";
import {
  DEFAULT_NEON_LINES_CONFIG,
  MAX_NEON_LINE_COUNT,
  MIN_NEON_LINE_COUNT,
  NEON_LINES_CONTROL_DEFINITIONS,
  NEON_LINES_PRESETS,
  createNeonLinesUniformState,
  getNeonLinesPreset,
  resolveNeonLinesConfig,
} from "./neonLines";
import type { VfxControlDefinition, VfxSurfaceConfig } from "./schema";

describe("Neon Lines VFX contract", () => {
  it("publishes a complete bounded schema for every observable parameter", () => {
    expect(NEON_LINES_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "lineCount",
      "waveHeight",
      "flowSpeed",
      "lineThickness",
      "glowSize",
      "energyReactivity",
      "backgroundColor",
      "leftColor",
      "rightColor",
      "burstColor",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(NEON_LINES_CONTROL_DEFINITIONS);
  });

  it("clamps hostile inputs before any shader iteration or allocation", () => {
    expect(
      resolveNeonLinesConfig({
        energyReactivity: Number.POSITIVE_INFINITY,
        flowSpeed: -8,
        glowSize: 9,
        lineCount: 4_000.4,
        lineThickness: 0,
        mode: "pulse-ring",
        motion: "unsafe",
        quality: "ultra",
        renderer: "canvas2d",
        waveHeight: -1,
      } as unknown as Parameters<typeof resolveNeonLinesConfig>[0]),
    ).toEqual({
      ...DEFAULT_NEON_LINES_CONFIG,
      flowSpeed: -2,
      glowSize: 3,
      lineCount: MAX_NEON_LINE_COUNT,
      lineThickness: 0.002,
      waveHeight: 0.02,
    });
    expect(resolveNeonLinesConfig({ lineCount: MIN_NEON_LINE_COUNT - 1 }).lineCount).toBe(
      MIN_NEON_LINE_COUNT,
    );
  });

  it("maps distributed, clipped band energy and every visual role deterministically", () => {
    const state = createNeonLinesUniformState(bands([-1, 0.25, 2, Number.NaN]), {
      backgroundColor: "#010203",
      burstColor: "#ffffff",
      energyReactivity: 1.6,
      flowSpeed: -0.75,
      glowSize: 2.1,
      leftColor: "#ff0000",
      lineCount: 9,
      lineThickness: 0.02,
      rightColor: "#00ff00",
      waveHeight: 0.3,
    });
    expect(state.bands).toEqual([0, 0.25, 1, 0]);
    expect(state.bandCount).toBe(4);
    expect(state.peak).toBe(1);
    expect(state.energy).toBeCloseTo(Math.sqrt((0.25 ** 2 + 1) / 4));
    expect(state).toMatchObject({
      energyReactivity: 1.6,
      flowSpeed: -0.75,
      glowSize: 2.1,
      lineCount: 9,
      lineThickness: 0.02,
      waveHeight: 0.3,
    });
    expect(state.leftColor).toEqual([1, 0, 0, 1]);
    expect(state.rightColor).toEqual([0, 1, 0, 1]);
    expect(state.burstColor).toEqual([1, 1, 1, 1]);
    expect(state.backgroundColor[0]).toBeCloseTo(1 / 255);
  });

  it("exposes immutable, unique, exactly reproducible presets", () => {
    expectPresets(NEON_LINES_PRESETS, DEFAULT_NEON_LINES_CONFIG);
    expect(getNeonLinesPreset("ember")).toBe(NEON_LINES_PRESETS[1]);
    expect(getNeonLinesPreset("aurora").config).toEqual(DEFAULT_NEON_LINES_CONFIG);
  });
});

describe("Equalizer Grid VFX contract", () => {
  it("publishes a complete bounded schema for every observable parameter", () => {
    expect(EQUALIZER_GRID_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "gridColumns",
      "gridRows",
      "cellGap",
      "cellReactivity",
      "randomSpeed",
      "backgroundColor",
      "gradientColor1",
      "gradientColor2",
      "gradientColor3",
      "gradientColor4",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(EQUALIZER_GRID_CONTROL_DEFINITIONS);
  });

  it("bounds both grid axes before procedural cell addressing", () => {
    expect(
      resolveEqualizerGridConfig({
        cellGap: 1,
        cellReactivity: -2,
        gridColumns: 5_000,
        gridRows: Number.POSITIVE_INFINITY,
        mode: "pulse-ring",
        motion: "unsafe",
        quality: "ultra",
        randomSpeed: -1,
        renderer: "canvas2d",
      } as unknown as Parameters<typeof resolveEqualizerGridConfig>[0]),
    ).toEqual({
      ...DEFAULT_EQUALIZER_GRID_CONFIG,
      cellGap: 0.45,
      cellReactivity: 0,
      gridColumns: MAX_EQUALIZER_GRID_COLUMNS,
      randomSpeed: 0,
    });
    expect(
      resolveEqualizerGridConfig({
        gridColumns: MIN_EQUALIZER_GRID_COLUMNS - 1,
        gridRows: MIN_EQUALIZER_GRID_ROWS - 1,
      }),
    ).toMatchObject({
      gridColumns: MIN_EQUALIZER_GRID_COLUMNS,
      gridRows: MIN_EQUALIZER_GRID_ROWS,
    });
    expect(resolveEqualizerGridConfig({ gridRows: MAX_EQUALIZER_GRID_ROWS + 1 }).gridRows).toBe(
      MAX_EQUALIZER_GRID_ROWS,
    );
  });

  it("maps zero and overload frames into stable uniform values", () => {
    const zero = createEqualizerGridUniformState(bands([0, 0, 0]));
    expect(zero).toMatchObject({
      bandCount: 3,
      centroid: 0,
      energy: 0,
      peak: 0,
    });

    const overload = createEqualizerGridUniformState(bands([0.25, 1.5, 0.75]), {
      cellGap: 0.2,
      cellReactivity: 1.8,
      gradientColor1: "#ff0000",
      gradientColor2: "#00ff00",
      gradientColor3: "#0000ff",
      gradientColor4: "#ffffff",
      gridColumns: 32,
      gridRows: 12,
      randomSpeed: 0.8,
    });
    expect(overload.bands).toEqual([0.25, 1, 0.75]);
    expect(overload.peak).toBe(1);
    expect(overload).toMatchObject({
      cellGap: 0.2,
      cellReactivity: 1.8,
      gridColumns: 32,
      gridRows: 12,
      randomSpeed: 0.8,
    });
    expect(overload.gradientColor1).toEqual([1, 0, 0, 1]);
    expect(overload.gradientColor2).toEqual([0, 1, 0, 1]);
    expect(overload.gradientColor3).toEqual([0, 0, 1, 1]);
    expect(overload.gradientColor4).toEqual([1, 1, 1, 1]);
  });

  it("exposes immutable, unique, exactly reproducible presets", () => {
    expectPresets(EQUALIZER_GRID_PRESETS, DEFAULT_EQUALIZER_GRID_CONFIG);
    expect(getEqualizerGridPreset("signal-radar")).toBe(EQUALIZER_GRID_PRESETS[2]);
    expect(getEqualizerGridPreset("ice-map").config).toEqual(DEFAULT_EQUALIZER_GRID_CONFIG);
  });
});

function expectCompleteSchema(definitions: readonly VfxControlDefinition[]) {
  expect(Object.isFrozen(definitions)).toBe(true);
  expect(new Set(definitions.map((control) => control.id)).size).toBe(definitions.length);
  definitions.forEach((control) => {
    expect(Object.isFrozen(control)).toBe(true);
    expect(control.compatibleData).toEqual(["bands"]);
    expect(control.compatibleRenderers).toEqual(["webgl2"]);
    expect(control.constraints.length).toBeGreaterThan(0);
    expect(control.description.length).toBeGreaterThan(10);
    expect(control.label.length).toBeGreaterThan(0);
    expect(control.unit.length).toBeGreaterThan(0);
    expect(control.visibleWhen).toBe("always");
    if (control.type === "number") {
      expect(control.minimum).toBeLessThan(control.maximum);
      expect(control.defaultValue).toBeGreaterThanOrEqual(control.minimum);
      expect(control.defaultValue).toBeLessThanOrEqual(control.maximum);
      expect(control.step).toBeGreaterThan(0);
    }
    if (control.type === "select") expect(control.options).toContain(control.defaultValue);
  });
}

function expectPresets<Config extends VfxSurfaceConfig>(
  presets: readonly { readonly config: Config; readonly id: string }[],
  expectedDefault: Config,
) {
  expect(Object.isFrozen(presets)).toBe(true);
  expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length);
  expect(presets[0].config).toEqual(expectedDefault);
  presets.forEach((preset) => {
    expect(Object.isFrozen(preset)).toBe(true);
    expect(Object.isFrozen(preset.config)).toBe(true);
  });
}

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
