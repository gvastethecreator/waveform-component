import { resolveWaveformConfig } from "../config";
import type {
  CanvasWaveformConfig,
  WaveformColumn,
  WaveformFrame,
  WaveformViewport,
} from "../types";

export function buildWaveformColumns(
  frame: WaveformFrame,
  viewport: WaveformViewport,
  config?: Partial<CanvasWaveformConfig>,
): readonly WaveformColumn[] {
  const resolved = resolveWaveformConfig(config);
  const width = finiteDimension(viewport.width);
  const height = finiteDimension(viewport.height);
  const padding = Math.min(resolved.padding, width / 2, height / 2);
  const innerWidth = Math.max(0, width - padding * 2);
  const innerHeight = Math.max(0, height - padding * 2);
  const channelCount = Math.max(1, frame.channels.length);
  const totalGap = Math.min(innerHeight, resolved.channelGap * Math.max(0, channelCount - 1));
  const channelHeight = Math.max(0, (innerHeight - totalGap) / channelCount);

  if (innerWidth === 0 || channelHeight === 0 || frame.state === "empty") return [];

  const output: WaveformColumn[] = [];
  frame.channels.forEach((channel, channelIndex) => {
    if (channel.length === 0) return;
    const columnCount = Math.max(1, Math.min(channel.length, Math.floor(innerWidth)));
    const channelTop = padding + channelIndex * (channelHeight + resolved.channelGap);
    const centerY = channelTop + channelHeight / 2;
    const scale = (channelHeight / 2) * resolved.amplitude;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const start = Math.floor((columnIndex * channel.length) / columnCount);
      const end = Math.max(
        start + 1,
        Math.floor(((columnIndex + 1) * channel.length) / columnCount),
      );
      let minimum = 1;
      let maximum = -1;
      for (
        let sampleIndex = start;
        sampleIndex < end && sampleIndex < channel.length;
        sampleIndex += 1
      ) {
        const sample = channel[sampleIndex];
        minimum = Math.min(minimum, sample);
        maximum = Math.max(maximum, sample);
      }

      output.push({
        channelIndex,
        centerY,
        x: padding + ((columnIndex + 0.5) / columnCount) * innerWidth,
        yMin: centerY - maximum * scale,
        yMax: centerY - minimum * scale,
      });
    }
  });

  return output;
}

function finiteDimension(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
