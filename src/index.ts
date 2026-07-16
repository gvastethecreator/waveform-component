export { DEFAULT_WAVEFORM_CONFIG, resolveWaveformConfig } from "./config";
export { createDemoWaveform, createStaticWaveformFrame } from "./core/staticFrame";
export type { DemoWaveformOptions, StaticWaveformOptions } from "./core/staticFrame";
export { buildWaveformColumns } from "./core/waveformGeometry";
export { renderCanvasWaveform, syncCanvasSize } from "./renderers/canvas2d";
export type { CanvasSize } from "./renderers/canvas2d";
export { Waveform } from "./react/Waveform";
export type { WaveformProps } from "./react/Waveform";
export { SessionWaveform, useWaveformSession } from "./react/SessionWaveform";
export type { SessionWaveformProps } from "./react/SessionWaveform";
export { createWaveformSession } from "./session/WaveformSession";
export {
  createAudioBufferWaveformSource,
  createAudioNodeWaveformSource,
  createDemoWaveformSource,
  createMediaElementWaveformSource,
  createMediaStreamWaveformSource,
  createPcmWaveformSource,
  createStaticWaveformSource,
} from "./session/sources";
export type { MediaStreamSourceOptions, SourceOptions } from "./session/sources";
export type {
  SourceOwnership,
  WaveformSession,
  WaveformSessionError,
  WaveformSessionSnapshot,
  WaveformSessionStatus,
  WaveformSource,
  WaveformSourceContext,
  WaveformSourceDescriptor,
  WaveformSourceHandle,
  WaveformSourceState,
} from "./session/types";
export { WaveformInputError } from "./types";
export type {
  AnalysisFrame,
  BandEnergyFrame,
  CanvasWaveformConfig,
  EnergyBand,
  EnvelopeFrame,
  MeterChannel,
  MeterFrame,
  SpectrumFrame,
  StaticWaveformInput,
  WaveformChannelInput,
  WaveformColumn,
  WaveformFrame,
  WaveformViewport,
} from "./types";
