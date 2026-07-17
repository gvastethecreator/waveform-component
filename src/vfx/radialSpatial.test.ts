import { describe, expect, it } from "vitest";
import type { BandEnergyFrame } from "../types";
import {
  DEFAULT_RADIAL_SPIKES_CONFIG,
  MAX_RADIAL_SPIKE_COUNT,
  MAX_RADIAL_SPIKE_REACH,
  MIN_RADIAL_SPIKE_COUNT,
  RADIAL_SPIKES_CONTROL_DEFINITIONS,
  RADIAL_SPIKES_PRESETS,
  createRadialSpikesUniformState,
  getRadialSpikesPreset,
  resolveRadialSpikesConfig,
} from "./radialSpikes";
import type { VfxControlDefinition, VfxSurfaceConfig } from "./schema";
import {
  DEFAULT_TUNNEL_WAVES_CONFIG,
  MAX_TUNNEL_RING_DENSITY,
  MIN_TUNNEL_RING_DENSITY,
  TUNNEL_WAVES_CONTROL_DEFINITIONS,
  TUNNEL_WAVES_PRESETS,
  createTunnelWavesUniformState,
  getTunnelWavesPreset,
  resolveTunnelWavesConfig,
} from "./tunnelWaves";
import {
  DEFAULT_VORTEX_RINGS_CONFIG,
  MAX_VORTEX_RING_DENSITY,
  MIN_VORTEX_RING_DENSITY,
  VORTEX_RINGS_CONTROL_DEFINITIONS,
  VORTEX_RINGS_PRESETS,
  createVortexRingsUniformState,
  getVortexRingsPreset,
  resolveVortexRingsConfig,
} from "./vortexRings";

describe("Radial Spikes VFX contract", () => {
  it("publishes every named spatial control through a complete schema", () => {
    expect(RADIAL_SPIKES_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "spikeCount",
      "baseRadius",
      "spikeHeight",
      "spikeWidth",
      "arcDegrees",
      "rotationDegrees",
      "energyReactivity",
      "glowStrength",
      "backgroundColor",
      "baseColor",
      "tipColor",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(RADIAL_SPIKES_CONTROL_DEFINITIONS);
  });

  it("bounds count, arc, width, and combined radial reach before shader work", () => {
    const resolved = resolveRadialSpikesConfig({
      arcDegrees: 900,
      baseRadius: 0.6,
      energyReactivity: -2,
      glowStrength: 9,
      rotationDegrees: -900,
      spikeCount: 50_000,
      spikeHeight: 4,
      spikeWidth: 3,
    });
    expect(resolved).toMatchObject({
      arcDegrees: 360,
      baseRadius: 0.6,
      energyReactivity: 0,
      glowStrength: 3,
      rotationDegrees: -180,
      spikeCount: MAX_RADIAL_SPIKE_COUNT,
      spikeWidth: 0.92,
    });
    expect(resolved.baseRadius + resolved.spikeHeight).toBe(MAX_RADIAL_SPIKE_REACH);
    expect(resolveRadialSpikesConfig({ spikeCount: 0 }).spikeCount).toBe(MIN_RADIAL_SPIKE_COUNT);
  });

  it("preserves explicit log and linear band order in uniform state", () => {
    const logarithmic = createRadialSpikesUniformState(
      bands([0.12, 0.46, 0.91], [20, 200, 2_000, 20_000]),
    );
    const linear = createRadialSpikesUniformState(
      bands([0.12, 0.46, 0.91], [20, 6_680, 13_340, 20_000]),
    );
    expect(logarithmic.bands).toEqual([0.12, 0.46, 0.91]);
    expect(linear.bands).toEqual(logarithmic.bands);
    expect(logarithmic).toMatchObject({ bandCount: 3, peak: 0.91, spikeCount: 48 });
  });

  it("exposes immutable and exactly reproducible presets", () => {
    expectPresets(RADIAL_SPIKES_PRESETS, DEFAULT_RADIAL_SPIKES_CONFIG);
    expect(getRadialSpikesPreset("signal-arc")).toBe(RADIAL_SPIKES_PRESETS[2]);
  });
});

describe("Tunnel Waves VFX contract", () => {
  it("publishes complete density, speed, depth, response, glow, and color controls", () => {
    expect(TUNNEL_WAVES_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "ringDensity",
      "tunnelSpeed",
      "tunnelDepth",
      "energyReactivity",
      "glowStrength",
      "backgroundColor",
      "centerColor",
      "midColor",
      "outerColor",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(TUNNEL_WAVES_CONTROL_DEFINITIONS);
  });

  it("bounds perspective, motion, density, response, and glow", () => {
    expect(
      resolveTunnelWavesConfig({
        energyReactivity: 9,
        glowStrength: -4,
        ringDensity: 9_000,
        tunnelDepth: 0,
        tunnelSpeed: -8,
      }),
    ).toEqual({
      ...DEFAULT_TUNNEL_WAVES_CONFIG,
      energyReactivity: 2,
      glowStrength: 0,
      ringDensity: MAX_TUNNEL_RING_DENSITY,
      tunnelDepth: 0.1,
      tunnelSpeed: -2,
    });
    expect(resolveTunnelWavesConfig({ ringDensity: 0 }).ringDensity).toBe(MIN_TUNNEL_RING_DENSITY);
  });

  it("keeps center-to-edge energy order and every gradient role", () => {
    const state = createTunnelWavesUniformState(bands([-1, 0.4, 2], [20, 200, 2_000, 20_000]), {
      centerColor: "#ff0000",
      midColor: "#00ff00",
      outerColor: "#0000ff",
      tunnelDepth: 0.8,
    });
    expect(state.bands).toEqual([0, 0.4, 1]);
    expect(state.centerColor).toEqual([1, 0, 0, 1]);
    expect(state.midColor).toEqual([0, 1, 0, 1]);
    expect(state.outerColor).toEqual([0, 0, 1, 1]);
    expect(state.tunnelDepth).toBe(0.8);
  });

  it("exposes immutable and exactly reproducible presets", () => {
    expectPresets(TUNNEL_WAVES_PRESETS, DEFAULT_TUNNEL_WAVES_CONFIG);
    expect(getTunnelWavesPreset("deep-signal")).toBe(TUNNEL_WAVES_PRESETS[2]);
  });
});

describe("Vortex Rings VFX contract", () => {
  it("publishes every named spiral control through a complete schema", () => {
    expect(VORTEX_RINGS_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "twistAmount",
      "spinSpeed",
      "ringDensity",
      "vortexRadius",
      "energyReactivity",
      "glowStrength",
      "backgroundColor",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "motion",
      "quality",
    ]);
    expectCompleteSchema(VORTEX_RINGS_CONTROL_DEFINITIONS);
  });

  it("bounds twist, spin, density, radius, response, and glow", () => {
    expect(
      resolveVortexRingsConfig({
        energyReactivity: -1,
        glowStrength: 10,
        ringDensity: 80_000,
        spinSpeed: 9,
        twistAmount: -12,
        vortexRadius: 8,
      }),
    ).toEqual({
      ...DEFAULT_VORTEX_RINGS_CONFIG,
      energyReactivity: 0,
      glowStrength: 3,
      ringDensity: MAX_VORTEX_RING_DENSITY,
      spinSpeed: 2,
      twistAmount: -4,
      vortexRadius: 0.95,
    });
    expect(resolveVortexRingsConfig({ ringDensity: 0 }).ringDensity).toBe(MIN_VORTEX_RING_DENSITY);
  });

  it("maps zero and overload without changing radial source order", () => {
    const zero = createVortexRingsUniformState(bands([0, 0], [20, 2_000, 20_000]));
    expect(zero).toMatchObject({ energy: 0, peak: 0 });
    const overload = createVortexRingsUniformState(
      bands([0.2, 5, Number.NaN], [20, 200, 2_000, 20_000]),
      { ringDensity: 32, twistAmount: -2.5 },
    );
    expect(overload.bands).toEqual([0.2, 1, 0]);
    expect(overload).toMatchObject({ peak: 1, ringDensity: 32, twistAmount: -2.5 });
  });

  it("exposes immutable and exactly reproducible presets", () => {
    expectPresets(VORTEX_RINGS_PRESETS, DEFAULT_VORTEX_RINGS_CONFIG);
    expect(getVortexRingsPreset("prism-vortex")).toBe(VORTEX_RINGS_PRESETS[2]);
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

function bands(values: readonly number[], edges: readonly number[]): BandEnergyFrame {
  return Object.freeze({
    bands: Object.freeze(
      values.map((energy, index) =>
        Object.freeze({
          energy,
          highFrequency: edges[index + 1],
          id: `ordered-${index}`,
          lowFrequency: edges[index],
        }),
      ),
    ),
    kind: "bands",
    state: "ready",
  });
}
