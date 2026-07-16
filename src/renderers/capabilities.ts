import type {
  AnalysisFrame,
  BuiltinRendererId,
  CoreRendererId,
  MeterColorMode,
  SpectrumColorMode,
  SpectrumGeometry,
  SpectrumLayout,
  WaveformChannelLayout,
} from "../types";

export type CoreRendererMode = "envelope" | "meter" | "spectrum" | "stepped-meter" | "waveform";
export type VfxRendererMode = "pulse-ring";
export type RendererMode = CoreRendererMode | VfxRendererMode;

export interface RendererLimits {
  readonly maximumBands: number;
  readonly maximumChannels: number;
  readonly maximumHistoryLayers: number;
  readonly maximumNodes: number;
  readonly maximumSpectrumPoints: number;
  readonly maximumTimeDomainColumns: number;
}

export interface RendererCapabilities {
  readonly colorModes: readonly (MeterColorMode | SpectrumColorMode)[];
  readonly description: string;
  readonly id: BuiltinRendererId;
  readonly label: string;
  readonly layouts: readonly (SpectrumLayout | WaveformChannelLayout)[];
  readonly limits: RendererLimits;
  readonly modes: readonly RendererMode[];
  readonly semanticOverlays: "shared-dom";
  readonly spectrumGeometries: readonly SpectrumGeometry[];
  readonly supportsDenseRealtime: boolean;
  readonly supportsVfx: boolean;
}

export interface RendererSupportQuery {
  readonly channelCount?: number;
  readonly frameKind: AnalysisFrame["kind"];
  readonly historyCount?: number;
  readonly layout?: SpectrumLayout | WaveformChannelLayout;
  readonly mode: RendererMode;
  readonly pointCount?: number;
  readonly spectrumGeometry?: SpectrumGeometry;
  readonly colorMode?: MeterColorMode | SpectrumColorMode;
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
const CORE_SPECTRUM_GEOMETRIES = Object.freeze(["curve", "bars"] as const);

export const CANVAS2D_RENDERER_CAPABILITIES: RendererCapabilities = Object.freeze({
  colorModes: CORE_COLORS,
  description:
    "Dense default renderer with DPR-aware bitmap output for every implemented core mode.",
  id: "canvas2d",
  label: "Canvas 2D",
  layouts: CORE_LAYOUTS,
  limits: Object.freeze({
    maximumBands: 0,
    maximumChannels: Number.MAX_SAFE_INTEGER,
    maximumHistoryLayers: 64,
    maximumNodes: 0,
    maximumSpectrumPoints: 4096,
    maximumTimeDomainColumns: Number.MAX_SAFE_INTEGER,
  }),
  modes: CORE_MODES,
  semanticOverlays: "shared-dom",
  spectrumGeometries: CORE_SPECTRUM_GEOMETRIES,
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
    maximumBands: 0,
    maximumChannels: 32,
    maximumHistoryLayers: 16,
    maximumNodes: 4096,
    maximumSpectrumPoints: 512,
    maximumTimeDomainColumns: 1024,
  }),
  modes: CORE_MODES,
  semanticOverlays: "shared-dom",
  spectrumGeometries: CORE_SPECTRUM_GEOMETRIES,
  supportsDenseRealtime: false,
  supportsVfx: false,
});

export const DOM_RENDERER_CAPABILITIES: RendererCapabilities = Object.freeze({
  colorModes: CORE_COLORS,
  description:
    "Inspectable CSS-box renderer for bounded rectangular spectrum bars and level meters.",
  id: "dom",
  label: "DOM/CSS",
  layouts: Object.freeze(["rectangular"] as const),
  limits: Object.freeze({
    maximumBands: 0,
    maximumChannels: 8,
    maximumHistoryLayers: 4,
    maximumNodes: 1024,
    maximumSpectrumPoints: 256,
    maximumTimeDomainColumns: 0,
  }),
  modes: Object.freeze(["spectrum", "meter", "stepped-meter"] as const),
  semanticOverlays: "shared-dom",
  spectrumGeometries: Object.freeze(["bars"] as const),
  supportsDenseRealtime: false,
  supportsVfx: false,
});

export const WEBGL2_RENDERER_CAPABILITIES: RendererCapabilities = Object.freeze({
  colorModes: Object.freeze([]),
  description: "GPU renderer for original clean-room VFX with explicit context-loss recovery.",
  id: "webgl2",
  label: "WebGL2",
  layouts: Object.freeze(["radial"] as const),
  limits: Object.freeze({
    maximumBands: 16,
    maximumChannels: 0,
    maximumHistoryLayers: 0,
    maximumNodes: 0,
    maximumSpectrumPoints: 0,
    maximumTimeDomainColumns: 0,
  }),
  modes: Object.freeze(["pulse-ring"] as const),
  semanticOverlays: "shared-dom",
  spectrumGeometries: Object.freeze([]),
  supportsDenseRealtime: true,
  supportsVfx: true,
});

export const CORE_RENDERER_CATALOG: Readonly<Record<CoreRendererId, RendererCapabilities>> =
  Object.freeze({
    canvas2d: CANVAS2D_RENDERER_CAPABILITIES,
    dom: DOM_RENDERER_CAPABILITIES,
    svg: SVG_RENDERER_CAPABILITIES,
  });

export const BUILTIN_RENDERER_CATALOG: Readonly<Record<BuiltinRendererId, RendererCapabilities>> =
  Object.freeze({
    ...CORE_RENDERER_CATALOG,
    webgl2: WEBGL2_RENDERER_CAPABILITIES,
  });

export function getRendererSupport(
  renderer: BuiltinRendererId,
  query: RendererSupportQuery,
): RendererSupport {
  const capabilities = BUILTIN_RENDERER_CATALOG[renderer];
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
  if (query.layout && !capabilities.layouts.includes(query.layout))
    reasons.push(`${capabilities.label} does not support ${query.layout} layout.`);
  if (
    expectedKind === "spectrum" &&
    query.spectrumGeometry &&
    !capabilities.spectrumGeometries.includes(query.spectrumGeometry)
  )
    reasons.push(
      `${capabilities.label} does not support ${query.spectrumGeometry} spectrum geometry.`,
    );
  if (query.colorMode && !capabilities.colorModes.includes(query.colorMode))
    reasons.push(`${capabilities.label} does not support ${query.colorMode} color mode.`);

  if (
    expectedKind === "spectrum" &&
    (query.pointCount ?? 0) > capabilities.limits.maximumSpectrumPoints
  )
    warnings.push(
      `${capabilities.label} samples spectrum geometry to ${capabilities.limits.maximumSpectrumPoints} points.`,
    );
  if (
    (expectedKind === "waveform" || expectedKind === "envelope") &&
    capabilities.limits.maximumTimeDomainColumns > 0 &&
    (query.pointCount ?? 0) > capabilities.limits.maximumTimeDomainColumns
  )
    warnings.push(
      `${capabilities.label} samples time-domain geometry to ${capabilities.limits.maximumTimeDomainColumns} columns.`,
    );
  if ((query.historyCount ?? 0) > capabilities.limits.maximumHistoryLayers)
    warnings.push(
      `${capabilities.label} samples meter history to ${capabilities.limits.maximumHistoryLayers} layers.`,
    );
  if (expectedKind === "bands" && (query.pointCount ?? 0) > capabilities.limits.maximumBands)
    warnings.push(
      `${capabilities.label} samples band energy to ${capabilities.limits.maximumBands} bands.`,
    );

  return Object.freeze({
    enabled: reasons.length === 0,
    reasons: Object.freeze(reasons),
    warnings: Object.freeze(warnings),
  });
}

function frameKindForMode(mode: RendererMode): AnalysisFrame["kind"] {
  if (mode === "pulse-ring") return "bands";
  if (mode === "stepped-meter") return "meter";
  return mode;
}
