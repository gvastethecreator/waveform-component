import {
  VFX_CONTROL_CONTEXT,
  type VfxBooleanControlDefinition,
  type VfxColorControlDefinition,
  type VfxMotion,
  type VfxNumericControlDefinition,
  type VfxQuality,
  type VfxSelectControlDefinition,
} from "./schema";

export function vfxNumberControl<Id extends string>(
  definition: Omit<VfxNumericControlDefinition<Id>, keyof typeof VFX_CONTROL_CONTEXT | "type">,
): VfxNumericControlDefinition<Id> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    ...definition,
    constraints: Object.freeze([...definition.constraints]),
    type: "number",
  });
}

export function vfxColorControl<Id extends string>(
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

export function vfxBooleanControl<Id extends string>(
  id: Id,
  label: string,
  description: string,
  defaultValue: boolean,
  constraints: readonly string[] = [],
): VfxBooleanControlDefinition<Id> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([...constraints]),
    defaultValue,
    description,
    id,
    label,
    type: "boolean",
    unit: "boolean",
  });
}

export function vfxMotionControl(
  defaultValue: VfxMotion,
  description: string,
): VfxSelectControlDefinition<"motion", VfxMotion> {
  return Object.freeze({
    ...VFX_CONTROL_CONTEXT,
    constraints: Object.freeze([
      "auto follows prefers-reduced-motion",
      "reduced draws one deterministic frame",
    ]),
    defaultValue,
    description,
    id: "motion",
    label: "Motion",
    options: Object.freeze(["auto", "full", "reduced"] as const),
    type: "select",
    unit: "enum",
  });
}

export function vfxQualityControl(
  defaultValue: VfxQuality,
): VfxSelectControlDefinition<"quality", VfxQuality> {
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
