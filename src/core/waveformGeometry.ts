import { selectTimeDomainChannels } from "../analysis/channels";
import { resolveWaveformConfig, WaveformConfigError } from "../config";
import type {
  CanvasWaveformConfig,
  CanvasWaveformConfigInput,
  TimeDomainFrame,
  WaveformColumn,
  WaveformFrame,
  WaveformViewport,
} from "../types";

export function buildWaveformColumns(
  frame: WaveformFrame,
  viewport: WaveformViewport,
  config?: CanvasWaveformConfigInput,
): readonly WaveformColumn[] {
  return buildTimeDomainSegments(frame, viewport, config);
}

export function buildTimeDomainSegments(
  frame: TimeDomainFrame,
  viewport: WaveformViewport,
  config?: CanvasWaveformConfigInput,
): readonly WaveformColumn[] {
  const resolved = resolveWaveformConfig(config, frame.kind);
  const selected = selectTimeDomainChannels(frame, resolved);
  validateLayout(resolved.channelLayout, selected.channels.length);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const padding = Math.min(resolved.padding, width / 2, height / 2);
  const innerWidth = Math.max(0, width - padding * 2);
  const innerHeight = Math.max(0, height - padding * 2);
  const horizontal = resolved.orientation === "horizontal";
  const primaryStart = padding;
  const primaryLength = horizontal ? innerWidth : innerHeight;
  const crossStart = padding;
  const crossLength = horizontal ? innerHeight : innerWidth;
  const laneCount = resolved.channelLayout === "stacked" ? selected.channels.length : 1;
  const totalLaneGap = Math.min(crossLength, resolved.channelGap * Math.max(0, laneCount - 1));
  const laneExtent = laneCount > 0 ? Math.max(0, (crossLength - totalLaneGap) / laneCount) : 0;
  const paneCount = resolved.channelLayout === "split" ? selected.channels.length : 1;
  const totalPaneGap = Math.min(primaryLength, resolved.channelGap * Math.max(0, paneCount - 1));
  const paneExtent = paneCount > 0 ? Math.max(0, (primaryLength - totalPaneGap) / paneCount) : 0;

  if (paneExtent === 0 || laneExtent === 0 || frame.state === "empty") return [];

  const output: WaveformColumn[] = [];
  selected.channels.forEach((channel, channelIndex) => {
    if (channel.length === 0) return;
    const laneIndex = resolved.channelLayout === "stacked" ? channelIndex : 0;
    const laneStart = crossStart + laneIndex * (laneExtent + resolved.channelGap);
    const paneIndex = resolved.channelLayout === "split" ? channelIndex : 0;
    const paneStart = primaryStart + paneIndex * (paneExtent + resolved.channelGap);
    const columnCount = Math.max(1, Math.min(channel.length, Math.floor(paneExtent)));

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const start = Math.floor((columnIndex * channel.length) / columnCount);
      const end = Math.max(
        start + 1,
        Math.floor(((columnIndex + 1) * channel.length) / columnCount),
      );
      let minimum = 1;
      let maximum = frame.kind === "envelope" ? 0 : -1;
      for (
        let sampleIndex = start;
        sampleIndex < end && sampleIndex < channel.length;
        sampleIndex += 1
      ) {
        minimum = Math.min(minimum, channel[sampleIndex]);
        maximum = Math.max(maximum, channel[sampleIndex]);
      }
      const progress = (columnIndex + 0.5) / columnCount;
      const primary = paneStart + progress * paneExtent;
      const amplitude = amplitudeCoordinates(
        frame.kind,
        minimum,
        maximum,
        laneStart,
        laneExtent,
        resolved,
      );
      output.push(
        horizontal
          ? {
              centerX: primary,
              centerY: amplitude.baseline,
              channelIndex,
              progress,
              sourceChannelIndex: selected.sourceChannelIndices[channelIndex],
              x1: primary,
              x2: primary,
              y1: amplitude.first,
              y2: amplitude.second,
            }
          : {
              centerX: amplitude.baseline,
              centerY: primary,
              channelIndex,
              progress,
              sourceChannelIndex: selected.sourceChannelIndices[channelIndex],
              x1: amplitude.first,
              x2: amplitude.second,
              y1: primary,
              y2: primary,
            },
      );
    }
  });

  return output;
}

function amplitudeCoordinates(
  frameKind: TimeDomainFrame["kind"],
  minimum: number,
  maximum: number,
  laneStart: number,
  laneExtent: number,
  config: CanvasWaveformConfig,
): { readonly baseline: number; readonly first: number; readonly second: number } {
  const laneEnd = laneStart + laneExtent;
  const center = laneStart + laneExtent / 2;
  const positiveDirection = config.orientation === "horizontal" ? -1 : 1;
  const positiveBaseline = positiveDirection < 0 ? laneEnd : laneStart;
  const negativeBaseline = positiveDirection < 0 ? laneStart : laneEnd;
  const position = (baseline: number, value: number, direction: number, extent: number) =>
    clamp(baseline + value * extent * config.amplitude * direction, laneStart, laneEnd);

  if (frameKind === "envelope") {
    if (config.mode !== "envelope") throw modeMismatch(frameKind, config.mode);
    if (config.amplitudePlacement === "mirrored")
      return {
        baseline: center,
        first: position(center, maximum, positiveDirection, laneExtent / 2),
        second: position(center, maximum, -positiveDirection, laneExtent / 2),
      };
    return {
      baseline: positiveBaseline,
      first: position(positiveBaseline, maximum, positiveDirection, laneExtent),
      second: positiveBaseline,
    };
  }

  if (config.mode !== "waveform") throw modeMismatch(frameKind, config.mode);
  if (config.amplitudePlacement === "positive-only") {
    const low = Math.max(0, minimum);
    const high = Math.max(0, maximum);
    return {
      baseline: positiveBaseline,
      first: position(positiveBaseline, high, positiveDirection, laneExtent),
      second: position(positiveBaseline, low, positiveDirection, laneExtent),
    };
  }
  if (config.amplitudePlacement === "negative-only") {
    const low = Math.max(0, -maximum);
    const high = Math.max(0, -minimum);
    return {
      baseline: negativeBaseline,
      first: position(negativeBaseline, low, -positiveDirection, laneExtent),
      second: position(negativeBaseline, high, -positiveDirection, laneExtent),
    };
  }
  return {
    baseline: center,
    first: position(center, maximum, positiveDirection, laneExtent / 2),
    second: position(center, minimum, positiveDirection, laneExtent / 2),
  };
}

function validateLayout(layout: CanvasWaveformConfig["channelLayout"], channelCount: number): void {
  if (layout === "split" && channelCount !== 2)
    throw new WaveformConfigError(
      "STEREO_REQUIRES_TWO_CHANNELS",
      `Split layout requires exactly two selected channels; received ${channelCount}.`,
    );
  if (layout === "overlay" && channelCount < 2)
    throw new WaveformConfigError(
      "MULTI_CHANNEL_LAYOUT_REQUIRED",
      `Overlay layout requires at least two selected channels; received ${channelCount}.`,
    );
}

function modeMismatch(frameKind: TimeDomainFrame["kind"], mode: CanvasWaveformConfig["mode"]) {
  return new WaveformConfigError(
    "FRAME_MODE_MISMATCH",
    `A ${frameKind} frame cannot use ${mode} amplitude placement.`,
  );
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
