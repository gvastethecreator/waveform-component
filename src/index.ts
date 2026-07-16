export { DEFAULT_WAVEFORM_CONFIG, resolveWaveformConfig } from "./config";
export { createDemoWaveform, createStaticWaveformFrame } from "./core/staticFrame";
export type { DemoWaveformOptions, StaticWaveformOptions } from "./core/staticFrame";
export { buildWaveformColumns } from "./core/waveformGeometry";
export { renderCanvasWaveform, syncCanvasSize } from "./renderers/canvas2d";
export type { CanvasSize } from "./renderers/canvas2d";
export { Waveform } from "./react/Waveform";
export type { WaveformProps } from "./react/Waveform";
export { WaveformInputError } from "./types";
export type {
  CanvasWaveformConfig,
  StaticWaveformInput,
  WaveformChannelInput,
  WaveformColumn,
  WaveformFrame,
  WaveformViewport,
} from "./types";
