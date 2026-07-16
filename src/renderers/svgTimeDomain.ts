import { selectTimeDomainChannels } from "../analysis/channels";
import { resolveWaveformConfig } from "../config";
import { buildTimeDomainSegments } from "../core/waveformGeometry";
import type {
  CanvasWaveformConfigInput,
  TimeDomainFrame,
  WaveformColumn,
  WaveformViewport,
} from "../types";
import { SVG_RENDERER_CAPABILITIES } from "./capabilities";
import {
  finalizeSvgScene,
  normalizeSvgViewport,
  pointsPath,
  sampleEvenly,
  segmentPath,
  unsupportedSvgScene,
} from "./svgHelpers";
import type { SvgNode, SvgRenderOptions, SvgScene } from "./svgTypes";

export function renderSvgTimeDomain(
  frame: TimeDomainFrame,
  viewport: WaveformViewport,
  config?: CanvasWaveformConfigInput,
  options: SvgRenderOptions = {},
): SvgScene {
  const size = normalizeSvgViewport(viewport);
  const resolved = resolveWaveformConfig(config, frame.kind);
  const selected = selectTimeDomainChannels(frame, resolved);
  if (selected.channels.length > SVG_RENDERER_CAPABILITIES.limits.maximumChannels)
    return unsupportedSvgScene(
      size.width,
      size.height,
      `SVG supports at most ${SVG_RENDERER_CAPABILITIES.limits.maximumChannels} selected channels; received ${selected.channels.length}. Use Canvas 2D or select fewer channels.`,
    );

  const sourceColumns = buildTimeDomainSegments(frame, size, resolved);
  const columns = sampleColumnsByChannel(
    sourceColumns,
    SVG_RENDERER_CAPABILITIES.limits.maximumTimeDomainColumns,
  );
  const nodes: SvgNode[] = [
    {
      fill: options.forcedColors ? "Canvas" : resolved.backgroundColor,
      height: size.height,
      key: "time-background",
      kind: "rect",
      width: size.width,
      x: 0,
      y: 0,
    },
  ];

  if (resolved.showCenterLine && columns.length > 0) {
    const guides = [
      ...new Set(columns.map((column) => guideCoordinate(column, resolved.orientation))),
    ];
    const padding = Math.min(resolved.padding, size.width / 2, size.height / 2);
    const guideSegments = guides.map((guide) =>
      resolved.orientation === "horizontal"
        ? { x1: padding, x2: Math.max(padding, size.width - padding), y1: guide, y2: guide }
        : { x1: guide, x2: guide, y1: padding, y2: Math.max(padding, size.height - padding) },
    );
    nodes.push({
      d: segmentPath(guideSegments),
      fill: "none",
      key: "time-guides",
      kind: "path",
      stroke: options.forcedColors ? "GrayText" : resolved.centerLineColor,
      strokeWidth: 1,
    });
  }

  for (const played of [false, true]) {
    const byChannel = groupColumns(
      columns.filter((column) =>
        played
          ? column.progress <= resolved.playbackProgress
          : column.progress > resolved.playbackProgress,
      ),
    );
    for (const [channelIndex, group] of byChannel) {
      const color = options.forcedColors
        ? played
          ? "Highlight"
          : "CanvasText"
        : played
          ? resolved.playedColor
          : (resolved.channelColors[channelIndex] ?? resolved.color);
      const key = `time-${played ? "played" : "unplayed"}-channel-${channelIndex}`;
      nodes.push(
        {
          d: segmentPath(group),
          fill: "none",
          key: `${key}-extrema`,
          kind: "path",
          stroke: color,
          strokeLinecap: "round",
          strokeWidth: resolved.lineWidth,
        },
        {
          d: pointsPath(
            group.map((column) => ({
              x: (column.x1 + column.x2) / 2,
              y: (column.y1 + column.y2) / 2,
            })),
          ),
          fill: "none",
          key: `${key}-continuity`,
          kind: "path",
          stroke: color,
          strokeLinecap: "round",
          strokeWidth: resolved.lineWidth,
        },
      );
    }
  }

  const messages =
    columns.length < sourceColumns.length
      ? [
          `SVG sampled ${sourceColumns.length} canonical extrema columns to ${columns.length} within its ${SVG_RENDERER_CAPABILITIES.limits.maximumTimeDomainColumns}-column budget.`,
        ]
      : [];
  return finalizeSvgScene({
    height: size.height,
    messages,
    nodes,
    renderedPointCount: columns.length,
    sourcePointCount: sourceColumns.length,
    width: size.width,
  });
}

function sampleColumnsByChannel(
  columns: readonly WaveformColumn[],
  maximum: number,
): readonly WaveformColumn[] {
  if (columns.length <= maximum) return columns;
  const groups = groupColumns(columns);
  const maximumPerChannel = Math.max(1, Math.floor(maximum / Math.max(1, groups.size)));
  return [...groups.values()].flatMap((group) => sampleEvenly(group, maximumPerChannel));
}

function groupColumns(columns: readonly WaveformColumn[]): ReadonlyMap<number, WaveformColumn[]> {
  const groups = new Map<number, WaveformColumn[]>();
  for (const column of columns) {
    const group = groups.get(column.channelIndex) ?? [];
    group.push(column);
    groups.set(column.channelIndex, group);
  }
  return groups;
}

function guideCoordinate(column: WaveformColumn, orientation: "horizontal" | "vertical"): number {
  return orientation === "horizontal" ? column.centerY : column.centerX;
}
