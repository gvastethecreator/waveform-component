import { MAX_VFX_BANDS } from "../analysis/bands";
import type { BandEnergyFrame } from "../types";
import type { VfxMotion, VfxQuality } from "./schema";

export interface BandUniformMetrics {
  readonly bandCount: number;
  readonly bands: readonly number[];
  readonly centroid: number;
  readonly energy: number;
  readonly peak: number;
}

export function createBandUniformMetrics(frame: BandEnergyFrame): BandUniformMetrics {
  const bands = sampleBandEnergy(frame);
  let squaredEnergy = 0;
  let peak = 0;
  let weightedPosition = 0;
  let weight = 0;
  bands.forEach((energy, index) => {
    squaredEnergy += energy * energy;
    peak = Math.max(peak, energy);
    const position = bands.length <= 1 ? 0 : index / (bands.length - 1);
    weightedPosition += position * energy;
    weight += energy;
  });
  return Object.freeze({
    bandCount: bands.length,
    bands,
    centroid: weight === 0 ? 0 : weightedPosition / weight,
    energy: bands.length === 0 ? 0 : Math.sqrt(squaredEnergy / bands.length),
    peak,
  });
}

export function resolveVfxTime(timeSeconds: number, reducedMotion: boolean): number {
  return reducedMotion || !Number.isFinite(timeSeconds) ? 0 : Math.max(0, timeSeconds);
}

export function parseVfxColor(
  value: string,
  fallback = "#000000",
): readonly [number, number, number, number] {
  const candidate = variableFallback(value) ?? value;
  return parseColor(candidate) ?? parseColor(fallback) ?? Object.freeze([0, 0, 0, 1]);
}

export function clampFinite(
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, typeof value === "number" && Number.isFinite(value) ? value : fallback),
  );
}

export function clampInteger(
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  return Math.round(clampFinite(value, minimum, maximum, fallback));
}

export function nonempty(value: string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function isVfxMotion(value: unknown): value is VfxMotion {
  return value === "auto" || value === "full" || value === "reduced";
}

export function isVfxQuality(value: unknown): value is VfxQuality {
  return value === "low" || value === "balanced" || value === "high";
}

function sampleBandEnergy(frame: BandEnergyFrame): readonly number[] {
  if (frame.state === "empty" || frame.bands.length === 0) return Object.freeze([]);
  if (frame.bands.length <= MAX_VFX_BANDS)
    return Object.freeze(frame.bands.map((band) => clampFinite(band.energy, 0, 1, 0)));
  return Object.freeze(
    Array.from({ length: MAX_VFX_BANDS }, (_, index) => {
      const start = Math.floor((index * frame.bands.length) / MAX_VFX_BANDS);
      const end = Math.max(
        start + 1,
        Math.floor(((index + 1) * frame.bands.length) / MAX_VFX_BANDS),
      );
      let peak = 0;
      for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1)
        peak = Math.max(peak, clampFinite(frame.bands[sourceIndex].energy, 0, 1, 0));
      return peak;
    }),
  );
}

function parseColor(value: string): readonly [number, number, number, number] | null {
  const color = value.trim();
  if (color.startsWith("#")) return parseHex(color.slice(1));
  const match =
    /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
      color,
    );
  if (!match) return null;
  const alpha = match[4]?.endsWith("%")
    ? Number.parseFloat(match[4]) / 100
    : Number.parseFloat(match[4] ?? "1");
  return Object.freeze([
    clampFinite(Number.parseFloat(match[1]) / 255, 0, 1, 0),
    clampFinite(Number.parseFloat(match[2]) / 255, 0, 1, 0),
    clampFinite(Number.parseFloat(match[3]) / 255, 0, 1, 0),
    clampFinite(alpha, 0, 1, 1),
  ]);
}

function parseHex(value: string): readonly [number, number, number, number] | null {
  const expanded =
    value.length === 3 || value.length === 4
      ? [...value].map((character) => character.repeat(2)).join("")
      : value;
  if (expanded.length !== 6 && expanded.length !== 8) return null;
  if (!/^[\da-f]+$/i.test(expanded)) return null;
  return Object.freeze([
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
    expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
  ]);
}

function variableFallback(value: string): string | null {
  return /^var\(\s*--[\w-]+\s*,\s*(.+)\)$/.exec(value.trim())?.[1]?.trim() ?? null;
}
