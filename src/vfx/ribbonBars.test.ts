import { describe, expect, it } from "vitest";
import type { BandEnergyFrame } from "../types";
import {
  DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG,
  MAX_WOBBLE_BAR_COUNT,
  MIN_WOBBLE_BAR_COUNT,
  ROUNDED_WOBBLE_BARS_CONTROL_DEFINITIONS,
  ROUNDED_WOBBLE_BARS_PRESETS,
  createRoundedWobbleBarsUniformState,
  getRoundedWobbleBarsPreset,
  resolveRoundedWobbleBarsConfig,
} from "./roundedWobbleBars";
import type { VfxControlDefinition, VfxSurfaceConfig } from "./schema";
import {
  DEFAULT_SPECTRUM_BARS_VFX_CONFIG,
  MAX_SPECTRUM_VFX_BAR_COUNT,
  MIN_SPECTRUM_VFX_BAR_COUNT,
  SPECTRUM_BARS_VFX_CONTROL_DEFINITIONS,
  SPECTRUM_BARS_VFX_PRESETS,
  createSpectrumBarsVfxUniformState,
  getSpectrumBarsVfxPreset,
  resolveSpectrumBarsVfxConfig,
} from "./spectrumBarsVfx";
import {
  DEFAULT_WAVEFORM_RIBBON_CONFIG,
  WAVEFORM_RIBBON_CONTROL_DEFINITIONS,
  WAVEFORM_RIBBON_PRESETS,
  createWaveformRibbonUniformState,
  getWaveformRibbonPreset,
  resolveWaveformRibbonConfig,
} from "./waveformRibbon";

describe("Waveform Ribbon VFX contract", () => {
  it("publishes every named control through a complete schema", () => {
    expect(WAVEFORM_RIBBON_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "waveHeight",
      "flowSpeed",
      "ribbonThickness",
      "glowStrength",
      "reflectionStrength",
      "energyReactivity",
      "backgroundColor",
      "leftColor",
      "rightColor",
      "peakFlashColor",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(WAVEFORM_RIBBON_CONTROL_DEFINITIONS);
  });

  it("clamps hostile geometry and lifecycle inputs", () => {
    expect(
      resolveWaveformRibbonConfig({
        energyReactivity: -1,
        flowSpeed: 9,
        glowStrength: 20,
        mode: "pulse-ring",
        motion: "unsafe",
        quality: "ultra",
        reflectionStrength: 3,
        renderer: "canvas2d",
        ribbonThickness: 2,
        waveHeight: 0,
      } as unknown as Parameters<typeof resolveWaveformRibbonConfig>[0]),
    ).toEqual({
      ...DEFAULT_WAVEFORM_RIBBON_CONFIG,
      energyReactivity: 0,
      flowSpeed: 2,
      glowStrength: 3,
      reflectionStrength: 1,
      ribbonThickness: 0.28,
      waveHeight: 0.02,
    });
  });

  it("maps ordered zero and overload energy deterministically", () => {
    const zero = createWaveformRibbonUniformState(bands([0, 0, 0]));
    expect(zero).toMatchObject({ bandCount: 3, centroid: 0, energy: 0, peak: 0 });
    const overload = createWaveformRibbonUniformState(bands([-1, 0.4, 2, Number.NaN]), {
      energyReactivity: 1.8,
      reflectionStrength: 0.7,
      ribbonThickness: 0.16,
    });
    expect(overload.bands).toEqual([0, 0.4, 1, 0]);
    expect(overload).toMatchObject({
      energyReactivity: 1.8,
      peak: 1,
      reflectionStrength: 0.7,
      ribbonThickness: 0.16,
    });
  });

  it("exposes immutable and exactly reproducible presets", () => {
    expectPresets(WAVEFORM_RIBBON_PRESETS, DEFAULT_WAVEFORM_RIBBON_CONFIG);
    expect(getWaveformRibbonPreset("ghost-mirror")).toBe(WAVEFORM_RIBBON_PRESETS[2]);
  });
});

describe("Rounded Wobble Bars VFX contract", () => {
  it("publishes every named control including a semantic boolean mirror", () => {
    expect(ROUNDED_WOBBLE_BARS_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "barCount",
      "wobbleIntensity",
      "mirrorVertically",
      "barGap",
      "glowIntensity",
      "energyReactivity",
      "backgroundColor",
      "leftColor",
      "rightColor",
      "burstFlashColor",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(ROUNDED_WOBBLE_BARS_CONTROL_DEFINITIONS);
    expect(ROUNDED_WOBBLE_BARS_CONTROL_DEFINITIONS[2]).toMatchObject({
      defaultValue: true,
      type: "boolean",
      unit: "boolean",
    });
  });

  it("bounds bar count and all procedural dimensions", () => {
    expect(
      resolveRoundedWobbleBarsConfig({
        barCount: 8_000,
        barGap: 2,
        energyReactivity: -2,
        glowIntensity: 9,
        mirrorVertically: "yes",
        wobbleIntensity: 4,
      } as unknown as Parameters<typeof resolveRoundedWobbleBarsConfig>[0]),
    ).toEqual({
      ...DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG,
      barCount: MAX_WOBBLE_BAR_COUNT,
      barGap: 0.78,
      energyReactivity: 0,
      glowIntensity: 3,
      wobbleIntensity: 1,
    });
    expect(resolveRoundedWobbleBarsConfig({ barCount: 0 }).barCount).toBe(MIN_WOBBLE_BAR_COUNT);
  });

  it("preserves source order and mirror intent in uniform state", () => {
    const state = createRoundedWobbleBarsUniformState(bands([0.1, 0.5, 1]), {
      barCount: 48,
      mirrorVertically: false,
      wobbleIntensity: 0.8,
    });
    expect(state.bands).toEqual([0.1, 0.5, 1]);
    expect(state).toMatchObject({
      barCount: 48,
      mirrorVertically: false,
      peak: 1,
      wobbleIntensity: 0.8,
    });
  });

  it("exposes immutable and exactly reproducible presets", () => {
    expectPresets(ROUNDED_WOBBLE_BARS_PRESETS, DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG);
    expect(getRoundedWobbleBarsPreset("candy-arc")).toBe(ROUNDED_WOBBLE_BARS_PRESETS[2]);
  });
});

describe("Spectrum Bars VFX contract", () => {
  it("publishes every metadata and ticket control through a complete schema", () => {
    expect(SPECTRUM_BARS_VFX_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "barCount",
      "heightReactivity",
      "gapSize",
      "verticalPosition",
      "randomSpeed",
      "glowStrength",
      "backgroundColor",
      "gradientColor1",
      "gradientColor2",
      "gradientColor3",
      "gradientColor4",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(SPECTRUM_BARS_VFX_CONTROL_DEFINITIONS);
  });

  it("bounds maximum density, gaps, baseline, shimmer, and glow", () => {
    expect(
      resolveSpectrumBarsVfxConfig({
        barCount: 100_000,
        gapSize: 2,
        glowStrength: -1,
        heightReactivity: 8,
        randomSpeed: 9,
        verticalPosition: -4,
      }),
    ).toEqual({
      ...DEFAULT_SPECTRUM_BARS_VFX_CONFIG,
      barCount: MAX_SPECTRUM_VFX_BAR_COUNT,
      gapSize: 0.82,
      glowStrength: 0,
      heightReactivity: 2,
      randomSpeed: 2,
      verticalPosition: 0.05,
    });
    expect(resolveSpectrumBarsVfxConfig({ barCount: 0 }).barCount).toBe(MIN_SPECTRUM_VFX_BAR_COUNT);
  });

  it("maps zero and overload while preserving all four gradient roles", () => {
    const zero = createSpectrumBarsVfxUniformState(bands([0, 0]));
    expect(zero).toMatchObject({ energy: 0, peak: 0 });
    const overload = createSpectrumBarsVfxUniformState(bands([0.2, 3, 0.7]), {
      gradientColor1: "#ff0000",
      gradientColor2: "#00ff00",
      gradientColor3: "#0000ff",
      gradientColor4: "#ffffff",
      verticalPosition: 0.5,
    });
    expect(overload.bands).toEqual([0.2, 1, 0.7]);
    expect(overload.gradientColor1).toEqual([1, 0, 0, 1]);
    expect(overload.gradientColor2).toEqual([0, 1, 0, 1]);
    expect(overload.gradientColor3).toEqual([0, 0, 1, 1]);
    expect(overload.gradientColor4).toEqual([1, 1, 1, 1]);
    expect(overload.verticalPosition).toBe(0.5);
  });

  it("exposes immutable and exactly reproducible presets", () => {
    expectPresets(SPECTRUM_BARS_VFX_PRESETS, DEFAULT_SPECTRUM_BARS_VFX_CONFIG);
    expect(getSpectrumBarsVfxPreset("radar-spectrum")).toBe(SPECTRUM_BARS_VFX_PRESETS[2]);
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
    if (control.type === "boolean") expect(typeof control.defaultValue).toBe("boolean");
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
