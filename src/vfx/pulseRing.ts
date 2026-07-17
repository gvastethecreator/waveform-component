import type { BandEnergyFrame } from "../types";
import {
  VFX_CONTROL_CONTEXT,
  type VfxColorControlDefinition,
  type VfxMotion,
  type VfxNumericControlDefinition,
  type VfxQuality,
  type VfxSelectControlDefinition,
  type VfxSurfaceConfig,
} from "./schema";
import {
  clampFinite,
  createBandUniformMetrics,
  isVfxMotion,
  isVfxQuality,
  nonempty,
  parseVfxColor,
  resolveVfxTime,
} from "./shared";

export type PulseRingMotion = VfxMotion;
export type PulseRingQuality = VfxQuality;

export interface PulseRingConfig extends VfxSurfaceConfig {
  readonly bandReactivity: number;
  readonly glowStrength: number;
  readonly mode: "pulse-ring";
  readonly motion: PulseRingMotion;
  readonly primaryColor: string;
  readonly quality: PulseRingQuality;
  readonly renderer: "webgl2";
  readonly rotationSpeed: number;
  readonly secondaryColor: string;
  readonly sweepColor: string;
  readonly tertiaryColor: string;
  readonly thickness: number;
}

export type PulseRingConfigInput = Partial<PulseRingConfig>;

export type PulseRingControlDefinition =
  | VfxColorControlDefinition<
      "backgroundColor" | "primaryColor" | "secondaryColor" | "sweepColor" | "tertiaryColor"
    >
  | VfxNumericControlDefinition<"bandReactivity" | "glowStrength" | "rotationSpeed" | "thickness">
  | VfxSelectControlDefinition<"motion", PulseRingMotion>
  | VfxSelectControlDefinition<"quality", PulseRingQuality>;

export interface PulseRingUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bandReactivity: number;
  readonly bands: readonly number[];
  readonly centroid: number;
  readonly energy: number;
  readonly glowStrength: number;
  readonly peak: number;
  readonly primaryColor: readonly [number, number, number, number];
  readonly rotationSpeed: number;
  readonly secondaryColor: readonly [number, number, number, number];
  readonly sweepColor: readonly [number, number, number, number];
  readonly tertiaryColor: readonly [number, number, number, number];
  readonly thickness: number;
}

export const DEFAULT_PULSE_RING_CONFIG: PulseRingConfig = Object.freeze({
  backgroundColor: "#061014",
  bandReactivity: 1,
  glowStrength: 0.75,
  mode: "pulse-ring",
  motion: "auto",
  primaryColor: "#62dcf5",
  quality: "balanced",
  renderer: "webgl2",
  rotationSpeed: 0.18,
  secondaryColor: "#a7f59c",
  sweepColor: "#f8d65c",
  tertiaryColor: "#ff7892",
  thickness: 0.055,
});

export const PULSE_RING_CONTROL_DEFINITIONS: readonly PulseRingControlDefinition[] = Object.freeze([
  Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze(["0.01 <= thickness <= 0.18"]),
    defaultValue: DEFAULT_PULSE_RING_CONFIG.thickness,
    description: "Visible core width as a fraction of the shorter stage dimension.",
    id: "thickness",
    label: "Ring thickness",
    maximum: 0.18,
    minimum: 0.01,
    step: 0.005,
    type: "number",
    unit: "ratio",
  }),
  Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze(["0 disables the halo", "2 is the maximum halo gain"]),
    defaultValue: DEFAULT_PULSE_RING_CONFIG.glowStrength,
    description: "Energy-scaled halo intensity around the ring core.",
    id: "glowStrength",
    label: "Glow strength",
    maximum: 2,
    minimum: 0,
    step: 0.05,
    type: "number",
    unit: "x",
  }),
  Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "Negative values reverse direction",
      "Reduced motion freezes time",
    ]),
    defaultValue: DEFAULT_PULSE_RING_CONFIG.rotationSpeed,
    description: "Angular sweep rate; negative values reverse direction.",
    id: "rotationSpeed",
    label: "Rotation speed",
    maximum: 1,
    minimum: -1,
    step: 0.01,
    type: "number",
    unit: "rev/s",
  }),
  Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze(["Input energy is clamped to 0..1", "At most 16 bands are sampled"]),
    defaultValue: DEFAULT_PULSE_RING_CONFIG.bandReactivity,
    description: "How strongly ordered band energy deforms and colors the ring.",
    id: "bandReactivity",
    label: "Band reactivity",
    maximum: 2,
    minimum: 0,
    step: 0.05,
    type: "number",
    unit: "x",
  }),
  ...(
    [
      ["backgroundColor", "Background color", "Opaque stage background color."],
      ["primaryColor", "Primary color", "Core ring color."],
      ["secondaryColor", "Secondary color", "Energy-blended ring color."],
      ["tertiaryColor", "Tertiary color", "Outer glow color."],
      ["sweepColor", "Sweep flash color", "Rotating peak highlight color."],
    ] as const
  ).map(([id, label, description]) =>
    Object.freeze({
      ...VFX_CONTROL_CONTEXT,
      constraints: Object.freeze([
        "Must resolve to a CSS color; invalid values use the role default",
      ]),
      defaultValue: DEFAULT_PULSE_RING_CONFIG[id],
      description,
      id,
      label,
      type: "color" as const,
      unit: "css-color" as const,
    }),
  ),
  Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "auto follows prefers-reduced-motion",
      "reduced draws one deterministic frame",
    ]),
    defaultValue: DEFAULT_PULSE_RING_CONFIG.motion,
    description: "Controls continuous animation while preserving a deterministic static frame.",
    id: "motion",
    label: "Motion",
    options: Object.freeze(["auto", "full", "reduced"] as const),
    type: "select",
    unit: "enum",
  }),
  Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "DPR caps are low=1, balanced=1.5, high=2",
      "The absolute pixel and dimension ceilings always apply",
    ]),
    defaultValue: DEFAULT_PULSE_RING_CONFIG.quality,
    description: "Caps actual backing-buffer DPR and pixel allocation.",
    id: "quality",
    label: "GPU quality",
    options: Object.freeze(["low", "balanced", "high"] as const),
    type: "select",
    unit: "enum",
  }),
]);

export function resolvePulseRingConfig(input: PulseRingConfigInput = {}): PulseRingConfig {
  return Object.freeze({
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_PULSE_RING_CONFIG.backgroundColor),
    bandReactivity: clampFinite(input.bandReactivity, 0, 2, 1),
    glowStrength: clampFinite(input.glowStrength, 0, 2, 0.75),
    mode: "pulse-ring",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_PULSE_RING_CONFIG.motion,
    primaryColor: nonempty(input.primaryColor, DEFAULT_PULSE_RING_CONFIG.primaryColor),
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_PULSE_RING_CONFIG.quality,
    renderer: "webgl2",
    rotationSpeed: clampFinite(input.rotationSpeed, -1, 1, 0.18),
    secondaryColor: nonempty(input.secondaryColor, DEFAULT_PULSE_RING_CONFIG.secondaryColor),
    sweepColor: nonempty(input.sweepColor, DEFAULT_PULSE_RING_CONFIG.sweepColor),
    tertiaryColor: nonempty(input.tertiaryColor, DEFAULT_PULSE_RING_CONFIG.tertiaryColor),
    thickness: clampFinite(input.thickness, 0.01, 0.18, 0.055),
  });
}

export function createPulseRingUniformState(
  frame: BandEnergyFrame,
  input: PulseRingConfigInput | PulseRingConfig = {},
): PulseRingUniformState {
  const config = resolvePulseRingConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parsePulseRingColor(
      config.backgroundColor,
      DEFAULT_PULSE_RING_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bandReactivity: config.bandReactivity,
    bands: metrics.bands,
    centroid: metrics.centroid,
    energy: metrics.energy,
    glowStrength: config.glowStrength,
    peak: metrics.peak,
    primaryColor: parsePulseRingColor(config.primaryColor, DEFAULT_PULSE_RING_CONFIG.primaryColor),
    rotationSpeed: config.rotationSpeed,
    secondaryColor: parsePulseRingColor(
      config.secondaryColor,
      DEFAULT_PULSE_RING_CONFIG.secondaryColor,
    ),
    sweepColor: parsePulseRingColor(config.sweepColor, DEFAULT_PULSE_RING_CONFIG.sweepColor),
    tertiaryColor: parsePulseRingColor(
      config.tertiaryColor,
      DEFAULT_PULSE_RING_CONFIG.tertiaryColor,
    ),
    thickness: config.thickness,
  });
}

export function resolvePulseRingTime(timeSeconds: number, reducedMotion: boolean): number {
  return resolveVfxTime(timeSeconds, reducedMotion);
}

export function parsePulseRingColor(
  value: string,
  fallback = "#000000",
): readonly [number, number, number, number] {
  return parseVfxColor(value, fallback);
}
