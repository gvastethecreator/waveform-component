import type { MeterColorMode, MeterGeometry, SpectrumLayout } from "../types";

export type MeterControlId =
  | "channelGap"
  | "cornerRadius"
  | "historyOpacity"
  | "middleThreshold"
  | "orientation"
  | "radialArc"
  | "radialDeadzone"
  | "radialInvert"
  | "radialRotation"
  | "stepGap"
  | "stepWidth";

export interface MeterCapabilityContext {
  readonly channelCount: number;
  readonly colorMode: MeterColorMode;
  readonly layout: SpectrumLayout;
  readonly mode: MeterGeometry;
  readonly roundedCaps: boolean;
  readonly showHistory: boolean;
}

export interface MeterControlAvailability {
  readonly enabled: boolean;
  readonly reason?: string;
}

export interface MeterControlDefinition {
  readonly description: string;
  readonly id: MeterControlId;
  readonly label: string;
  readonly unit?: "dBFS" | "degrees" | "percent" | "pixels";
}

export const METER_CONTROL_DEFINITIONS: readonly MeterControlDefinition[] = Object.freeze([
  definition("channelGap", "Channel gap", "Space between selected meter channels.", "pixels"),
  definition(
    "cornerRadius",
    "Corner radius",
    "Rectangular rounding when rounded caps are enabled.",
    "pixels",
  ),
  definition(
    "historyOpacity",
    "History opacity",
    "Opacity of bounded prior-frame ghosts.",
    "percent",
  ),
  definition(
    "middleThreshold",
    "Range thresholds",
    "Ordered dBFS boundaries for gradient and range colors.",
    "dBFS",
  ),
  definition("orientation", "Orientation", "Direction of dB progression for rectangular meters."),
  definition("radialArc", "Arc", "Angular extent of radial meters.", "degrees"),
  definition("radialDeadzone", "Deadzone", "Unused radial center area.", "percent"),
  definition("radialInvert", "Invert arc", "Reverse radial meter progression."),
  definition("radialRotation", "Rotation", "Starting angle of radial meters.", "degrees"),
  definition("stepGap", "Step gap", "Space between stepped-meter segments.", "pixels"),
  definition("stepWidth", "Step width", "Length of each stepped-meter segment.", "pixels"),
]);

export function getMeterControlAvailability(
  id: MeterControlId,
  context: MeterCapabilityContext,
): MeterControlAvailability {
  if (id === "channelGap" && context.channelCount < 2)
    return disabled("Channel gap requires at least two selected channels.");
  if ((id === "stepGap" || id === "stepWidth") && context.mode !== "stepped-meter")
    return disabled("This control applies only to stepped-meter geometry.");
  if (
    ["radialArc", "radialDeadzone", "radialInvert", "radialRotation"].includes(id) &&
    context.layout !== "radial"
  )
    return disabled("Select radial layout to use this control.");
  if (id === "orientation" && context.layout === "radial")
    return disabled("Radial meters progress around their configured arc.");
  if (id === "cornerRadius" && context.layout === "radial")
    return disabled("Radial meters use line caps instead of corner radius.");
  if (id === "cornerRadius" && !context.roundedCaps)
    return disabled("Enable rounded caps to use corner radius.");
  if (id === "historyOpacity" && !context.showHistory)
    return disabled("Enable meter history to tune its opacity.");
  if (id === "middleThreshold" && context.colorMode === "solid")
    return disabled("Solid meters use only the base color role.");
  return Object.freeze({ enabled: true });
}

function definition(
  id: MeterControlId,
  label: string,
  description: string,
  unit?: MeterControlDefinition["unit"],
): MeterControlDefinition {
  return Object.freeze({ description, id, label, ...(unit ? { unit } : {}) });
}

function disabled(reason: string): MeterControlAvailability {
  return Object.freeze({ enabled: false, reason });
}
