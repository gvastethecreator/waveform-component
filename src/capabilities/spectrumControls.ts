import {
  DEFAULT_SPECTRUM_ANALYSIS_CONFIG,
  DEFAULT_SPECTRUM_CONFIG,
  GUARDED_SPECTRUM_FFT_SIZE,
  SPECTRUM_FFT_SIZES,
} from "../spectrumConfig";
import type { SpectrumColorMode, SpectrumGeometry, SpectrumLayout, SpectrumWindow } from "../types";

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
  | "layout"
  | "radialInvert"
  | "radialDeadzone"
  | "radialArc"
  | "radialRotation"
  | "roundedCaps"
  | "cornerRadius"
  | "colorMode"
  | "pulseMode"
  | "color"
  | "middleColor"
  | "crestColor"
  | "accentColor"
  | "gradientRatio"
  | "middleDecibels"
  | "crestDecibels";

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
  readonly unit?: "%" | "dBFS" | "deg" | "Hz" | "px" | "×";
  readonly valueType: "boolean" | "color" | "number" | "select";
}

export interface SpectrumCapabilityContext {
  readonly allowLargeFft: boolean;
  readonly colorMode: SpectrumColorMode;
  readonly geometry: SpectrumGeometry;
  readonly layout: SpectrumLayout;
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
  definition("layout", "Layout", "geometry", DEFAULT_SPECTRUM_CONFIG.layout, {
    description: "Use a rectangular plot or map ordered frequencies around a polar arc.",
    options: [
      { label: "Rectangular", value: "rectangular" },
      { label: "Radial", value: "radial" },
    ],
    valueType: "select",
  }),
  definition("radialInvert", "Invert radius", "geometry", false, {
    description:
      "Grow magnitude inward from the outer radius instead of outward from the deadzone.",
    valueType: "boolean",
  }),
  definition("radialDeadzone", "Deadzone", "geometry", 28, {
    description: "Reserve a quiet inner radius as a percentage of the available circle.",
    maximum: 100,
    minimum: 0,
    step: 1,
    unit: "%",
    valueType: "number",
  }),
  definition("radialArc", "Arc", "geometry", 360, {
    description: "Visible polar sweep; zero is intentionally empty and 360 closes the circle.",
    maximum: 360,
    minimum: 0,
    step: 1,
    unit: "deg",
    valueType: "number",
  }),
  definition("radialRotation", "Rotation", "geometry", 270, {
    description: "Clockwise starting angle normalized through wraparound rotations.",
    maximum: 360,
    minimum: 0,
    step: 1,
    unit: "deg",
    valueType: "number",
  }),
  definition("roundedCaps", "Rounded caps", "geometry", true, {
    description: "Round curve endpoints and polar bar caps where the primitive supports it.",
    valueType: "boolean",
  }),
  definition("cornerRadius", "Corner radius", "geometry", 3, {
    description: "Round rectangular bar corners without changing their measured bounds.",
    maximum: 32,
    minimum: 0,
    step: 1,
    unit: "px",
    valueType: "number",
  }),
  definition("colorMode", "Color mode", "color", DEFAULT_SPECTRUM_CONFIG.colorMode, {
    description: "Choose outline, filled, amplitude gradient, peak pulse, or dB-range coloring.",
    options: [
      { label: "Line", value: "line" },
      { label: "Solid", value: "solid" },
      { label: "Gradient", value: "gradient" },
      { label: "Peak pulse", value: "pulse" },
      { label: "dB range", value: "range" },
    ],
    valueType: "select",
  }),
  definition("pulseMode", "Pulse mapping", "color", DEFAULT_SPECTRUM_CONFIG.pulseMode, {
    description: "Drive the base-to-accent blend from peak magnitude or peak frequency position.",
    options: [
      { label: "Peak magnitude", value: "peak-magnitude" },
      { label: "Peak frequency", value: "peak-frequency" },
    ],
    valueType: "select",
  }),
  definition("color", "Signal color", "color", DEFAULT_SPECTRUM_CONFIG.color, {
    description:
      "Base role used by every color mode; CSS variables and explicit alpha are supported.",
    valueType: "color",
  }),
  definition(
    "middleColor",
    "Middle color",
    "color",
    DEFAULT_SPECTRUM_CONFIG.colorRoles.middle.color,
    {
      description: "Middle dB-range role, including its own alpha channel.",
      valueType: "color",
    },
  ),
  definition("crestColor", "Crest color", "color", DEFAULT_SPECTRUM_CONFIG.colorRoles.crest.color, {
    description: "High-energy role used by gradients and dB ranges.",
    valueType: "color",
  }),
  definition(
    "accentColor",
    "Accent color",
    "color",
    DEFAULT_SPECTRUM_CONFIG.colorRoles.accent.color,
    {
      description: "Reactive destination color used by peak pulse mapping.",
      valueType: "color",
    },
  ),
  definition("gradientRatio", "Color ratio", "color", DEFAULT_SPECTRUM_CONFIG.gradientRatio, {
    description: "Moves the gradient crest or scales peak-pulse response.",
    maximum: 4,
    minimum: 0,
    step: 0.05,
    unit: "×",
    valueType: "number",
  }),
  definition(
    "middleDecibels",
    "Middle threshold",
    "color",
    DEFAULT_SPECTRUM_CONFIG.middleDecibels,
    {
      description: "First ordered dB boundary for range coloring.",
      maximum: 0,
      minimum: -120,
      step: 1,
      unit: "dBFS",
      valueType: "number",
    },
  ),
  definition("crestDecibels", "Crest threshold", "color", DEFAULT_SPECTRUM_CONFIG.crestDecibels, {
    description: "Second ordered dB boundary for range coloring.",
    maximum: 0,
    minimum: -120,
    step: 1,
    unit: "dBFS",
    valueType: "number",
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
  if (
    id === "lineWidth" &&
    context.colorMode !== "line" &&
    !(context.geometry === "curve" && context.colorMode === "range")
  )
    return Object.freeze({
      enabled: false,
      reason: "Line width applies to Line mode and range-colored curves.",
    });
  if ((id === "barWidth" || id === "barGap") && context.geometry !== "bars")
    return Object.freeze({ enabled: false, reason: "Bar sizing applies only to bars geometry." });
  if (
    ["radialInvert", "radialDeadzone", "radialArc", "radialRotation"].includes(id) &&
    context.layout !== "radial"
  )
    return Object.freeze({
      enabled: false,
      reason: "Select radial layout to edit polar geometry.",
    });
  if (id === "cornerRadius" && (context.layout !== "rectangular" || context.geometry !== "bars"))
    return Object.freeze({
      enabled: false,
      reason: "Corner radius applies only to rectangular bars.",
    });
  if (
    id === "roundedCaps" &&
    ((context.layout === "rectangular" && context.geometry === "bars") ||
      (context.geometry === "curve" && !["line", "range"].includes(context.colorMode)))
  )
    return Object.freeze({
      enabled: false,
      reason:
        "Rounded caps apply to stroked curves and radial bars; filled curves have no endpoints.",
    });
  if (id === "pulseMode" && context.colorMode !== "pulse")
    return Object.freeze({ enabled: false, reason: "Select Peak pulse to choose its mapping." });
  if (id === "middleColor" && context.colorMode !== "range")
    return Object.freeze({ enabled: false, reason: "Middle color applies only to dB range mode." });
  if (id === "crestColor" && !["gradient", "range"].includes(context.colorMode))
    return Object.freeze({
      enabled: false,
      reason: "Crest color applies to Gradient and dB range modes.",
    });
  if (id === "accentColor" && context.colorMode !== "pulse")
    return Object.freeze({ enabled: false, reason: "Accent color applies only to Peak pulse." });
  if (id === "gradientRatio" && !["gradient", "pulse"].includes(context.colorMode))
    return Object.freeze({
      enabled: false,
      reason: "Color ratio applies to Gradient and Peak pulse modes.",
    });
  if ((id === "middleDecibels" || id === "crestDecibels") && context.colorMode !== "range")
    return Object.freeze({ enabled: false, reason: "dB thresholds apply only to dB range mode." });
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
