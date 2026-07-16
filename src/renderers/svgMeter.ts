import {
  buildMeterArcs,
  buildMeterArcSegments,
  buildMeterRects,
  buildMeterSegments,
} from "../core/meterGeometry";
import { resolveMeterConfig } from "../meterConfig";
import type {
  CanvasMeterConfig,
  CanvasMeterConfigInput,
  MeterArc,
  MeterArcSegment,
  MeterFrame,
  MeterHistoryPoint,
  MeterRect,
  MeterSegment,
  WaveformViewport,
} from "../types";
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import {
  arcPath,
  finalizeSvgScene,
  normalizeSvgViewport,
  sampleEvenly,
  sanitizeSvgId,
  unsupportedSvgScene,
} from "./svgHelpers";
import type { SvgGradient, SvgNode, SvgRenderOptions, SvgScene } from "./svgTypes";

interface RolePaint {
  readonly color: string;
  readonly opacity: number;
}

interface MeterPaints {
  readonly accent: RolePaint;
  readonly base: RolePaint;
  readonly crest: RolePaint;
  readonly middle: RolePaint;
}

export function renderSvgMeter(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: CanvasMeterConfigInput,
  history: readonly MeterHistoryPoint[] = [],
  options: SvgRenderOptions = {},
): SvgScene {
  const size = normalizeSvgViewport(viewport);
  const resolved = resolveMeterConfig(config, frame);
  if (frame.channels.length > SVG_RENDERER_CAPABILITIES.limits.maximumChannels)
    return unsupportedSvgScene(
      size.width,
      size.height,
      `SVG supports at most ${SVG_RENDERER_CAPABILITIES.limits.maximumChannels} meter channels; received ${frame.channels.length}. Use Canvas 2D or select fewer channels.`,
    );

  const paints = resolvePaints(resolved, options.forcedColors === true);
  const idPrefix = sanitizeSvgId(options.idPrefix ?? "waveform-svg-meter");
  const gradient = meterGradient(`${idPrefix}-meter-gradient`, size, resolved, paints);
  const nodes: SvgNode[] = [
    {
      fill: options.forcedColors ? "Canvas" : resolved.backgroundColor,
      height: size.height,
      key: "meter-background",
      kind: "rect",
      width: size.width,
      x: 0,
      y: 0,
    },
  ];
  if (frame.state === "empty")
    return finalizeSvgScene({
      definitions: gradient ? [gradient] : [],
      height: size.height,
      nodes,
      renderedPointCount: 0,
      sourcePointCount: 0,
      width: size.width,
    });

  const currentGeometry = buildMeterGeometry(frame, size, resolved);
  nodes.push(
    ...meterLayerNodes(
      currentGeometry,
      size,
      resolved,
      paints,
      gradient,
      "track",
      1,
      true,
      options.forcedColors === true,
    ),
  );

  const compatibleHistory = resolved.showHistory
    ? history.filter(
        (point) =>
          point.frame.state === "ready" && point.frame.channels.length === frame.channels.length,
      )
    : [];
  const sampledHistory = sampleEvenly(
    compatibleHistory,
    SVG_RENDERER_CAPABILITIES.limits.maximumHistoryLayers,
  );
  const historyGeometries = sampledHistory.map((point) =>
    buildMeterGeometry(point.frame, size, resolved),
  );
  historyGeometries.forEach((geometry, index) => {
    const ageRatio = historyGeometries.length === 1 ? 1 : (index + 1) / historyGeometries.length;
    nodes.push(
      ...meterLayerNodes(
        geometry,
        size,
        resolved,
        paints,
        gradient,
        `history-${index}`,
        resolved.historyOpacity * ageRatio,
        false,
        options.forcedColors === true,
      ),
    );
  });
  nodes.push(
    ...meterLayerNodes(
      currentGeometry,
      size,
      resolved,
      paints,
      gradient,
      "current",
      1,
      false,
      options.forcedColors === true,
    ),
  );

  const messages =
    sampledHistory.length < compatibleHistory.length
      ? [
          `SVG sampled ${compatibleHistory.length} meter history frames to its ${SVG_RENDERER_CAPABILITIES.limits.maximumHistoryLayers}-layer budget.`,
        ]
      : [];
  const renderedPointCount =
    currentGeometry.items.length * 2 +
    historyGeometries.reduce((total, geometry) => total + geometry.items.length, 0);
  const sourcePointCount =
    currentGeometry.items.length * 2 + currentGeometry.items.length * compatibleHistory.length;
  return finalizeSvgScene({
    definitions: gradient ? [gradient] : [],
    height: size.height,
    messages,
    nodes,
    renderedPointCount,
    sourcePointCount,
    width: size.width,
  });
}

type MeterGeometryResult =
  | { readonly items: readonly MeterArc[]; readonly kind: "arcs" }
  | { readonly items: readonly MeterArcSegment[]; readonly kind: "arc-segments" }
  | { readonly items: readonly MeterRect[]; readonly kind: "rects" }
  | { readonly items: readonly MeterSegment[]; readonly kind: "segments" };

function buildMeterGeometry(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
): MeterGeometryResult {
  if (config.layout === "radial")
    return config.mode === "stepped-meter"
      ? { items: buildMeterArcSegments(frame, viewport, config), kind: "arc-segments" }
      : { items: buildMeterArcs(frame, viewport, config), kind: "arcs" };
  return config.mode === "stepped-meter"
    ? { items: buildMeterSegments(frame, viewport, config), kind: "segments" }
    : { items: buildMeterRects(frame, viewport, config), kind: "rects" };
}

function meterLayerNodes(
  geometry: MeterGeometryResult,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  keyPrefix: string,
  opacity: number,
  drawTracks: boolean,
  forcedColors: boolean,
): readonly SvgNode[] {
  switch (geometry.kind) {
    case "rects":
      return rectangularMeterNodes(
        geometry.items,
        viewport,
        config,
        paints,
        gradient,
        keyPrefix,
        opacity,
        drawTracks,
        forcedColors,
      );
    case "segments":
      return rectangularSegmentNodes(
        geometry.items,
        config,
        paints,
        gradient,
        keyPrefix,
        opacity,
        drawTracks,
        forcedColors,
      );
    case "arcs":
      return radialMeterNodes(
        geometry.items,
        config,
        paints,
        gradient,
        keyPrefix,
        opacity,
        drawTracks,
        forcedColors,
      );
    case "arc-segments":
      return radialSegmentNodes(
        geometry.items,
        config,
        paints,
        gradient,
        keyPrefix,
        opacity,
        drawTracks,
        forcedColors,
      );
  }
}

function rectangularMeterNodes(
  meters: readonly MeterRect[],
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  keyPrefix: string,
  opacity: number,
  drawTracks: boolean,
  forcedColors: boolean,
): readonly SvgNode[] {
  const nodes: SvgNode[] = [];
  if (drawTracks)
    meters.forEach((meter, index) => {
      const track =
        config.orientation === "horizontal"
          ? { ...meter, width: Math.max(0, viewport.width - config.padding * 2), x: config.padding }
          : {
              ...meter,
              height: Math.max(0, viewport.height - config.padding * 2),
              y: config.padding,
            };
      nodes.push(rectNode(track, config, `meter-track-${index}`, trackPaint(config, forcedColors)));
    });
  meters.forEach((meter, index) => {
    nodes.push(
      rectNode(
        meter,
        config,
        `${keyPrefix}-meter-${index}`,
        meterFill(meter.decibels, config, paints, gradient, opacity),
      ),
    );
  });
  return nodes;
}

function rectangularSegmentNodes(
  segments: readonly MeterSegment[],
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  keyPrefix: string,
  opacity: number,
  drawTracks: boolean,
  forcedColors: boolean,
): readonly SvgNode[] {
  const nodes: SvgNode[] = [];
  for (const segment of segments) {
    if (!segment.active && !drawTracks) continue;
    const paint = segment.active
      ? meterFill(segment.decibels, config, paints, gradient, opacity)
      : trackPaint(config, forcedColors);
    nodes.push(
      rectNode(
        segment,
        config,
        `${keyPrefix}-segment-${segment.channelIndex}-${segment.segmentIndex}`,
        paint,
      ),
    );
  }
  return nodes;
}

function radialMeterNodes(
  arcs: readonly MeterArc[],
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  keyPrefix: string,
  opacity: number,
  drawTracks: boolean,
  forcedColors: boolean,
): readonly SvgNode[] {
  const nodes: SvgNode[] = [];
  const direction = config.radialInvert ? -1 : 1;
  const extent = (config.radialArc * Math.PI) / 180;
  for (const [index, arc] of arcs.entries()) {
    if (drawTracks)
      nodes.push({
        d: arcPath(
          arc.x,
          arc.y,
          arc.radius,
          arc.startAngle,
          arc.startAngle + direction * extent,
          direction < 0,
        ),
        fill: "none",
        key: `meter-track-${index}`,
        kind: "path",
        stroke: forcedColors ? "GrayText" : config.trackColor,
        strokeLinecap: config.roundedCaps ? "round" : "butt",
        strokeWidth: arc.width,
      });
    nodes.push({
      d: arcPath(arc.x, arc.y, arc.radius, arc.startAngle, arc.endAngle, direction < 0),
      fill: "none",
      key: `${keyPrefix}-arc-${index}`,
      kind: "path",
      strokeLinecap: config.roundedCaps ? "round" : "butt",
      strokeWidth: arc.width,
      ...meterStroke(arc.decibels, config, paints, gradient, opacity),
    });
  }
  return nodes;
}

function radialSegmentNodes(
  segments: readonly MeterArcSegment[],
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  keyPrefix: string,
  opacity: number,
  drawTracks: boolean,
  forcedColors: boolean,
): readonly SvgNode[] {
  const nodes: SvgNode[] = [];
  for (const segment of segments) {
    if (!segment.active && !drawTracks) continue;
    const activePaint = meterStroke(segment.decibels, config, paints, gradient, opacity);
    nodes.push({
      d: arcPath(
        segment.x,
        segment.y,
        segment.radius,
        segment.startAngle,
        segment.endAngle,
        config.radialInvert,
      ),
      fill: "none",
      key: `${keyPrefix}-arc-segment-${segment.channelIndex}-${segment.segmentIndex}`,
      kind: "path",
      stroke: segment.active ? activePaint.stroke : forcedColors ? "GrayText" : config.trackColor,
      strokeLinecap: config.roundedCaps ? "round" : "butt",
      strokeOpacity: segment.active ? activePaint.strokeOpacity : 1,
      strokeWidth: segment.width,
    });
  }
  return nodes;
}

function rectNode(
  rect: Pick<MeterRect, "height" | "width" | "x" | "y">,
  config: CanvasMeterConfig,
  key: string,
  paint: { readonly fill: string; readonly fillOpacity?: number },
): SvgNode {
  return {
    ...paint,
    height: rect.height,
    key,
    kind: "rect",
    radius: config.roundedCaps ? Math.min(config.cornerRadius, rect.width / 2, rect.height / 2) : 0,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  };
}

function meterFill(
  decibels: number,
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  opacity: number,
) {
  if (gradient) return { fill: `url(#${gradient.id})`, fillOpacity: opacity };
  const paint =
    config.colorMode === "range" ? paints[meterRangeRole(decibels, config)] : paints.base;
  return { fill: paint.color, fillOpacity: paint.opacity * opacity };
}

function meterStroke(
  decibels: number,
  config: CanvasMeterConfig,
  paints: MeterPaints,
  gradient: SvgGradient | null,
  opacity: number,
) {
  if (gradient) return { stroke: `url(#${gradient.id})`, strokeOpacity: opacity };
  const paint =
    config.colorMode === "range" ? paints[meterRangeRole(decibels, config)] : paints.base;
  return { stroke: paint.color, strokeOpacity: paint.opacity * opacity };
}

function trackPaint(config: CanvasMeterConfig, forcedColors: boolean) {
  return { fill: forcedColors ? "GrayText" : config.trackColor };
}

function meterGradient(
  id: string,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  paints: MeterPaints,
): SvgGradient | null {
  if (config.colorMode !== "gradient") return null;
  const coordinates =
    config.layout === "radial" || config.orientation === "horizontal"
      ? { x1: config.padding, x2: viewport.width - config.padding, y1: 0, y2: 0 }
      : { x1: 0, x2: 0, y1: viewport.height - config.padding, y2: config.padding };
  return Object.freeze({
    id,
    kind: "linear-gradient",
    stops: Object.freeze([
      { color: paints.base.color, offset: 0, opacity: paints.base.opacity },
      {
        color: paints.middle.color,
        offset: thresholdLevel(config.middleDecibels, config),
        opacity: paints.middle.opacity,
      },
      {
        color: paints.crest.color,
        offset: thresholdLevel(config.crestDecibels, config),
        opacity: paints.crest.opacity,
      },
      {
        color: paints.accent.color,
        offset: thresholdLevel(config.peakThresholdDb, config),
        opacity: paints.accent.opacity,
      },
      { color: paints.accent.color, offset: 1, opacity: paints.accent.opacity },
    ]),
    ...coordinates,
  });
}

function resolvePaints(config: CanvasMeterConfig, forcedColors: boolean): MeterPaints {
  if (forcedColors)
    return {
      accent: { color: "LinkText", opacity: 1 },
      base: { color: "CanvasText", opacity: 1 },
      crest: { color: "Highlight", opacity: 1 },
      middle: { color: "GrayText", opacity: 1 },
    };
  return {
    accent: { color: config.colorRoles.accent.color, opacity: config.colorRoles.accent.alpha },
    base: { color: config.colorRoles.base.color, opacity: config.colorRoles.base.alpha },
    crest: { color: config.colorRoles.crest.color, opacity: config.colorRoles.crest.alpha },
    middle: { color: config.colorRoles.middle.color, opacity: config.colorRoles.middle.alpha },
  };
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
