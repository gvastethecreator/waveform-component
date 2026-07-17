import type { BandEnergyFrame } from "../types";

export type VfxEffectId =
  | "equalizer-grid"
  | "neon-lines"
  | "pulse-ring"
  | "radial-spikes"
  | "rounded-wobble-bars"
  | "spectrum-bars"
  | "tunnel-waves"
  | "vortex-rings"
  | "waveform-ribbon";
export type VfxMotion = "auto" | "full" | "reduced";
export type VfxQuality = "balanced" | "high" | "low";

export interface VfxSurfaceConfig {
  readonly backgroundColor: string;
  readonly mode: VfxEffectId;
  readonly motion: VfxMotion;
  readonly quality: VfxQuality;
  readonly renderer: "webgl2";
}

interface VfxControlDefinitionBase<Id extends string> {
  readonly compatibleData: readonly [BandEnergyFrame["kind"]];
  readonly compatibleRenderers: readonly ["webgl2"];
  readonly constraints: readonly string[];
  readonly description: string;
  readonly id: Id;
  readonly label: string;
  readonly visibleWhen: "always";
}

export interface VfxNumericControlDefinition<
  Id extends string,
> extends VfxControlDefinitionBase<Id> {
  readonly defaultValue: number;
  readonly maximum: number;
  readonly minimum: number;
  readonly step: number;
  readonly type: "number";
  readonly unit: string;
}

export interface VfxColorControlDefinition<Id extends string> extends VfxControlDefinitionBase<Id> {
  readonly defaultValue: string;
  readonly type: "color";
  readonly unit: "css-color";
}

export interface VfxBooleanControlDefinition<
  Id extends string,
> extends VfxControlDefinitionBase<Id> {
  readonly defaultValue: boolean;
  readonly type: "boolean";
  readonly unit: "boolean";
}

export interface VfxSelectControlDefinition<
  Id extends string,
  Value extends string,
> extends VfxControlDefinitionBase<Id> {
  readonly defaultValue: Value;
  readonly options: readonly Value[];
  readonly type: "select";
  readonly unit: "enum";
}

export type VfxControlDefinition<Id extends string = string> =
  | VfxBooleanControlDefinition<Id>
  | VfxColorControlDefinition<Id>
  | VfxNumericControlDefinition<Id>
  | VfxSelectControlDefinition<Id, string>;

export interface VfxPreset<Config extends VfxSurfaceConfig> {
  readonly config: Config;
  readonly description: string;
  readonly id: string;
  readonly label: string;
}

export const VFX_CONTROL_CONTEXT = Object.freeze({
  compatibleData: Object.freeze(["bands"] as const),
  compatibleRenderers: Object.freeze(["webgl2"] as const),
  visibleWhen: "always" as const,
});
