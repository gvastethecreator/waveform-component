export { DEFAULT_WAVEFORM_CONFIG, resolveWaveformConfig } from "./config";
export { createDemoWaveform, createStaticWaveformFrame } from "./core/staticFrame";
export type { DemoWaveformOptions, StaticWaveformOptions } from "./core/staticFrame";
export { buildWaveformColumns } from "./core/waveformGeometry";
export { createWaveformFrameFromPeakLevel, extractWaveformPeakPyramid } from "./core/waveformPeaks";
export type { WaveformPeakOptions } from "./core/waveformPeaks";
export { renderCanvasWaveform, syncCanvasSize } from "./renderers/canvas2d";
export type { CanvasSize } from "./renderers/canvas2d";
export { Waveform } from "./react/Waveform";
export type { WaveformProps } from "./react/Waveform";
export { SessionWaveform, useWaveformSession } from "./react/SessionWaveform";
export type { SessionWaveformProps } from "./react/SessionWaveform";
export {
  RecordedWaveformPlayer,
  formatAudioTime,
  keyboardSeekTarget,
  useRecordedAudioSource,
} from "./react/RecordedWaveformPlayer";
export type { RecordedWaveformPlayerProps } from "./react/RecordedWaveformPlayer";
export { createLiveMediaStreamSource, createMicrophoneSource } from "./live/MicrophoneSource";
export type {
  LiveAudioContext,
  MicrophoneEnvironment,
  MicrophoneSnapshot,
  MicrophoneSource,
  MicrophoneSourceOptions,
  MicrophoneState,
} from "./live/MicrophoneSource";
export { useMicrophoneSource } from "./react/useMicrophoneSource";
export { createRecordedAudioSource } from "./recorded/RecordedAudioSource";
export type {
  RecordedAudioEnvironment,
  RecordedAudioInput,
  RecordedAudioSnapshot,
  RecordedAudioSource,
  RecordedAudioSourceOptions,
  RecordedAudioState,
} from "./recorded/RecordedAudioSource";
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
  WaveformPeakChannel,
  WaveformPeakLevel,
  WaveformPeakPyramid,
  WaveformViewport,
} from "./types";
