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

export const MIN_EQUALIZER_GRID_COLUMNS = 4;
export const MAX_EQUALIZER_GRID_COLUMNS = 48;
export const MIN_EQUALIZER_GRID_ROWS = 2;
export const MAX_EQUALIZER_GRID_ROWS = 24;

export interface EqualizerGridConfig extends VfxSurfaceConfig {
  readonly cellGap: number;
  readonly cellReactivity: number;
  readonly gradientColor1: string;
  readonly gradientColor2: string;
  readonly gradientColor3: string;
  readonly gradientColor4: string;
  readonly gridColumns: number;
  readonly gridRows: number;
  readonly mode: "equalizer-grid";
  readonly randomSpeed: number;
  readonly renderer: "webgl2";
}

export type EqualizerGridConfigInput = Partial<EqualizerGridConfig>;

export type EqualizerGridControlDefinition =
  | VfxColorControlDefinition<
      "backgroundColor" | "gradientColor1" | "gradientColor2" | "gradientColor3" | "gradientColor4"
    >
  | VfxNumericControlDefinition<
      "cellGap" | "cellReactivity" | "gridColumns" | "gridRows" | "randomSpeed"
    >
  | VfxSelectControlDefinition<"motion", EqualizerGridConfig["motion"]>
  | VfxSelectControlDefinition<"quality", EqualizerGridConfig["quality"]>;

export interface EqualizerGridUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly cellGap: number;
  readonly cellReactivity: number;
  readonly centroid: number;
  readonly energy: number;
  readonly gradientColor1: readonly [number, number, number, number];
  readonly gradientColor2: readonly [number, number, number, number];
  readonly gradientColor3: readonly [number, number, number, number];
  readonly gradientColor4: readonly [number, number, number, number];
  readonly gridColumns: number;
  readonly gridRows: number;
  readonly peak: number;
  readonly randomSpeed: number;
}

export type EqualizerGridPresetId = "ember-matrix" | "ice-map" | "signal-radar";

export const DEFAULT_EQUALIZER_GRID_CONFIG: EqualizerGridConfig = Object.freeze({
  backgroundColor: "#03080c",
  cellGap: 0.12,
  cellReactivity: 1.15,
  gradientColor1: "#3be8ff",
  gradientColor2: "#58f0a7",
  gradientColor3: "#f1dc64",
  gradientColor4: "#ff668f",
  gridColumns: 24,
  gridRows: 10,
  mode: "equalizer-grid",
  motion: "auto",
  quality: "balanced",
  randomSpeed: 0.28,
  renderer: "webgl2",
});

export const EQUALIZER_GRID_CONTROL_DEFINITIONS: readonly EqualizerGridControlDefinition[] =
  Object.freeze([
    numberControl({
      constraints: [
        `${MIN_EQUALIZER_GRID_COLUMNS} <= gridColumns <= ${MAX_EQUALIZER_GRID_COLUMNS}`,
        "Rounded before cell addressing",
      ],
      defaultValue: DEFAULT_EQUALIZER_GRID_CONFIG.gridColumns,
      description: "Number of frequency-addressed columns across the stage.",
      id: "gridColumns",
      label: "Grid columns",
      maximum: MAX_EQUALIZER_GRID_COLUMNS,
      minimum: MIN_EQUALIZER_GRID_COLUMNS,
      step: 1,
      unit: "columns",
    }),
    numberControl({
      constraints: [
        `${MIN_EQUALIZER_GRID_ROWS} <= gridRows <= ${MAX_EQUALIZER_GRID_ROWS}`,
        "Rounded before cell addressing",
      ],
      defaultValue: DEFAULT_EQUALIZER_GRID_CONFIG.gridRows,
      description: "Number of amplitude thresholds stacked vertically.",
      id: "gridRows",
      label: "Grid rows",
      maximum: MAX_EQUALIZER_GRID_ROWS,
      minimum: MIN_EQUALIZER_GRID_ROWS,
      step: 1,
      unit: "rows",
    }),
    numberControl({
      constraints: ["0 joins adjacent cells", "0.45 retains at least 10% cell fill per axis"],
      defaultValue: DEFAULT_EQUALIZER_GRID_CONFIG.cellGap,
      description: "Inset around each cell as a fraction of its local size.",
      id: "cellGap",
      label: "Cell gap",
      maximum: 0.45,
      minimum: 0,
      step: 0.01,
      unit: "ratio",
    }),
    numberControl({
      constraints: ["Input energy is clamped to 0..1", "At most 16 source bands are sampled"],
      defaultValue: DEFAULT_EQUALIZER_GRID_CONFIG.cellReactivity,
      description: "How strongly mapped energy fills, brightens, and colors each column.",
      id: "cellReactivity",
      label: "Cell reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    numberControl({
      constraints: ["0 disables shimmer", "Reduced motion freezes shimmer at a stable seed"],
      defaultValue: DEFAULT_EQUALIZER_GRID_CONFIG.randomSpeed,
      description: "Deterministic per-cell shimmer rate; it never changes cell positions.",
      id: "randomSpeed",
      label: "Shimmer speed",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "cycles/s",
    }),
    colorControl(
      "backgroundColor",
      "Background color",
      "Opaque stage background behind inactive and active cells.",
      DEFAULT_EQUALIZER_GRID_CONFIG.backgroundColor,
    ),
    colorControl(
      "gradientColor1",
      "Gradient color 1",
      "Low-frequency, low-amplitude color stop.",
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor1,
    ),
    colorControl(
      "gradientColor2",
      "Gradient color 2",
      "Low-mid frequency color stop.",
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor2,
    ),
    colorControl(
      "gradientColor3",
      "Gradient color 3",
      "High-mid frequency color stop.",
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor3,
    ),
    colorControl(
      "gradientColor4",
      "Gradient color 4",
      "High-frequency and peak color stop.",
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor4,
    ),
    motionControl(DEFAULT_EQUALIZER_GRID_CONFIG.motion),
    qualityControl(DEFAULT_EQUALIZER_GRID_CONFIG.quality),
  ]);

export const EQUALIZER_GRID_PRESETS: readonly VfxPreset<EqualizerGridConfig>[] = Object.freeze([
  preset("ice-map", "Ice map", "Cyan-to-rose analysis grid with balanced density.", {}),
  preset("ember-matrix", "Ember matrix", "Low-density amber grid with broad cells.", {
    backgroundColor: "#0c0502",
    cellGap: 0.18,
    cellReactivity: 1.35,
    gradientColor1: "#ff653c",
    gradientColor2: "#ff9d42",
    gradientColor3: "#ffd66b",
    gradientColor4: "#fff1b2",
    gridColumns: 18,
    gridRows: 8,
    randomSpeed: 0.12,
  }),
  preset("signal-radar", "Signal radar", "Dense green diagnostic matrix with a bright peak stop.", {
    backgroundColor: "#010806",
    cellGap: 0.08,
    cellReactivity: 0.9,
    gradientColor1: "#145c43",
    gradientColor2: "#28b778",
    gradientColor3: "#77efaa",
    gradientColor4: "#e5fff1",
    gridColumns: 36,
    gridRows: 14,
    randomSpeed: 0.5,
  }),
]);

export function resolveEqualizerGridConfig(
  input: EqualizerGridConfigInput = {},
): EqualizerGridConfig {
  return Object.freeze({
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_EQUALIZER_GRID_CONFIG.backgroundColor),
    cellGap: clampFinite(input.cellGap, 0, 0.45, 0.12),
    cellReactivity: clampFinite(input.cellReactivity, 0, 2, 1.15),
    gradientColor1: nonempty(input.gradientColor1, DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor1),
    gradientColor2: nonempty(input.gradientColor2, DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor2),
    gradientColor3: nonempty(input.gradientColor3, DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor3),
    gradientColor4: nonempty(input.gradientColor4, DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor4),
    gridColumns: clampInteger(
      input.gridColumns,
      MIN_EQUALIZER_GRID_COLUMNS,
      MAX_EQUALIZER_GRID_COLUMNS,
      DEFAULT_EQUALIZER_GRID_CONFIG.gridColumns,
    ),
    gridRows: clampInteger(
      input.gridRows,
      MIN_EQUALIZER_GRID_ROWS,
      MAX_EQUALIZER_GRID_ROWS,
      DEFAULT_EQUALIZER_GRID_CONFIG.gridRows,
    ),
    mode: "equalizer-grid",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_EQUALIZER_GRID_CONFIG.motion,
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_EQUALIZER_GRID_CONFIG.quality,
    randomSpeed: clampFinite(input.randomSpeed, 0, 2, 0.28),
    renderer: "webgl2",
  });
}

export function createEqualizerGridUniformState(
  frame: BandEnergyFrame,
  input: EqualizerGridConfigInput | EqualizerGridConfig = {},
): EqualizerGridUniformState {
  const config = resolveEqualizerGridConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_EQUALIZER_GRID_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    cellGap: config.cellGap,
    cellReactivity: config.cellReactivity,
    centroid: metrics.centroid,
    energy: metrics.energy,
    gradientColor1: parseVfxColor(
      config.gradientColor1,
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor1,
    ),
    gradientColor2: parseVfxColor(
      config.gradientColor2,
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor2,
    ),
    gradientColor3: parseVfxColor(
      config.gradientColor3,
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor3,
    ),
    gradientColor4: parseVfxColor(
      config.gradientColor4,
      DEFAULT_EQUALIZER_GRID_CONFIG.gradientColor4,
    ),
    gridColumns: config.gridColumns,
    gridRows: config.gridRows,
    peak: metrics.peak,
    randomSpeed: config.randomSpeed,
  });
}

export function getEqualizerGridPreset(id: EqualizerGridPresetId): VfxPreset<EqualizerGridConfig> {
  return (
    EQUALIZER_GRID_PRESETS.find((candidate) => candidate.id === id) ?? EQUALIZER_GRID_PRESETS[0]
  );
}

function numberControl<
  Id extends Extract<EqualizerGridControlDefinition, { type: "number" }>["id"],
>(
  definition: Omit<VfxNumericControlDefinition<Id>, keyof typeof VFX_CONTROL_CONTEXT | "type">,
): VfxNumericControlDefinition<Id> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    ...definition,
    constraints: Object.freeze([...definition.constraints]),
    type: "number",
  });
}

function colorControl<
  Id extends
    | "backgroundColor"
    | "gradientColor1"
    | "gradientColor2"
    | "gradientColor3"
    | "gradientColor4",
>(id: Id, label: string, description: string, defaultValue: string): VfxColorControlDefinition<Id> {
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
  defaultValue: EqualizerGridConfig["motion"],
): VfxSelectControlDefinition<"motion", EqualizerGridConfig["motion"]> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "auto follows prefers-reduced-motion",
      "reduced draws one deterministic frame",
    ]),
    defaultValue,
    description: "Controls deterministic shimmer while preserving a stable static grid.",
    id: "motion",
    label: "Motion",
    options: Object.freeze(["auto", "full", "reduced"] as const),
    type: "select",
    unit: "enum",
  });
}

function qualityControl(
  defaultValue: EqualizerGridConfig["quality"],
): VfxSelectControlDefinition<"quality", EqualizerGridConfig["quality"]> {
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
  id: EqualizerGridPresetId,
  label: string,
  description: string,
  input: EqualizerGridConfigInput,
): VfxPreset<EqualizerGridConfig> {
  return Object.freeze({
    config: resolveEqualizerGridConfig(input),
    description,
    id,
    label,
  });
}
