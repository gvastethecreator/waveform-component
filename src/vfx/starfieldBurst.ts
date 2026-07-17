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
import { MAX_VFX_SEED } from "./liquidBlobs";

export const MIN_STARFIELD_COUNT = 12;
export const MAX_STARFIELD_COUNT = 256;

export interface StarfieldBurstConfig extends VfxSurfaceConfig {
  readonly backgroundColor: string;
  readonly burstSpeed: number;
  readonly coreColor: string;
  readonly edgeColor: string;
  readonly mode: "starfield-burst";
  readonly renderer: "webgl2";
  readonly seed: number;
  readonly starCount: number;
  readonly starSize: number;
  readonly trailLength: number;
  readonly transientReactivity: number;
  readonly trebleFlashColor: string;
}

export type StarfieldBurstConfigInput = Partial<StarfieldBurstConfig>;
export type StarfieldBurstPresetId = "cyan-supernova" | "ember-shower" | "violet-warp";

export type StarfieldBurstControlDefinition =
  | VfxColorControlDefinition<"backgroundColor" | "coreColor" | "edgeColor" | "trebleFlashColor">
  | VfxNumericControlDefinition<
      "burstSpeed" | "seed" | "starCount" | "starSize" | "trailLength" | "transientReactivity"
    >
  | VfxSelectControlDefinition<"motion", StarfieldBurstConfig["motion"]>
  | VfxSelectControlDefinition<"quality", StarfieldBurstConfig["quality"]>;

export interface StarfieldBurstUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly burstSpeed: number;
  readonly centroid: number;
  readonly coreColor: readonly [number, number, number, number];
  readonly edgeColor: readonly [number, number, number, number];
  readonly energy: number;
  readonly highEnergy: number;
  readonly peak: number;
  readonly seed: number;
  readonly starCount: number;
  readonly starSize: number;
  readonly trailLength: number;
  readonly transient: number;
  readonly transientReactivity: number;
  readonly trebleFlashColor: readonly [number, number, number, number];
}

export const DEFAULT_STARFIELD_BURST_CONFIG: StarfieldBurstConfig = Object.freeze({
  backgroundColor: "#02050b",
  burstSpeed: 0.75,
  coreColor: "#f6ffff",
  edgeColor: "#3aa8ff",
  mode: "starfield-burst",
  motion: "auto",
  quality: "balanced",
  renderer: "webgl2",
  seed: 7_919,
  starCount: 112,
  starSize: 1.65,
  trailLength: 0.18,
  transientReactivity: 1.35,
  trebleFlashColor: "#9bfff2",
});

export const STARFIELD_BURST_CONTROL_DEFINITIONS: readonly StarfieldBurstControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: [
        `${MIN_STARFIELD_COUNT} <= starCount <= ${MAX_STARFIELD_COUNT}`,
        "Procedural angular addressing samples three neighboring sectors only",
      ],
      defaultValue: DEFAULT_STARFIELD_BURST_CONFIG.starCount,
      description: "Number of seeded radial star sectors in the burst field.",
      id: "starCount",
      label: "Star count",
      maximum: MAX_STARFIELD_COUNT,
      minimum: MIN_STARFIELD_COUNT,
      step: 1,
      unit: "stars",
    }),
    vfxNumberControl({
      constraints: ["0 <= burstSpeed <= 2.5", "Absolute time is period-bounded; no catch-up loop"],
      defaultValue: DEFAULT_STARFIELD_BURST_CONFIG.burstSpeed,
      description: "Outward travel speed of the deterministic radial field.",
      id: "burstSpeed",
      label: "Burst speed",
      maximum: 2.5,
      minimum: 0,
      step: 0.05,
      unit: "cycles/s",
    }),
    vfxNumberControl({
      constraints: ["0.4 <= starSize <= 4", "Converted to bounded drawing-buffer pixels"],
      defaultValue: DEFAULT_STARFIELD_BURST_CONFIG.starSize,
      description: "Head width and halo radius of each star.",
      id: "starSize",
      label: "Star size",
      maximum: 4,
      minimum: 0.4,
      step: 0.05,
      unit: "px",
    }),
    vfxNumberControl({
      constraints: ["0 removes radial tails", "0.55 is the maximum normalized radius"],
      defaultValue: DEFAULT_STARFIELD_BURST_CONFIG.trailLength,
      description: "Maximum inward trail length behind each outward-moving head.",
      id: "trailLength",
      label: "Trail length",
      maximum: 0.55,
      minimum: 0,
      step: 0.01,
      unit: "radius",
    }),
    vfxNumberControl({
      constraints: ["Uses the highest 35% of ordered bands plus peak crest", "Energy is clamped"],
      defaultValue: DEFAULT_STARFIELD_BURST_CONFIG.transientReactivity,
      description: "How strongly treble energy and concentrated peaks flash heads and trails.",
      id: "transientReactivity",
      label: "Transient reactivity",
      maximum: 2.5,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 <= seed <= 65535", "Rounded before deterministic integer hashing"],
      defaultValue: DEFAULT_STARFIELD_BURST_CONFIG.seed,
      description: "Stable integer seed for angle, depth, speed, and brightness variation.",
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
      "Opaque field behind the star burst.",
      DEFAULT_STARFIELD_BURST_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "coreColor",
      "Core color",
      "Bright color at each star head.",
      DEFAULT_STARFIELD_BURST_CONFIG.coreColor,
    ),
    vfxColorControl(
      "edgeColor",
      "Edge color",
      "Base color of trails and outer halos.",
      DEFAULT_STARFIELD_BURST_CONFIG.edgeColor,
    ),
    vfxColorControl(
      "trebleFlashColor",
      "Treble flash color",
      "High-frequency and transient highlight color.",
      DEFAULT_STARFIELD_BURST_CONFIG.trebleFlashColor,
    ),
    vfxMotionControl(
      DEFAULT_STARFIELD_BURST_CONFIG.motion,
      "Controls outward travel; reduced motion renders the seed/time-zero field exactly.",
    ),
    vfxQualityControl(DEFAULT_STARFIELD_BURST_CONFIG.quality),
  ]);

export const STARFIELD_BURST_PRESETS: readonly VfxPreset<StarfieldBurstConfig>[] = Object.freeze([
  preset("cyan-supernova", "Cyan supernova", "Balanced icy burst with readable trails.", {}),
  preset("ember-shower", "Ember shower", "Dense warm sparks with short energetic tails.", {
    backgroundColor: "#0c0301",
    burstSpeed: 1.25,
    coreColor: "#fff5c6",
    edgeColor: "#ff5d27",
    seed: 35_021,
    starCount: 188,
    starSize: 1.1,
    trailLength: 0.1,
    transientReactivity: 1.75,
    trebleFlashColor: "#ffd24c",
  }),
  preset("violet-warp", "Violet warp", "Sparse large stars with long magenta-violet trails.", {
    backgroundColor: "#05020d",
    burstSpeed: 0.42,
    coreColor: "#fff7ff",
    edgeColor: "#7755ff",
    seed: 61_203,
    starCount: 54,
    starSize: 2.7,
    trailLength: 0.42,
    transientReactivity: 0.95,
    trebleFlashColor: "#ff66d9",
  }),
]);

export function resolveStarfieldBurstConfig(
  input: StarfieldBurstConfigInput = {},
): StarfieldBurstConfig {
  return Object.freeze({
    backgroundColor: nonempty(
      input.backgroundColor,
      DEFAULT_STARFIELD_BURST_CONFIG.backgroundColor,
    ),
    burstSpeed: clampFinite(input.burstSpeed, 0, 2.5, DEFAULT_STARFIELD_BURST_CONFIG.burstSpeed),
    coreColor: nonempty(input.coreColor, DEFAULT_STARFIELD_BURST_CONFIG.coreColor),
    edgeColor: nonempty(input.edgeColor, DEFAULT_STARFIELD_BURST_CONFIG.edgeColor),
    mode: "starfield-burst",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_STARFIELD_BURST_CONFIG.motion,
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_STARFIELD_BURST_CONFIG.quality,
    renderer: "webgl2",
    seed: clampInteger(input.seed, 0, MAX_VFX_SEED, DEFAULT_STARFIELD_BURST_CONFIG.seed),
    starCount: clampInteger(
      input.starCount,
      MIN_STARFIELD_COUNT,
      MAX_STARFIELD_COUNT,
      DEFAULT_STARFIELD_BURST_CONFIG.starCount,
    ),
    starSize: clampFinite(input.starSize, 0.4, 4, DEFAULT_STARFIELD_BURST_CONFIG.starSize),
    trailLength: clampFinite(
      input.trailLength,
      0,
      0.55,
      DEFAULT_STARFIELD_BURST_CONFIG.trailLength,
    ),
    transientReactivity: clampFinite(
      input.transientReactivity,
      0,
      2.5,
      DEFAULT_STARFIELD_BURST_CONFIG.transientReactivity,
    ),
    trebleFlashColor: nonempty(
      input.trebleFlashColor,
      DEFAULT_STARFIELD_BURST_CONFIG.trebleFlashColor,
    ),
  });
}

export function createStarfieldBurstUniformState(
  frame: BandEnergyFrame,
  input: StarfieldBurstConfigInput | StarfieldBurstConfig = {},
): StarfieldBurstUniformState {
  const config = resolveStarfieldBurstConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_STARFIELD_BURST_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    burstSpeed: config.burstSpeed,
    centroid: metrics.centroid,
    coreColor: parseVfxColor(config.coreColor, DEFAULT_STARFIELD_BURST_CONFIG.coreColor),
    edgeColor: parseVfxColor(config.edgeColor, DEFAULT_STARFIELD_BURST_CONFIG.edgeColor),
    energy: metrics.energy,
    highEnergy: bandRangeRms(metrics.bands, 0.65, 1),
    peak: metrics.peak,
    seed: config.seed,
    starCount: config.starCount,
    starSize: config.starSize,
    trailLength: config.trailLength,
    transient: clampFinite(metrics.peak - metrics.energy * 0.55, 0, 1, 0),
    transientReactivity: config.transientReactivity,
    trebleFlashColor: parseVfxColor(
      config.trebleFlashColor,
      DEFAULT_STARFIELD_BURST_CONFIG.trebleFlashColor,
    ),
  });
}

export function getStarfieldBurstPreset(
  id: StarfieldBurstPresetId,
): VfxPreset<StarfieldBurstConfig> {
  return (
    STARFIELD_BURST_PRESETS.find((candidate) => candidate.id === id) ?? STARFIELD_BURST_PRESETS[0]
  );
}

function preset(
  id: StarfieldBurstPresetId,
  label: string,
  description: string,
  input: StarfieldBurstConfigInput,
): VfxPreset<StarfieldBurstConfig> {
  return Object.freeze({ config: resolveStarfieldBurstConfig(input), description, id, label });
}
