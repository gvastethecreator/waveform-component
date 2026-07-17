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
  clampFinite,
  clampInteger,
  createBandUniformMetrics,
  isVfxMotion,
  isVfxQuality,
  nonempty,
  parseVfxColor,
} from "./shared";

export const MIN_VORTEX_RING_DENSITY = 3;
export const MAX_VORTEX_RING_DENSITY = 48;

export interface VortexRingsConfig extends VfxSurfaceConfig {
  readonly accentColor: string;
  readonly energyReactivity: number;
  readonly glowStrength: number;
  readonly mode: "vortex-rings";
  readonly primaryColor: string;
  readonly renderer: "webgl2";
  readonly ringDensity: number;
  readonly secondaryColor: string;
  readonly spinSpeed: number;
  readonly twistAmount: number;
  readonly vortexRadius: number;
}

export type VortexRingsConfigInput = Partial<VortexRingsConfig>;
export type VortexRingsPresetId = "ember-helix" | "prism-vortex" | "violet-eye";

export type VortexRingsControlDefinition =
  | VfxColorControlDefinition<"accentColor" | "backgroundColor" | "primaryColor" | "secondaryColor">
  | VfxNumericControlDefinition<
      | "energyReactivity"
      | "glowStrength"
      | "ringDensity"
      | "spinSpeed"
      | "twistAmount"
      | "vortexRadius"
    >
  | VfxSelectControlDefinition<"motion", VortexRingsConfig["motion"]>
  | VfxSelectControlDefinition<"quality", VortexRingsConfig["quality"]>;

export interface VortexRingsUniformState {
  readonly accentColor: readonly [number, number, number, number];
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly centroid: number;
  readonly energy: number;
  readonly energyReactivity: number;
  readonly glowStrength: number;
  readonly peak: number;
  readonly primaryColor: readonly [number, number, number, number];
  readonly ringDensity: number;
  readonly secondaryColor: readonly [number, number, number, number];
  readonly spinSpeed: number;
  readonly twistAmount: number;
  readonly vortexRadius: number;
}

export const DEFAULT_VORTEX_RINGS_CONFIG: VortexRingsConfig = Object.freeze({
  accentColor: "#fff3a8",
  backgroundColor: "#05030b",
  energyReactivity: 1.2,
  glowStrength: 1.1,
  mode: "vortex-rings",
  motion: "auto",
  primaryColor: "#8d72ff",
  quality: "balanced",
  renderer: "webgl2",
  ringDensity: 18,
  secondaryColor: "#ff63c7",
  spinSpeed: 0.32,
  twistAmount: 1.45,
  vortexRadius: 0.78,
});

export const VORTEX_RINGS_CONTROL_DEFINITIONS: readonly VortexRingsControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: ["-4 <= twistAmount <= 4", "Sign changes handedness without band reordering"],
      defaultValue: DEFAULT_VORTEX_RINGS_CONFIG.twistAmount,
      description: "Angular winding applied from the eye to the outer ring field.",
      id: "twistAmount",
      label: "Twist amount",
      maximum: 4,
      minimum: -4,
      step: 0.05,
      unit: "turns",
    }),
    vfxNumberControl({
      constraints: ["Negative values reverse spin", "Reduced motion freezes the phase"],
      defaultValue: DEFAULT_VORTEX_RINGS_CONFIG.spinSpeed,
      description: "Phase travel around the fixed radial energy ordering.",
      id: "spinSpeed",
      label: "Spin speed",
      maximum: 2,
      minimum: -2,
      step: 0.05,
      unit: "cycles/s",
    }),
    vfxNumberControl({
      constraints: [
        `${MIN_VORTEX_RING_DENSITY} <= ringDensity <= ${MAX_VORTEX_RING_DENSITY}`,
        "Rounded before procedural radial addressing",
      ],
      defaultValue: DEFAULT_VORTEX_RINGS_CONFIG.ringDensity,
      description: "Number of spiral ring intervals inside the bounded vortex radius.",
      id: "ringDensity",
      label: "Ring density",
      maximum: MAX_VORTEX_RING_DENSITY,
      minimum: MIN_VORTEX_RING_DENSITY,
      step: 1,
      unit: "rings",
    }),
    vfxNumberControl({
      constraints: ["0.25 <= vortexRadius <= 0.95", "Measured against half the shortest edge"],
      defaultValue: DEFAULT_VORTEX_RINGS_CONFIG.vortexRadius,
      description: "Outer spatial boundary of the vortex composition.",
      id: "vortexRadius",
      label: "Vortex radius",
      maximum: 0.95,
      minimum: 0.25,
      step: 0.01,
      unit: "half-stage",
    }),
    vfxNumberControl({
      constraints: ["Input energy is clamped to 0..1", "At most 16 radial bands are sampled"],
      defaultValue: DEFAULT_VORTEX_RINGS_CONFIG.energyReactivity,
      description: "How strongly ordered energy changes spiral ring width and accent intensity.",
      id: "energyReactivity",
      label: "Energy reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_VORTEX_RINGS_CONFIG.glowStrength,
      description: "Width and intensity multiplier for spiral halos and the central eye.",
      id: "glowStrength",
      label: "Glow strength",
      maximum: 3,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxColorControl(
      "backgroundColor",
      "Background color",
      "Opaque field outside and between vortex rings.",
      DEFAULT_VORTEX_RINGS_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "primaryColor",
      "Primary color",
      "Color at the inner radial energy field.",
      DEFAULT_VORTEX_RINGS_CONFIG.primaryColor,
    ),
    vfxColorControl(
      "secondaryColor",
      "Secondary color",
      "Color blended toward the outer ring field.",
      DEFAULT_VORTEX_RINGS_CONFIG.secondaryColor,
    ),
    vfxColorControl(
      "accentColor",
      "Accent color",
      "Peak-energy highlight and central-eye color.",
      DEFAULT_VORTEX_RINGS_CONFIG.accentColor,
    ),
    vfxMotionControl(
      DEFAULT_VORTEX_RINGS_CONFIG.motion,
      "Controls spiral phase travel while preserving center-to-edge source order.",
    ),
    vfxQualityControl(DEFAULT_VORTEX_RINGS_CONFIG.quality),
  ]);

export const VORTEX_RINGS_PRESETS: readonly VfxPreset<VortexRingsConfig>[] = Object.freeze([
  preset("violet-eye", "Violet eye", "Balanced violet-rose spiral with a warm eye.", {}),
  preset("ember-helix", "Ember helix", "Broad reverse-handed amber spiral.", {
    accentColor: "#fff2a6",
    backgroundColor: "#0c0301",
    energyReactivity: 1.4,
    glowStrength: 1.5,
    primaryColor: "#ff6338",
    ringDensity: 12,
    secondaryColor: "#ffbd4a",
    spinSpeed: -0.42,
    twistAmount: -2.2,
    vortexRadius: 0.84,
  }),
  preset("prism-vortex", "Prism vortex", "Dense cool spiral with a compact bright eye.", {
    accentColor: "#ecffb1",
    backgroundColor: "#02050f",
    energyReactivity: 0.92,
    glowStrength: 0.7,
    primaryColor: "#42e5ff",
    ringDensity: 32,
    secondaryColor: "#7474ff",
    spinSpeed: 0.75,
    twistAmount: 3.1,
    vortexRadius: 0.66,
  }),
]);

export function resolveVortexRingsConfig(input: VortexRingsConfigInput = {}): VortexRingsConfig {
  return Object.freeze({
    accentColor: nonempty(input.accentColor, DEFAULT_VORTEX_RINGS_CONFIG.accentColor),
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_VORTEX_RINGS_CONFIG.backgroundColor),
    energyReactivity: clampFinite(input.energyReactivity, 0, 2, 1.2),
    glowStrength: clampFinite(input.glowStrength, 0, 3, 1.1),
    mode: "vortex-rings",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_VORTEX_RINGS_CONFIG.motion,
    primaryColor: nonempty(input.primaryColor, DEFAULT_VORTEX_RINGS_CONFIG.primaryColor),
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_VORTEX_RINGS_CONFIG.quality,
    renderer: "webgl2",
    ringDensity: clampInteger(
      input.ringDensity,
      MIN_VORTEX_RING_DENSITY,
      MAX_VORTEX_RING_DENSITY,
      DEFAULT_VORTEX_RINGS_CONFIG.ringDensity,
    ),
    secondaryColor: nonempty(input.secondaryColor, DEFAULT_VORTEX_RINGS_CONFIG.secondaryColor),
    spinSpeed: clampFinite(input.spinSpeed, -2, 2, 0.32),
    twistAmount: clampFinite(input.twistAmount, -4, 4, 1.45),
    vortexRadius: clampFinite(input.vortexRadius, 0.25, 0.95, 0.78),
  });
}

export function createVortexRingsUniformState(
  frame: BandEnergyFrame,
  input: VortexRingsConfigInput | VortexRingsConfig = {},
): VortexRingsUniformState {
  const config = resolveVortexRingsConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    accentColor: parseVfxColor(config.accentColor, DEFAULT_VORTEX_RINGS_CONFIG.accentColor),
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_VORTEX_RINGS_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    centroid: metrics.centroid,
    energy: metrics.energy,
    energyReactivity: config.energyReactivity,
    glowStrength: config.glowStrength,
    peak: metrics.peak,
    primaryColor: parseVfxColor(config.primaryColor, DEFAULT_VORTEX_RINGS_CONFIG.primaryColor),
    ringDensity: config.ringDensity,
    secondaryColor: parseVfxColor(
      config.secondaryColor,
      DEFAULT_VORTEX_RINGS_CONFIG.secondaryColor,
    ),
    spinSpeed: config.spinSpeed,
    twistAmount: config.twistAmount,
    vortexRadius: config.vortexRadius,
  });
}

export function getVortexRingsPreset(id: VortexRingsPresetId): VfxPreset<VortexRingsConfig> {
  return VORTEX_RINGS_PRESETS.find((candidate) => candidate.id === id) ?? VORTEX_RINGS_PRESETS[0];
}

function preset(
  id: VortexRingsPresetId,
  label: string,
  description: string,
  input: VortexRingsConfigInput,
): VfxPreset<VortexRingsConfig> {
  return Object.freeze({ config: resolveVortexRingsConfig(input), description, id, label });
}
