import { spectrumPulseAmount, spectrumRangeRole } from "../color/spectrumColor";
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
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import {
  arcPath,
  finalizeSvgScene,
  normalizeSvgViewport,
  pointsPath,
  sampleEvenly,
  sanitizeSvgId,
  segmentPath,
} from "./svgHelpers";
import type { SvgGradient, SvgGradientStop, SvgNode, SvgRenderOptions, SvgScene } from "./svgTypes";

interface RolePaint {
  readonly color: string;
  readonly opacity: number;
}

interface SpectrumPaints {
  readonly accent: RolePaint;
  readonly base: RolePaint;
  readonly crest: RolePaint;
  readonly middle: RolePaint;
}

interface PaintAttributes {
  readonly fill?: string;
  readonly fillOpacity?: number;
  readonly stroke?: string;
  readonly strokeOpacity?: number;
}

export function renderSvgSpectrum(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config?: CanvasSpectrumConfigInput,
  options: SvgRenderOptions = {},
): SvgScene {
  const size = normalizeSvgViewport(viewport);
  const resolved = resolveSpectrumConfig(config, frame);
  const paints = resolvePaints(resolved, options.forcedColors === true);
  const idPrefix = sanitizeSvgId(options.idPrefix ?? "waveform-svg-spectrum");
  const nodes: SvgNode[] = [
    {
      fill: options.forcedColors ? "Canvas" : resolved.backgroundColor,
      height: size.height,
      key: "spectrum-background",
      kind: "rect",
      width: size.width,
      x: 0,
      y: 0,
    },
  ];
  const definitions: SvgGradient[] = [];
  if (resolved.showGrid) nodes.push(...gridNodes(size, resolved, options.forcedColors === true));
  if (frame.state === "empty")
    return finalizeSvgScene({
      height: size.height,
      nodes,
      renderedPointCount: 0,
      sourcePointCount: 0,
      width: size.width,
    });

  const built = buildGeometry(frame, size, resolved);
  const maximum = SVG_RENDERER_CAPABILITIES.limits.maximumSpectrumPoints;
  const points = sampleEvenly(built.points, maximum);
  const messages =
    points.length < built.points.length
      ? [`SVG sampled ${built.points.length} spectrum points to its ${maximum}-point budget.`]
      : [];
  const gradient = spectrumGradient(idPrefix, points, size, resolved, paints);
  if (gradient) definitions.push(gradient);

  if (resolved.layout === "radial") {
    if (resolved.geometry === "bars")
      nodes.push(
        ...radialBarNodes(points as readonly SpectrumRadialBar[], resolved, paints, gradient),
      );
    else
      nodes.push(
        ...radialCurveNodes(points as readonly SpectrumRadialPoint[], resolved, paints, gradient),
      );
  } else if (resolved.geometry === "bars")
    nodes.push(
      ...rectangularBarNodes(points as readonly SpectrumBar[], resolved, paints, gradient),
    );
  else
    nodes.push(
      ...rectangularCurveNodes(
        points as readonly SpectrumPoint[],
        size,
        resolved,
        paints,
        gradient,
      ),
    );

  return finalizeSvgScene({
    definitions,
    height: size.height,
    messages,
    nodes,
    renderedPointCount: points.length,
    sourcePointCount: built.points.length,
    width: size.width,
  });
}

function buildGeometry(
  frame: SpectrumFrame,
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
): { readonly points: readonly SpectrumPoint[] } {
  if (config.layout === "radial")
    return {
      points:
        config.geometry === "bars"
          ? buildSpectrumRadialBars(frame, viewport, config)
          : buildSpectrumRadialPoints(frame, viewport, config),
    };
  return {
    points:
      config.geometry === "bars"
        ? buildSpectrumBars(frame, viewport, config)
        : buildSpectrumPoints(frame, viewport, config),
  };
}

function rectangularCurveNodes(
  points: readonly SpectrumPoint[],
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  gradient: SvgGradient | null,
): readonly SvgNode[] {
  if (points.length === 0) return [];
  if (config.colorMode === "range")
    return rangeCurveNodes(points, config, paints, "spectrum-rect-range");
  if (config.colorMode === "line")
    return [
      {
        d: pointsPath(points),
        fill: "none",
        key: "spectrum-rect-line",
        kind: "path",
        stroke: paints.base.color,
        strokeLinecap: config.roundedCaps ? "round" : "butt",
        strokeOpacity: paints.base.opacity,
        strokeWidth: config.lineWidth,
      },
    ];
  const baseline = Math.max(config.padding, viewport.height - config.padding);
  const d = pointsPath(
    [{ x: points[0].x, y: baseline }, ...points, { x: points.at(-1)!.x, y: baseline }],
    true,
  );
  return [
    {
      d,
      key: "spectrum-rect-fill",
      kind: "path",
      ...fillAttributes(points, config, paints, gradient),
    },
  ];
}

function radialCurveNodes(
  points: readonly SpectrumRadialPoint[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  gradient: SvgGradient | null,
): readonly SvgNode[] {
  if (points.length === 0) return [];
  if (config.colorMode === "range")
    return rangeCurveNodes(points, config, paints, "spectrum-radial-range");
  if (config.colorMode === "line")
    return [
      {
        d: pointsPath(points, config.radialArc === 360),
        fill: "none",
        key: "spectrum-radial-line",
        kind: "path",
        stroke: paints.base.color,
        strokeLinecap: config.roundedCaps ? "round" : "butt",
        strokeOpacity: paints.base.opacity,
        strokeWidth: config.lineWidth,
      },
    ];
  const perimeter = [
    { x: points[0].baseX, y: points[0].baseY },
    ...points,
    ...[...points].reverse().map((point) => ({ x: point.baseX, y: point.baseY })),
  ];
  return [
    {
      d: pointsPath(perimeter, true),
      key: "spectrum-radial-fill",
      kind: "path",
      ...fillAttributes(points, config, paints, gradient),
    },
  ];
}

function rectangularBarNodes(
  bars: readonly SpectrumBar[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  gradient: SvgGradient | null,
): readonly SvgNode[] {
  return bars.map((bar, index) => {
    const radius = Math.min(config.cornerRadius, bar.width / 2, bar.height / 2);
    if (config.colorMode === "line")
      return {
        fill: "none",
        height: bar.height,
        key: `spectrum-rect-bar-${index}`,
        kind: "rect" as const,
        radius,
        stroke: paints.base.color,
        strokeOpacity: paints.base.opacity,
        strokeWidth: config.lineWidth,
        width: bar.width,
        x: bar.x,
        y: bar.y,
      };
    return {
      height: bar.height,
      key: `spectrum-rect-bar-${index}`,
      kind: "rect" as const,
      radius,
      width: bar.width,
      x: bar.x,
      y: bar.y,
      ...(config.colorMode === "range"
        ? fillPaint(paints[spectrumRangeRole(bar.decibels, config)])
        : fillAttributes(bars, config, paints, gradient)),
    };
  });
}

function radialBarNodes(
  bars: readonly SpectrumRadialBar[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  gradient: SvgGradient | null,
): readonly SvgNode[] {
  const shared = strokeAttributes(bars, config, paints, gradient);
  return bars.map((bar, index) => ({
    d: segmentPath([bar]),
    fill: "none",
    key: `spectrum-radial-bar-${index}`,
    kind: "path" as const,
    strokeLinecap: config.roundedCaps ? "round" : "butt",
    strokeWidth: config.colorMode === "line" ? config.lineWidth : bar.width,
    ...(config.colorMode === "range"
      ? strokePaint(paints[spectrumRangeRole(bar.decibels, config)])
      : shared),
  }));
}

function rangeCurveNodes(
  points: readonly SpectrumPoint[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  keyPrefix: string,
): readonly SvgNode[] {
  const segments = new Map<
    keyof SpectrumPaints,
    { x1: number; x2: number; y1: number; y2: number }[]
  >();
  for (let index = 1; index < points.length; index += 1) {
    const role = spectrumRangeRole(points[index].decibels, config);
    const group = segments.get(role) ?? [];
    group.push({
      x1: points[index - 1].x,
      x2: points[index].x,
      y1: points[index - 1].y,
      y2: points[index].y,
    });
    segments.set(role, group);
  }
  return [...segments.entries()].map(([role, group]) => ({
    d: segmentPath(group),
    fill: "none",
    key: `${keyPrefix}-${role}`,
    kind: "path" as const,
    strokeLinecap: config.roundedCaps ? "round" : "butt",
    strokeWidth: config.lineWidth,
    ...strokePaint(paints[role]),
  }));
}

function gridNodes(
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  forcedColors: boolean,
): readonly SvgNode[] {
  const stroke = forcedColors ? "GrayText" : config.gridColor;
  if (config.layout === "radial") {
    const padding = Math.min(config.padding, viewport.width / 2, viewport.height / 2);
    const maximumRadius = Math.max(
      0,
      Math.min(viewport.width - padding * 2, viewport.height - padding * 2) / 2,
    );
    const minimumRadius = maximumRadius * config.radialDeadzone;
    const start = (config.radialRotation * Math.PI) / 180;
    const end = start + (config.radialArc * Math.PI) / 180;
    const d = [0, 0.5, 1]
      .map((ratio) =>
        arcPath(
          viewport.width / 2,
          viewport.height / 2,
          minimumRadius + (maximumRadius - minimumRadius) * ratio,
          start,
          end,
          false,
        ),
      )
      .join(" ");
    return [{ d, fill: "none", key: "spectrum-grid", kind: "path", stroke, strokeWidth: 1 }];
  }
  const segments = [0, 0.5, 1].map((ratio) => {
    const y = config.padding + (viewport.height - config.padding * 2) * ratio;
    return {
      x1: config.padding,
      x2: Math.max(config.padding, viewport.width - config.padding),
      y1: y,
      y2: y,
    };
  });
  return [
    {
      d: segmentPath(segments),
      fill: "none",
      key: "spectrum-grid",
      kind: "path",
      stroke,
      strokeWidth: 1,
    },
  ];
}

function spectrumGradient(
  idPrefix: string,
  points: readonly SpectrumPoint[],
  viewport: WaveformViewport,
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
): SvgGradient | null {
  if (config.colorMode !== "gradient" || points.length === 0) return null;
  const crestStop = config.gradientRatio === 0 ? 1 : clamp(1 / config.gradientRatio, 0.05, 1);
  const stops: readonly SvgGradientStop[] = config.radialInvert
    ? [
        { color: paints.crest.color, offset: 0, opacity: paints.crest.opacity },
        { color: paints.base.color, offset: crestStop, opacity: paints.base.opacity },
      ]
    : [
        { color: paints.base.color, offset: 0, opacity: paints.base.opacity },
        {
          color: config.gradientRatio === 0 ? paints.base.color : paints.crest.color,
          offset: crestStop,
          opacity: config.gradientRatio === 0 ? paints.base.opacity : paints.crest.opacity,
        },
      ];
  if (config.layout === "radial") {
    const radial = points as readonly SpectrumRadialPoint[];
    const radii = radial.flatMap((point) => [point.baselineRadius, point.radius]);
    return Object.freeze({
      centerX: radial[0].centerX,
      centerY: radial[0].centerY,
      id: `${idPrefix}-spectrum-gradient`,
      innerRadius: Math.min(...radii),
      kind: "radial-gradient",
      outerRadius: Math.max(...radii),
      stops: Object.freeze(stops),
    });
  }
  return Object.freeze({
    id: `${idPrefix}-spectrum-gradient`,
    kind: "linear-gradient",
    stops: Object.freeze(stops),
    x1: 0,
    x2: 0,
    y1: Math.max(config.padding, viewport.height - config.padding),
    y2: config.padding,
  });
}

function fillAttributes(
  points: readonly SpectrumPoint[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  gradient: SvgGradient | null,
): PaintAttributes {
  if (gradient) return { fill: `url(#${gradient.id})` };
  if (config.colorMode === "pulse") return fillPaint(pulsePaint(points, config, paints));
  return fillPaint(paints.base);
}

function strokeAttributes(
  points: readonly SpectrumPoint[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
  gradient: SvgGradient | null,
): PaintAttributes {
  if (gradient) return { stroke: `url(#${gradient.id})` };
  if (config.colorMode === "pulse") return strokePaint(pulsePaint(points, config, paints));
  return strokePaint(paints.base);
}

function pulsePaint(
  points: readonly SpectrumPoint[],
  config: CanvasSpectrumConfig,
  paints: SpectrumPaints,
): RolePaint {
  const amount = spectrumPulseAmount(points, config);
  const baseRatio = Number(((1 - amount) * 100).toFixed(2));
  const accentRatio = Number((amount * 100).toFixed(2));
  return {
    color: `color-mix(in srgb, ${paints.base.color} ${baseRatio}%, ${paints.accent.color} ${accentRatio}%)`,
    opacity: paints.base.opacity + (paints.accent.opacity - paints.base.opacity) * amount,
  };
}

function resolvePaints(config: CanvasSpectrumConfig, forcedColors: boolean): SpectrumPaints {
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

function fillPaint(paint: RolePaint): PaintAttributes {
  return { fill: paint.color, fillOpacity: paint.opacity };
}

function strokePaint(paint: RolePaint): PaintAttributes {
  return { stroke: paint.color, strokeOpacity: paint.opacity };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
