import type { BandEnergyFrame } from "../types";
import {
  vfxBooleanControl,
  vfxColorControl,
  vfxMotionControl,
  vfxNumberControl,
  vfxQualityControl,
} from "./controlFactories";
import type {
  VfxBooleanControlDefinition,
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

export const MIN_WOBBLE_BAR_COUNT = 4;
export const MAX_WOBBLE_BAR_COUNT = 64;

export interface RoundedWobbleBarsConfig extends VfxSurfaceConfig {
  readonly barCount: number;
  readonly barGap: number;
  readonly burstFlashColor: string;
  readonly energyReactivity: number;
  readonly glowIntensity: number;
  readonly leftColor: string;
  readonly mirrorVertically: boolean;
  readonly mode: "rounded-wobble-bars";
  readonly renderer: "webgl2";
  readonly rightColor: string;
  readonly wobbleIntensity: number;
}

export type RoundedWobbleBarsConfigInput = Partial<RoundedWobbleBarsConfig>;
export type RoundedWobbleBarsPresetId = "candy-arc" | "signal-pillars" | "twin-ember";

export type RoundedWobbleBarsControlDefinition =
  | VfxBooleanControlDefinition<"mirrorVertically">
  | VfxColorControlDefinition<"backgroundColor" | "burstFlashColor" | "leftColor" | "rightColor">
  | VfxNumericControlDefinition<
      "barCount" | "barGap" | "energyReactivity" | "glowIntensity" | "wobbleIntensity"
    >
  | VfxSelectControlDefinition<"motion", RoundedWobbleBarsConfig["motion"]>
  | VfxSelectControlDefinition<"quality", RoundedWobbleBarsConfig["quality"]>;

export interface RoundedWobbleBarsUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly barCount: number;
  readonly barGap: number;
  readonly burstFlashColor: readonly [number, number, number, number];
  readonly centroid: number;
  readonly energy: number;
  readonly energyReactivity: number;
  readonly glowIntensity: number;
  readonly leftColor: readonly [number, number, number, number];
  readonly mirrorVertically: boolean;
  readonly peak: number;
  readonly rightColor: readonly [number, number, number, number];
  readonly wobbleIntensity: number;
}

export const DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG: RoundedWobbleBarsConfig = Object.freeze({
  backgroundColor: "#04070d",
  barCount: 28,
  barGap: 0.22,
  burstFlashColor: "#fff1a3",
  energyReactivity: 1.15,
  glowIntensity: 1.05,
  leftColor: "#4fe8ff",
  mirrorVertically: true,
  mode: "rounded-wobble-bars",
  motion: "auto",
  quality: "balanced",
  renderer: "webgl2",
  rightColor: "#c36dff",
  wobbleIntensity: 0.34,
});

export const ROUNDED_WOBBLE_BARS_CONTROL_DEFINITIONS: readonly RoundedWobbleBarsControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: [
        `${MIN_WOBBLE_BAR_COUNT} <= barCount <= ${MAX_WOBBLE_BAR_COUNT}`,
        "Rounded before procedural addressing",
      ],
      defaultValue: DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.barCount,
      description: "Number of ordered, energy-addressed rounded bars.",
      id: "barCount",
      label: "Bar count",
      maximum: MAX_WOBBLE_BAR_COUNT,
      minimum: MIN_WOBBLE_BAR_COUNT,
      step: 1,
      unit: "bars",
    }),
    vfxNumberControl({
      constraints: ["0 is straight", "1 caps lateral displacement inside each bar cell"],
      defaultValue: DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.wobbleIntensity,
      description: "Deterministic tip and height variation without changing source order.",
      id: "wobbleIntensity",
      label: "Wobble intensity",
      maximum: 1,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxBooleanControl(
      "mirrorVertically",
      "Mirror vertically",
      "Reflects every bar around the central baseline.",
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.mirrorVertically,
      ["false anchors bars to the lower baseline", "true uses a centered mirrored baseline"],
    ),
    vfxNumberControl({
      constraints: ["0 joins bar cells", "0.78 retains a visible bar core"],
      defaultValue: DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.barGap,
      description: "Horizontal empty space inside each procedural bar cell.",
      id: "barGap",
      label: "Bar gap",
      maximum: 0.78,
      minimum: 0,
      step: 0.01,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.glowIntensity,
      description: "Width and intensity multiplier for bar halos and burst tips.",
      id: "glowIntensity",
      label: "Glow intensity",
      maximum: 3,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["Input energy is clamped to 0..1", "At most 16 source bands are sampled"],
      defaultValue: DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.energyReactivity,
      description: "How strongly ordered energy changes height, wobble, and burst color.",
      id: "energyReactivity",
      label: "Energy reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxColorControl(
      "backgroundColor",
      "Background color",
      "Opaque stage background behind all bars.",
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "leftColor",
      "Left color",
      "Gradient color at the low-band edge.",
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.leftColor,
    ),
    vfxColorControl(
      "rightColor",
      "Right color",
      "Gradient color at the high-band edge.",
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.rightColor,
    ),
    vfxColorControl(
      "burstFlashColor",
      "Burst flash color",
      "Independent energetic tip and peak highlight.",
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.burstFlashColor,
    ),
    vfxMotionControl(
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.motion,
      "Controls wobble phase while preserving a composed static bar field.",
    ),
    vfxQualityControl(DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.quality),
  ]);

export const ROUNDED_WOBBLE_BARS_PRESETS: readonly VfxPreset<RoundedWobbleBarsConfig>[] =
  Object.freeze([
    preset("signal-pillars", "Signal pillars", "Balanced mirrored cyan-violet bars.", {}),
    preset("twin-ember", "Twin ember", "Warm low-density mirrored pillars.", {
      backgroundColor: "#0c0402",
      barCount: 18,
      barGap: 0.32,
      burstFlashColor: "#fff2b0",
      energyReactivity: 1.4,
      glowIntensity: 1.5,
      leftColor: "#ff6138",
      mirrorVertically: true,
      rightColor: "#ffc457",
      wobbleIntensity: 0.18,
    }),
    preset("candy-arc", "Candy arc", "Dense asymmetric bars with lively wobble.", {
      backgroundColor: "#070310",
      barCount: 46,
      barGap: 0.16,
      burstFlashColor: "#72fbff",
      energyReactivity: 0.95,
      glowIntensity: 0.8,
      leftColor: "#7d7cff",
      mirrorVertically: false,
      rightColor: "#ff64cb",
      wobbleIntensity: 0.68,
    }),
  ]);

export function resolveRoundedWobbleBarsConfig(
  input: RoundedWobbleBarsConfigInput = {},
): RoundedWobbleBarsConfig {
  return Object.freeze({
    backgroundColor: nonempty(
      input.backgroundColor,
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.backgroundColor,
    ),
    barCount: clampInteger(
      input.barCount,
      MIN_WOBBLE_BAR_COUNT,
      MAX_WOBBLE_BAR_COUNT,
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.barCount,
    ),
    barGap: clampFinite(input.barGap, 0, 0.78, 0.22),
    burstFlashColor: nonempty(
      input.burstFlashColor,
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.burstFlashColor,
    ),
    energyReactivity: clampFinite(input.energyReactivity, 0, 2, 1.15),
    glowIntensity: clampFinite(input.glowIntensity, 0, 3, 1.05),
    leftColor: nonempty(input.leftColor, DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.leftColor),
    mirrorVertically:
      typeof input.mirrorVertically === "boolean"
        ? input.mirrorVertically
        : DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.mirrorVertically,
    mode: "rounded-wobble-bars",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.motion,
    quality: isVfxQuality(input.quality)
      ? input.quality
      : DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.quality,
    renderer: "webgl2",
    rightColor: nonempty(input.rightColor, DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.rightColor),
    wobbleIntensity: clampFinite(input.wobbleIntensity, 0, 1, 0.34),
  });
}

export function createRoundedWobbleBarsUniformState(
  frame: BandEnergyFrame,
  input: RoundedWobbleBarsConfigInput | RoundedWobbleBarsConfig = {},
): RoundedWobbleBarsUniformState {
  const config = resolveRoundedWobbleBarsConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    barCount: config.barCount,
    barGap: config.barGap,
    burstFlashColor: parseVfxColor(
      config.burstFlashColor,
      DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.burstFlashColor,
    ),
    centroid: metrics.centroid,
    energy: metrics.energy,
    energyReactivity: config.energyReactivity,
    glowIntensity: config.glowIntensity,
    leftColor: parseVfxColor(config.leftColor, DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.leftColor),
    mirrorVertically: config.mirrorVertically,
    peak: metrics.peak,
    rightColor: parseVfxColor(config.rightColor, DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG.rightColor),
    wobbleIntensity: config.wobbleIntensity,
  });
}

export function getRoundedWobbleBarsPreset(
  id: RoundedWobbleBarsPresetId,
): VfxPreset<RoundedWobbleBarsConfig> {
  return (
    ROUNDED_WOBBLE_BARS_PRESETS.find((candidate) => candidate.id === id) ??
    ROUNDED_WOBBLE_BARS_PRESETS[0]
  );
}

function preset(
  id: RoundedWobbleBarsPresetId,
  label: string,
  description: string,
  input: RoundedWobbleBarsConfigInput,
): VfxPreset<RoundedWobbleBarsConfig> {
  return Object.freeze({ config: resolveRoundedWobbleBarsConfig(input), description, id, label });
}
