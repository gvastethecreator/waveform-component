import type { CanvasSpectrumConfig, SpectrumPoint } from "../types";

export type SpectrumColorRoleName = "accent" | "base" | "crest" | "middle";

export function spectrumRangeRole(
  decibels: number,
  config: Pick<CanvasSpectrumConfig, "crestDecibels" | "middleDecibels">,
): SpectrumColorRoleName {
  if (decibels >= config.crestDecibels) return "crest";
  if (decibels >= config.middleDecibels) return "middle";
  return "base";
}

export function spectrumPulseAmount(
  points: readonly SpectrumPoint[],
  config: Pick<
    CanvasSpectrumConfig,
    "gradientRatio" | "maximumDecibels" | "minimumDecibels" | "pulseMode"
  >,
): number {
  if (points.length === 0) return 0;
  let peakIndex = 0;
  for (let index = 1; index < points.length; index += 1)
    if (points[index].decibels > points[peakIndex].decibels) peakIndex = index;
  const raw =
    config.pulseMode === "peak-frequency"
      ? points.length === 1
        ? 0
        : peakIndex / (points.length - 1)
      : (points[peakIndex].decibels - config.minimumDecibels) /
        (config.maximumDecibels - config.minimumDecibels);
  return clamp(raw * config.gradientRatio, 0, 1);
}

export function resolveCssVariableColor(value: string, element?: Element | null): string {
  const match = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(value.trim());
  if (!match) return value;
  const fallback = match[2]?.trim() || "transparent";
  if (!element || typeof getComputedStyle !== "function") return fallback;
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || fallback;
}

export function colorWithAlpha(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed)
    return clamp(alpha, 0, 1) === 1
      ? color
      : `color-mix(in srgb, ${color} ${clamp(alpha, 0, 1) * 100}%, transparent)`;
  return rgba(parsed.red, parsed.green, parsed.blue, parsed.alpha * clamp(alpha, 0, 1));
}

export function mixSpectrumColors(from: string, to: string, amount: number): string {
  const first = parseColor(from);
  const second = parseColor(to);
  const ratio = clamp(amount, 0, 1);
  if (!first || !second) return ratio < 0.5 ? from : to;
  return rgba(
    first.red + (second.red - first.red) * ratio,
    first.green + (second.green - first.green) * ratio,
    first.blue + (second.blue - first.blue) * ratio,
    first.alpha + (second.alpha - first.alpha) * ratio,
  );
}

interface ParsedColor {
  readonly alpha: number;
  readonly blue: number;
  readonly green: number;
  readonly red: number;
}

function parseColor(color: string): ParsedColor | null {
  const value = color.trim();
  if (value === "transparent") return { alpha: 0, blue: 0, green: 0, red: 0 };
  if (value.startsWith("#")) return parseHex(value.slice(1));
  const match =
    /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
      value,
    );
  if (!match) return null;
  return {
    alpha: match[4]?.endsWith("%")
      ? Number.parseFloat(match[4]) / 100
      : Number.parseFloat(match[4] ?? "1"),
    blue: Number.parseFloat(match[3]),
    green: Number.parseFloat(match[2]),
    red: Number.parseFloat(match[1]),
  };
}

function parseHex(value: string): ParsedColor | null {
  const expanded =
    value.length === 3 || value.length === 4
      ? [...value].map((character) => character.repeat(2)).join("")
      : value;
  if (expanded.length !== 6 && expanded.length !== 8) return null;
  const numeric = Number.parseInt(expanded, 16);
  if (!Number.isFinite(numeric)) return null;
  return {
    alpha: expanded.length === 8 ? (numeric & 0xff) / 255 : 1,
    blue: expanded.length === 8 ? (numeric >> 8) & 0xff : numeric & 0xff,
    green: expanded.length === 8 ? (numeric >> 16) & 0xff : (numeric >> 8) & 0xff,
    red: expanded.length === 8 ? (numeric >> 24) & 0xff : (numeric >> 16) & 0xff,
  };
}

function rgba(red: number, green: number, blue: number, alpha: number): string {
  return `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${Number(clamp(alpha, 0, 1).toFixed(4))})`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}
