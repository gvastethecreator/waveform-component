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
  createBandUniformMetrics,
  isVfxMotion,
  isVfxQuality,
  nonempty,
  parseVfxColor,
} from "./shared";

export interface WaveformRibbonConfig extends VfxSurfaceConfig {
  readonly energyReactivity: number;
  readonly flowSpeed: number;
  readonly glowStrength: number;
  readonly leftColor: string;
  readonly mode: "waveform-ribbon";
  readonly peakFlashColor: string;
  readonly reflectionStrength: number;
  readonly renderer: "webgl2";
  readonly ribbonThickness: number;
  readonly rightColor: string;
  readonly waveHeight: number;
}

export type WaveformRibbonConfigInput = Partial<WaveformRibbonConfig>;
export type WaveformRibbonPresetId = "ember-fold" | "ghost-mirror" | "prism-stream";

export type WaveformRibbonControlDefinition =
  | VfxColorControlDefinition<"backgroundColor" | "leftColor" | "peakFlashColor" | "rightColor">
  | VfxNumericControlDefinition<
      | "energyReactivity"
      | "flowSpeed"
      | "glowStrength"
      | "reflectionStrength"
      | "ribbonThickness"
      | "waveHeight"
    >
  | VfxSelectControlDefinition<"motion", WaveformRibbonConfig["motion"]>
  | VfxSelectControlDefinition<"quality", WaveformRibbonConfig["quality"]>;

export interface WaveformRibbonUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly centroid: number;
  readonly energy: number;
  readonly energyReactivity: number;
  readonly flowSpeed: number;
  readonly glowStrength: number;
  readonly leftColor: readonly [number, number, number, number];
  readonly peak: number;
  readonly peakFlashColor: readonly [number, number, number, number];
  readonly reflectionStrength: number;
  readonly ribbonThickness: number;
  readonly rightColor: readonly [number, number, number, number];
  readonly waveHeight: number;
}

export const DEFAULT_WAVEFORM_RIBBON_CONFIG: WaveformRibbonConfig = Object.freeze({
  backgroundColor: "#030710",
  energyReactivity: 1.15,
  flowSpeed: 0.3,
  glowStrength: 1.1,
  leftColor: "#53e8ff",
  mode: "waveform-ribbon",
  motion: "auto",
  peakFlashColor: "#fff3a4",
  quality: "balanced",
  reflectionStrength: 0.38,
  renderer: "webgl2",
  ribbonThickness: 0.095,
  rightColor: "#ad72ff",
  waveHeight: 0.22,
});

export const WAVEFORM_RIBBON_CONTROL_DEFINITIONS: readonly WaveformRibbonControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: ["0.02 <= waveHeight <= 0.38", "Centerline remains inside the stage"],
      defaultValue: DEFAULT_WAVEFORM_RIBBON_CONFIG.waveHeight,
      description: "Maximum centerline displacement as a fraction of stage height.",
      id: "waveHeight",
      label: "Wave height",
      maximum: 0.38,
      minimum: 0.02,
      step: 0.01,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["Negative values reverse phase flow", "Reduced motion freezes phase"],
      defaultValue: DEFAULT_WAVEFORM_RIBBON_CONFIG.flowSpeed,
      description: "Phase travel across the ribbon without reordering source bands.",
      id: "flowSpeed",
      label: "Flow speed",
      maximum: 2,
      minimum: -2,
      step: 0.05,
      unit: "cycles/s",
    }),
    vfxNumberControl({
      constraints: ["0.015 <= ribbonThickness <= 0.28"],
      defaultValue: DEFAULT_WAVEFORM_RIBBON_CONFIG.ribbonThickness,
      description: "Filled ribbon body thickness as a fraction of stage height.",
      id: "ribbonThickness",
      label: "Ribbon thickness",
      maximum: 0.28,
      minimum: 0.015,
      step: 0.005,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_WAVEFORM_RIBBON_CONFIG.glowStrength,
      description: "Width and intensity multiplier for the ribbon halo.",
      id: "glowStrength",
      label: "Glow strength",
      maximum: 3,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 hides the reflection", "Reflection remains below the primary ribbon"],
      defaultValue: DEFAULT_WAVEFORM_RIBBON_CONFIG.reflectionStrength,
      description: "Opacity and reach of the vertically reflected secondary ribbon.",
      id: "reflectionStrength",
      label: "Reflection",
      maximum: 1,
      minimum: 0,
      step: 0.05,
      unit: "opacity",
    }),
    vfxNumberControl({
      constraints: ["Input energy is clamped to 0..1", "At most 16 source bands are sampled"],
      defaultValue: DEFAULT_WAVEFORM_RIBBON_CONFIG.energyReactivity,
      description: "How strongly ordered band energy changes height, thickness, and flash.",
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
      "Opaque stage background behind the ribbon and reflection.",
      DEFAULT_WAVEFORM_RIBBON_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "leftColor",
      "Left color",
      "Ribbon gradient color at the low-band edge.",
      DEFAULT_WAVEFORM_RIBBON_CONFIG.leftColor,
    ),
    vfxColorControl(
      "rightColor",
      "Right color",
      "Ribbon gradient color at the high-band edge.",
      DEFAULT_WAVEFORM_RIBBON_CONFIG.rightColor,
    ),
    vfxColorControl(
      "peakFlashColor",
      "Peak flash color",
      "Independent highlight blended into energetic crests.",
      DEFAULT_WAVEFORM_RIBBON_CONFIG.peakFlashColor,
    ),
    vfxMotionControl(
      DEFAULT_WAVEFORM_RIBBON_CONFIG.motion,
      "Controls phase flow while preserving a composed static ribbon.",
    ),
    vfxQualityControl(DEFAULT_WAVEFORM_RIBBON_CONFIG.quality),
  ]);

export const WAVEFORM_RIBBON_PRESETS: readonly VfxPreset<WaveformRibbonConfig>[] = Object.freeze([
  preset("prism-stream", "Prism stream", "Cool reflective ribbon with balanced motion.", {}),
  preset("ember-fold", "Ember fold", "Warm broad ribbon with a restrained reflection.", {
    backgroundColor: "#0b0403",
    energyReactivity: 1.35,
    flowSpeed: -0.2,
    glowStrength: 1.45,
    leftColor: "#ff6a3d",
    peakFlashColor: "#fff0b0",
    reflectionStrength: 0.2,
    ribbonThickness: 0.14,
    rightColor: "#ffca58",
    waveHeight: 0.18,
  }),
  preset("ghost-mirror", "Ghost mirror", "Fine violet stream with a pronounced reflection.", {
    backgroundColor: "#03020d",
    energyReactivity: 0.9,
    flowSpeed: 0.65,
    glowStrength: 0.75,
    leftColor: "#7d8dff",
    peakFlashColor: "#7ffcff",
    reflectionStrength: 0.78,
    ribbonThickness: 0.055,
    rightColor: "#ff75d8",
    waveHeight: 0.26,
  }),
]);

export function resolveWaveformRibbonConfig(
  input: WaveformRibbonConfigInput = {},
): WaveformRibbonConfig {
  return Object.freeze({
    backgroundColor: nonempty(
      input.backgroundColor,
      DEFAULT_WAVEFORM_RIBBON_CONFIG.backgroundColor,
    ),
    energyReactivity: clampFinite(input.energyReactivity, 0, 2, 1.15),
    flowSpeed: clampFinite(input.flowSpeed, -2, 2, 0.3),
    glowStrength: clampFinite(input.glowStrength, 0, 3, 1.1),
    leftColor: nonempty(input.leftColor, DEFAULT_WAVEFORM_RIBBON_CONFIG.leftColor),
    mode: "waveform-ribbon",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_WAVEFORM_RIBBON_CONFIG.motion,
    peakFlashColor: nonempty(input.peakFlashColor, DEFAULT_WAVEFORM_RIBBON_CONFIG.peakFlashColor),
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_WAVEFORM_RIBBON_CONFIG.quality,
    reflectionStrength: clampFinite(input.reflectionStrength, 0, 1, 0.38),
    renderer: "webgl2",
    ribbonThickness: clampFinite(input.ribbonThickness, 0.015, 0.28, 0.095),
    rightColor: nonempty(input.rightColor, DEFAULT_WAVEFORM_RIBBON_CONFIG.rightColor),
    waveHeight: clampFinite(input.waveHeight, 0.02, 0.38, 0.22),
  });
}

export function createWaveformRibbonUniformState(
  frame: BandEnergyFrame,
  input: WaveformRibbonConfigInput | WaveformRibbonConfig = {},
): WaveformRibbonUniformState {
  const config = resolveWaveformRibbonConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_WAVEFORM_RIBBON_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    centroid: metrics.centroid,
    energy: metrics.energy,
    energyReactivity: config.energyReactivity,
    flowSpeed: config.flowSpeed,
    glowStrength: config.glowStrength,
    leftColor: parseVfxColor(config.leftColor, DEFAULT_WAVEFORM_RIBBON_CONFIG.leftColor),
    peak: metrics.peak,
    peakFlashColor: parseVfxColor(
      config.peakFlashColor,
      DEFAULT_WAVEFORM_RIBBON_CONFIG.peakFlashColor,
    ),
    reflectionStrength: config.reflectionStrength,
    ribbonThickness: config.ribbonThickness,
    rightColor: parseVfxColor(config.rightColor, DEFAULT_WAVEFORM_RIBBON_CONFIG.rightColor),
    waveHeight: config.waveHeight,
  });
}

export function getWaveformRibbonPreset(
  id: WaveformRibbonPresetId,
): VfxPreset<WaveformRibbonConfig> {
  return (
    WAVEFORM_RIBBON_PRESETS.find((candidate) => candidate.id === id) ?? WAVEFORM_RIBBON_PRESETS[0]
  );
}

function preset(
  id: WaveformRibbonPresetId,
  label: string,
  description: string,
  input: WaveformRibbonConfigInput,
): VfxPreset<WaveformRibbonConfig> {
  return Object.freeze({ config: resolveWaveformRibbonConfig(input), description, id, label });
}
