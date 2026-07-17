import type { BandEnergyFrame } from "../types";
import {
  VFX_CONTROL_CONTEXT,
  type VfxColorControlDefinition,
  type VfxNumericControlDefinition,
  type VfxPreset,
  type VfxSelectControlDefinition,
  type VfxSurfaceConfig,
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

export const MIN_NEON_LINE_COUNT = 2;
export const MAX_NEON_LINE_COUNT = 12;

export interface NeonLinesConfig extends VfxSurfaceConfig {
  readonly burstColor: string;
  readonly energyReactivity: number;
  readonly flowSpeed: number;
  readonly glowSize: number;
  readonly leftColor: string;
  readonly lineCount: number;
  readonly lineThickness: number;
  readonly mode: "neon-lines";
  readonly renderer: "webgl2";
  readonly rightColor: string;
  readonly waveHeight: number;
}

export type NeonLinesConfigInput = Partial<NeonLinesConfig>;

export type NeonLinesControlDefinition =
  | VfxColorControlDefinition<"backgroundColor" | "burstColor" | "leftColor" | "rightColor">
  | VfxNumericControlDefinition<
      "energyReactivity" | "flowSpeed" | "glowSize" | "lineCount" | "lineThickness" | "waveHeight"
    >
  | VfxSelectControlDefinition<"motion", NeonLinesConfig["motion"]>
  | VfxSelectControlDefinition<"quality", NeonLinesConfig["quality"]>;

export interface NeonLinesUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly burstColor: readonly [number, number, number, number];
  readonly centroid: number;
  readonly energy: number;
  readonly energyReactivity: number;
  readonly flowSpeed: number;
  readonly glowSize: number;
  readonly leftColor: readonly [number, number, number, number];
  readonly lineCount: number;
  readonly lineThickness: number;
  readonly peak: number;
  readonly rightColor: readonly [number, number, number, number];
  readonly waveHeight: number;
}

export type NeonLinesPresetId = "aurora" | "ember" | "ultraviolet";

export const DEFAULT_NEON_LINES_CONFIG: NeonLinesConfig = Object.freeze({
  backgroundColor: "#03070d",
  burstColor: "#f8f3a6",
  energyReactivity: 1.1,
  flowSpeed: 0.35,
  glowSize: 1.15,
  leftColor: "#5de7ff",
  lineCount: 7,
  lineThickness: 0.009,
  mode: "neon-lines",
  motion: "auto",
  quality: "balanced",
  renderer: "webgl2",
  rightColor: "#bb72ff",
  waveHeight: 0.16,
});

export const NEON_LINES_CONTROL_DEFINITIONS: readonly NeonLinesControlDefinition[] = Object.freeze([
  numberControl({
    constraints: [
      `${MIN_NEON_LINE_COUNT} <= lineCount <= ${MAX_NEON_LINE_COUNT}`,
      "Rounded before shader iteration",
    ],
    defaultValue: DEFAULT_NEON_LINES_CONFIG.lineCount,
    description: "Number of independently energy-mapped horizontal traces.",
    id: "lineCount",
    label: "Line count",
    maximum: MAX_NEON_LINE_COUNT,
    minimum: MIN_NEON_LINE_COUNT,
    step: 1,
    unit: "lines",
  }),
  numberControl({
    constraints: ["0.02 <= waveHeight <= 0.45"],
    defaultValue: DEFAULT_NEON_LINES_CONFIG.waveHeight,
    description: "Maximum vertical displacement as a fraction of the stage height.",
    id: "waveHeight",
    label: "Wave height",
    maximum: 0.45,
    minimum: 0.02,
    step: 0.01,
    unit: "ratio",
  }),
  numberControl({
    constraints: ["Negative values reverse flow", "Reduced motion freezes time at a stable phase"],
    defaultValue: DEFAULT_NEON_LINES_CONFIG.flowSpeed,
    description: "Horizontal phase travel; negative values reverse direction.",
    id: "flowSpeed",
    label: "Flow speed",
    maximum: 2,
    minimum: -2,
    step: 0.05,
    unit: "cycles/s",
  }),
  numberControl({
    constraints: ["0.002 <= lineThickness <= 0.04"],
    defaultValue: DEFAULT_NEON_LINES_CONFIG.lineThickness,
    description: "Core trace width as a fraction of the shorter stage dimension.",
    id: "lineThickness",
    label: "Line thickness",
    maximum: 0.04,
    minimum: 0.002,
    step: 0.001,
    unit: "ratio",
  }),
  numberControl({
    constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
    defaultValue: DEFAULT_NEON_LINES_CONFIG.glowSize,
    description: "Width and intensity multiplier for the energy-scaled halo.",
    id: "glowSize",
    label: "Glow size",
    maximum: 3,
    minimum: 0,
    step: 0.05,
    unit: "x",
  }),
  numberControl({
    constraints: ["Input energy is clamped to 0..1", "At most 16 source bands are sampled"],
    defaultValue: DEFAULT_NEON_LINES_CONFIG.energyReactivity,
    description: "How strongly each mapped band changes its trace height, color, and glow.",
    id: "energyReactivity",
    label: "Energy reactivity",
    maximum: 2,
    minimum: 0,
    step: 0.05,
    unit: "x",
  }),
  colorControl(
    "backgroundColor",
    "Background color",
    "Opaque stage background behind all traces.",
    DEFAULT_NEON_LINES_CONFIG.backgroundColor,
  ),
  colorControl(
    "leftColor",
    "Left color",
    "Color at the left edge of every trace.",
    DEFAULT_NEON_LINES_CONFIG.leftColor,
  ),
  colorControl(
    "rightColor",
    "Right color",
    "Color at the right edge of every trace.",
    DEFAULT_NEON_LINES_CONFIG.rightColor,
  ),
  colorControl(
    "burstColor",
    "Burst color",
    "Peak-energy highlight blended independently into each trace.",
    DEFAULT_NEON_LINES_CONFIG.burstColor,
  ),
  motionControl(DEFAULT_NEON_LINES_CONFIG.motion),
  qualityControl(DEFAULT_NEON_LINES_CONFIG.quality),
]);

export const NEON_LINES_PRESETS: readonly VfxPreset<NeonLinesConfig>[] = Object.freeze([
  preset("aurora", "Aurora", "Cool layered streams with a balanced GPU budget.", {}),
  preset("ember", "Ember", "Warm, thicker traces with restrained motion.", {
    backgroundColor: "#0c0404",
    burstColor: "#fff0b0",
    energyReactivity: 1.35,
    flowSpeed: 0.2,
    glowSize: 1.45,
    leftColor: "#ff6a3d",
    lineCount: 6,
    lineThickness: 0.012,
    rightColor: "#ffcc5c",
    waveHeight: 0.2,
  }),
  preset("ultraviolet", "Ultraviolet", "Fast, fine violet traces with a cyan peak flash.", {
    backgroundColor: "#05030f",
    burstColor: "#6ffaff",
    energyReactivity: 0.9,
    flowSpeed: -0.65,
    glowSize: 0.85,
    leftColor: "#8a66ff",
    lineCount: 10,
    lineThickness: 0.006,
    rightColor: "#ff5fd1",
    waveHeight: 0.12,
  }),
]);

export function resolveNeonLinesConfig(input: NeonLinesConfigInput = {}): NeonLinesConfig {
  return Object.freeze({
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_NEON_LINES_CONFIG.backgroundColor),
    burstColor: nonempty(input.burstColor, DEFAULT_NEON_LINES_CONFIG.burstColor),
    energyReactivity: clampFinite(input.energyReactivity, 0, 2, 1.1),
    flowSpeed: clampFinite(input.flowSpeed, -2, 2, 0.35),
    glowSize: clampFinite(input.glowSize, 0, 3, 1.15),
    leftColor: nonempty(input.leftColor, DEFAULT_NEON_LINES_CONFIG.leftColor),
    lineCount: clampInteger(
      input.lineCount,
      MIN_NEON_LINE_COUNT,
      MAX_NEON_LINE_COUNT,
      DEFAULT_NEON_LINES_CONFIG.lineCount,
    ),
    lineThickness: clampFinite(input.lineThickness, 0.002, 0.04, 0.009),
    mode: "neon-lines",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_NEON_LINES_CONFIG.motion,
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_NEON_LINES_CONFIG.quality,
    renderer: "webgl2",
    rightColor: nonempty(input.rightColor, DEFAULT_NEON_LINES_CONFIG.rightColor),
    waveHeight: clampFinite(input.waveHeight, 0.02, 0.45, 0.16),
  });
}

export function createNeonLinesUniformState(
  frame: BandEnergyFrame,
  input: NeonLinesConfigInput | NeonLinesConfig = {},
): NeonLinesUniformState {
  const config = resolveNeonLinesConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_NEON_LINES_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    burstColor: parseVfxColor(config.burstColor, DEFAULT_NEON_LINES_CONFIG.burstColor),
    centroid: metrics.centroid,
    energy: metrics.energy,
    energyReactivity: config.energyReactivity,
    flowSpeed: config.flowSpeed,
    glowSize: config.glowSize,
    leftColor: parseVfxColor(config.leftColor, DEFAULT_NEON_LINES_CONFIG.leftColor),
    lineCount: config.lineCount,
    lineThickness: config.lineThickness,
    peak: metrics.peak,
    rightColor: parseVfxColor(config.rightColor, DEFAULT_NEON_LINES_CONFIG.rightColor),
    waveHeight: config.waveHeight,
  });
}

export function getNeonLinesPreset(id: NeonLinesPresetId): VfxPreset<NeonLinesConfig> {
  return NEON_LINES_PRESETS.find((candidate) => candidate.id === id) ?? NEON_LINES_PRESETS[0];
}

function numberControl<Id extends Extract<NeonLinesControlDefinition, { type: "number" }>["id"]>(
  definition: Omit<VfxNumericControlDefinition<Id>, keyof typeof VFX_CONTROL_CONTEXT | "type">,
): VfxNumericControlDefinition<Id> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    ...definition,
    constraints: Object.freeze([...definition.constraints]),
    type: "number",
  });
}

function colorControl<Id extends "backgroundColor" | "burstColor" | "leftColor" | "rightColor">(
  id: Id,
  label: string,
  description: string,
  defaultValue: string,
): VfxColorControlDefinition<Id> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "Must resolve to a CSS color; invalid values use the role default",
    ]),
    defaultValue,
    description,
    id,
    label,
    type: "color",
    unit: "css-color",
  });
}

function motionControl(
  defaultValue: NeonLinesConfig["motion"],
): VfxSelectControlDefinition<"motion", NeonLinesConfig["motion"]> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "auto follows prefers-reduced-motion",
      "reduced draws one deterministic frame",
    ]),
    defaultValue,
    description: "Controls continuous flow while preserving a stable static phase.",
    id: "motion",
    label: "Motion",
    options: Object.freeze(["auto", "full", "reduced"] as const),
    type: "select",
    unit: "enum",
  });
}

function qualityControl(
  defaultValue: NeonLinesConfig["quality"],
): VfxSelectControlDefinition<"quality", NeonLinesConfig["quality"]> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "DPR caps are low=1, balanced=1.5, high=2",
      "The absolute pixel and dimension ceilings always apply",
    ]),
    defaultValue,
    description: "Caps actual backing-buffer DPR and pixel allocation.",
    id: "quality",
    label: "GPU quality",
    options: Object.freeze(["low", "balanced", "high"] as const),
    type: "select",
    unit: "enum",
  });
}

function preset(
  id: NeonLinesPresetId,
  label: string,
  description: string,
  input: NeonLinesConfigInput,
): VfxPreset<NeonLinesConfig> {
  return Object.freeze({
    config: resolveNeonLinesConfig(input),
    description,
    id,
    label,
  });
}
