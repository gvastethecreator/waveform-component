export {
  DEFAULT_ENVELOPE_CONFIG,
  DEFAULT_WAVEFORM_CONFIG,
  resolveWaveformConfig,
  WaveformConfigError,
} from "./config";
export { mixChannels, selectTimeDomainChannels } from "./analysis/channels";
export type { SelectedTimeDomainChannels } from "./analysis/channels";
export { analyzeMeter, analyzeMeterWindows, linearAmplitudeToDbfs } from "./analysis/meter";
export type { AnalyzeMeterOptions, AnalyzeMeterWindowsOptions } from "./analysis/meter";
export {
  DEFAULT_METER_DYNAMICS_CONFIG,
  METER_PRESETS,
  createMeterDynamicsProcessor,
  meterHistoryCapacity,
  resolveMeterDynamicsConfig,
} from "./analysis/meterDynamics";
export type {
  MeterDynamicsConfig,
  MeterDynamicsInput,
  MeterDynamicsProcessor,
  MeterDynamicsResult,
  MeterPreset,
} from "./analysis/meterDynamics";
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
export {
  getMeterControlAvailability,
  METER_CONTROL_DEFINITIONS,
} from "./capabilities/meterControls";
export type {
  MeterCapabilityContext,
  MeterControlAvailability,
  MeterControlDefinition,
  MeterControlId,
} from "./capabilities/meterControls";
export {
  colorWithAlpha,
  mixSpectrumColors,
  resolveCssVariableColor,
  spectrumPulseAmount,
  spectrumRangeRole,
} from "./color/spectrumColor";
export type { SpectrumColorRoleName } from "./color/spectrumColor";
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
export {
  buildMeterArcs,
  buildMeterArcSegments,
  buildMeterRects,
  buildMeterSegments,
  meterChannelDecibels,
  meterDecibelLevel,
} from "./core/meterGeometry";
export {
  buildSpectrumBars,
  buildSpectrumPoints,
  buildSpectrumRadialBars,
  buildSpectrumRadialPoints,
  resampleSpectrum,
} from "./core/spectrumGeometry";
export { createWaveformFrameFromPeakLevel, extractWaveformPeakPyramid } from "./core/waveformPeaks";
export type { WaveformPeakOptions } from "./core/waveformPeaks";
export { renderCanvasTimeDomain, renderCanvasWaveform, syncCanvasSize } from "./renderers/canvas2d";
export { renderCanvasMeter } from "./renderers/canvasMeter";
export { renderCanvasSpectrum } from "./renderers/canvasSpectrum";
export type { CanvasSize } from "./renderers/canvas2d";
export {
  CANVAS2D_RENDERER_CAPABILITIES,
  CORE_RENDERER_CATALOG,
  SVG_RENDERER_CAPABILITIES,
  getRendererSupport,
} from "./renderers/capabilities";
export type {
  CoreRendererMode,
  RendererCapabilities,
  RendererLimits,
  RendererSupport,
  RendererSupportQuery,
} from "./renderers/capabilities";
export { renderSvgTimeDomain } from "./renderers/svgTimeDomain";
export { renderSvgSpectrum } from "./renderers/svgSpectrum";
export { renderSvgMeter } from "./renderers/svgMeter";
export { SVG_RENDERER_ADAPTER, renderSvgFrame } from "./renderers/svg";
export type { SvgRendererAdapter, SvgRenderRequest } from "./renderers/svg";
export type {
  SvgGradient,
  SvgGradientStop,
  SvgLinearGradient,
  SvgNode,
  SvgPathNode,
  SvgRadialGradient,
  SvgRectNode,
  SvgRenderOptions,
  SvgScene,
} from "./renderers/svgTypes";
export { Waveform } from "./react/Waveform";
export type { WaveformProps } from "./react/Waveform";
export { Envelope } from "./react/Envelope";
export type { EnvelopeProps } from "./react/Envelope";
export { Spectrum } from "./react/Spectrum";
export type { SpectrumProps } from "./react/Spectrum";
export { Meter } from "./react/Meter";
export type { MeterProps } from "./react/Meter";
export { SignalOverlay } from "./react/SignalOverlay";
export type {
  SignalOverlayChangeMeta,
  SignalOverlayChangeSource,
  SignalOverlayHandle,
  SignalOverlayHandleKind,
  SignalOverlayMarker,
  SignalOverlayProps,
  SignalOverlayRegion,
  SignalOverlayRegionKind,
  SignalOverlaySeek,
} from "./react/SignalOverlay";
export {
  assignOverlayCollisionLanes,
  assignOverlayRangeCollisionLanes,
  clampNormalized,
  keyboardNormalizedValue,
  normalizedToValue,
  normalizedValueFromPoint,
  normalizeOverlayRange,
  positionForNormalizedValue,
  valueToNormalized,
} from "./overlays/coordinates";
export type {
  OverlayAxis,
  OverlayBounds,
  OverlayCollisionItem,
  OverlayCollisionLayout,
  OverlayCoordinatePolicy,
  OverlayDirection,
  OverlayPoint,
  OverlayPosition,
  OverlayRangeCollisionItem,
  OverlayRangeCollisionLayout,
  OverlayScale,
  OverlayValueRange,
} from "./overlays/coordinates";
export { DEFAULT_METER_CONFIG, resolveMeterConfig } from "./meterConfig";
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
  CanvasColorRole,
  CanvasColorRoles,
  CanvasMeterConfig,
  CanvasMeterConfigInput,
  CanvasSpectrumConfig,
  CanvasSpectrumConfigInput,
  CanvasVisualizationConfig,
  CanvasEnvelopeModeConfig,
  CanvasWaveformConfig,
  CanvasWaveformConfigInput,
  CanvasWaveformModeConfig,
  EnergyBand,
  CoreRendererId,
  CoreVisualizationConfigInput,
  CoreVisualizationConfig,
  EnvelopeAmplitudePlacement,
  EnvelopeFrame,
  MeterChannel,
  MeterArc,
  MeterArcSegment,
  MeterColorMode,
  MeterFrame,
  MeterGeometry,
  MeterHistoryPoint,
  MeterMeasurement,
  MeterConfigInput,
  MeterConfig,
  MeterRect,
  MeterSegment,
  SpectrumFrame,
  SpectrumAnalysisConfig,
  SpectrumBar,
  SpectrumColorMode,
  SpectrumColorRole,
  SpectrumColorRoles,
  SpectrumFrequencyScale,
  SpectrumGeometry,
  SpectrumInterpolation,
  SpectrumLayout,
  SpectrumPoint,
  SpectrumPulseMode,
  SpectrumRadialBar,
  SpectrumRadialPoint,
  SpectrumWindow,
  SpectrumConfigInput,
  SpectrumConfig,
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
  WaveformConfigInput,
  WaveformConfig,
} from "./types";
