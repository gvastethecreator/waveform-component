import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import type { SvgNode, SvgScene } from "./svgTypes";
import type { WaveformViewport } from "../types";

export function normalizeSvgViewport(viewport: WaveformViewport): WaveformViewport {
  return Object.freeze({
    height: finiteDimension(viewport.height),
    width: finiteDimension(viewport.width),
  });
}

export function svgNumber(value: number): string {
  const finite = Number.isFinite(value) ? value : 0;
  return String(Number(finite.toFixed(3)));
}

export function pointsPath(
  points: readonly { readonly x: number; readonly y: number }[],
  close = false,
): string {
  if (points.length === 0) return "";
  const commands = points.map(
    (point, index) => `${index === 0 ? "M" : "L"}${svgNumber(point.x)} ${svgNumber(point.y)}`,
  );
  if (close) commands.push("Z");
  return commands.join(" ");
}

export function segmentPath(
  segments: readonly {
    readonly x1: number;
    readonly x2: number;
    readonly y1: number;
    readonly y2: number;
  }[],
): string {
  return segments
    .map(
      (segment) =>
        `M${svgNumber(segment.x1)} ${svgNumber(segment.y1)} L${svgNumber(segment.x2)} ${svgNumber(segment.y2)}`,
    )
    .join(" ");
}

export function arcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  anticlockwise = false,
): string {
  const extent = Math.abs(endAngle - startAngle);
  if (radius <= 0 || extent <= Number.EPSILON) return "";
  const direction = anticlockwise ? 0 : 1;
  const start = polarPoint(centerX, centerY, radius, startAngle);
  if (extent >= Math.PI * 2 - 0.000_001) {
    const middleAngle = startAngle + (anticlockwise ? -Math.PI : Math.PI);
    const middle = polarPoint(centerX, centerY, radius, middleAngle);
    return `M${svgNumber(start.x)} ${svgNumber(start.y)} A${svgNumber(radius)} ${svgNumber(radius)} 0 1 ${direction} ${svgNumber(middle.x)} ${svgNumber(middle.y)} A${svgNumber(radius)} ${svgNumber(radius)} 0 1 ${direction} ${svgNumber(start.x)} ${svgNumber(start.y)}`;
  }
  const end = polarPoint(centerX, centerY, radius, endAngle);
  const largeArc = extent > Math.PI ? 1 : 0;
  return `M${svgNumber(start.x)} ${svgNumber(start.y)} A${svgNumber(radius)} ${svgNumber(radius)} 0 ${largeArc} ${direction} ${svgNumber(end.x)} ${svgNumber(end.y)}`;
}

export function sampleEvenly<Item>(items: readonly Item[], maximum: number): readonly Item[] {
  if (items.length <= maximum) return items;
  if (maximum <= 1) return items.length === 0 ? [] : [items[0]];
  return Array.from({ length: maximum }, (_, index) => {
    const sourceIndex = Math.round((index * (items.length - 1)) / (maximum - 1));
    return items[sourceIndex];
  });
}

export function finalizeSvgScene(input: {
  readonly definitions?: SvgScene["definitions"];
  readonly height: number;
  readonly messages?: readonly string[];
  readonly nodes: readonly SvgNode[];
  readonly renderedPointCount: number;
  readonly sourcePointCount: number;
  readonly width: number;
}): SvgScene {
  const messages = [...(input.messages ?? [])];
  if (input.nodes.length > SVG_RENDERER_CAPABILITIES.limits.maximumNodes)
    return unsupportedSvgScene(
      input.width,
      input.height,
      `SVG node budget exceeded: ${input.nodes.length} nodes requested, maximum ${SVG_RENDERER_CAPABILITIES.limits.maximumNodes}. Increase step/bar size or use Canvas 2D.`,
    );
  return Object.freeze({
    definitions: Object.freeze([...(input.definitions ?? [])]),
    height: input.height,
    messages: Object.freeze(messages),
    nodeCount: input.nodes.length,
    nodes: Object.freeze([...input.nodes]),
    renderedPointCount: input.renderedPointCount,
    sourcePointCount: input.sourcePointCount,
    status: "ready",
    width: input.width,
  });
}

export function unsupportedSvgScene(width: number, height: number, message: string): SvgScene {
  return Object.freeze({
    definitions: Object.freeze([]),
    height,
    messages: Object.freeze([message]),
    nodeCount: 0,
    nodes: Object.freeze([]),
    renderedPointCount: 0,
    sourcePointCount: 0,
    status: "unsupported",
    width,
  });
}

export function sanitizeSvgId(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "waveform-svg";
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number) {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
