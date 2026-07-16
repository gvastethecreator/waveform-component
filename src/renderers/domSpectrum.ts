import { spectrumPulseAmount, spectrumRangeRole } from "../color/spectrumColor";
import { buildSpectrumBars } from "../core/spectrumGeometry";
import { resolveSpectrumConfig } from "../spectrumConfig";
import type {
  CanvasSpectrumConfig,
  SpectrumBar,
  SpectrumConfigInput,
  SpectrumFrame,
  WaveformViewport,
} from "../types";
import { DOM_RENDERER_CAPABILITIES, getRendererSupport } from "./capabilities";
import {
  cssColorMix,
  cssColorWithAlpha,
  finalizeDomScene,
  normalizeDomViewport,
  unsupportedDomScene,
} from "./domHelpers";
import type { DomNode, DomRenderOptions, DomScene } from "./domTypes";

interface SpectrumPaints {
  readonly accent: string;
  readonly base: string;
  readonly crest: string;
  readonly middle: string;
}

export function renderDomSpectrum(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: SpectrumConfigInput,
  options: DomRenderOptions = {},
): DomScene {
  const size = normalizeDomViewport(viewport);
  const resolved = resolveSpectrumConfig(config, frame);
  const background = options.forcedColors ? "Canvas" : resolved.backgroundColor;
  const support = getRendererSupport("dom", {
    colorMode: resolved.colorMode,
    frameKind: frame.kind,
    layout: resolved.layout,
    mode: "spectrum",
    pointCount: frame.bins.length,
    spectrumGeometry: resolved.geometry,
  });
  if (!support.enabled)
    return unsupportedDomScene(size.width, size.height, support.reasons.join(" "), background);

  const nodes: DomNode[] = resolved.showGrid
    ? [...rectangularGridNodes(size, resolved, options.forcedColors === true)]
    : [];
  if (frame.state === "empty")
    return finalizeDomScene({
      background,
      height: size.height,
      nodes,
      renderedPointCount: 0,
      sourcePointCount: 0,
      width: size.width,
    });

  const nativeBarCount = spectrumBarCount(size, resolved);
  const bars = buildBoundedSpectrumBars(frame, size, resolved, nativeBarCount);
  const paints = resolvePaints(resolved, options.forcedColors === true);
  const sharedBackground = spectrumBackground(bars, resolved, paints);
  nodes.push(
    ...bars.map((bar, index) =>
      spectrumBarNode(bar, index, size, resolved, paints, sharedBackground),
    ),
  );
  const messages = [...support.warnings];
  if (nativeBarCount > DOM_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints)
    messages.push(
      `DOM/CSS increased bar spacing to its ${DOM_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints}-node spectrum budget.`,
    );
  return finalizeDomScene({
    background,
    height: size.height,
    messages,
    nodes,
    renderedPointCount: bars.length,
    sourcePointCount: nativeBarCount,
    width: size.width,
  });
}

function spectrumBarCount(viewport: WaveformViewport, config: CanvasSpectrumConfig): number {
  const innerWidth = Math.max(0, viewport.width - config.padding * 2);
  if (innerWidth === 0) return 0;
  const barWidth = Math.min(config.barWidth, innerWidth);
  const barGap = Math.min(config.barGap, innerWidth);
  return Math.max(1, Math.floor((innerWidth + barGap) / Math.max(1, barWidth + barGap)));
}

function buildBoundedSpectrumBars(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  nativeBarCount: number,
): readonly SpectrumBar[] {
  const maximum = DOM_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints;
  if (nativeBarCount <= maximum) return buildSpectrumBars(frame, viewport, config);
  const innerWidth = Math.max(0, viewport.width - config.padding * 2);
  const slot = innerWidth / maximum;
  const barGap = Math.min(config.barGap, slot / 2);
  if (slot <= 64)
    return buildSpectrumBars(frame, viewport, {
      ...config,
      barGap,
      barWidth: Math.max(1, slot - barGap),
    });

  const workingSlot = 64;
  const workingInnerWidth = maximum * workingSlot;
  const workingViewport = {
    height: viewport.height,
    width: workingInnerWidth + config.padding * 2,
  };
  const workingBars = buildSpectrumBars(frame, workingViewport, {
    ...config,
    barGap: 1,
    barWidth: workingSlot - 1,
  });
  const scale = innerWidth / workingInnerWidth;
  return workingBars.map((bar) =>
    Object.freeze({
      ...bar,
      width: bar.width * scale,
      x: config.padding + (bar.x - config.padding) * scale,
    }),
  );
}

function rectangularGridNodes(
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  forcedColors: boolean,
): readonly DomNode[] {
  const width = Math.max(0, viewport.width - config.padding * 2);
  const height = Math.max(0, viewport.height - config.padding * 2);
  return [0, 0.5, 1].map((ratio, index) => ({
    background: forcedColors ? "GrayText" : config.gridColor,
    height: 1,
    key: `spectrum-grid-${index}`,
    kind: "box" as const,
    opacity: forcedColors ? 1 : 0.7,
    role: "grid" as const,
    width,
    x: config.padding,
    y: config.padding + height * ratio,
  }));
}

function spectrumBarNode(
  bar: SpectrumBar,
  index: number,
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  sharedBackground: string,
): DomNode {
  const line = config.colorMode === "line";
  const background =
    config.colorMode === "range"
      ? paints[spectrumRangeRole(bar.decibels, config)]
      : line
        ? "transparent"
        : sharedBackground;
  const gradient = config.colorMode === "gradient";
  const gradientHeight = Math.max(1, viewport.height - config.padding * 2);
  return {
    background,
    backgroundPosition: gradient ? `0 ${config.padding - bar.y}px` : undefined,
    backgroundSize: gradient ? `100% ${gradientHeight}px` : undefined,
    borderColor: line ? paints.base : undefined,
    borderWidth: line ? config.lineWidth : undefined,
    height: bar.height,
    key: `spectrum-bar-${index}`,
    kind: "box",
    radius: Math.min(config.cornerRadius, bar.width / 2, bar.height / 2),
    role: "spectrum-bar",
    width: bar.width,
    x: bar.x,
    y: bar.y,
  };
}

function spectrumBackground(
  bars: readonly SpectrumBar[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
): string {
  if (config.colorMode === "pulse")
    return cssColorMix(paints.base, paints.accent, spectrumPulseAmount(bars, config));
  if (config.colorMode !== "gradient") return paints.base;
  if (config.gradientRatio === 0) return paints.base;
  const crestStop = Math.min(1, Math.max(0.05, 1 / config.gradientRatio));
  return `linear-gradient(to top, ${paints.base} 0%, ${paints.crest} ${crestStop * 100}%)`;
}

function resolvePaints(config: CanvasSpectrumConfig, forcedColors: boolean): SpectrumPaints {
  if (forcedColors)
    return {
      accent: "LinkText",
      base: "CanvasText",
      crest: "Highlight",
      middle: "GrayText",
    };
  return {
    accent: cssColorWithAlpha(config.colorRoles.accent.color, config.colorRoles.accent.alpha),
    base: cssColorWithAlpha(config.colorRoles.base.color, config.colorRoles.base.alpha),
    crest: cssColorWithAlpha(config.colorRoles.crest.color, config.colorRoles.crest.alpha),
    middle: cssColorWithAlpha(config.colorRoles.middle.color, config.colorRoles.middle.alpha),
  };
}
