import type { WaveformViewport } from "../types";
import { DOM_RENDERER_CAPABILITIES } from "./capabilities";
import type { DomNode, DomScene } from "./domTypes";

export function normalizeDomViewport(viewport: WaveformViewport): WaveformViewport {
  return Object.freeze({
    height: finiteDimension(viewport.height),
    width: finiteDimension(viewport.width),
  });
}

export function sampleDomItems<Item>(items: readonly Item[], maximum: number): readonly Item[] {
  if (items.length <= maximum) return items;
  if (maximum <= 1) return items.length === 0 ? [] : [items[0]];
  return Array.from({ length: maximum }, (_, index) => {
    const sourceIndex = Math.round((index * (items.length - 1)) / (maximum - 1));
    return items[sourceIndex];
  });
}

export function finalizeDomScene(input: {
  readonly background: string;
  readonly height: number;
  readonly messages?: readonly string[];
  readonly nodes: readonly DomNode[];
  readonly renderedPointCount: number;
  readonly sourcePointCount: number;
  readonly width: number;
}): DomScene {
  if (input.nodes.length > DOM_RENDERER_CAPABILITIES.limits.maximumNodes)
    return unsupportedDomScene(
      input.width,
      input.height,
      `DOM/CSS node budget exceeded: ${input.nodes.length} nodes requested, maximum ${DOM_RENDERER_CAPABILITIES.limits.maximumNodes}. Increase bar/step size, shorten history, or use Canvas 2D.`,
      input.background,
    );
  return Object.freeze({
    background: input.background,
    height: input.height,
    messages: Object.freeze([...(input.messages ?? [])]),
    nodeCount: input.nodes.length,
    nodes: Object.freeze([...input.nodes]),
    renderedPointCount: input.renderedPointCount,
    sourcePointCount: input.sourcePointCount,
    status: "ready",
    width: input.width,
  });
}

export function unsupportedDomScene(
  width: number,
  height: number,
  message: string,
  background = "Canvas",
): DomScene {
  return Object.freeze({
    background,
    height: finiteDimension(height),
    messages: Object.freeze([message]),
    nodeCount: 0,
    nodes: Object.freeze([]),
    renderedPointCount: 0,
    sourcePointCount: 0,
    status: "unsupported",
    width: finiteDimension(width),
  });
}

export function cssColorWithAlpha(color: string, alpha: number): string {
  const percentage = Math.round(Math.min(1, Math.max(0, alpha)) * 10_000) / 100;
  return percentage >= 100 ? color : `color-mix(in srgb, ${color} ${percentage}%, transparent)`;
}

export function cssColorMix(first: string, second: string, secondAmount: number): string {
  const percentage = Math.round(Math.min(1, Math.max(0, secondAmount)) * 10_000) / 100;
  return `color-mix(in srgb, ${first} ${100 - percentage}%, ${second} ${percentage}%)`;
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
