import type { PulseRingQuality } from "../vfx/pulseRing";

export const WEBGL2_MAX_DRAWING_BUFFER_DIMENSION = 4096;
export const WEBGL2_MAX_DRAWING_BUFFER_PIXELS = 4_194_304;

export interface WebglDrawingBufferSize {
  readonly bufferHeight: number;
  readonly bufferWidth: number;
  readonly cssHeight: number;
  readonly cssWidth: number;
  readonly degraded: boolean;
  readonly devicePixelRatio: number;
  readonly effectivePixelRatio: number;
  readonly quality: PulseRingQuality;
}

export function resolveWebglDrawingBufferSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  quality: PulseRingQuality,
): WebglDrawingBufferSize {
  const width = finiteDimension(cssWidth);
  const height = finiteDimension(cssHeight);
  const requestedPixelRatio = finitePixelRatio(devicePixelRatio);
  const deviceRatio = Math.min(requestedPixelRatio, qualityPixelRatio(quality));
  const targetWidth = Math.max(1, Math.round(width * deviceRatio));
  const targetHeight = Math.max(1, Math.round(height * deviceRatio));
  const scale = Math.min(
    1,
    WEBGL2_MAX_DRAWING_BUFFER_DIMENSION / targetWidth,
    WEBGL2_MAX_DRAWING_BUFFER_DIMENSION / targetHeight,
    Math.sqrt(WEBGL2_MAX_DRAWING_BUFFER_PIXELS / (targetWidth * targetHeight)),
  );
  const bufferWidth = Math.max(1, Math.floor(targetWidth * scale));
  const bufferHeight = Math.max(1, Math.floor(targetHeight * scale));
  const effectivePixelRatio =
    width > 0 && height > 0 ? Math.min(bufferWidth / width, bufferHeight / height) : 1;
  return Object.freeze({
    bufferHeight,
    bufferWidth,
    cssHeight: height,
    cssWidth: width,
    degraded: requestedPixelRatio > deviceRatio || scale < 1,
    devicePixelRatio: requestedPixelRatio,
    effectivePixelRatio,
    quality,
  });
}

function qualityPixelRatio(quality: PulseRingQuality): number {
  if (quality === "low") return 1;
  if (quality === "high") return 2;
  return 1.5;
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function finitePixelRatio(value: number): number {
  return Number.isFinite(value) ? Math.max(0.25, value) : 1;
}
