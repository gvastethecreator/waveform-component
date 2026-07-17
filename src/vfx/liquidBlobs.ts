import type { BandEnergyFrame } from "../types";
import {
  vfxColorControl,
  vfxMotionControl,
  vfxNumberControl,
  vfxQualityControl,
} from "./controlFactories";
import type {
  VfxColorControlDefinition,
  VfxNumericControlDefinition,
  VfxPreset,
  VfxSelectControlDefinition,
  VfxSurfaceConfig,
} from "./schema";
import {
  bandRangeRms,
  clampFinite,
  clampInteger,
  createBandUniformMetrics,
  isVfxMotion,
  isVfxQuality,
  nonempty,
  parseVfxColor,
} from "./shared";

export const MIN_LIQUID_BLOB_COUNT = 2;
export const MAX_LIQUID_BLOB_COUNT = 24;
export const MAX_VFX_SEED = 65_535;

export interface LiquidBlobsConfig extends VfxSurfaceConfig {
  readonly backgroundColor: string;
  readonly baseColor: string;
  readonly blobColor: string;
  readonly blobCount: number;
  readonly blobSize: number;
  readonly driftSpeed: number;
  readonly glowStrength: number;
  readonly lowFrequencyReactivity: number;
  readonly mode: "liquid-blobs";
  readonly peakFlashColor: string;
  readonly renderer: "webgl2";
  readonly seed: number;
  readonly threshold: number;
}

export type LiquidBlobsConfigInput = Partial<LiquidBlobsConfig>;
export type LiquidBlobsPresetId = "magma-bloom" | "mint-mercury" | "tidal-ink";

export type LiquidBlobsControlDefinition =
  | VfxColorControlDefinition<"backgroundColor" | "baseColor" | "blobColor" | "peakFlashColor">
  | VfxNumericControlDefinition<
      | "blobCount"
      | "blobSize"
      | "driftSpeed"
      | "glowStrength"
      | "lowFrequencyReactivity"
      | "seed"
      | "threshold"
    >
  | VfxSelectControlDefinition<"motion", LiquidBlobsConfig["motion"]>
  | VfxSelectControlDefinition<"quality", LiquidBlobsConfig["quality"]>;

export interface LiquidBlobsUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly baseColor: readonly [number, number, number, number];
  readonly blobColor: readonly [number, number, number, number];
  readonly blobCount: number;
  readonly blobSize: number;
  readonly centroid: number;
  readonly driftSpeed: number;
  readonly energy: number;
  readonly glowStrength: number;
  readonly lowEnergy: number;
  readonly lowFrequencyReactivity: number;
  readonly peak: number;
  readonly peakFlashColor: readonly [number, number, number, number];
  readonly seed: number;
  readonly threshold: number;
}

export const DEFAULT_LIQUID_BLOBS_CONFIG: LiquidBlobsConfig = Object.freeze({
  backgroundColor: "#03070a",
  baseColor: "#102d3a",
  blobColor: "#3fe0c5",
  blobCount: 9,
  blobSize: 0.2,
  driftSpeed: 0.38,
  glowStrength: 1.15,
  lowFrequencyReactivity: 1.3,
  mode: "liquid-blobs",
  motion: "auto",
  peakFlashColor: "#dcfff8",
  quality: "balanced",
  renderer: "webgl2",
  seed: 2_731,
  threshold: 0.54,
});

export const LIQUID_BLOBS_CONTROL_DEFINITIONS: readonly LiquidBlobsControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: [
        `${MIN_LIQUID_BLOB_COUNT} <= blobCount <= ${MAX_LIQUID_BLOB_COUNT}`,
        "One fixed 24-iteration shader loop; no count-sized allocation",
      ],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.blobCount,
      description: "Number of deterministic metaball contributors in the organic field.",
      id: "blobCount",
      label: "Blob count",
      maximum: MAX_LIQUID_BLOB_COUNT,
      minimum: MIN_LIQUID_BLOB_COUNT,
      step: 1,
      unit: "blobs",
    }),
    vfxNumberControl({
      constraints: ["0.08 <= blobSize <= 0.36", "Measured against half the shortest stage edge"],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.blobSize,
      description: "Base influence radius of each liquid body before low-frequency response.",
      id: "blobSize",
      label: "Blob size",
      maximum: 0.36,
      minimum: 0.08,
      step: 0.01,
      unit: "half-stage",
    }),
    vfxNumberControl({
      constraints: ["-1.5 <= driftSpeed <= 1.5", "Motion is stateless and time-period bounded"],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.driftSpeed,
      description: "Direction and speed of deterministic orbital drift.",
      id: "driftSpeed",
      label: "Drift speed",
      maximum: 1.5,
      minimum: -1.5,
      step: 0.05,
      unit: "cycles/s",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.glowStrength,
      description: "Width and intensity of the liquid boundary halo.",
      id: "glowStrength",
      label: "Glow strength",
      maximum: 3,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0.2 keeps bodies separate", "0.9 strongly merges neighboring bodies"],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.threshold,
      description: "Connection threshold that controls when neighboring bodies merge.",
      id: "threshold",
      label: "Merge threshold",
      maximum: 0.9,
      minimum: 0.2,
      step: 0.01,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["Uses the lowest 35% of ordered bands", "Input energy is clamped to 0..1"],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.lowFrequencyReactivity,
      description: "How strongly low-frequency energy expands and joins the blobs.",
      id: "lowFrequencyReactivity",
      label: "Bass reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 <= seed <= 65535", "Rounded before deterministic integer hashing"],
      defaultValue: DEFAULT_LIQUID_BLOBS_CONFIG.seed,
      description: "Stable integer seed for blob placement and orbital phase.",
      id: "seed",
      label: "Seed",
      maximum: MAX_VFX_SEED,
      minimum: 0,
      step: 1,
      unit: "integer",
    }),
    vfxColorControl(
      "backgroundColor",
      "Background color",
      "Opaque field behind the liquid composition.",
      DEFAULT_LIQUID_BLOBS_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "baseColor",
      "Base color",
      "Low-intensity body and boundary color.",
      DEFAULT_LIQUID_BLOBS_CONFIG.baseColor,
    ),
    vfxColorControl(
      "blobColor",
      "Blob color",
      "Primary interior color of merged liquid bodies.",
      DEFAULT_LIQUID_BLOBS_CONFIG.blobColor,
    ),
    vfxColorControl(
      "peakFlashColor",
      "Peak flash color",
      "Highlight color driven by concentrated peak energy.",
      DEFAULT_LIQUID_BLOBS_CONFIG.peakFlashColor,
    ),
    vfxMotionControl(
      DEFAULT_LIQUID_BLOBS_CONFIG.motion,
      "Controls deterministic orbital drift; reduced motion renders seed/time zero exactly.",
    ),
    vfxQualityControl(DEFAULT_LIQUID_BLOBS_CONFIG.quality),
  ]);

export const LIQUID_BLOBS_PRESETS: readonly VfxPreset<LiquidBlobsConfig>[] = Object.freeze([
  preset("tidal-ink", "Tidal ink", "Cool connected bodies with restrained orbital drift.", {}),
  preset("magma-bloom", "Magma bloom", "Dense amber-red pools with bright peak flashes.", {
    backgroundColor: "#0d0201",
    baseColor: "#4d1109",
    blobColor: "#ff5a24",
    blobCount: 13,
    blobSize: 0.17,
    driftSpeed: -0.52,
    glowStrength: 1.75,
    lowFrequencyReactivity: 1.55,
    peakFlashColor: "#fff1a8",
    seed: 9_117,
    threshold: 0.66,
  }),
  preset("mint-mercury", "Mint mercury", "Sparse pale bodies with broad reflective boundaries.", {
    backgroundColor: "#020b0b",
    baseColor: "#123936",
    blobColor: "#75ffe0",
    blobCount: 5,
    blobSize: 0.29,
    driftSpeed: 0.18,
    glowStrength: 0.8,
    lowFrequencyReactivity: 0.85,
    peakFlashColor: "#f4fffb",
    seed: 48_209,
    threshold: 0.4,
  }),
]);

export function resolveLiquidBlobsConfig(input: LiquidBlobsConfigInput = {}): LiquidBlobsConfig {
  return Object.freeze({
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_LIQUID_BLOBS_CONFIG.backgroundColor),
    baseColor: nonempty(input.baseColor, DEFAULT_LIQUID_BLOBS_CONFIG.baseColor),
    blobColor: nonempty(input.blobColor, DEFAULT_LIQUID_BLOBS_CONFIG.blobColor),
    blobCount: clampInteger(
      input.blobCount,
      MIN_LIQUID_BLOB_COUNT,
      MAX_LIQUID_BLOB_COUNT,
      DEFAULT_LIQUID_BLOBS_CONFIG.blobCount,
    ),
    blobSize: clampFinite(input.blobSize, 0.08, 0.36, DEFAULT_LIQUID_BLOBS_CONFIG.blobSize),
    driftSpeed: clampFinite(input.driftSpeed, -1.5, 1.5, DEFAULT_LIQUID_BLOBS_CONFIG.driftSpeed),
    glowStrength: clampFinite(input.glowStrength, 0, 3, DEFAULT_LIQUID_BLOBS_CONFIG.glowStrength),
    lowFrequencyReactivity: clampFinite(
      input.lowFrequencyReactivity,
      0,
      2,
      DEFAULT_LIQUID_BLOBS_CONFIG.lowFrequencyReactivity,
    ),
    mode: "liquid-blobs",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_LIQUID_BLOBS_CONFIG.motion,
    peakFlashColor: nonempty(input.peakFlashColor, DEFAULT_LIQUID_BLOBS_CONFIG.peakFlashColor),
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_LIQUID_BLOBS_CONFIG.quality,
    renderer: "webgl2",
    seed: clampInteger(input.seed, 0, MAX_VFX_SEED, DEFAULT_LIQUID_BLOBS_CONFIG.seed),
    threshold: clampFinite(input.threshold, 0.2, 0.9, DEFAULT_LIQUID_BLOBS_CONFIG.threshold),
  });
}

export function createLiquidBlobsUniformState(
  frame: BandEnergyFrame,
  input: LiquidBlobsConfigInput | LiquidBlobsConfig = {},
): LiquidBlobsUniformState {
  const config = resolveLiquidBlobsConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_LIQUID_BLOBS_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    baseColor: parseVfxColor(config.baseColor, DEFAULT_LIQUID_BLOBS_CONFIG.baseColor),
    blobColor: parseVfxColor(config.blobColor, DEFAULT_LIQUID_BLOBS_CONFIG.blobColor),
    blobCount: config.blobCount,
    blobSize: config.blobSize,
    centroid: metrics.centroid,
    driftSpeed: config.driftSpeed,
    energy: metrics.energy,
    glowStrength: config.glowStrength,
    lowEnergy: bandRangeRms(metrics.bands, 0, 0.35),
    lowFrequencyReactivity: config.lowFrequencyReactivity,
    peak: metrics.peak,
    peakFlashColor: parseVfxColor(
      config.peakFlashColor,
      DEFAULT_LIQUID_BLOBS_CONFIG.peakFlashColor,
    ),
    seed: config.seed,
    threshold: config.threshold,
  });
}

export function getLiquidBlobsPreset(id: LiquidBlobsPresetId): VfxPreset<LiquidBlobsConfig> {
  return LIQUID_BLOBS_PRESETS.find((candidate) => candidate.id === id) ?? LIQUID_BLOBS_PRESETS[0];
}

function preset(
  id: LiquidBlobsPresetId,
  label: string,
  description: string,
  input: LiquidBlobsConfigInput,
): VfxPreset<LiquidBlobsConfig> {
  return Object.freeze({ config: resolveLiquidBlobsConfig(input), description, id, label });
}
