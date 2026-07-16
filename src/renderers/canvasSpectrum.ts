import {
  colorWithAlpha,
  mixSpectrumColors,
  resolveCssVariableColor,
  spectrumPulseAmount,
  spectrumRangeRole,
} from "../color/spectrumColor";
import {
  buildSpectrumBars,
  buildSpectrumPoints,
  buildSpectrumRadialBars,
  buildSpectrumRadialPoints,
} from "../core/spectrumGeometry";
import { resolveSpectrumConfig } from "../spectrumConfig";
import type {
  CanvasSpectrumConfig,
  CanvasSpectrumConfigInput,
  SpectrumBar,
  SpectrumFrame,
  SpectrumPoint,
  SpectrumRadialBar,
  SpectrumRadialPoint,
  WaveformViewport,
} from "../types";

interface RenderColors {
  readonly accent: string;
  readonly base: string;
  readonly crest: string;
  readonly middle: string;
}

export function renderCanvasSpectrum(
  context: CanvasRenderingContext2D,
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: CanvasSpectrumConfigInput,
): void {
  const resolved = resolveSpectrumConfig(config, frame);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const forcedColors = forcedColorsActive();
  const colors = resolveRenderColors(context, resolved);
  context.clearRect(0, 0, width, height);
  context.fillStyle = forcedColors ? "Canvas" : resolved.backgroundColor;
  context.fillRect(0, 0, width, height);

  drawGrid(context, { height, width }, resolved, forcedColors);
  if (frame.state === "empty") return;

  if (resolved.layout === "radial") {
    if (resolved.geometry === "bars")
      drawRadialBars(context, buildSpectrumRadialBars(frame, viewport, resolved), resolved, colors);
    else
      drawRadialCurve(
        context,
        buildSpectrumRadialPoints(frame, viewport, resolved),
        resolved,
        colors,
      );
    return;
  }

  if (resolved.geometry === "bars")
    drawRectangularBars(
      context,
      buildSpectrumBars(frame, viewport, resolved),
      { height, width },
      resolved,
      colors,
    );
  else
    drawRectangularCurve(
      context,
      buildSpectrumPoints(frame, viewport, resolved),
      { height, width },
      resolved,
      colors,
    );
}

function drawRectangularCurve(
  context: CanvasRenderingContext2D,
  points: readonly SpectrumPoint[],
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): void {
  if (points.length === 0) return;
  context.lineWidth = config.lineWidth;
  context.lineCap = config.roundedCaps ? "round" : "butt";
  if (config.colorMode === "range") {
    drawRangeSegments(context, points, config, colors);
    return;
  }
  if (config.colorMode === "line") {
    context.strokeStyle = colors.base;
    strokePoints(context, points);
    return;
  }

  context.fillStyle = fillStyleForRectangular(context, points, viewport, config, colors);
  const baseline = Math.max(config.padding, viewport.height - config.padding);
  context.beginPath();
  context.moveTo(points[0].x, baseline);
  for (const point of points) context.lineTo(point.x, point.y);
  context.lineTo(points.at(-1)!.x, baseline);
  context.closePath();
  context.fill();
}

function drawRectangularBars(
  context: CanvasRenderingContext2D,
  bars: readonly SpectrumBar[],
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): void {
  if (bars.length === 0) return;
  if (config.colorMode === "line") {
    context.strokeStyle = colors.base;
    context.lineWidth = config.lineWidth;
    for (const bar of bars) strokeBar(context, bar, config.cornerRadius);
    return;
  }
  const sharedFill = fillStyleForRectangular(context, bars, viewport, config, colors);
  for (const bar of bars) {
    context.fillStyle =
      config.colorMode === "range" ? colors[spectrumRangeRole(bar.decibels, config)] : sharedFill;
    fillBar(context, bar, config.cornerRadius);
  }
}

function drawRadialCurve(
  context: CanvasRenderingContext2D,
  points: readonly SpectrumRadialPoint[],
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): void {
  if (points.length === 0) return;
  context.lineWidth = config.lineWidth;
  context.lineCap = config.roundedCaps ? "round" : "butt";
  if (config.colorMode === "range") {
    drawRangeSegments(context, points, config, colors);
    return;
  }
  if (config.colorMode === "line") {
    context.strokeStyle = colors.base;
    strokePoints(context, points, config.radialArc === 360);
    return;
  }

  context.fillStyle = fillStyleForRadial(context, points, config, colors);
  context.beginPath();
  context.moveTo(points[0].baseX, points[0].baseY);
  for (const point of points) context.lineTo(point.x, point.y);
  for (let index = points.length - 1; index >= 0; index -= 1)
    context.lineTo(points[index].baseX, points[index].baseY);
  context.closePath();
  context.fill();
}

function drawRadialBars(
  context: CanvasRenderingContext2D,
  bars: readonly SpectrumRadialBar[],
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): void {
  if (bars.length === 0) return;
  context.lineCap = config.roundedCaps ? "round" : "butt";
  const sharedStroke = fillStyleForRadial(context, bars, config, colors);
  for (const bar of bars) {
    context.lineWidth = config.colorMode === "line" ? config.lineWidth : bar.width;
    context.strokeStyle =
      config.colorMode === "range" ? colors[spectrumRangeRole(bar.decibels, config)] : sharedStroke;
    context.beginPath();
    context.moveTo(bar.x1, bar.y1);
    context.lineTo(bar.x2, bar.y2);
    context.stroke();
  }
}

function fillStyleForRectangular(
  context: CanvasRenderingContext2D,
  points: readonly SpectrumPoint[],
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): string | CanvasGradient {
  if (config.colorMode === "pulse")
    return mixSpectrumColors(colors.base, colors.accent, spectrumPulseAmount(points, config));
  if (config.colorMode !== "gradient") return colors.base;
  const gradient = context.createLinearGradient(
    0,
    Math.max(config.padding, viewport.height - config.padding),
    0,
    config.padding,
  );
  addGradientStops(gradient, config, colors, false);
  return gradient;
}

function fillStyleForRadial(
  context: CanvasRenderingContext2D,
  points: readonly SpectrumRadialPoint[],
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): string | CanvasGradient {
  if (config.colorMode === "pulse")
    return mixSpectrumColors(colors.base, colors.accent, spectrumPulseAmount(points, config));
  if (config.colorMode !== "gradient") return colors.base;
  const first = points[0];
  const radii = points.flatMap((point) => [point.baselineRadius, point.radius]);
  const minimumRadius = Math.min(...radii);
  const maximumRadius = Math.max(...radii);
  const gradient = context.createRadialGradient(
    first.centerX,
    first.centerY,
    minimumRadius,
    first.centerX,
    first.centerY,
    Math.max(minimumRadius, maximumRadius),
  );
  addGradientStops(gradient, config, colors, config.radialInvert);
  return gradient;
}

function addGradientStops(
  gradient: CanvasGradient,
  config: CanvasSpectrumConfig,
  colors: RenderColors,
  reverse: boolean,
): void {
  const crestStop = config.gradientRatio === 0 ? 1 : clamp(1 / config.gradientRatio, 0.05, 1);
  if (reverse) {
    gradient.addColorStop(0, colors.crest);
    gradient.addColorStop(crestStop, colors.base);
  } else {
    gradient.addColorStop(0, colors.base);
    gradient.addColorStop(crestStop, config.gradientRatio === 0 ? colors.base : colors.crest);
  }
}

function drawRangeSegments(
  context: CanvasRenderingContext2D,
  points: readonly SpectrumPoint[],
  config: CanvasSpectrumConfig,
  colors: RenderColors,
): void {
  for (let index = 1; index < points.length; index += 1) {
    context.strokeStyle = colors[spectrumRangeRole(points[index].decibels, config)];
    context.beginPath();
    context.moveTo(points[index - 1].x, points[index - 1].y);
    context.lineTo(points[index].x, points[index].y);
    context.stroke();
  }
}

function strokePoints(
  context: CanvasRenderingContext2D,
  points: readonly SpectrumPoint[],
  close = false,
): void {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1)
    context.lineTo(points[index].x, points[index].y);
  if (close) context.closePath();
  context.stroke();
}

function fillBar(context: CanvasRenderingContext2D, bar: SpectrumBar, radius: number): void {
  if (radius > 0 && typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(
      bar.x,
      bar.y,
      bar.width,
      bar.height,
      Math.min(radius, bar.width / 2, bar.height / 2),
    );
    context.fill();
  } else context.fillRect(bar.x, bar.y, bar.width, bar.height);
}

function strokeBar(context: CanvasRenderingContext2D, bar: SpectrumBar, radius: number): void {
  if (radius > 0 && typeof context.roundRect === "function") {
    context.beginPath();
    context.roundRect(
      bar.x,
      bar.y,
      bar.width,
      bar.height,
      Math.min(radius, bar.width / 2, bar.height / 2),
    );
    context.stroke();
  } else context.strokeRect(bar.x, bar.y, bar.width, bar.height);
}

function drawGrid(
  context: CanvasRenderingContext2D,
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  forcedColors: boolean,
): void {
  if (!config.showGrid) return;
  context.strokeStyle = forcedColors ? "GrayText" : config.gridColor;
  context.lineWidth = 1;
  if (config.layout === "radial") {
    const padding = Math.min(config.padding, viewport.width / 2, viewport.height / 2);
    const maximumRadius = Math.max(
      0,
      Math.min(viewport.width - padding * 2, viewport.height - padding * 2) / 2,
    );
    const minimumRadius = maximumRadius * config.radialDeadzone;
    const start = (config.radialRotation * Math.PI) / 180;
    const end = start + (config.radialArc * Math.PI) / 180;
    for (const ratio of [0, 0.5, 1]) {
      context.beginPath();
      context.arc(
        viewport.width / 2,
        viewport.height / 2,
        minimumRadius + (maximumRadius - minimumRadius) * ratio,
        start,
        end,
      );
      context.stroke();
    }
    return;
  }
  context.beginPath();
  for (const ratio of [0, 0.5, 1]) {
    const y = config.padding + (viewport.height - config.padding * 2) * ratio;
    context.moveTo(config.padding, y);
    context.lineTo(Math.max(config.padding, viewport.width - config.padding), y);
  }
  context.stroke();
}

function resolveRenderColors(
  context: CanvasRenderingContext2D,
  config: CanvasSpectrumConfig,
): RenderColors {
  if (forcedColorsActive())
    return { accent: "LinkText", base: "CanvasText", crest: "Highlight", middle: "GrayText" };
  const element = context.canvas ?? null;
  return {
    accent: roleColor("accent"),
    base: roleColor("base"),
    crest: roleColor("crest"),
    middle: roleColor("middle"),
  };

  function roleColor(role: keyof RenderColors): string {
    const value = config.colorRoles[role];
    return colorWithAlpha(resolveCssVariableColor(value.color, element), value.alpha);
  }
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

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
