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

export const MIN_TUNNEL_RING_DENSITY = 3;
export const MAX_TUNNEL_RING_DENSITY = 48;

export interface TunnelWavesConfig extends VfxSurfaceConfig {
  readonly centerColor: string;
  readonly energyReactivity: number;
  readonly glowStrength: number;
  readonly midColor: string;
  readonly mode: "tunnel-waves";
  readonly outerColor: string;
  readonly renderer: "webgl2";
  readonly ringDensity: number;
  readonly tunnelDepth: number;
  readonly tunnelSpeed: number;
}

export type TunnelWavesConfigInput = Partial<TunnelWavesConfig>;
export type TunnelWavesPresetId = "amber-transit" | "deep-signal" | "ice-gate";

export type TunnelWavesControlDefinition =
  | VfxColorControlDefinition<"backgroundColor" | "centerColor" | "midColor" | "outerColor">
  | VfxNumericControlDefinition<
      "energyReactivity" | "glowStrength" | "ringDensity" | "tunnelDepth" | "tunnelSpeed"
    >
  | VfxSelectControlDefinition<"motion", TunnelWavesConfig["motion"]>
  | VfxSelectControlDefinition<"quality", TunnelWavesConfig["quality"]>;

export interface TunnelWavesUniformState {
  readonly backgroundColor: readonly [number, number, number, number];
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly centerColor: readonly [number, number, number, number];
  readonly centroid: number;
  readonly energy: number;
  readonly energyReactivity: number;
  readonly glowStrength: number;
  readonly midColor: readonly [number, number, number, number];
  readonly outerColor: readonly [number, number, number, number];
  readonly peak: number;
  readonly ringDensity: number;
  readonly tunnelDepth: number;
  readonly tunnelSpeed: number;
}

export const DEFAULT_TUNNEL_WAVES_CONFIG: TunnelWavesConfig = Object.freeze({
  backgroundColor: "#02050a",
  centerColor: "#dffcff",
  energyReactivity: 1.15,
  glowStrength: 1,
  midColor: "#4ee0d0",
  mode: "tunnel-waves",
  motion: "auto",
  outerColor: "#5368ff",
  quality: "balanced",
  renderer: "webgl2",
  ringDensity: 16,
  tunnelDepth: 0.64,
  tunnelSpeed: 0.38,
});

export const TUNNEL_WAVES_CONTROL_DEFINITIONS: readonly TunnelWavesControlDefinition[] =
  Object.freeze([
    vfxNumberControl({
      constraints: [
        `${MIN_TUNNEL_RING_DENSITY} <= ringDensity <= ${MAX_TUNNEL_RING_DENSITY}`,
        "Rounded before procedural distance addressing",
      ],
      defaultValue: DEFAULT_TUNNEL_WAVES_CONFIG.ringDensity,
      description: "Number of bounded wave intervals from the vanishing point to the outer field.",
      id: "ringDensity",
      label: "Ring density",
      maximum: MAX_TUNNEL_RING_DENSITY,
      minimum: MIN_TUNNEL_RING_DENSITY,
      step: 1,
      unit: "rings",
    }),
    vfxNumberControl({
      constraints: ["Negative values reverse travel", "Reduced motion freezes the phase"],
      defaultValue: DEFAULT_TUNNEL_WAVES_CONFIG.tunnelSpeed,
      description: "Apparent forward or reverse travel through the fixed ordered energy field.",
      id: "tunnelSpeed",
      label: "Tunnel speed",
      maximum: 2,
      minimum: -2,
      step: 0.05,
      unit: "cycles/s",
    }),
    vfxNumberControl({
      constraints: ["0.1 <= tunnelDepth <= 1", "Changes perspective spacing, never ring count"],
      defaultValue: DEFAULT_TUNNEL_WAVES_CONFIG.tunnelDepth,
      description: "Perspective compression between the portal center and outer rings.",
      id: "tunnelDepth",
      label: "Tunnel depth",
      maximum: 1,
      minimum: 0.1,
      step: 0.01,
      unit: "ratio",
    }),
    vfxNumberControl({
      constraints: ["Input energy is clamped to 0..1", "At most 16 ordered bands are sampled"],
      defaultValue: DEFAULT_TUNNEL_WAVES_CONFIG.energyReactivity,
      description: "How strongly ordered radial band energy changes wave width and intensity.",
      id: "energyReactivity",
      label: "Energy reactivity",
      maximum: 2,
      minimum: 0,
      step: 0.05,
      unit: "x",
    }),
    vfxNumberControl({
      constraints: ["0 removes the outer halo", "3 is the maximum halo multiplier"],
      defaultValue: DEFAULT_TUNNEL_WAVES_CONFIG.glowStrength,
      description: "Width and intensity multiplier for tunnel wave halos.",
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
      "Opaque field outside and between tunnel waves.",
      DEFAULT_TUNNEL_WAVES_CONFIG.backgroundColor,
    ),
    vfxColorControl(
      "centerColor",
      "Center color",
      "Portal and innermost wave color.",
      DEFAULT_TUNNEL_WAVES_CONFIG.centerColor,
    ),
    vfxColorControl(
      "midColor",
      "Mid color",
      "Middle-depth wave color.",
      DEFAULT_TUNNEL_WAVES_CONFIG.midColor,
    ),
    vfxColorControl(
      "outerColor",
      "Outer color",
      "Color at the nearest outer wave field.",
      DEFAULT_TUNNEL_WAVES_CONFIG.outerColor,
    ),
    vfxMotionControl(
      DEFAULT_TUNNEL_WAVES_CONFIG.motion,
      "Controls tunnel travel while preserving ordered center-to-edge energy placement.",
    ),
    vfxQualityControl(DEFAULT_TUNNEL_WAVES_CONFIG.quality),
  ]);

export const TUNNEL_WAVES_PRESETS: readonly VfxPreset<TunnelWavesConfig>[] = Object.freeze([
  preset("ice-gate", "Ice gate", "Balanced cyan portal with deep blue outer waves.", {}),
  preset("amber-transit", "Amber transit", "Warm dense tunnel moving toward the viewer.", {
    backgroundColor: "#0b0301",
    centerColor: "#fff1ad",
    energyReactivity: 1.35,
    glowStrength: 1.45,
    midColor: "#ff9f45",
    outerColor: "#e6442d",
    ringDensity: 24,
    tunnelDepth: 0.76,
    tunnelSpeed: 0.72,
  }),
  preset("deep-signal", "Deep signal", "Sparse green diagnostic tunnel with reverse travel.", {
    backgroundColor: "#010806",
    centerColor: "#e7fff4",
    energyReactivity: 0.9,
    glowStrength: 0.55,
    midColor: "#3ee69a",
    outerColor: "#126c55",
    ringDensity: 9,
    tunnelDepth: 0.92,
    tunnelSpeed: -0.26,
  }),
]);

export function resolveTunnelWavesConfig(input: TunnelWavesConfigInput = {}): TunnelWavesConfig {
  return Object.freeze({
    backgroundColor: nonempty(input.backgroundColor, DEFAULT_TUNNEL_WAVES_CONFIG.backgroundColor),
    centerColor: nonempty(input.centerColor, DEFAULT_TUNNEL_WAVES_CONFIG.centerColor),
    energyReactivity: clampFinite(input.energyReactivity, 0, 2, 1.15),
    glowStrength: clampFinite(input.glowStrength, 0, 3, 1),
    midColor: nonempty(input.midColor, DEFAULT_TUNNEL_WAVES_CONFIG.midColor),
    mode: "tunnel-waves",
    motion: isVfxMotion(input.motion) ? input.motion : DEFAULT_TUNNEL_WAVES_CONFIG.motion,
    outerColor: nonempty(input.outerColor, DEFAULT_TUNNEL_WAVES_CONFIG.outerColor),
    quality: isVfxQuality(input.quality) ? input.quality : DEFAULT_TUNNEL_WAVES_CONFIG.quality,
    renderer: "webgl2",
    ringDensity: clampInteger(
      input.ringDensity,
      MIN_TUNNEL_RING_DENSITY,
      MAX_TUNNEL_RING_DENSITY,
      DEFAULT_TUNNEL_WAVES_CONFIG.ringDensity,
    ),
    tunnelDepth: clampFinite(input.tunnelDepth, 0.1, 1, 0.64),
    tunnelSpeed: clampFinite(input.tunnelSpeed, -2, 2, 0.38),
  });
}

export function createTunnelWavesUniformState(
  frame: BandEnergyFrame,
  input: TunnelWavesConfigInput | TunnelWavesConfig = {},
): TunnelWavesUniformState {
  const config = resolveTunnelWavesConfig(input);
  const metrics = createBandUniformMetrics(frame);
  return Object.freeze({
    backgroundColor: parseVfxColor(
      config.backgroundColor,
      DEFAULT_TUNNEL_WAVES_CONFIG.backgroundColor,
    ),
    bandCount: metrics.bandCount,
    bands: metrics.bands,
    centerColor: parseVfxColor(config.centerColor, DEFAULT_TUNNEL_WAVES_CONFIG.centerColor),
    centroid: metrics.centroid,
    energy: metrics.energy,
    energyReactivity: config.energyReactivity,
    glowStrength: config.glowStrength,
    midColor: parseVfxColor(config.midColor, DEFAULT_TUNNEL_WAVES_CONFIG.midColor),
    outerColor: parseVfxColor(config.outerColor, DEFAULT_TUNNEL_WAVES_CONFIG.outerColor),
    peak: metrics.peak,
    ringDensity: config.ringDensity,
    tunnelDepth: config.tunnelDepth,
    tunnelSpeed: config.tunnelSpeed,
  });
}

export function getTunnelWavesPreset(id: TunnelWavesPresetId): VfxPreset<TunnelWavesConfig> {
  return TUNNEL_WAVES_PRESETS.find((candidate) => candidate.id === id) ?? TUNNEL_WAVES_PRESETS[0];
}

function preset(
  id: TunnelWavesPresetId,
  label: string,
  description: string,
  input: TunnelWavesConfigInput,
): VfxPreset<TunnelWavesConfig> {
  return Object.freeze({ config: resolveTunnelWavesConfig(input), description, id, label });
}
