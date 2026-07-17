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
  BandEnergyInputError,
  MAX_VFX_BANDS,
  createBandEnergyFrameFromSpectrum,
} from "./analysis/bands";
export type { SpectrumBandEnergyOptions } from "./analysis/bands";
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
  BUILTIN_RENDERER_CATALOG,
  CANVAS2D_RENDERER_CAPABILITIES,
  CORE_RENDERER_CATALOG,
  DOM_RENDERER_CAPABILITIES,
  SVG_RENDERER_CAPABILITIES,
  WEBGL2_RENDERER_CAPABILITIES,
  getRendererSupport,
} from "./renderers/capabilities";
export type {
  CoreRendererMode,
  RendererMode,
  RendererCapabilities,
  RendererLimits,
  RendererSupport,
  RendererSupportQuery,
  VfxRendererMode,
} from "./renderers/capabilities";
export { renderDomMeter } from "./renderers/domMeter";
export { renderDomSpectrum } from "./renderers/domSpectrum";
export { DOM_RENDERER_ADAPTER, renderDomFrame } from "./renderers/dom";
export type { DomRendererAdapter, DomRenderRequest } from "./renderers/dom";
export type {
  DomBoxNode,
  DomNode,
  DomNodeRole,
  DomRenderOptions,
  DomScene,
} from "./renderers/domTypes";
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
export { WebglRendererError, createWebglPulseRingRenderer } from "./renderers/webgl2PulseRing";
export type {
  WebglPulseRingRenderOptions,
  WebglPulseRingRenderer,
  WebglPulseRingRendererOptions,
  WebglRendererDiagnostics,
  WebglRendererErrorCode,
  WebglRendererState,
  WebglRendererStatus,
} from "./renderers/webgl2PulseRing";
export { createWebglNeonLinesRenderer } from "./renderers/webgl2NeonLines";
export type {
  WebglNeonLinesRenderOptions,
  WebglNeonLinesRenderer,
  WebglNeonLinesRendererOptions,
} from "./renderers/webgl2NeonLines";
export { createWebglEqualizerGridRenderer } from "./renderers/webgl2EqualizerGrid";
export type {
  WebglEqualizerGridRenderOptions,
  WebglEqualizerGridRenderer,
  WebglEqualizerGridRendererOptions,
} from "./renderers/webgl2EqualizerGrid";
export { createWebglWaveformRibbonRenderer } from "./renderers/webgl2WaveformRibbon";
export type {
  WebglWaveformRibbonRenderOptions,
  WebglWaveformRibbonRenderer,
  WebglWaveformRibbonRendererOptions,
} from "./renderers/webgl2WaveformRibbon";
export { createWebglRoundedWobbleBarsRenderer } from "./renderers/webgl2RoundedWobbleBars";
export type {
  WebglRoundedWobbleBarsRenderOptions,
  WebglRoundedWobbleBarsRenderer,
  WebglRoundedWobbleBarsRendererOptions,
} from "./renderers/webgl2RoundedWobbleBars";
export {
  createWebglSpectrumBarsVfxRenderer,
  createWebglSpectrumBarsVfxRenderer as createWebglSpectrumBarsRenderer,
} from "./renderers/webgl2SpectrumBarsVfx";
export type {
  WebglSpectrumBarsVfxRenderOptions,
  WebglSpectrumBarsVfxRenderOptions as WebglSpectrumBarsRenderOptions,
  WebglSpectrumBarsVfxRenderer,
  WebglSpectrumBarsVfxRenderer as WebglSpectrumBarsRenderer,
  WebglSpectrumBarsVfxRendererOptions,
  WebglSpectrumBarsVfxRendererOptions as WebglSpectrumBarsRendererOptions,
} from "./renderers/webgl2SpectrumBarsVfx";
export { createWebglRadialSpikesRenderer } from "./renderers/webgl2RadialSpikes";
export type {
  WebglRadialSpikesRenderOptions,
  WebglRadialSpikesRenderer,
  WebglRadialSpikesRendererOptions,
} from "./renderers/webgl2RadialSpikes";
export { createWebglTunnelWavesRenderer } from "./renderers/webgl2TunnelWaves";
export type {
  WebglTunnelWavesRenderOptions,
  WebglTunnelWavesRenderer,
  WebglTunnelWavesRendererOptions,
} from "./renderers/webgl2TunnelWaves";
export { createWebglVortexRingsRenderer } from "./renderers/webgl2VortexRings";
export type {
  WebglVortexRingsRenderOptions,
  WebglVortexRingsRenderer,
  WebglVortexRingsRendererOptions,
} from "./renderers/webgl2VortexRings";
export {
  WEBGL2_MAX_DRAWING_BUFFER_DIMENSION,
  WEBGL2_MAX_DRAWING_BUFFER_PIXELS,
  resolveWebglDrawingBufferSize,
} from "./renderers/webgl2Sizing";
export type { WebglDrawingBufferSize } from "./renderers/webgl2Sizing";
export { Waveform } from "./react/Waveform";
export type { WaveformProps } from "./react/Waveform";
export { Envelope } from "./react/Envelope";
export type { EnvelopeProps } from "./react/Envelope";
export { Spectrum } from "./react/Spectrum";
export type { SpectrumProps } from "./react/Spectrum";
export { Meter } from "./react/Meter";
export type { MeterProps } from "./react/Meter";
export { PulseRing } from "./react/PulseRing";
export type { PulseRingProps } from "./react/PulseRing";
export { NeonLines } from "./react/NeonLines";
export type { NeonLinesProps } from "./react/NeonLines";
export { EqualizerGrid } from "./react/EqualizerGrid";
export type { EqualizerGridProps } from "./react/EqualizerGrid";
export { WaveformRibbon } from "./react/WaveformRibbon";
export type { WaveformRibbonProps } from "./react/WaveformRibbon";
export { RoundedWobbleBars } from "./react/RoundedWobbleBars";
export type { RoundedWobbleBarsProps } from "./react/RoundedWobbleBars";
export { SpectrumBarsVfx, SpectrumBarsVfx as SpectrumBars } from "./react/SpectrumBarsVfx";
export type {
  SpectrumBarsVfxProps,
  SpectrumBarsVfxProps as SpectrumBarsProps,
} from "./react/SpectrumBarsVfx";
export { RadialSpikes } from "./react/RadialSpikes";
export type { RadialSpikesProps } from "./react/RadialSpikes";
export { TunnelWaves } from "./react/TunnelWaves";
export type { TunnelWavesProps } from "./react/TunnelWaves";
export { VortexRings } from "./react/VortexRings";
export type { VortexRingsProps } from "./react/VortexRings";
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
export {
  DEFAULT_PULSE_RING_CONFIG,
  PULSE_RING_CONTROL_DEFINITIONS,
  createPulseRingUniformState,
  parsePulseRingColor,
  resolvePulseRingConfig,
  resolvePulseRingTime,
} from "./vfx/pulseRing";
export {
  DEFAULT_NEON_LINES_CONFIG,
  MAX_NEON_LINE_COUNT,
  MIN_NEON_LINE_COUNT,
  NEON_LINES_CONTROL_DEFINITIONS,
  NEON_LINES_PRESETS,
  createNeonLinesUniformState,
  getNeonLinesPreset,
  resolveNeonLinesConfig,
} from "./vfx/neonLines";
export type {
  NeonLinesConfig,
  NeonLinesConfigInput,
  NeonLinesControlDefinition,
  NeonLinesPresetId,
  NeonLinesUniformState,
} from "./vfx/neonLines";
export {
  DEFAULT_EQUALIZER_GRID_CONFIG,
  EQUALIZER_GRID_CONTROL_DEFINITIONS,
  EQUALIZER_GRID_PRESETS,
  MAX_EQUALIZER_GRID_COLUMNS,
  MAX_EQUALIZER_GRID_ROWS,
  MIN_EQUALIZER_GRID_COLUMNS,
  MIN_EQUALIZER_GRID_ROWS,
  createEqualizerGridUniformState,
  getEqualizerGridPreset,
  resolveEqualizerGridConfig,
} from "./vfx/equalizerGrid";
export type {
  EqualizerGridConfig,
  EqualizerGridConfigInput,
  EqualizerGridControlDefinition,
  EqualizerGridPresetId,
  EqualizerGridUniformState,
} from "./vfx/equalizerGrid";
export {
  DEFAULT_WAVEFORM_RIBBON_CONFIG,
  WAVEFORM_RIBBON_CONTROL_DEFINITIONS,
  WAVEFORM_RIBBON_PRESETS,
  createWaveformRibbonUniformState,
  getWaveformRibbonPreset,
  resolveWaveformRibbonConfig,
} from "./vfx/waveformRibbon";
export type {
  WaveformRibbonConfig,
  WaveformRibbonConfigInput,
  WaveformRibbonControlDefinition,
  WaveformRibbonPresetId,
  WaveformRibbonUniformState,
} from "./vfx/waveformRibbon";
export {
  DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG,
  MAX_WOBBLE_BAR_COUNT,
  MIN_WOBBLE_BAR_COUNT,
  ROUNDED_WOBBLE_BARS_CONTROL_DEFINITIONS,
  ROUNDED_WOBBLE_BARS_PRESETS,
  createRoundedWobbleBarsUniformState,
  getRoundedWobbleBarsPreset,
  resolveRoundedWobbleBarsConfig,
} from "./vfx/roundedWobbleBars";
export type {
  RoundedWobbleBarsConfig,
  RoundedWobbleBarsConfigInput,
  RoundedWobbleBarsControlDefinition,
  RoundedWobbleBarsPresetId,
  RoundedWobbleBarsUniformState,
} from "./vfx/roundedWobbleBars";
export {
  DEFAULT_SPECTRUM_BARS_VFX_CONFIG,
  DEFAULT_SPECTRUM_BARS_VFX_CONFIG as DEFAULT_SPECTRUM_BARS_CONFIG,
  MAX_SPECTRUM_VFX_BAR_COUNT,
  MIN_SPECTRUM_VFX_BAR_COUNT,
  SPECTRUM_BARS_VFX_CONTROL_DEFINITIONS,
  SPECTRUM_BARS_VFX_CONTROL_DEFINITIONS as SPECTRUM_BARS_CONTROL_DEFINITIONS,
  SPECTRUM_BARS_VFX_PRESETS,
  SPECTRUM_BARS_VFX_PRESETS as SPECTRUM_BARS_PRESETS,
  createSpectrumBarsVfxUniformState,
  createSpectrumBarsVfxUniformState as createSpectrumBarsUniformState,
  getSpectrumBarsVfxPreset,
  resolveSpectrumBarsVfxConfig,
  resolveSpectrumBarsVfxConfig as resolveSpectrumBarsConfig,
} from "./vfx/spectrumBarsVfx";
export type {
  SpectrumBarsVfxConfig,
  SpectrumBarsVfxConfig as SpectrumBarsConfig,
  SpectrumBarsVfxConfigInput,
  SpectrumBarsVfxConfigInput as SpectrumBarsConfigInput,
  SpectrumBarsVfxControlDefinition,
  SpectrumBarsVfxControlDefinition as SpectrumBarsControlDefinition,
  SpectrumBarsVfxPresetId,
  SpectrumBarsVfxPresetId as SpectrumBarsPresetId,
  SpectrumBarsVfxUniformState,
  SpectrumBarsVfxUniformState as SpectrumBarsUniformState,
} from "./vfx/spectrumBarsVfx";
export {
  DEFAULT_RADIAL_SPIKES_CONFIG,
  MAX_RADIAL_SPIKE_COUNT,
  MAX_RADIAL_SPIKE_REACH,
  MIN_RADIAL_SPIKE_COUNT,
  RADIAL_SPIKES_CONTROL_DEFINITIONS,
  RADIAL_SPIKES_PRESETS,
  createRadialSpikesUniformState,
  getRadialSpikesPreset,
  resolveRadialSpikesConfig,
} from "./vfx/radialSpikes";
export type {
  RadialSpikesConfig,
  RadialSpikesConfigInput,
  RadialSpikesControlDefinition,
  RadialSpikesPresetId,
  RadialSpikesUniformState,
} from "./vfx/radialSpikes";
export {
  DEFAULT_TUNNEL_WAVES_CONFIG,
  MAX_TUNNEL_RING_DENSITY,
  MIN_TUNNEL_RING_DENSITY,
  TUNNEL_WAVES_CONTROL_DEFINITIONS,
  TUNNEL_WAVES_PRESETS,
  createTunnelWavesUniformState,
  getTunnelWavesPreset,
  resolveTunnelWavesConfig,
} from "./vfx/tunnelWaves";
export type {
  TunnelWavesConfig,
  TunnelWavesConfigInput,
  TunnelWavesControlDefinition,
  TunnelWavesPresetId,
  TunnelWavesUniformState,
} from "./vfx/tunnelWaves";
export {
  DEFAULT_VORTEX_RINGS_CONFIG,
  MAX_VORTEX_RING_DENSITY,
  MIN_VORTEX_RING_DENSITY,
  VORTEX_RINGS_CONTROL_DEFINITIONS,
  VORTEX_RINGS_PRESETS,
  createVortexRingsUniformState,
  getVortexRingsPreset,
  resolveVortexRingsConfig,
} from "./vfx/vortexRings";
export type {
  VortexRingsConfig,
  VortexRingsConfigInput,
  VortexRingsControlDefinition,
  VortexRingsPresetId,
  VortexRingsUniformState,
} from "./vfx/vortexRings";
export type {
  VfxBooleanControlDefinition,
  VfxColorControlDefinition,
  VfxControlDefinition,
  VfxEffectId,
  VfxMotion,
  VfxNumericControlDefinition,
  VfxPreset,
  VfxQuality,
  VfxSelectControlDefinition,
  VfxSurfaceConfig,
} from "./vfx/schema";
export type {
  PulseRingConfig,
  PulseRingConfigInput,
  PulseRingControlDefinition,
  PulseRingMotion,
  PulseRingQuality,
  PulseRingUniformState,
} from "./vfx/pulseRing";
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
  BuiltinRendererId,
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
