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

export const MIN_RADIAL_SPIKE_COUNT = 4;
export const MAX_RADIAL_SPIKE_COUNT = 128;
export const MAX_RADIAL_SPIKE_REACH = 0.92;

export interface RadialSpikesConfig extends VfxSurfaceConfig {
  readonly arcDegrees: number;
  readonly baseColor: string;
  readonly baseRadius: number;
  readonly energyReactivity: number;
  readonly glowStrength: number;
  readonly mode: "radial-spikes";
  readonly renderer: "webgl2";
  readonly rotationDegrees: number;
  readonly spikeCount: number;
  readonly spikeHeight: number;
  readonly spikeWidth: number;
  readonly tipColor: string;
}

export type RadialSpikesConfigInput = Partial<RadialSpikesConfig>;
export type RadialSpikesPresetId = "aurora-crown" | "ember-dial" | "signal-arc";

export type RadialSpikesControlDefinition =
  | VfxColorControlDefinition<"backgroundColor" | "baseColor" | "tipColor">
  | VfxNumericControlDefinition<
      | "arcDegrees"
      | "baseRadius"
      | "energyReactivity"
      | "glowStrength"
      | "rotationDegrees"
      | "spikeCount"
      | "spikeHeight"
      | "spikeWidth"
    >
  | VfxSelectControlDefinition<"motion", RadialSpikesConfig["motion"]>
  | VfxSelectControlDefinition<"quality", RadialSpikesConfig["quality"]>;

export interface RadialSpikesUniformState {
  readonly arcDegrees: number;
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly baseColor: readonly [number, number, number, number];
  readonly baseRadius: number;
  readonly centroid: number;
  readonly energy: number;
  readonly energyReactivity: number;
  readonly glowStrength: number;
  readonly peak: number;
  readonly rotationDegrees: number;
  readonly spikeCount: number;
  readonly spikeHeight: number;
  readonly spikeWidth: number;
  readonly tipColor: readonly [number, number, number, number];
}

export const DEFAULT_RADIAL_SPIKES_CONFIG: RadialSpikesConfig = Object.freeze({
  arcDegrees: 300,
  backgroundColor: "#03060c",
  baseColor: "#39dfff",
  baseRadius: 0.32,
  energyReactivity: 1.2,
  glowStrength: 1.05,
  mode: "radial-spikes",
  motion: "auto",
  quality: "balanced",
  renderer: "webgl2",
  rotationDegrees: 90,
  spikeCount: 48,
  spikeHeight: 0.46,
  spikeWidth: 0.58,
  tipColor: "#ff72c9",
});

export const RADIAL_SPIKES_CONTROL_DEFINITIONS: readonly RadialSpikesControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: [
        `${MIN_RADIAL_SPIKE_COUNT} <= spikeCount <= ${MAX_RADIAL_SPIKE_COUNT}`,
        "Rounded before procedural angular addressing",
      ],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.spikeCount,
      description: "Number of ordered energy spikes distributed across the selected arc.",
      id: "spikeCount",
      label: "Spike count",
      maximum: MAX_RADIAL_SPIKE_COUNT,
      minimum: MIN_RADIAL_SPIKE_COUNT,
      step: 1,
      unit: "spikes",
    }),
    vfxNumberControl({
      constraints: ["0.12 <= baseRadius <= 0.62", "Measured against half the shortest stage edge"],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.baseRadius,
      description: "Radius of the continuous base ring from which spikes extend.",
      id: "baseRadius",
      label: "Base radius",
      maximum: 0.62,
      minimum: 0.12,
      step: 0.01,
      unit: "half-stage",
    }),
    vfxNumberControl({
      constraints: [
        "0.02 <= spikeHeight <= 0.6",
        `baseRadius + spikeHeight <= ${MAX_RADIAL_SPIKE_REACH}`,
      ],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.spikeHeight,
      description: "Maximum radial reach available to each energy-driven spike.",
      id: "spikeHeight",
      label: "Spike height",
      maximum: 0.6,
      minimum: 0.02,
      step: 0.01,
      unit: "half-stage",
    }),
    vfxNumberControl({
      constraints: ["0.08 retains a visible spoke", "0.92 retains an angular gap"],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.spikeWidth,
      description: "Angular fill ratio inside each procedural spike cell.",
      id: "spikeWidth",
      label: "Spike width",
      maximum: 0.92,
      minimum: 0.08,
      step: 0.01,
      unit: "cell-ratio",
    }),
    vfxNumberControl({
      constraints: ["30 <= arcDegrees <= 360", "Arc endpoints remain inside the base ring"],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.arcDegrees,
      description: "Angular span occupied by the ordered spike sequence.",
      id: "arcDegrees",
      label: "Arc",
      maximum: 360,
      minimum: 30,
      step: 1,
      unit: "degrees",
    }),
    vfxNumberControl({
      constraints: ["-180 <= rotationDegrees <= 180", "Rotation never changes source order"],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.rotationDegrees,
      description: "Static orientation of the arc midpoint around the stage center.",
      id: "rotationDegrees",
      label: "Rotation",
      maximum: 180,
      minimum: -180,
      step: 1,
      unit: "degrees",
    }),
    vfxNumberControl({
      constraints: ["Input energy is clamped to 0..1", "At most 16 ordered bands are sampled"],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.energyReactivity,
      description: "How strongly ordered band energy changes spike reach and tip intensity.",
      id: "energyReactivity",
      label: "Energy reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_RADIAL_SPIKES_CONFIG.glowStrength,
      description: "Width and intensity multiplier for the base ring and spike halos.",
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
      "Opaque spatial field behind the radial spike composition.",
      DEFAULT_RADIAL_SPIKES_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "baseColor",
      "Base color",
      "Color of the base ring and each spike root.",
      DEFAULT_RADIAL_SPIKES_CONFIG.baseColor,
    ),
    vfxColorControl(
      "tipColor",
      "Tip color",
      "Color blended into energetic spike tips.",
      DEFAULT_RADIAL_SPIKES_CONFIG.tipColor,
    ),
    vfxMotionControl(
      DEFAULT_RADIAL_SPIKES_CONFIG.motion,
      "Controls deterministic brightness breathing without rotating or reordering spikes.",
    ),
    vfxQualityControl(DEFAULT_RADIAL_SPIKES_CONFIG.quality),
  ]);

export const RADIAL_SPIKES_PRESETS: readonly VfxPreset<RadialSpikesConfig>[] = Object.freeze([
  preset("aurora-crown", "Aurora crown", "Open cyan-magenta crown with balanced reach.", {}),
  preset("ember-dial", "Ember dial", "Dense full-circle amber dial with compact spikes.", {
    arcDegrees: 360,
    backgroundColor: "#0b0301",
    baseColor: "#ff6438",
    baseRadius: 0.4,
    energyReactivity: 1.4,
    glowStrength: 1.45,
    rotationDegrees: -90,
    spikeCount: 72,
    spikeHeight: 0.34,
    spikeWidth: 0.42,
    tipColor: "#ffe06b",
  }),
  preset("signal-arc", "Signal arc", "Sparse diagnostic arc with long narrow spikes.", {
    arcDegrees: 190,
    backgroundColor: "#010908",
    baseColor: "#23c789",
    baseRadius: 0.24,
    energyReactivity: 0.95,
    glowStrength: 0.65,
    rotationDegrees: 90,
    spikeCount: 24,
    spikeHeight: 0.58,
    spikeWidth: 0.24,
    tipColor: "#e8fff6",
  }),
]);

export function resolveRadialSpikesConfig(input: RadialSpikesConfigInput = {}): RadialSpikesConfig {
  const baseRadius = clampFinite(input.baseRadius, 0.12, 0.62, 0.32);
  const maximumHeight = Math.min(0.6, MAX_RADIAL_SPIKE_REACH - baseRadius);
  return Object.freeze({
    arcDegrees: clampFinite(input.arcDegrees, 30, 360, 300),
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_RADIAL_SPIKES_CONFIG.backgroundColor),
    baseColor: nonempty(input.baseColor, DEFAULT_RADIAL_SPIKES_CONFIG.baseColor),
    baseRadius,
    energyReactivity: clampFinite(input.energyReactivity, 0, 2, 1.2),
    glowStrength: clampFinite(input.glowStrength, 0, 3, 1.05),
    mode: "radial-spikes",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_RADIAL_SPIKES_CONFIG.motion,
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_RADIAL_SPIKES_CONFIG.quality,
    renderer: "webgl2",
    rotationDegrees: clampFinite(input.rotationDegrees, -180, 180, 90),
    spikeCount: clampInteger(
      input.spikeCount,
      MIN_RADIAL_SPIKE_COUNT,
      MAX_RADIAL_SPIKE_COUNT,
      DEFAULT_RADIAL_SPIKES_CONFIG.spikeCount,
    ),
    spikeHeight: clampFinite(input.spikeHeight, 0.02, maximumHeight, 0.46),
    spikeWidth: clampFinite(input.spikeWidth, 0.08, 0.92, 0.58),
    tipColor: nonempty(input.tipColor, DEFAULT_RADIAL_SPIKES_CONFIG.tipColor),
  });
}

export function createRadialSpikesUniformState(
  frame: BandEnergyFrame,
  input: RadialSpikesConfigInput | RadialSpikesConfig = {},
): RadialSpikesUniformState {
  const config = resolveRadialSpikesConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    arcDegrees: config.arcDegrees,
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_RADIAL_SPIKES_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    baseColor: parseVfxColor(config.baseColor, DEFAULT_RADIAL_SPIKES_CONFIG.baseColor),
    baseRadius: config.baseRadius,
    centroid: metrics.centroid,
    energy: metrics.energy,
    energyReactivity: config.energyReactivity,
    glowStrength: config.glowStrength,
    peak: metrics.peak,
    rotationDegrees: config.rotationDegrees,
    spikeCount: config.spikeCount,
    spikeHeight: config.spikeHeight,
    spikeWidth: config.spikeWidth,
    tipColor: parseVfxColor(config.tipColor, DEFAULT_RADIAL_SPIKES_CONFIG.tipColor),
  });
}

export function getRadialSpikesPreset(id: RadialSpikesPresetId): VfxPreset<RadialSpikesConfig> {
  return RADIAL_SPIKES_PRESETS.find((candidate) => candidate.id === id) ?? RADIAL_SPIKES_PRESETS[0];
}

function preset(
  id: RadialSpikesPresetId,
  label: string,
  description: string,
  input: RadialSpikesConfigInput,
): VfxPreset<RadialSpikesConfig> {
  return Object.freeze({ config: resolveRadialSpikesConfig(input), description, id, label });
}
