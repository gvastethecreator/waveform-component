import type { BandEnergyFrame } from "../types";
import { MAX_VFX_BANDS } from "../analysis/bands";

export type PulseRingMotion = "auto" | "full" | "reduced";
export type PulseRingQuality = "balanced" | "high" | "low";

export interface PulseRingConfig {
  readonly backgroundColor: string;
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

interface NumericPulseRingControlDefinition {
  readonly defaultValue: number;
  readonly description: string;
  readonly id: "bandReactivity" | "glowStrength" | "rotationSpeed" | "thickness";
  readonly label: string;
  readonly maximum: number;
  readonly minimum: number;
  readonly step: number;
  readonly type: "number";
  readonly unit: string;
}

interface ColorPulseRingControlDefinition {
  readonly defaultValue: string;
  readonly description: string;
  readonly id: "primaryColor" | "secondaryColor" | "sweepColor" | "tertiaryColor";
  readonly label: string;
  readonly type: "color";
}

interface QualityPulseRingControlDefinition {
  readonly defaultValue: PulseRingQuality;
  readonly description: string;
  readonly id: "quality";
  readonly label: string;
  readonly options: readonly PulseRingQuality[];
  readonly type: "select";
}

export type PulseRingControlDefinition =
  | ColorPulseRingControlDefinition
  | NumericPulseRingControlDefinition
  | QualityPulseRingControlDefinition;

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
      ["primaryColor", "Primary color", "Core ring color."],
      ["secondaryColor", "Secondary color", "Energy-blended ring color."],
      ["tertiaryColor", "Tertiary color", "Outer glow color."],
      ["sweepColor", "Sweep flash color", "Rotating peak highlight color."],
    ] as const
  ).map(([id, label, description]) =>
    Object.freeze({
      defaultValue: DEFAULT_PULSE_RING_CONFIG[id],
      description,
      id,
      label,
      type: "color" as const,
    }),
  ),
  Object.freeze({
    defaultValue: DEFAULT_PULSE_RING_CONFIG.quality,
    description: "Caps actual backing-buffer DPR and pixel allocation.",
    id: "quality",
    label: "GPU quality",
    options: Object.freeze(["low", "balanced", "high"] as const),
    type: "select",
  }),
]);

export function resolvePulseRingConfig(input: PulseRingConfigInput = {}): PulseRingConfig {
  return Object.freeze({
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_PULSE_RING_CONFIG.backgroundColor),
    bandReactivity: clampFinite(input.bandReactivity, 0, 2, 1),
    glowStrength: clampFinite(input.glowStrength, 0, 2, 0.75),
    mode: "pulse-ring",
    motion: isMotion(input.motion) ? input.motion : DEFAULT_PULSE_RING_CONFIG.motion,
    primaryColor: nonempty(input.primaryColor, DEFAULT_PULSE_RING_CONFIG.primaryColor),
    quality: isQuality(input.quality) ? input.quality : DEFAULT_PULSE_RING_CONFIG.quality,
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
  const bands = sampleBandEnergy(frame);
  let squaredEnergy = 0;
  let peak = 0;
  let weightedPosition = 0;
  let weight = 0;
  bands.forEach((energy, index) => {
    squaredEnergy += energy * energy;
    peak = Math.max(peak, energy);
    const position = bands.length <= 1 ? 0 : index / (bands.length - 1);
    weightedPosition += position * energy;
    weight += energy;
  });
  return Object.freeze({
    backgroundColor: parsePulseRingColor(
      config.backgroundColor,
      DEFAULT_PULSE_RING_CONFIG.backgroundColor,
    ),
    bandCount: bands.length,
    bandReactivity: config.bandReactivity,
    bands,
    centroid: weight === 0 ? 0 : weightedPosition / weight,
    energy: bands.length === 0 ? 0 : Math.sqrt(squaredEnergy / bands.length),
    glowStrength: config.glowStrength,
    peak,
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
  return reducedMotion || !Number.isFinite(timeSeconds) ? 0 : Math.max(0, timeSeconds);
}

export function parsePulseRingColor(
  value: string,
  fallback = "#000000",
): readonly [number, number, number, number] {
  const candidate = variableFallback(value) ?? value;
  return parseColor(candidate) ?? parseColor(fallback) ?? Object.freeze([0, 0, 0, 1]);
}

function sampleBandEnergy(frame: BandEnergyFrame): readonly number[] {
  if (frame.state === "empty" || frame.bands.length === 0) return Object.freeze([]);
  if (frame.bands.length <= MAX_VFX_BANDS)
    return Object.freeze(frame.bands.map((band) => clampFinite(band.energy, 0, 1, 0)));
  return Object.freeze(
    Array.from({ length: MAX_VFX_BANDS }, (_, index) => {
      const start = Math.floor((index * frame.bands.length) / MAX_VFX_BANDS);
      const end = Math.max(
        start + 1,
        Math.floor(((index + 1) * frame.bands.length) / MAX_VFX_BANDS),
      );
      let peak = 0;
      for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1)
        peak = Math.max(peak, clampFinite(frame.bands[sourceIndex].energy, 0, 1, 0));
      return peak;
    }),
  );
}

function parseColor(value: string): readonly [number, number, number, number] | null {
  const color = value.trim();
  if (color.startsWith("#")) return parseHex(color.slice(1));
  const match =
    /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
      color,
    );
  if (!match) return null;
  const alpha = match[4]?.endsWith("%")
    ? Number.parseFloat(match[4]) / 100
    : Number.parseFloat(match[4] ?? "1");
  return Object.freeze([
    clampFinite(Number.parseFloat(match[1]) / 255, 0, 1, 0),
    clampFinite(Number.parseFloat(match[2]) / 255, 0, 1, 0),
    clampFinite(Number.parseFloat(match[3]) / 255, 0, 1, 0),
    clampFinite(alpha, 0, 1, 1),
  ]);
}

function parseHex(value: string): readonly [number, number, number, number] | null {
  const expanded =
    value.length === 3 || value.length === 4
      ? [...value].map((character) => character.repeat(2)).join("")
      : value;
  if (expanded.length !== 6 && expanded.length !== 8) return null;
  if (!/^[\da-f]+$/i.test(expanded)) return null;
  return Object.freeze([
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
    expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
  ]);
}

function variableFallback(value: string): string | null {
  return /^var\(\s*--[\w-]+\s*,\s*(.+)\)$/.exec(value.trim())?.[1]?.trim() ?? null;
}

function clampFinite(
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, typeof value === "number" && Number.isFinite(value) ? value : fallback),
  );
}

function nonempty(value: string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isMotion(value: unknown): value is PulseRingMotion {
  return value === "auto" || value === "full" || value === "reduced";
}

function isQuality(value: unknown): value is PulseRingQuality {
  return value === "low" || value === "balanced" || value === "high";
}
