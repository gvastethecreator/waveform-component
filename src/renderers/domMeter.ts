import { buildMeterRects, buildMeterSegments } from "../core/meterGeometry";
import { resolveMeterConfig } from "../meterConfig";
import type {
  CanvasMeterConfig,
  MeterConfigInput,
  MeterFrame,
  MeterHistoryPoint,
  MeterRect,
  MeterSegment,
  WaveformViewport,
} from "../types";
import { DOM_RENDERER_CAPABILITIES, getRendererSupport } from "./capabilities";
import {
  cssColorWithAlpha,
  finalizeDomScene,
  normalizeDomViewport,
  sampleDomItems,
  unsupportedDomScene,
} from "./domHelpers";
import type { DomNode, DomRenderOptions, DomScene } from "./domTypes";

interface MeterPaints {
  readonly accent: string;
  readonly base: string;
  readonly crest: string;
  readonly middle: string;
}

type MeterGeometry =
  | { readonly items: readonly MeterRect[]; readonly kind: "meters" }
  | { readonly items: readonly MeterSegment[]; readonly kind: "steps" };

export function renderDomMeter(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: MeterConfigInput,
  history: readonly MeterHistoryPoint[] = [],
  options: DomRenderOptions = {},
): DomScene {
  const size = normalizeDomViewport(viewport);
  const resolved = resolveMeterConfig(config, frame);
  const background = options.forcedColors ? "Canvas" : resolved.backgroundColor;
  const compatibleHistory = resolved.showHistory
    ? history.filter(
        (point) =>
          point.frame.state === "ready" && point.frame.channels.length === frame.channels.length,
      )
    : [];
  const support = getRendererSupport("dom", {
    channelCount: frame.channels.length,
    colorMode: resolved.colorMode,
    frameKind: frame.kind,
    historyCount: compatibleHistory.length,
    layout: resolved.layout,
    mode: resolved.mode,
  });
  if (!support.enabled)
    return unsupportedDomScene(size.width, size.height, support.reasons.join(" "), background);
  if (frame.state === "empty")
    return finalizeDomScene({
      background,
      height: size.height,
      nodes: [],
      renderedPointCount: 0,
      sourcePointCount: 0,
      width: size.width,
    });

  const sampledHistory = sampleDomItems(
    compatibleHistory,
    DOM_RENDERER_CAPABILITIES.limits.maximumHistoryLayers,
  );
  const estimatedNodeCount = estimateMaximumNodeCount(
    size,
    resolved,
    frame.channels.length,
    sampledHistory.length,
  );
  if (estimatedNodeCount > DOM_RENDERER_CAPABILITIES.limits.maximumNodes)
    return unsupportedDomScene(
      size.width,
      size.height,
      `DOM/CSS node budget exceeded: ${estimatedNodeCount} nodes requested, maximum ${DOM_RENDERER_CAPABILITIES.limits.maximumNodes}. Increase step size or gap, shorten history, or use Canvas 2D.`,
      background,
    );

  const current = buildGeometry(frame, size, resolved);
  const historyGeometry = sampledHistory.map((point) => buildGeometry(point.frame, size, resolved));
  const paints = resolvePaints(resolved, options.forcedColors === true);
  const nodes: DomNode[] = [...trackNodes(current, size, resolved, options.forcedColors === true)];
  historyGeometry.forEach((geometry, index) => {
    const ageRatio = historyGeometry.length === 1 ? 1 : (index + 1) / historyGeometry.length;
    nodes.push(
      ...activeNodes(
        geometry,
        size,
        resolved,
        paints,
        `history-${index}`,
        resolved.historyOpacity * ageRatio,
        "history",
      ),
    );
  });
  nodes.push(...activeNodes(current, size, resolved, paints, "current", 1, currentRole(current)));

  const sourcePointCount =
    current.items.length * 2 + current.items.length * compatibleHistory.length;
  const renderedPointCount = nodes.length;
  return finalizeDomScene({
    background,
    height: size.height,
    messages: support.warnings,
    nodes,
    renderedPointCount,
    sourcePointCount,
    width: size.width,
  });
}

function estimateMaximumNodeCount(
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  channelCount: number,
  historyCount: number,
): number {
  if (config.mode === "meter") return channelCount * (2 + historyCount);
  const progressExtent = Math.max(
    0,
    (config.orientation === "horizontal" ? viewport.width : viewport.height) - config.padding * 2,
  );
  const stepWidth = Math.min(config.stepWidth, progressExtent);
  const stepGap = Math.min(config.stepGap, progressExtent);
  const stepsPerChannel = Math.max(
    1,
    Math.floor((progressExtent + stepGap) / Math.max(1, stepWidth + stepGap)),
  );
  return stepsPerChannel * channelCount * (2 + historyCount);
}

function buildGeometry(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
): MeterGeometry {
  return config.mode === "stepped-meter"
    ? { items: buildMeterSegments(frame, viewport, config), kind: "steps" }
    : { items: buildMeterRects(frame, viewport, config), kind: "meters" };
}

function trackNodes(
  geometry: MeterGeometry,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  forcedColors: boolean,
): readonly DomNode[] {
  const background = forcedColors ? "GrayText" : config.trackColor;
  if (geometry.kind === "steps")
    return geometry.items.map((segment) =>
      boxNode(segment, config, `track-${segment.channelIndex}-${segment.segmentIndex}`, "track", {
        background,
      }),
    );
  return geometry.items.map((meter, index) => {
    const track =
      config.orientation === "horizontal"
        ? { ...meter, width: Math.max(0, viewport.width - config.padding * 2), x: config.padding }
        : {
            ...meter,
            height: Math.max(0, viewport.height - config.padding * 2),
            y: config.padding,
          };
    return boxNode(track, config, `track-${index}`, "track", { background });
  });
}

function activeNodes(
  geometry: MeterGeometry,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  paints: MeterPaints,
  keyPrefix: string,
  opacity: number,
  role: "history" | "meter" | "step",
): readonly DomNode[] {
  const items =
    geometry.kind === "steps" ? geometry.items.filter((segment) => segment.active) : geometry.items;
  return items.map((item, index) => {
    const paint = meterPaint(item.decibels, item, viewport, config, paints);
    const itemKey =
      "segmentIndex" in item ? `${item.channelIndex}-${item.segmentIndex}` : String(index);
    return boxNode(item, config, `${keyPrefix}-${itemKey}`, role, { ...paint, opacity });
  });
}

function meterPaint(
  decibels: number,
  rect: MeterRect,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  paints: MeterPaints,
): Pick<DomNode, "background" | "backgroundPosition" | "backgroundSize"> {
  if (config.colorMode === "range") return { background: paints[meterRangeRole(decibels, config)] };
  if (config.colorMode !== "gradient") return { background: paints.base };
  const length = Math.max(
    1,
    (config.orientation === "horizontal" ? viewport.width : viewport.height) - config.padding * 2,
  );
  return {
    background: meterGradient(config, paints),
    backgroundPosition:
      config.orientation === "horizontal"
        ? `${config.padding - rect.x}px 0`
        : `0 ${config.padding - rect.y}px`,
    backgroundSize: config.orientation === "horizontal" ? `${length}px 100%` : `100% ${length}px`,
  };
}

function meterGradient(config: CanvasMeterConfig, paints: MeterPaints): string {
  const direction = config.orientation === "horizontal" ? "to right" : "to top";
  const stop = (value: number) => `${thresholdLevel(value, config) * 100}%`;
  return `linear-gradient(${direction}, ${paints.base} 0%, ${paints.middle} ${stop(config.middleDecibels)}, ${paints.crest} ${stop(config.crestDecibels)}, ${paints.accent} ${stop(config.peakThresholdDb)}, ${paints.accent} 100%)`;
}

function boxNode(
  rect: Pick<MeterRect, "height" | "width" | "x" | "y">,
  config: CanvasMeterConfig,
  key: string,
  role: DomNode["role"],
  paint: Pick<DomNode, "background" | "backgroundPosition" | "backgroundSize" | "opacity">,
): DomNode {
  return {
    ...paint,
    height: rect.height,
    key,
    kind: "box",
    radius: config.roundedCaps ? Math.min(config.cornerRadius, rect.width / 2, rect.height / 2) : 0,
    role,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}

function resolvePaints(config: CanvasMeterConfig, forcedColors: boolean): MeterPaints {
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

function currentRole(geometry: MeterGeometry): "meter" | "step" {
  return geometry.kind === "steps" ? "step" : "meter";
}

function meterRangeRole(decibels: number, config: CanvasMeterConfig): keyof MeterPaints {
  if (decibels >= config.peakThresholdDb) return "accent";
  if (decibels >= config.crestDecibels) return "crest";
  if (decibels >= config.middleDecibels) return "middle";
  return "base";
}

function thresholdLevel(decibels: number, config: CanvasMeterConfig): number {
  return Math.min(
    1,
    Math.max(
      0,
      (decibels - config.minimumDecibels) / (config.maximumDecibels - config.minimumDecibels),
    ),
  );
}
