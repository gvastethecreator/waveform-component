import {
  DEFAULT_SPECTRUM_ANALYSIS_CONFIG,
  DEFAULT_SPECTRUM_CONFIG,
  GUARDED_SPECTRUM_FFT_SIZE,
  SPECTRUM_FFT_SIZES,
} from "../spectrumConfig";
import type { SpectrumGeometry, SpectrumWindow } from "../types";

export type SpectrumControlId =
  | "fftSize"
  | "allowLargeFft"
  | "window"
  | "powerOfSineExponent"
  | "lowFrequency"
  | "highFrequency"
  | "frequencyScale"
  | "minimumDecibels"
  | "maximumDecibels"
  | "interpolation"
  | "geometry"
  | "lineWidth"
  | "barWidth"
  | "barGap"
  | "color";

export interface SpectrumControlDefinition {
  readonly defaultValue: boolean | number | string;
  readonly description: string;
  readonly group: "analysis" | "color" | "geometry";
  readonly id: SpectrumControlId;
  readonly label: string;
  readonly maximum?: number;
  readonly minimum?: number;
  readonly options?: readonly { readonly label: string; readonly value: number | string }[];
  readonly step?: number;
  readonly unit?: "dBFS" | "Hz" | "px";
  readonly valueType: "boolean" | "color" | "number" | "select";
}

export interface SpectrumCapabilityContext {
  readonly allowLargeFft: boolean;
  readonly geometry: SpectrumGeometry;
  readonly window: SpectrumWindow;
}

export interface SpectrumControlAvailability {
  readonly enabled: boolean;
  readonly reason?: string;
}

export const SPECTRUM_CONTROL_DEFINITIONS: readonly SpectrumControlDefinition[] = Object.freeze([
  definition("fftSize", "FFT size", "analysis", DEFAULT_SPECTRUM_ANALYSIS_CONFIG.fftSize, {
    description: "Power-of-two analysis size; larger values trade latency and cost for resolution.",
    options: [
      ...SPECTRUM_FFT_SIZES.map((value) => ({ label: value.toLocaleString("en-US"), value })),
      { label: "65,536 · guarded", value: GUARDED_SPECTRUM_FFT_SIZE },
    ],
    valueType: "select",
  }),
  definition("allowLargeFft", "Allow high-cost FFT", "analysis", false, {
    description: "Explicitly enables the 65,536-point advanced analyzer path.",
    valueType: "boolean",
  }),
  definition("window", "Window", "analysis", DEFAULT_SPECTRUM_ANALYSIS_CONFIG.window, {
    description: "Controls spectral leakage before the FFT.",
    options: ["none", "hann", "hamming", "blackman", "blackman-harris", "power-of-sine"].map(
      (value) => ({ label: titleCase(value), value }),
    ),
    valueType: "select",
  }),
  definition(
    "powerOfSineExponent",
    "Sine exponent",
    "analysis",
    DEFAULT_SPECTRUM_ANALYSIS_CONFIG.powerOfSineExponent,
    {
      description: "Shapes only the Power-of-Sine window.",
      maximum: 10,
      minimum: 0.1,
      step: 0.1,
      valueType: "number",
    },
  ),
  definition("lowFrequency", "Low cutoff", "analysis", DEFAULT_SPECTRUM_CONFIG.lowFrequency, {
    description: "Lower visible frequency in hertz; logarithmic views clamp it above zero.",
    maximum: 24_000,
    minimum: 0,
    step: 10,
    unit: "Hz",
    valueType: "number",
  }),
  definition("highFrequency", "High cutoff", "analysis", DEFAULT_SPECTRUM_CONFIG.highFrequency, {
    description: "Upper visible frequency in hertz, clamped to the source Nyquist frequency.",
    maximum: 24_000,
    minimum: 20,
    step: 10,
    unit: "Hz",
    valueType: "number",
  }),
  definition("frequencyScale", "Frequency scale", "analysis", "log", {
    description: "Linear preserves equal-hertz spacing; log prioritizes perceptual detail.",
    options: [
      { label: "Logarithmic", value: "log" },
      { label: "Linear", value: "linear" },
    ],
    valueType: "select",
  }),
  definition("minimumDecibels", "Floor", "analysis", -100, {
    description: "Lowest visible magnitude in decibels relative to full scale.",
    maximum: -1,
    minimum: -180,
    step: 1,
    unit: "dBFS",
    valueType: "number",
  }),
  definition("maximumDecibels", "Ceiling", "analysis", 0, {
    description: "Highest visible magnitude in decibels relative to full scale.",
    maximum: 12,
    minimum: -120,
    step: 1,
    unit: "dBFS",
    valueType: "number",
  }),
  definition("interpolation", "Interpolation", "geometry", "catmull-rom", {
    description: "Resamples ordered bins without changing their frequency meaning.",
    options: [
      { label: "Nearest", value: "nearest" },
      { label: "Lanczos", value: "lanczos" },
      { label: "Catmull-Rom", value: "catmull-rom" },
    ],
    valueType: "select",
  }),
  definition("geometry", "Geometry", "geometry", "curve", {
    description: "Draw the ordered spectrum as a continuous curve or bounded bars.",
    options: [
      { label: "Curve", value: "curve" },
      { label: "Bars", value: "bars" },
    ],
    valueType: "select",
  }),
  definition("lineWidth", "Line width", "geometry", 1.5, {
    description: "Curve stroke width.",
    maximum: 12,
    minimum: 0.5,
    step: 0.1,
    unit: "px",
    valueType: "number",
  }),
  definition("barWidth", "Bar width", "geometry", 7, {
    description: "Width of each Canvas spectrum bar.",
    maximum: 64,
    minimum: 1,
    step: 1,
    unit: "px",
    valueType: "number",
  }),
  definition("barGap", "Bar gap", "geometry", 2, {
    description: "Horizontal gap between Canvas spectrum bars.",
    maximum: 32,
    minimum: 0,
    step: 1,
    unit: "px",
    valueType: "number",
  }),
  definition("color", "Signal color", "color", DEFAULT_SPECTRUM_CONFIG.color, {
    description: "Base curve or bar color; advanced color grammars are capability-gated later.",
    valueType: "color",
  }),
]);

export function getSpectrumControlAvailability(
  id: SpectrumControlId,
  context: SpectrumCapabilityContext,
): SpectrumControlAvailability {
  if (id === "powerOfSineExponent" && context.window !== "power-of-sine")
    return Object.freeze({
      enabled: false,
      reason: "Select the Power-of-Sine window to edit its exponent.",
    });
  if (id === "fftSize" && !context.allowLargeFft)
    return Object.freeze({
      enabled: true,
      reason: "65,536 remains disabled until high-cost FFT is allowed.",
    });
  if (id === "lineWidth" && context.geometry !== "curve")
    return Object.freeze({ enabled: false, reason: "Line width applies only to curve geometry." });
  if ((id === "barWidth" || id === "barGap") && context.geometry !== "bars")
    return Object.freeze({ enabled: false, reason: "Bar sizing applies only to bars geometry." });
  return Object.freeze({ enabled: true });
}

function definition(
  id: SpectrumControlId,
  label: string,
  group: SpectrumControlDefinition["group"],
  defaultValue: SpectrumControlDefinition["defaultValue"],
  details: Omit<SpectrumControlDefinition, "defaultValue" | "group" | "id" | "label">,
): SpectrumControlDefinition {
  return Object.freeze({ defaultValue, group, id, label, ...details });
}

function titleCase(value: string): string {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
