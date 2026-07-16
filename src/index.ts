export {
  DEFAULT_ENVELOPE_CONFIG,
  DEFAULT_WAVEFORM_CONFIG,
  resolveWaveformConfig,
  WaveformConfigError,
} from "./config";
export { mixChannels, selectTimeDomainChannels } from "./analysis/channels";
export type { SelectedTimeDomainChannels } from "./analysis/channels";
export {
  analyzeSpectrum,
  createSpectrumFrame,
  createWindowCoefficients,
  fractionalBinForFrequency,
  frequencyForBin,
  SpectrumAnalysisError,
} from "./analysis/spectrum";
export type { AnalyzeSpectrumOptions, SpectrumFrameOptions } from "./analysis/spectrum";
export {
  DEFAULT_SPECTRUM_DYNAMICS_CONFIG,
  SpectrumFrameDelay,
  createSpectrumDynamicsProcessor,
  gaussianFilterSpectrum,
  resolveSpectrumDynamicsConfig,
  resolveVisualSyncOffset,
} from "./analysis/spectrumDynamics";
export type {
  SpectrumDynamicsConfig,
  SpectrumDynamicsInput,
  SpectrumDynamicsPolicy,
  SpectrumDynamicsProcessor,
  SpectrumDynamicsResult,
  SpectrumInputState,
  SpectrumSmoothingMode,
  VisualSyncCapability,
  VisualSyncResolution,
} from "./analysis/spectrumDynamics";
export {
  getSpectrumControlAvailability,
  SPECTRUM_CONTROL_DEFINITIONS,
} from "./capabilities/spectrumControls";
export type {
  SpectrumCapabilityContext,
  SpectrumControlAvailability,
  SpectrumControlDefinition,
  SpectrumControlId,
} from "./capabilities/spectrumControls";
export {
  createDemoWaveform,
  createEnvelopeFrameFromWaveform,
  createStaticEnvelopeFrame,
  createStaticWaveformFrame,
} from "./core/staticFrame";
export type { DemoWaveformOptions, StaticWaveformOptions } from "./core/staticFrame";
export { buildTimeDomainSegments, buildWaveformColumns } from "./core/waveformGeometry";
export { buildSpectrumBars, buildSpectrumPoints, resampleSpectrum } from "./core/spectrumGeometry";
export { createWaveformFrameFromPeakLevel, extractWaveformPeakPyramid } from "./core/waveformPeaks";
export type { WaveformPeakOptions } from "./core/waveformPeaks";
export { renderCanvasTimeDomain, renderCanvasWaveform, syncCanvasSize } from "./renderers/canvas2d";
export { renderCanvasSpectrum } from "./renderers/canvasSpectrum";
export type { CanvasSize } from "./renderers/canvas2d";
export { Waveform } from "./react/Waveform";
export type { WaveformProps } from "./react/Waveform";
export { Envelope } from "./react/Envelope";
export type { EnvelopeProps } from "./react/Envelope";
export { Spectrum } from "./react/Spectrum";
export type { SpectrumProps } from "./react/Spectrum";
export {
  DEFAULT_SPECTRUM_ANALYSIS_CONFIG,
  DEFAULT_SPECTRUM_CONFIG,
  GUARDED_SPECTRUM_FFT_SIZE,
  resolveSpectrumAnalysisConfig,
  resolveSpectrumConfig,
  resolveSpectrumFrequencyRange,
  SPECTRUM_FFT_SIZES,
} from "./spectrumConfig";
export type { SpectrumFrequencyRange } from "./spectrumConfig";
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
export type {
  DemoWaveformSourceOptions,
  MediaStreamSourceOptions,
  SourceOptions,
} from "./session/sources";
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
  CanvasSpectrumConfig,
  CanvasVisualizationConfig,
  CanvasEnvelopeModeConfig,
  CanvasWaveformConfig,
  CanvasWaveformConfigInput,
  CanvasWaveformModeConfig,
  EnergyBand,
  EnvelopeAmplitudePlacement,
  EnvelopeFrame,
  MeterChannel,
  MeterFrame,
  SpectrumFrame,
  SpectrumAnalysisConfig,
  SpectrumBar,
  SpectrumFrequencyScale,
  SpectrumGeometry,
  SpectrumInterpolation,
  SpectrumPoint,
  SpectrumWindow,
  StaticWaveformInput,
  TimeDomainFrame,
  WaveformChannelInput,
  WaveformChannelLayout,
  WaveformChannelMode,
  WaveformChannelSelection,
  WaveformColumn,
  WaveformFrame,
  WaveformOrientation,
  WaveformAmplitudePlacement,
  WaveformPeakChannel,
  WaveformPeakLevel,
  WaveformPeakPyramid,
  WaveformViewport,
} from "./types";
