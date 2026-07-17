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

export const MIN_SPECTRUM_VFX_BAR_COUNT = 4;
export const MAX_SPECTRUM_VFX_BAR_COUNT = 96;

export interface SpectrumBarsVfxConfig extends VfxSurfaceConfig {
  readonly barCount: number;
  readonly gapSize: number;
  readonly glowStrength: number;
  readonly gradientColor1: string;
  readonly gradientColor2: string;
  readonly gradientColor3: string;
  readonly gradientColor4: string;
  readonly heightReactivity: number;
  readonly mode: "spectrum-bars";
  readonly randomSpeed: number;
  readonly renderer: "webgl2";
  readonly verticalPosition: number;
}

export type SpectrumBarsVfxConfigInput = Partial<SpectrumBarsVfxConfig>;
export type SpectrumBarsVfxPresetId = "ember-spectrum" | "ice-spectrum" | "radar-spectrum";

export type SpectrumBarsVfxControlDefinition =
  | VfxColorControlDefinition<
      "backgroundColor" | "gradientColor1" | "gradientColor2" | "gradientColor3" | "gradientColor4"
    >
  | VfxNumericControlDefinition<
      | "barCount"
      | "gapSize"
      | "glowStrength"
      | "heightReactivity"
      | "randomSpeed"
      | "verticalPosition"
    >
  | VfxSelectControlDefinition<"motion", SpectrumBarsVfxConfig["motion"]>
  | VfxSelectControlDefinition<"quality", SpectrumBarsVfxConfig["quality"]>;

export interface SpectrumBarsVfxUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly barCount: number;
  readonly centroid: number;
  readonly energy: number;
  readonly gapSize: number;
  readonly glowStrength: number;
  readonly gradientColor1: readonly [number, number, number, number];
  readonly gradientColor2: readonly [number, number, number, number];
  readonly gradientColor3: readonly [number, number, number, number];
  readonly gradientColor4: readonly [number, number, number, number];
  readonly heightReactivity: number;
  readonly peak: number;
  readonly randomSpeed: number;
  readonly verticalPosition: number;
}

export const DEFAULT_SPECTRUM_BARS_VFX_CONFIG: SpectrumBarsVfxConfig = Object.freeze({
  backgroundColor: "#03080c",
  barCount: 40,
  gapSize: 0.2,
  glowStrength: 0.9,
  gradientColor1: "#34d9ff",
  gradientColor2: "#4ceca0",
  gradientColor3: "#f2d85b",
  gradientColor4: "#ff5f8e",
  heightReactivity: 1.15,
  mode: "spectrum-bars",
  motion: "auto",
  quality: "balanced",
  randomSpeed: 0.24,
  renderer: "webgl2",
  verticalPosition: 0.12,
});

export const SPECTRUM_BARS_VFX_CONTROL_DEFINITIONS: readonly SpectrumBarsVfxControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: [
        `${MIN_SPECTRUM_VFX_BAR_COUNT} <= barCount <= ${MAX_SPECTRUM_VFX_BAR_COUNT}`,
        "Rounded before procedural addressing",
      ],
      defaultValue: DEFAULT_SPECTRUM_BARS_VFX_CONFIG.barCount,
      description: "Number of ordered, interpolated spectrum bars.",
      id: "barCount",
      label: "Bar count",
      maximum: MAX_SPECTRUM_VFX_BAR_COUNT,
      minimum: MIN_SPECTRUM_VFX_BAR_COUNT,
      step: 1,
      unit: "bars",
    }),
    vfxNumberControl({
      constraints: ["Input energy is clamped to 0..1", "Bar height remains inside the stage"],
      defaultValue: DEFAULT_SPECTRUM_BARS_VFX_CONFIG.heightReactivity,
      description: "How strongly ordered energy changes each bar height.",
      id: "heightReactivity",
      label: "Height reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 joins bar cells", "0.82 retains a visible bar core"],
      defaultValue: DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gapSize,
      description: "Horizontal empty space inside each procedural bar cell.",
      id: "gapSize",
      label: "Gap size",
      maximum: 0.82,
      minimum: 0,
      step: 0.01,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["0.05 <= verticalPosition <= 0.72", "Bars grow upward and stay bounded"],
      defaultValue: DEFAULT_SPECTRUM_BARS_VFX_CONFIG.verticalPosition,
      description: "Vertical baseline position measured from the lower stage edge.",
      id: "verticalPosition",
      label: "Baseline position",
      maximum: 0.72,
      minimum: 0.05,
      step: 0.01,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["0 disables shimmer", "Reduced motion freezes shimmer at a stable seed"],
      defaultValue: DEFAULT_SPECTRUM_BARS_VFX_CONFIG.randomSpeed,
      description: "Deterministic brightness shimmer; bar positions and source order never change.",
      id: "randomSpeed",
      label: "Random speed",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "cycles/s",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_SPECTRUM_BARS_VFX_CONFIG.glowStrength,
      description: "Width and intensity multiplier for bar halos.",
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
      "Opaque stage background behind the bars.",
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "gradientColor1",
      "Gradient color 1",
      "Low-band color stop.",
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor1,
    ),
    vfxColorControl(
      "gradientColor2",
      "Gradient color 2",
      "Low-mid color stop.",
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor2,
    ),
    vfxColorControl(
      "gradientColor3",
      "Gradient color 3",
      "High-mid color stop.",
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor3,
    ),
    vfxColorControl(
      "gradientColor4",
      "Gradient color 4",
      "High-band peak color stop.",
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor4,
    ),
    vfxMotionControl(
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.motion,
      "Controls deterministic shimmer while preserving a composed static spectrum.",
    ),
    vfxQualityControl(DEFAULT_SPECTRUM_BARS_VFX_CONFIG.quality),
  ]);

export const SPECTRUM_BARS_VFX_PRESETS: readonly VfxPreset<SpectrumBarsVfxConfig>[] = Object.freeze(
  [
    preset("ice-spectrum", "Ice spectrum", "Balanced cyan-to-rose spectrum field.", {}),
    preset("ember-spectrum", "Ember spectrum", "Broad warm bars on a raised baseline.", {
      backgroundColor: "#0c0502",
      barCount: 26,
      gapSize: 0.3,
      glowStrength: 1.35,
      gradientColor1: "#ff5e38",
      gradientColor2: "#ff9442",
      gradientColor3: "#ffd05c",
      gradientColor4: "#fff1b1",
      heightReactivity: 1.4,
      randomSpeed: 0.1,
      verticalPosition: 0.2,
    }),
    preset("radar-spectrum", "Radar spectrum", "Dense green diagnostic bars with fast shimmer.", {
      backgroundColor: "#010806",
      barCount: 72,
      gapSize: 0.12,
      glowStrength: 0.55,
      gradientColor1: "#155f42",
      gradientColor2: "#28bd76",
      gradientColor3: "#75f0a7",
      gradientColor4: "#e6fff1",
      heightReactivity: 0.9,
      randomSpeed: 0.75,
      verticalPosition: 0.08,
    }),
  ],
);

export function resolveSpectrumBarsVfxConfig(
  input: SpectrumBarsVfxConfigInput = {},
): SpectrumBarsVfxConfig {
  return Object.freeze({
    backgroundColor: nonempty(
      input.backgroundColor,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.backgroundColor,
    ),
    barCount: clampInteger(
      input.barCount,
      MIN_SPECTRUM_VFX_BAR_COUNT,
      MAX_SPECTRUM_VFX_BAR_COUNT,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.barCount,
    ),
    gapSize: clampFinite(input.gapSize, 0, 0.82, 0.2),
    glowStrength: clampFinite(input.glowStrength, 0, 3, 0.9),
    gradientColor1: nonempty(input.gradientColor1, DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor1),
    gradientColor2: nonempty(input.gradientColor2, DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor2),
    gradientColor3: nonempty(input.gradientColor3, DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor3),
    gradientColor4: nonempty(input.gradientColor4, DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor4),
    heightReactivity: clampFinite(input.heightReactivity, 0, 2, 1.15),
    mode: "spectrum-bars",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_SPECTRUM_BARS_VFX_CONFIG.motion,
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_SPECTRUM_BARS_VFX_CONFIG.quality,
    randomSpeed: clampFinite(input.randomSpeed, 0, 2, 0.24),
    renderer: "webgl2",
    verticalPosition: clampFinite(input.verticalPosition, 0.05, 0.72, 0.12),
  });
}

export function createSpectrumBarsVfxUniformState(
  frame: BandEnergyFrame,
  input: SpectrumBarsVfxConfigInput | SpectrumBarsVfxConfig = {},
): SpectrumBarsVfxUniformState {
  const config = resolveSpectrumBarsVfxConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    barCount: config.barCount,
    centroid: metrics.centroid,
    energy: metrics.energy,
    gapSize: config.gapSize,
    glowStrength: config.glowStrength,
    gradientColor1: parseVfxColor(
      config.gradientColor1,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor1,
    ),
    gradientColor2: parseVfxColor(
      config.gradientColor2,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor2,
    ),
    gradientColor3: parseVfxColor(
      config.gradientColor3,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor3,
    ),
    gradientColor4: parseVfxColor(
      config.gradientColor4,
      DEFAULT_SPECTRUM_BARS_VFX_CONFIG.gradientColor4,
    ),
    heightReactivity: config.heightReactivity,
    peak: metrics.peak,
    randomSpeed: config.randomSpeed,
    verticalPosition: config.verticalPosition,
  });
}

export function getSpectrumBarsVfxPreset(
  id: SpectrumBarsVfxPresetId,
): VfxPreset<SpectrumBarsVfxConfig> {
  return (
    SPECTRUM_BARS_VFX_PRESETS.find((candidate) => candidate.id === id) ??
    SPECTRUM_BARS_VFX_PRESETS[0]
  );
}

function preset(
  id: SpectrumBarsVfxPresetId,
  label: string,
  description: string,
  input: SpectrumBarsVfxConfigInput,
): VfxPreset<SpectrumBarsVfxConfig> {
  return Object.freeze({ config: resolveSpectrumBarsVfxConfig(input), description, id, label });
}
