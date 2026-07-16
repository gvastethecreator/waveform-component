import type { CanvasWaveformConfig } from "./types";

export const DEFAULT_WAVEFORM_CONFIG: CanvasWaveformConfig = Object.freeze({
  renderer: "canvas2d",
  mode: "waveform",
  amplitude: 0.86,
  backgroundColor: "#0b1012",
  centerLineColor: "rgba(169, 190, 194, 0.16)",
  channelGap: 12,
  color: "#62dcf5",
  lineWidth: 1.5,
  padding: 20,
  playbackProgress: 0,
  playedColor: "#ecfdff",
  showCenterLine: true,
});

export function resolveWaveformConfig(
  config: Partial<CanvasWaveformConfig> | undefined,
): CanvasWaveformConfig {
  const candidate = { ...DEFAULT_WAVEFORM_CONFIG, ...config };

  return {
    renderer: "canvas2d",
    mode: "waveform",
    amplitude: clampFinite(candidate.amplitude, 0, 2, DEFAULT_WAVEFORM_CONFIG.amplitude),
    backgroundColor: candidate.backgroundColor || DEFAULT_WAVEFORM_CONFIG.backgroundColor,
    centerLineColor: candidate.centerLineColor || DEFAULT_WAVEFORM_CONFIG.centerLineColor,
    channelGap: clampFinite(candidate.channelGap, 0, 96, DEFAULT_WAVEFORM_CONFIG.channelGap),
    color: candidate.color || DEFAULT_WAVEFORM_CONFIG.color,
    lineWidth: clampFinite(candidate.lineWidth, 0.5, 12, DEFAULT_WAVEFORM_CONFIG.lineWidth),
    padding: clampFinite(candidate.padding, 0, 160, DEFAULT_WAVEFORM_CONFIG.padding),
    playbackProgress: clampFinite(candidate.playbackProgress, 0, 1, 0),
    playedColor: candidate.playedColor || DEFAULT_WAVEFORM_CONFIG.playedColor,
    showCenterLine: Boolean(candidate.showCenterLine),
  };
}

function clampFinite(value: number, minimum: number, maximum: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}
