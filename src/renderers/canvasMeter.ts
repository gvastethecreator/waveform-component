import { colorWithAlpha, resolveCssVariableColor } from "../color/spectrumColor";
import {
  buildMeterArcs,
  buildMeterArcSegments,
  buildMeterRects,
  buildMeterSegments,
} from "../core/meterGeometry";
import { resolveMeterConfig } from "../meterConfig";
import type {
  CanvasColorRoles,
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

const MAX_RENDERED_HISTORY_FRAMES = 64;

interface RenderColors {
  readonly accent: string;
  readonly base: string;
  readonly crest: string;
  readonly middle: string;
}

export function renderCanvasMeter(
  context: CanvasRenderingContext2D,
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: CanvasMeterConfigInput,
  history: readonly MeterHistoryPoint[] = [],
): void {
  const resolved = resolveMeterConfig(config, frame);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const forcedColors = forcedColorsActive();
  context.clearRect(0, 0, width, height);
  context.fillStyle = forcedColors ? "Canvas" : resolved.backgroundColor;
  context.fillRect(0, 0, width, height);
  if (frame.state === "empty") return;

  const colors = resolveRenderColors(context, resolved.colorRoles, forcedColors);
  drawMeterLayer(context, frame, { height, width }, resolved, colors, true);
  if (!resolved.showHistory || resolved.historyOpacity === 0 || history.length === 0) return;

  const compatibleHistory = history.filter(
    (point) =>
      point.frame.state === "ready" && point.frame.channels.length === frame.channels.length,
  );
  const sampled = sampleHistory(compatibleHistory, MAX_RENDERED_HISTORY_FRAMES);
  sampled.forEach((point, index) => {
    const ageRatio = sampled.length === 1 ? 1 : (index + 1) / sampled.length;
    const historyColors = resolveRenderColors(
      context,
      resolved.colorRoles,
      forcedColors,
      resolved.historyOpacity * ageRatio,
    );
    drawMeterLayer(context, point.frame, { height, width }, resolved, historyColors, false);
  });
  drawMeterLayer(context, frame, { height, width }, resolved, colors, false);
}

function drawMeterLayer(
  context: CanvasRenderingContext2D,
  frame: MeterFrame,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  colors: RenderColors,
  drawTracks: boolean,
): void {
  if (config.layout === "radial") {
    if (config.mode === "stepped-meter")
      drawRadialSegments(
        context,
        buildMeterArcSegments(frame, viewport, config),
        config,
        colors,
        drawTracks,
      );
    else
      drawRadialArcs(context, buildMeterArcs(frame, viewport, config), config, colors, drawTracks);
    return;
  }
  if (config.mode === "stepped-meter")
    drawRectangularSegments(
      context,
      buildMeterSegments(frame, viewport, config),
      config,
      colors,
      drawTracks,
    );
  else
    drawRectangularMeters(
      context,
      buildMeterRects(frame, viewport, config),
      viewport,
      config,
      colors,
      drawTracks,
    );
}

function drawRectangularMeters(
  context: CanvasRenderingContext2D,
  meters: readonly MeterRect[],
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  colors: RenderColors,
  drawTracks: boolean,
): void {
  if (meters.length === 0) return;
  if (drawTracks) {
    context.fillStyle = forcedColorsActive() ? "GrayText" : config.trackColor;
    for (const meter of meters) {
      const track =
        config.orientation === "horizontal"
          ? { ...meter, width: Math.max(0, viewport.width - config.padding * 2), x: config.padding }
          : {
              ...meter,
              height: Math.max(0, viewport.height - config.padding * 2),
              y: config.padding,
            };
      fillRoundedRect(context, track, config);
    }
  }
  const sharedFill = rectangularFill(context, viewport, config, colors);
  for (const meter of meters) {
    context.fillStyle =
      config.colorMode === "range" ? colors[meterRangeRole(meter.decibels, config)] : sharedFill;
    fillRoundedRect(context, meter, config);
  }
}

function drawRectangularSegments(
  context: CanvasRenderingContext2D,
  segments: readonly MeterSegment[],
  config: CanvasMeterConfig,
  colors: RenderColors,
  drawTracks: boolean,
): void {
  if (segments.length === 0) return;
  const sharedFill = rectangularFillFromSegments(context, segments, config, colors);
  for (const segment of segments) {
    if (!segment.active && !drawTracks) continue;
    context.fillStyle = segment.active
      ? config.colorMode === "range"
        ? colors[meterRangeRole(segment.decibels, config)]
        : sharedFill
      : forcedColorsActive()
        ? "GrayText"
        : config.trackColor;
    fillRoundedRect(context, segment, config);
  }
}

function drawRadialArcs(
  context: CanvasRenderingContext2D,
  arcs: readonly MeterArc[],
  config: CanvasMeterConfig,
  colors: RenderColors,
  drawTracks: boolean,
): void {
  if (arcs.length === 0) return;
  context.lineCap = config.roundedCaps ? "round" : "butt";
  const direction = config.radialInvert ? -1 : 1;
  const fullExtent = (config.radialArc * Math.PI) / 180;
  const sharedStroke = radialFill(context, arcs, config, colors);
  for (const arc of arcs) {
    context.lineWidth = arc.width;
    if (drawTracks) {
      context.strokeStyle = forcedColorsActive() ? "GrayText" : config.trackColor;
      strokeArc(
        context,
        arc,
        arc.startAngle,
        arc.startAngle + direction * fullExtent,
        direction < 0,
      );
    }
    context.strokeStyle =
      config.colorMode === "range" ? colors[meterRangeRole(arc.decibels, config)] : sharedStroke;
    strokeArc(context, arc, arc.startAngle, arc.endAngle, direction < 0);
  }
}

function drawRadialSegments(
  context: CanvasRenderingContext2D,
  segments: readonly MeterArcSegment[],
  config: CanvasMeterConfig,
  colors: RenderColors,
  drawTracks: boolean,
): void {
  if (segments.length === 0) return;
  context.lineCap = config.roundedCaps ? "round" : "butt";
  const sharedStroke = radialFill(context, segments, config, colors);
  for (const segment of segments) {
    if (!segment.active && !drawTracks) continue;
    context.lineWidth = segment.width;
    context.strokeStyle = segment.active
      ? config.colorMode === "range"
        ? colors[meterRangeRole(segment.decibels, config)]
        : sharedStroke
      : forcedColorsActive()
        ? "GrayText"
        : config.trackColor;
    strokeArc(context, segment, segment.startAngle, segment.endAngle, config.radialInvert);
  }
}

function rectangularFill(
  context: CanvasRenderingContext2D,
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  colors: RenderColors,
): string | CanvasGradient {
  if (config.colorMode !== "gradient") return colors.base;
  const gradient =
    config.orientation === "horizontal"
      ? context.createLinearGradient(config.padding, 0, viewport.width - config.padding, 0)
      : context.createLinearGradient(0, viewport.height - config.padding, 0, config.padding);
  addGradientStops(gradient, config, colors);
  return gradient;
}

function rectangularFillFromSegments(
  context: CanvasRenderingContext2D,
  segments: readonly MeterSegment[],
  config: CanvasMeterConfig,
  colors: RenderColors,
): string | CanvasGradient {
  const maximumX = Math.max(...segments.map((segment) => segment.x + segment.width));
  const maximumY = Math.max(...segments.map((segment) => segment.y + segment.height));
  return rectangularFill(
    context,
    { height: maximumY + config.padding, width: maximumX + config.padding },
    config,
    colors,
  );
}

function radialFill(
  context: CanvasRenderingContext2D,
  arcs: readonly MeterArc[],
  config: CanvasMeterConfig,
  colors: RenderColors,
): string | CanvasGradient {
  if (config.colorMode !== "gradient") return colors.base;
  const first = arcs[0];
  const radius = Math.max(...arcs.map((arc) => arc.radius + arc.width / 2));
  const gradient = context.createLinearGradient(
    first.x - radius,
    first.y,
    first.x + radius,
    first.y,
  );
  addGradientStops(gradient, config, colors);
  return gradient;
}

function addGradientStops(
  gradient: CanvasGradient,
  config: CanvasMeterConfig,
  colors: RenderColors,
): void {
  gradient.addColorStop(0, colors.base);
  gradient.addColorStop(thresholdLevel(config.middleDecibels, config), colors.middle);
  gradient.addColorStop(thresholdLevel(config.crestDecibels, config), colors.crest);
  gradient.addColorStop(thresholdLevel(config.peakThresholdDb, config), colors.accent);
  gradient.addColorStop(1, colors.accent);
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

function meterRangeRole(decibels: number, config: CanvasMeterConfig): keyof RenderColors {
  if (decibels >= config.peakThresholdDb) return "accent";
  if (decibels >= config.crestDecibels) return "crest";
  if (decibels >= config.middleDecibels) return "middle";
  return "base";
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  rect: Pick<MeterRect, "height" | "width" | "x" | "y">,
  config: CanvasMeterConfig,
): void {
  const radius = config.roundedCaps
    ? Math.min(config.cornerRadius, rect.width / 2, rect.height / 2)
    : 0;
  if (radius > 0 && typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
    context.fill();
  } else context.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function strokeArc(
  context: CanvasRenderingContext2D,
  arc: Pick<MeterArc, "radius" | "x" | "y">,
  startAngle: number,
  endAngle: number,
  anticlockwise: boolean,
): void {
  context.beginPath();
  context.arc(arc.x, arc.y, arc.radius, startAngle, endAngle, anticlockwise);
  context.stroke();
}

function resolveRenderColors(
  context: CanvasRenderingContext2D,
  roles: CanvasColorRoles,
  forcedColors: boolean,
  opacityMultiplier = 1,
): RenderColors {
  if (forcedColors)
    return { accent: "LinkText", base: "CanvasText", crest: "Highlight", middle: "GrayText" };
  const element = context.canvas ?? null;
  return {
    accent: roleColor("accent"),
    base: roleColor("base"),
    crest: roleColor("crest"),
    middle: roleColor("middle"),
  };

  function roleColor(role: keyof RenderColors): string {
    const value = roles[role];
    return colorWithAlpha(
      resolveCssVariableColor(value.color, element),
      value.alpha * opacityMultiplier,
    );
  }
}

function sampleHistory(
  history: readonly MeterHistoryPoint[],
  maximum: number,
): readonly MeterHistoryPoint[] {
  if (history.length <= maximum) return history;
  const stride = history.length / maximum;
  return Array.from({ length: maximum }, (_, index) => history[Math.floor(index * stride)]);
}

function forcedColorsActive(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(forced-colors: active)").matches
  );
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
