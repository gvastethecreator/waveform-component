import type {
  AnalysisFrame,
  CoreRendererId,
  MeterColorMode,
  SpectrumColorMode,
  SpectrumLayout,
  WaveformChannelLayout,
} from "../types";

export type CoreRendererMode = "envelope" | "meter" | "spectrum" | "stepped-meter" | "waveform";

export interface RendererLimits {
  readonly maximumChannels: number;
  readonly maximumHistoryLayers: number;
  readonly maximumNodes: number;
  readonly maximumSpectrumPoints: number;
  readonly maximumTimeDomainColumns: number;
}

export interface RendererCapabilities {
  readonly colorModes: readonly (MeterColorMode | SpectrumColorMode)[];
  readonly description: string;
  readonly id: CoreRendererId;
  readonly label: string;
  readonly layouts: readonly (SpectrumLayout | WaveformChannelLayout)[];
  readonly limits: RendererLimits;
  readonly modes: readonly CoreRendererMode[];
  readonly semanticOverlays: "shared-dom";
  readonly supportsDenseRealtime: boolean;
  readonly supportsVfx: false;
}

export interface RendererSupportQuery {
  readonly channelCount?: number;
  readonly frameKind: AnalysisFrame["kind"];
  readonly historyCount?: number;
  readonly mode: CoreRendererMode;
  readonly pointCount?: number;
}

export interface RendererSupport {
  readonly enabled: boolean;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
}

const CORE_MODES = Object.freeze([
  "waveform",
  "envelope",
  "spectrum",
  "meter",
  "stepped-meter",
] as const);
const CORE_LAYOUTS = Object.freeze([
  "stacked",
  "split",
  "overlay",
  "rectangular",
  "radial",
] as const);
const CORE_COLORS = Object.freeze(["solid", "line", "gradient", "pulse", "range"] as const);

export const CANVAS2D_RENDERER_CAPABILITIES: RendererCapabilities = Object.freeze({
  colorModes: CORE_COLORS,
  description:
    "Dense default renderer with DPR-aware bitmap output for every implemented core mode.",
  id: "canvas2d",
  label: "Canvas 2D",
  layouts: CORE_LAYOUTS,
  limits: Object.freeze({
    maximumChannels: Number.MAX_SAFE_INTEGER,
    maximumHistoryLayers: 64,
    maximumNodes: 0,
    maximumSpectrumPoints: 4096,
    maximumTimeDomainColumns: Number.MAX_SAFE_INTEGER,
  }),
  modes: CORE_MODES,
  semanticOverlays: "shared-dom",
  supportsDenseRealtime: true,
  supportsVfx: false,
});

export const SVG_RENDERER_CAPABILITIES: RendererCapabilities = Object.freeze({
  colorModes: CORE_COLORS,
  description:
    "Inspectable vector renderer for static and moderate-rate core views with an explicit DOM budget.",
  id: "svg",
  label: "SVG",
  layouts: CORE_LAYOUTS,
  limits: Object.freeze({
    maximumChannels: 32,
    maximumHistoryLayers: 16,
    maximumNodes: 4096,
    maximumSpectrumPoints: 512,
    maximumTimeDomainColumns: 1024,
  }),
  modes: CORE_MODES,
  semanticOverlays: "shared-dom",
  supportsDenseRealtime: false,
  supportsVfx: false,
});

export const CORE_RENDERER_CATALOG: Readonly<Record<CoreRendererId, RendererCapabilities>> =
  Object.freeze({
    canvas2d: CANVAS2D_RENDERER_CAPABILITIES,
    svg: SVG_RENDERER_CAPABILITIES,
  });

export function getRendererSupport(
  renderer: CoreRendererId,
  query: RendererSupportQuery,
): RendererSupport {
  const capabilities = CORE_RENDERER_CATALOG[renderer];
  const reasons: string[] = [];
  const warnings: string[] = [];
  const expectedKind = frameKindForMode(query.mode);

  if (!capabilities.modes.includes(query.mode))
    reasons.push(`${capabilities.label} does not support ${query.mode} mode.`);
  if (query.frameKind !== expectedKind)
    reasons.push(`${query.mode} mode requires a ${expectedKind} frame, not ${query.frameKind}.`);
  if ((query.channelCount ?? 0) > capabilities.limits.maximumChannels)
    reasons.push(
      `${capabilities.label} supports at most ${capabilities.limits.maximumChannels} channels; received ${query.channelCount}.`,
    );

  if (
    expectedKind === "spectrum" &&
    (query.pointCount ?? 0) > capabilities.limits.maximumSpectrumPoints
  )
    warnings.push(
      `${capabilities.label} samples spectrum geometry to ${capabilities.limits.maximumSpectrumPoints} points.`,
    );
  if (
    (expectedKind === "waveform" || expectedKind === "envelope") &&
    (query.pointCount ?? 0) > capabilities.limits.maximumTimeDomainColumns
  )
    warnings.push(
      `${capabilities.label} samples time-domain geometry to ${capabilities.limits.maximumTimeDomainColumns} columns.`,
    );
  if ((query.historyCount ?? 0) > capabilities.limits.maximumHistoryLayers)
    warnings.push(
      `${capabilities.label} samples meter history to ${capabilities.limits.maximumHistoryLayers} layers.`,
    );

  return Object.freeze({
    enabled: reasons.length === 0,
    reasons: Object.freeze(reasons),
    warnings: Object.freeze(warnings),
  });
}

function frameKindForMode(mode: CoreRendererMode): AnalysisFrame["kind"] {
  if (mode === "stepped-meter") return "meter";
  return mode;
}
