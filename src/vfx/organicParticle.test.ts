import { describe, expect, it } from "vitest";
import type { BandEnergyFrame } from "../types";
import {
  DEFAULT_LIQUID_BLOBS_CONFIG,
  LIQUID_BLOBS_CONTROL_DEFINITIONS,
  LIQUID_BLOBS_PRESETS,
  MAX_LIQUID_BLOB_COUNT,
  MAX_VFX_SEED,
  MIN_LIQUID_BLOB_COUNT,
  createLiquidBlobsUniformState,
  getLiquidBlobsPreset,
  resolveLiquidBlobsConfig,
} from "./liquidBlobs";
import {
  MAX_STARFIELD_COUNT,
  MIN_STARFIELD_COUNT,
  STARFIELD_BURST_CONTROL_DEFINITIONS,
  STARFIELD_BURST_PRESETS,
  createStarfieldBurstUniformState,
  getStarfieldBurstPreset,
  resolveStarfieldBurstConfig,
} from "./starfieldBurst";
import { VFX_TIME_PERIOD_SECONDS, resolveVfxTime } from "./shared";

const lowFrame = bands([1, 0.82, 0.16, 0.08, 0.04, 0.02]);
const highFrame = bands([0.02, 0.04, 0.08, 0.16, 0.82, 1]);

describe("Liquid Blobs schema", () => {
  it("publishes complete effect-specific controls and immutable presets", () => {
    expect(LIQUID_BLOBS_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "blobCount",
      "blobSize",
      "driftSpeed",
      "glowStrength",
      "threshold",
      "lowFrequencyReactivity",
      "seed",
      "backgroundColor",
      "baseColor",
      "blobColor",
      "peakFlashColor",
      "motion",
      "quality",
    ]);
    expect(LIQUID_BLOBS_PRESETS).toHaveLength(3);
    expect(Object.isFrozen(LIQUID_BLOBS_PRESETS[0].config)).toBe(true);
    expect(getLiquidBlobsPreset("magma-bloom").config.mode).toBe("liquid-blobs");
  });

  it("clamps hostile counts, seed, field controls, and invalid common values", () => {
    expect(
      resolveLiquidBlobsConfig({
        blobCount: 99_999,
        blobSize: Number.POSITIVE_INFINITY,
        driftSpeed: -99,
        glowStrength: 99,
        lowFrequencyReactivity: -2,
        motion: "cinematic" as never,
        quality: "ultra" as never,
        seed: 99_999,
        threshold: -1,
      }),
    ).toMatchObject({
      blobCount: MAX_LIQUID_BLOB_COUNT,
      blobSize: DEFAULT_LIQUID_BLOBS_CONFIG.blobSize,
      driftSpeed: -1.5,
      glowStrength: 3,
      lowFrequencyReactivity: 0,
      motion: "auto",
      quality: "balanced",
      seed: MAX_VFX_SEED,
      threshold: 0.2,
    });
    expect(resolveLiquidBlobsConfig({ blobCount: -10 }).blobCount).toBe(MIN_LIQUID_BLOB_COUNT);
  });

  it("maps the low ordered band range without making seed nondeterministic", () => {
    const first = createLiquidBlobsUniformState(lowFrame, { seed: 41 });
    const repeat = createLiquidBlobsUniformState(lowFrame, { seed: 41 });
    const high = createLiquidBlobsUniformState(highFrame, { seed: 41 });
    expect(first).toEqual(repeat);
    expect(first.seed).toBe(41);
    expect(first.lowEnergy).toBeGreaterThan(high.lowEnergy);
    expect(first.bands).toEqual([1, 0.82, 0.16, 0.08, 0.04, 0.02]);
  });
});

describe("Starfield Burst schema", () => {
  it("publishes complete controls, deterministic presets, and hard procedural ceilings", () => {
    expect(STARFIELD_BURST_CONTROL_DEFINITIONS.map((control) => control.id)).toEqual([
      "starCount",
      "burstSpeed",
      "starSize",
      "trailLength",
      "transientReactivity",
      "seed",
      "backgroundColor",
      "coreColor",
      "edgeColor",
      "trebleFlashColor",
      "motion",
      "quality",
    ]);
    expect(STARFIELD_BURST_PRESETS).toHaveLength(3);
    expect(getStarfieldBurstPreset("violet-warp").config.mode).toBe("starfield-burst");
    expect(Object.isFrozen(STARFIELD_BURST_PRESETS[2].config)).toBe(true);
  });

  it("clamps counts, trails, speed, size, response, and seed", () => {
    expect(
      resolveStarfieldBurstConfig({
        burstSpeed: 99,
        seed: -4,
        starCount: 1_000,
        starSize: 0,
        trailLength: 2,
        transientReactivity: 9,
      }),
    ).toMatchObject({
      burstSpeed: 2.5,
      seed: 0,
      starCount: MAX_STARFIELD_COUNT,
      starSize: 0.4,
      trailLength: 0.55,
      transientReactivity: 2.5,
    });
    expect(resolveStarfieldBurstConfig({ starCount: -1 }).starCount).toBe(MIN_STARFIELD_COUNT);
  });

  it("maps high ordered bands and peak crest independently from a stable seed", () => {
    const low = createStarfieldBurstUniformState(lowFrame, { seed: 71 });
    const high = createStarfieldBurstUniformState(highFrame, { seed: 71 });
    expect(high.highEnergy).toBeGreaterThan(low.highEnergy);
    expect(high.seed).toBe(71);
    expect(createStarfieldBurstUniformState(highFrame, { seed: 71 })).toEqual(high);
    expect(high.transient).toBeGreaterThan(0);
  });
});

describe("bounded VFX time", () => {
  it("freezes reduced motion and wraps long absolute frames without catch-up state", () => {
    expect(resolveVfxTime(92, true)).toBe(0);
    expect(resolveVfxTime(Number.POSITIVE_INFINITY, false)).toBe(0);
    expect(resolveVfxTime(-1, false)).toBe(0);
    expect(resolveVfxTime(VFX_TIME_PERIOD_SECONDS + 1.25, false)).toBe(1.25);
    expect(resolveVfxTime(VFX_TIME_PERIOD_SECONDS * 10_000 + 3.5, false)).toBe(3.5);
  });
});

function bands(energies: readonly number[]): BandEnergyFrame {
  return Object.freeze({
    bands: Object.freeze(
      energies.map((energy, index) =>
        Object.freeze({
          energy,
          highFrequency: 20 * 2 ** (index + 1),
          id: `band-${index}`,
          lowFrequency: 20 * 2 ** index,
        }),
      ),
    ),
    kind: "bands",
    state: "ready",
  });
}
