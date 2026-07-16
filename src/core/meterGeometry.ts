import { resolveMeterConfig } from "../meterConfig";
import type {
  CanvasMeterConfig,
  CanvasMeterConfigInput,
  MeterArc,
  MeterArcSegment,
  MeterChannel,
  MeterFrame,
  MeterRect,
  MeterSegment,
  WaveformViewport,
} from "../types";

export function buildMeterRects(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: CanvasMeterConfigInput,
): readonly MeterRect[] {
  if (frame.state === "empty" || frame.channels.length === 0) return [];
  const resolved = resolveMeterConfig(config, frame);
  const metrics = rectangularMetrics(viewport, resolved, frame.channels.length);
  if (!metrics) return [];
  return frame.channels.map((channel, channelIndex) => {
    const decibels = meterChannelDecibels(channel, resolved);
    const level = meterDecibelLevel(decibels, resolved);
    const size = Math.min(
      metrics.progressExtent,
      Math.max(resolved.minimumSize, level * metrics.progressExtent),
    );
    if (resolved.orientation === "horizontal")
      return Object.freeze({
        channelIndex,
        decibels,
        height: metrics.barThickness,
        level,
        width: size,
        x: resolved.padding,
        y:
          resolved.padding +
          channelIndex * (metrics.laneExtent + metrics.effectiveGap) +
          (metrics.laneExtent - metrics.barThickness) / 2,
      });
    return Object.freeze({
      channelIndex,
      decibels,
      height: size,
      level,
      width: metrics.barThickness,
      x:
        resolved.padding +
        channelIndex * (metrics.laneExtent + metrics.effectiveGap) +
        (metrics.laneExtent - metrics.barThickness) / 2,
      y: resolved.padding + metrics.progressExtent - size,
    });
  });
}

export function buildMeterSegments(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: CanvasMeterConfigInput,
): readonly MeterSegment[] {
  if (frame.state === "empty" || frame.channels.length === 0) return [];
  const resolved = resolveMeterConfig({ ...config, mode: "stepped-meter" }, frame);
  const metrics = rectangularMetrics(viewport, resolved, frame.channels.length);
  if (!metrics) return [];
  const stepWidth = Math.min(resolved.stepWidth, metrics.progressExtent);
  const stepGap = Math.min(resolved.stepGap, metrics.progressExtent);
  const count = Math.max(
    1,
    Math.floor((metrics.progressExtent + stepGap) / Math.max(1, stepWidth + stepGap)),
  );
  const usedExtent = count * stepWidth + Math.max(0, count - 1) * stepGap;
  const offset = Math.max(0, (metrics.progressExtent - usedExtent) / 2);
  const minimumActive = Math.min(
    count,
    resolved.minimumSize === 0
      ? 0
      : Math.max(1, Math.ceil(resolved.minimumSize / Math.max(1, stepWidth + stepGap))),
  );
  return frame.channels.flatMap((channel, channelIndex) => {
    const value = meterChannelDecibels(channel, resolved);
    const valueLevel = meterDecibelLevel(value, resolved);
    const activeCount = Math.max(minimumActive, Math.ceil(valueLevel * count));
    return Array.from({ length: count }, (_, segmentIndex) => {
      const level = (segmentIndex + 1) / count;
      const decibels = decibelsAtLevel(level, resolved);
      if (resolved.orientation === "horizontal")
        return Object.freeze({
          active: segmentIndex < activeCount,
          channelIndex,
          decibels,
          height: metrics.barThickness,
          level,
          segmentIndex,
          width: stepWidth,
          x: resolved.padding + offset + segmentIndex * (stepWidth + stepGap),
          y:
            resolved.padding +
            channelIndex * (metrics.laneExtent + metrics.effectiveGap) +
            (metrics.laneExtent - metrics.barThickness) / 2,
        });
      return Object.freeze({
        active: segmentIndex < activeCount,
        channelIndex,
        decibels,
        height: stepWidth,
        level,
        segmentIndex,
        width: metrics.barThickness,
        x:
          resolved.padding +
          channelIndex * (metrics.laneExtent + metrics.effectiveGap) +
          (metrics.laneExtent - metrics.barThickness) / 2,
        y:
          resolved.padding +
          metrics.progressExtent -
          offset -
          stepWidth -
          segmentIndex * (stepWidth + stepGap),
      });
    });
  });
}

export function buildMeterArcs(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: CanvasMeterConfigInput,
): readonly MeterArc[] {
  if (frame.state === "empty" || frame.channels.length === 0) return [];
  const resolved = resolveMeterConfig({ ...config, layout: "radial" }, frame);
  const metrics = radialMetrics(viewport, resolved, frame.channels.length);
  if (!metrics || metrics.arc === 0) return [];
  return frame.channels.map((channel, channelIndex) => {
    const decibels = meterChannelDecibels(channel, resolved);
    const level = meterDecibelLevel(decibels, resolved);
    const radius =
      metrics.minimumRadius +
      channelIndex * (metrics.laneExtent + metrics.effectiveGap) +
      metrics.laneExtent / 2;
    const minimumArc = radius === 0 ? 0 : resolved.minimumSize / radius;
    const extent = Math.min(metrics.arc, Math.max(minimumArc, level * metrics.arc));
    return Object.freeze({
      channelIndex,
      decibels,
      endAngle: metrics.startAngle + metrics.direction * extent,
      level,
      radius,
      startAngle: metrics.startAngle,
      width: metrics.barThickness,
      x: metrics.centerX,
      y: metrics.centerY,
    });
  });
}

export function buildMeterArcSegments(
  frame: MeterFrame,
  viewport: WaveformViewport,
  config?: CanvasMeterConfigInput,
): readonly MeterArcSegment[] {
  if (frame.state === "empty" || frame.channels.length === 0) return [];
  const resolved = resolveMeterConfig(
    { ...config, layout: "radial", mode: "stepped-meter" },
    frame,
  );
  const metrics = radialMetrics(viewport, resolved, frame.channels.length);
  if (!metrics || metrics.arc === 0) return [];
  return frame.channels.flatMap((channel, channelIndex) => {
    const radius =
      metrics.minimumRadius +
      channelIndex * (metrics.laneExtent + metrics.effectiveGap) +
      metrics.laneExtent / 2;
    const arcLength = metrics.arc * radius;
    const stepWidth = Math.min(resolved.stepWidth, arcLength);
    const stepGap = Math.min(resolved.stepGap, arcLength);
    const strokeWidth = Math.min(metrics.barThickness, stepWidth);
    const capAllowance = resolved.roundedCaps ? strokeWidth : 0;
    const centerlineStepWidth = Math.max(0.001, stepWidth - capAllowance);
    const count = Math.max(1, Math.floor((arcLength + stepGap) / Math.max(1, stepWidth + stepGap)));
    const valueLevel = meterDecibelLevel(meterChannelDecibels(channel, resolved), resolved);
    const minimumActive =
      resolved.minimumSize === 0
        ? 0
        : Math.max(1, Math.ceil(resolved.minimumSize / Math.max(1, stepWidth + stepGap)));
    const activeCount = Math.min(count, Math.max(minimumActive, Math.ceil(valueLevel * count)));
    const usedExtent = count * stepWidth + Math.max(0, count - 1) * stepGap;
    const offset = Math.max(0, (arcLength - usedExtent) / 2);
    return Array.from({ length: count }, (_, segmentIndex) => {
      const segmentStart =
        (offset + capAllowance / 2 + segmentIndex * (stepWidth + stepGap)) / radius;
      const segmentEnd = segmentStart + centerlineStepWidth / radius;
      const level = (segmentIndex + 1) / count;
      return Object.freeze({
        active: segmentIndex < activeCount,
        channelIndex,
        decibels: decibelsAtLevel(level, resolved),
        endAngle: metrics.startAngle + metrics.direction * segmentEnd,
        level,
        radius,
        segmentIndex,
        startAngle: metrics.startAngle + metrics.direction * segmentStart,
        width: strokeWidth,
        x: metrics.centerX,
        y: metrics.centerY,
      });
    });
  });
}

export function meterChannelDecibels(
  channel: MeterChannel,
  config: Pick<CanvasMeterConfig, "measurement">,
): number {
  return config.measurement === "peak" ? channel.peakDbfs : channel.rmsDbfs;
}

export function meterDecibelLevel(
  decibels: number,
  config: Pick<CanvasMeterConfig, "maximumDecibels" | "minimumDecibels">,
): number {
  const finite = Number.isFinite(decibels) ? decibels : config.minimumDecibels;
  return clamp(
    (finite - config.minimumDecibels) / (config.maximumDecibels - config.minimumDecibels),
    0,
    1,
  );
}

interface RectangularMetrics {
  readonly barThickness: number;
  readonly effectiveGap: number;
  readonly laneExtent: number;
  readonly progressExtent: number;
}

function rectangularMetrics(
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  channelCount: number,
): RectangularMetrics | null {
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const innerWidth = Math.max(0, width - config.padding * 2);
  const innerHeight = Math.max(0, height - config.padding * 2);
  if (innerWidth === 0 || innerHeight === 0 || channelCount === 0) return null;
  const crossExtent = config.orientation === "horizontal" ? innerHeight : innerWidth;
  const progressExtent = config.orientation === "horizontal" ? innerWidth : innerHeight;
  const maximumTotalGap = Math.max(0, crossExtent - channelCount);
  const totalGap = Math.min(config.channelGap * Math.max(0, channelCount - 1), maximumTotalGap);
  const effectiveGap = channelCount > 1 ? totalGap / (channelCount - 1) : 0;
  const laneExtent = (crossExtent - totalGap) / channelCount;
  return Object.freeze({
    barThickness: Math.min(config.barWidth, laneExtent),
    effectiveGap,
    laneExtent,
    progressExtent,
  });
}

interface RadialMetrics {
  readonly arc: number;
  readonly barThickness: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly direction: -1 | 1;
  readonly effectiveGap: number;
  readonly laneExtent: number;
  readonly minimumRadius: number;
  readonly startAngle: number;
}

function radialMetrics(
  viewport: WaveformViewport,
  config: CanvasMeterConfig,
  channelCount: number,
): RadialMetrics | null {
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const padding = Math.min(config.padding, width / 2, height / 2);
  const maximumRadius = Math.max(0, Math.min(width - padding * 2, height - padding * 2) / 2);
  if (maximumRadius === 0 || channelCount === 0) return null;
  const minimumRadius = maximumRadius * config.radialDeadzone;
  const crossExtent = maximumRadius - minimumRadius;
  if (crossExtent === 0) return null;
  const maximumTotalGap = Math.max(0, crossExtent - channelCount);
  const totalGap = Math.min(config.channelGap * Math.max(0, channelCount - 1), maximumTotalGap);
  const effectiveGap = channelCount > 1 ? totalGap / (channelCount - 1) : 0;
  const laneExtent = (crossExtent - totalGap) / channelCount;
  return Object.freeze({
    arc: (config.radialArc * Math.PI) / 180,
    barThickness: Math.min(config.barWidth, laneExtent),
    centerX: width / 2,
    centerY: height / 2,
    direction: config.radialInvert ? -1 : 1,
    effectiveGap,
    laneExtent,
    minimumRadius,
    startAngle: (config.radialRotation * Math.PI) / 180,
  });
}

function decibelsAtLevel(level: number, config: CanvasMeterConfig): number {
  return config.minimumDecibels + level * (config.maximumDecibels - config.minimumDecibels);
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
