import {
  IconCheck,
  IconCode,
  IconCopy,
  IconFocus2,
  IconLayoutGrid,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  DEFAULT_SPECTRUM_ANALYSIS_CONFIG,
  DEFAULT_SPECTRUM_CONFIG,
  DEFAULT_SPECTRUM_DYNAMICS_CONFIG,
  DEFAULT_METER_CONFIG,
  DEFAULT_METER_DYNAMICS_CONFIG,
  DEFAULT_ENVELOPE_CONFIG,
  DEFAULT_EQUALIZER_GRID_CONFIG,
  DEFAULT_NEON_LINES_CONFIG,
  DEFAULT_PULSE_RING_CONFIG,
  DEFAULT_RADIAL_SPIKES_CONFIG,
  DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG,
  DEFAULT_SPECTRUM_BARS_VFX_CONFIG,
  DEFAULT_TUNNEL_WAVES_CONFIG,
  DEFAULT_VORTEX_RINGS_CONFIG,
  DEFAULT_WAVEFORM_RIBBON_CONFIG,
  DEFAULT_WAVEFORM_CONFIG,
  BUILTIN_RENDERER_CATALOG,
  Envelope,
  EQUALIZER_GRID_PRESETS,
  EqualizerGrid,
  GUARDED_SPECTRUM_FFT_SIZE,
  METER_PRESETS,
  Meter,
  NEON_LINES_PRESETS,
  NeonLines,
  PulseRing,
  RADIAL_SPIKES_PRESETS,
  RadialSpikes,
  ROUNDED_WOBBLE_BARS_PRESETS,
  RecordedWaveformPlayer,
  RoundedWobbleBars,
  SessionWaveform,
  SignalOverlay,
  Spectrum,
  SpectrumBars,
  SpectrumFrameDelay,
  SPECTRUM_BARS_VFX_PRESETS,
  SPECTRUM_CONTROL_DEFINITIONS,
  TUNNEL_WAVES_PRESETS,
  TunnelWaves,
  VORTEX_RINGS_PRESETS,
  VortexRings,
  Waveform,
  WaveformRibbon,
  WAVEFORM_RIBBON_PRESETS,
  analyzeMeter,
  analyzeMeterWindows,
  analyzeSpectrum,
  createDemoWaveform,
  createBandEnergyFrameFromSpectrum,
  createDemoWaveformSource,
  createEnvelopeFrameFromWaveform,
  createMicrophoneSource,
  createMeterDynamicsProcessor,
  createRecordedAudioSource,
  createSpectrumFrame,
  createSpectrumDynamicsProcessor,
  createWaveformSession,
  getSpectrumControlAvailability,
  getRendererSupport,
  normalizedToValue,
  resolveSpectrumAnalysisConfig,
  resolveMeterConfig,
  resolveMeterDynamicsConfig,
  resolveEqualizerGridConfig,
  resolveNeonLinesConfig,
  resolveRadialSpikesConfig,
  resolveRoundedWobbleBarsConfig,
  resolveSpectrumBarsVfxConfig,
  resolveSpectrumConfig,
  resolveSpectrumDynamicsConfig,
  resolveSpectrumFrequencyRange,
  resolveVisualSyncOffset,
  resolveTunnelWavesConfig,
  resolveVortexRingsConfig,
  resolveWaveformRibbonConfig,
  useWaveformSession,
  useMicrophoneSource,
  type SpectrumConfigInput,
  type MeterConfigInput,
  type WaveformConfigInput,
  type BuiltinRendererId,
  type BandEnergyFrame,
  type EnvelopeAmplitudePlacement,
  type EnvelopeFrame,
  type EqualizerGridConfig,
  type EqualizerGridPresetId,
  type RecordedAudioSource,
  type MicrophoneSource,
  type MeterColorMode,
  type MeterDynamicsConfig,
  type MeterDynamicsResult,
  type MeterMeasurement,
  type NeonLinesConfig,
  type NeonLinesPresetId,
  type PulseRingConfigInput,
  type PulseRingQuality,
  type RadialSpikesConfig,
  type RadialSpikesPresetId,
  type RoundedWobbleBarsConfig,
  type RoundedWobbleBarsPresetId,
  type SpectrumControlDefinition,
  type SpectrumControlId,
  type SpectrumDynamicsConfig,
  type SpectrumDynamicsResult,
  type SpectrumFrequencyScale,
  type SpectrumFrame,
  type SpectrumGeometry,
  type SpectrumColorMode,
  type SpectrumInputState,
  type SpectrumInterpolation,
  type SpectrumLayout,
  type SpectrumPulseMode,
  type SpectrumSmoothingMode,
  type SpectrumBarsVfxConfig,
  type SpectrumBarsVfxPresetId,
  type TunnelWavesConfig,
  type TunnelWavesPresetId,
  type VisualSyncCapability,
  type VfxMotion,
  type VfxQuality,
  type VfxRendererMode,
  type VortexRingsConfig,
  type VortexRingsPresetId,
  type WaveformSessionStatus,
  type WaveformRibbonConfig,
  type WaveformRibbonPresetId,
  type SpectrumWindow,
  type SignalOverlayHandle,
  type WaveformFrame,
  type WaveformAmplitudePlacement,
  type WaveformChannelLayout,
  type WaveformChannelMode,
  type WaveformOrientation,
} from "waveform-component";

const PRESETS = [
  { id: "broadcast", label: "Broadcast", phase: 0, color: "#62dcf5" },
  { id: "transient", label: "Transient", phase: 0.18, color: "#f8d65c" },
  { id: "nocturne", label: "Nocturne", phase: 0.37, color: "#a7f59c" },
  { id: "signal", label: "Signal red", phase: 0.64, color: "#ff7892" },
] as const;

type Preset = (typeof PRESETS)[number];
type VisualMode =
  | "envelope"
  | "meter"
  | "spectrum"
  | "stepped-meter"
  | VfxRendererMode
  | "waveform";
type VfxEnergyScenario = "overload" | "signal" | "zero";

export default function App() {
  const [view, setView] = useState<"overview" | "focus">("overview");
  const [visualMode, setVisualMode] = useState<VisualMode>("waveform");
  const [renderer, setRenderer] = useState<BuiltinRendererId>("canvas2d");
  const [presetId, setPresetId] = useState<Preset["id"]>("broadcast");
  const [signalColor, setSignalColor] = useState<string>(PRESETS[0].color);
  const [pulseRingThickness, setPulseRingThickness] = useState(DEFAULT_PULSE_RING_CONFIG.thickness);
  const [pulseRingGlow, setPulseRingGlow] = useState(DEFAULT_PULSE_RING_CONFIG.glowStrength);
  const [pulseRingRotation, setPulseRingRotation] = useState(
    DEFAULT_PULSE_RING_CONFIG.rotationSpeed,
  );
  const [pulseRingReactivity, setPulseRingReactivity] = useState(
    DEFAULT_PULSE_RING_CONFIG.bandReactivity,
  );
  const [pulseRingQuality, setPulseRingQuality] = useState<PulseRingQuality>(
    DEFAULT_PULSE_RING_CONFIG.quality,
  );
  const [pulseRingPrimary, setPulseRingPrimary] = useState(DEFAULT_PULSE_RING_CONFIG.primaryColor);
  const [pulseRingSecondary, setPulseRingSecondary] = useState(
    DEFAULT_PULSE_RING_CONFIG.secondaryColor,
  );
  const [pulseRingTertiary, setPulseRingTertiary] = useState(
    DEFAULT_PULSE_RING_CONFIG.tertiaryColor,
  );
  const [pulseRingSweep, setPulseRingSweep] = useState(DEFAULT_PULSE_RING_CONFIG.sweepColor);
  const [pulseRingBackground, setPulseRingBackground] = useState(
    DEFAULT_PULSE_RING_CONFIG.backgroundColor,
  );
  const [pulseRingMotion, setPulseRingMotion] = useState<VfxMotion>(
    DEFAULT_PULSE_RING_CONFIG.motion,
  );
  const [neonLinesPresetId, setNeonLinesPresetId] = useState<NeonLinesPresetId | "custom">(
    NEON_LINES_PRESETS[0].id as NeonLinesPresetId,
  );
  const [neonLinesConfig, setNeonLinesConfig] =
    useState<NeonLinesConfig>(DEFAULT_NEON_LINES_CONFIG);
  const [equalizerGridPresetId, setEqualizerGridPresetId] = useState<
    EqualizerGridPresetId | "custom"
  >(EQUALIZER_GRID_PRESETS[0].id as EqualizerGridPresetId);
  const [equalizerGridConfig, setEqualizerGridConfig] = useState<EqualizerGridConfig>(
    DEFAULT_EQUALIZER_GRID_CONFIG,
  );
  const [waveformRibbonPresetId, setWaveformRibbonPresetId] = useState<
    WaveformRibbonPresetId | "custom"
  >(WAVEFORM_RIBBON_PRESETS[0].id as WaveformRibbonPresetId);
  const [waveformRibbonConfig, setWaveformRibbonConfig] = useState<WaveformRibbonConfig>(
    DEFAULT_WAVEFORM_RIBBON_CONFIG,
  );
  const [roundedWobbleBarsPresetId, setRoundedWobbleBarsPresetId] = useState<
    RoundedWobbleBarsPresetId | "custom"
  >(ROUNDED_WOBBLE_BARS_PRESETS[0].id as RoundedWobbleBarsPresetId);
  const [roundedWobbleBarsConfig, setRoundedWobbleBarsConfig] = useState<RoundedWobbleBarsConfig>(
    DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG,
  );
  const [spectrumBarsVfxPresetId, setSpectrumBarsVfxPresetId] = useState<
    SpectrumBarsVfxPresetId | "custom"
  >(SPECTRUM_BARS_VFX_PRESETS[0].id as SpectrumBarsVfxPresetId);
  const [spectrumBarsVfxConfig, setSpectrumBarsVfxConfig] = useState<SpectrumBarsVfxConfig>(
    DEFAULT_SPECTRUM_BARS_VFX_CONFIG,
  );
  const [radialSpikesPresetId, setRadialSpikesPresetId] = useState<RadialSpikesPresetId | "custom">(
    RADIAL_SPIKES_PRESETS[0].id as RadialSpikesPresetId,
  );
  const [radialSpikesConfig, setRadialSpikesConfig] = useState<RadialSpikesConfig>(
    DEFAULT_RADIAL_SPIKES_CONFIG,
  );
  const [tunnelWavesPresetId, setTunnelWavesPresetId] = useState<TunnelWavesPresetId | "custom">(
    TUNNEL_WAVES_PRESETS[0].id as TunnelWavesPresetId,
  );
  const [tunnelWavesConfig, setTunnelWavesConfig] = useState<TunnelWavesConfig>(
    DEFAULT_TUNNEL_WAVES_CONFIG,
  );
  const [vortexRingsPresetId, setVortexRingsPresetId] = useState<VortexRingsPresetId | "custom">(
    VORTEX_RINGS_PRESETS[0].id as VortexRingsPresetId,
  );
  const [vortexRingsConfig, setVortexRingsConfig] = useState<VortexRingsConfig>(
    DEFAULT_VORTEX_RINGS_CONFIG,
  );
  const [vfxEnergyScenario, setVfxEnergyScenario] = useState<VfxEnergyScenario>("signal");
  const [vfxBandScale, setVfxBandScale] = useState<SpectrumFrequencyScale>("log");
  const [sampleCount, setSampleCount] = useState(2048);
  const [amplitude, setAmplitude] = useState(DEFAULT_WAVEFORM_CONFIG.amplitude);
  const [lineWidth, setLineWidth] = useState(DEFAULT_WAVEFORM_CONFIG.lineWidth);
  const [showCenterLine, setShowCenterLine] = useState(true);
  const [channelMode, setChannelMode] = useState<WaveformChannelMode>("source");
  const [channelIndex, setChannelIndex] = useState(0);
  const [channelLayout, setChannelLayout] = useState<WaveformChannelLayout>("stacked");
  const [channelGap, setChannelGap] = useState(DEFAULT_WAVEFORM_CONFIG.channelGap);
  const [orientation, setOrientation] = useState<WaveformOrientation>("horizontal");
  const [waveformPlacement, setWaveformPlacement] =
    useState<WaveformAmplitudePlacement>("centered");
  const [envelopePlacement, setEnvelopePlacement] =
    useState<EnvelopeAmplitudePlacement>("baseline");
  const [timeDomainSizing, setTimeDomainSizing] = useState<"fixed" | "responsive">("responsive");
  const [fixedTimeDomainWidth, setFixedTimeDomainWidth] = useState(640);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [recordedSource, setRecordedSource] = useState<RecordedAudioSource | null>(null);
  const [microphoneSource, setMicrophoneSource] = useState<MicrophoneSource | null>(null);
  const [allowLargeFft, setAllowLargeFft] = useState(false);
  const [fftSize, setFftSize] = useState(DEFAULT_SPECTRUM_ANALYSIS_CONFIG.fftSize);
  const [spectrumWindow, setSpectrumWindow] = useState<SpectrumWindow>(
    DEFAULT_SPECTRUM_ANALYSIS_CONFIG.window,
  );
  const [powerOfSineExponent, setPowerOfSineExponent] = useState(
    DEFAULT_SPECTRUM_ANALYSIS_CONFIG.powerOfSineExponent,
  );
  const [lowFrequency, setLowFrequency] = useState(DEFAULT_SPECTRUM_CONFIG.lowFrequency);
  const [highFrequency, setHighFrequency] = useState(DEFAULT_SPECTRUM_CONFIG.highFrequency);
  const [minimumDecibels, setMinimumDecibels] = useState(DEFAULT_SPECTRUM_CONFIG.minimumDecibels);
  const [maximumDecibels, setMaximumDecibels] = useState(DEFAULT_SPECTRUM_CONFIG.maximumDecibels);
  const [frequencyScale, setFrequencyScale] = useState<SpectrumFrequencyScale>(
    DEFAULT_SPECTRUM_CONFIG.frequencyScale,
  );
  const [spectrumInterpolation, setSpectrumInterpolation] = useState<SpectrumInterpolation>(
    DEFAULT_SPECTRUM_CONFIG.interpolation,
  );
  const [spectrumGeometry, setSpectrumGeometry] = useState<SpectrumGeometry>(
    DEFAULT_SPECTRUM_CONFIG.geometry,
  );
  const [spectrumLayout, setSpectrumLayout] = useState<SpectrumLayout>(
    DEFAULT_SPECTRUM_CONFIG.layout,
  );
  const [radialInvert, setRadialInvert] = useState(DEFAULT_SPECTRUM_CONFIG.radialInvert);
  const [radialDeadzone, setRadialDeadzone] = useState(DEFAULT_SPECTRUM_CONFIG.radialDeadzone);
  const [radialArc, setRadialArc] = useState(DEFAULT_SPECTRUM_CONFIG.radialArc);
  const [radialRotation, setRadialRotation] = useState(DEFAULT_SPECTRUM_CONFIG.radialRotation);
  const [roundedCaps, setRoundedCaps] = useState(DEFAULT_SPECTRUM_CONFIG.roundedCaps);
  const [cornerRadius, setCornerRadius] = useState(DEFAULT_SPECTRUM_CONFIG.cornerRadius);
  const [barWidth, setBarWidth] = useState(DEFAULT_SPECTRUM_CONFIG.barWidth);
  const [barGap, setBarGap] = useState(DEFAULT_SPECTRUM_CONFIG.barGap);
  const [spectrumColorMode, setSpectrumColorMode] = useState<SpectrumColorMode>(
    DEFAULT_SPECTRUM_CONFIG.colorMode,
  );
  const [spectrumPulseMode, setSpectrumPulseMode] = useState<SpectrumPulseMode>(
    DEFAULT_SPECTRUM_CONFIG.pulseMode,
  );
  const [baseAlpha, setBaseAlpha] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.base.alpha);
  const [middleColor, setMiddleColor] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.middle.color);
  const [middleAlpha, setMiddleAlpha] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.middle.alpha);
  const [crestColor, setCrestColor] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.crest.color);
  const [crestAlpha, setCrestAlpha] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.crest.alpha);
  const [accentColor, setAccentColor] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.accent.color);
  const [accentAlpha, setAccentAlpha] = useState(DEFAULT_SPECTRUM_CONFIG.colorRoles.accent.alpha);
  const [gradientRatio, setGradientRatio] = useState(DEFAULT_SPECTRUM_CONFIG.gradientRatio);
  const [middleDecibels, setMiddleDecibels] = useState(DEFAULT_SPECTRUM_CONFIG.middleDecibels);
  const [crestDecibels, setCrestDecibels] = useState(DEFAULT_SPECTRUM_CONFIG.crestDecibels);
  const [showSpectrumGrid, setShowSpectrumGrid] = useState(DEFAULT_SPECTRUM_CONFIG.showGrid);
  const [dynamicsSettings, setDynamicsSettings] = useState<SpectrumDynamicsConfig>(
    DEFAULT_SPECTRUM_DYNAMICS_CONFIG,
  );
  const [visualSyncOffsetMs, setVisualSyncOffsetMs] = useState(0);
  const [meterMeasurement, setMeterMeasurement] = useState<MeterMeasurement>(
    DEFAULT_METER_CONFIG.measurement,
  );
  const [meterPresetId, setMeterPresetId] = useState<(typeof METER_PRESETS)[number]["id"]>(
    METER_PRESETS[0].id,
  );
  const [meterDynamicsSettings, setMeterDynamicsSettings] = useState<MeterDynamicsConfig>(
    DEFAULT_METER_DYNAMICS_CONFIG,
  );
  const [meterLayout, setMeterLayout] = useState<SpectrumLayout>(DEFAULT_METER_CONFIG.layout);
  const [meterColorMode, setMeterColorMode] = useState<MeterColorMode>(
    DEFAULT_METER_CONFIG.colorMode,
  );
  const [meterMinimumDecibels, setMeterMinimumDecibels] = useState(
    DEFAULT_METER_CONFIG.minimumDecibels,
  );
  const [meterMaximumDecibels, setMeterMaximumDecibels] = useState(
    DEFAULT_METER_CONFIG.maximumDecibels,
  );
  const [meterBarWidth, setMeterBarWidth] = useState(DEFAULT_METER_CONFIG.barWidth);
  const [meterChannelGap, setMeterChannelGap] = useState(DEFAULT_METER_CONFIG.channelGap);
  const [meterMinimumSize, setMeterMinimumSize] = useState(DEFAULT_METER_CONFIG.minimumSize);
  const [meterStepWidth, setMeterStepWidth] = useState(DEFAULT_METER_CONFIG.stepWidth);
  const [meterStepGap, setMeterStepGap] = useState(DEFAULT_METER_CONFIG.stepGap);
  const [showMeterHistory, setShowMeterHistory] = useState(DEFAULT_METER_CONFIG.showHistory);
  const [meterHistoryOpacity, setMeterHistoryOpacity] = useState(
    DEFAULT_METER_CONFIG.historyOpacity,
  );
  const [showOverlays, setShowOverlays] = useState(true);
  const [overlayDirection, setOverlayDirection] = useState<"ltr" | "rtl">("ltr");
  const [playheadPosition, setPlayheadPosition] = useState(0.32);
  const [selectionRange, setSelectionRange] = useState({
    end: 0.42,
    start: 0.18,
  });
  const [loopRange, setLoopRange] = useState({ end: 0.76, start: 0.56 });
  const [activeRegion, setActiveRegion] = useState("selection");
  const [overlayInspection, setOverlayInspection] = useState<number | null>(null);
  const [overlayEvent, setOverlayEvent] = useState("No interaction yet");
  const session = useMemo(() => createWaveformSession<WaveformFrame>(), []);
  const preset = PRESETS.find((candidate) => candidate.id === presetId) ?? PRESETS[0];
  const isMeterMode = visualMode === "meter" || visualMode === "stepped-meter";
  const isPulseRingMode = visualMode === "pulse-ring";
  const isNeonLinesMode = visualMode === "neon-lines";
  const isEqualizerGridMode = visualMode === "equalizer-grid";
  const isWaveformRibbonMode = visualMode === "waveform-ribbon";
  const isRoundedWobbleBarsMode = visualMode === "rounded-wobble-bars";
  const isSpectrumBarsVfxMode = visualMode === "spectrum-bars";
  const isRadialSpikesMode = visualMode === "radial-spikes";
  const isTunnelWavesMode = visualMode === "tunnel-waves";
  const isVortexRingsMode = visualMode === "vortex-rings";
  const isVfxMode =
    isPulseRingMode ||
    isNeonLinesMode ||
    isEqualizerGridMode ||
    isWaveformRibbonMode ||
    isRoundedWobbleBarsMode ||
    isSpectrumBarsVfxMode ||
    isRadialSpikesMode ||
    isTunnelWavesMode ||
    isVortexRingsMode;
  const coreRenderer = renderer === "webgl2" ? "canvas2d" : renderer;
  const sessionSnapshot = useWaveformSession(session);
  const demoSource = useMemo(
    () =>
      createDemoWaveformSource({
        channelCount: 2,
        id: `${preset.id}-${sampleCount}`,
        phase: preset.phase,
        sampleCount,
      }),
    [preset.id, preset.phase, sampleCount],
  );
  const activeSource = microphoneSource ?? recordedSource ?? demoSource;
  const timeDomainConfig = useMemo<WaveformConfigInput>(
    () => ({
      amplitude,
      amplitudePlacement: visualMode === "envelope" ? envelopePlacement : waveformPlacement,
      channelColors: [signalColor, "#f8d65c"],
      channelGap,
      channelLayout,
      ...(channelMode === "single" ? { channelIndex } : {}),
      channelMode,
      color: signalColor,
      lineWidth,
      mode: visualMode === "envelope" ? "envelope" : "waveform",
      orientation,
      renderer: coreRenderer,
      showCenterLine,
    }),
    [
      amplitude,
      channelGap,
      channelIndex,
      channelLayout,
      channelMode,
      envelopePlacement,
      lineWidth,
      orientation,
      coreRenderer,
      showCenterLine,
      signalColor,
      visualMode,
      waveformPlacement,
    ],
  );
  const envelopeFrame = useMemo<EnvelopeFrame>(
    () =>
      sessionSnapshot.frame
        ? createEnvelopeFrameFromWaveform(sessionSnapshot.frame)
        : ({
            channels: Object.freeze([new Float32Array()]),
            kind: "envelope",
            sampleCount: 0,
            state: "empty",
          } as const),
    [sessionSnapshot.frame],
  );
  const sourceChannelCount = sessionSnapshot.frame?.channels.length ?? 2;
  const selectedChannelCount =
    channelMode === "mono" || channelMode === "single"
      ? 1
      : channelMode === "stereo"
        ? Math.min(2, sourceChannelCount)
        : sourceChannelCount;
  const spectrumAnalysis = useMemo(
    () =>
      resolveSpectrumAnalysisConfig({
        allowLargeFft,
        fftSize,
        maximumDecibels,
        minimumDecibels,
        powerOfSineExponent,
        window: spectrumWindow,
      }),
    [allowLargeFft, fftSize, maximumDecibels, minimumDecibels, powerOfSineExponent, spectrumWindow],
  );
  const sampleRate = sessionSnapshot.frame?.sampleRate ?? 48_000;
  const nyquist = sampleRate / 2;
  const spectrumFrame = useMemo(
    () =>
      analyzeSpectrum(
        (visualMode === "spectrum" || isVfxMode) && !recordedSource
          ? (sessionSnapshot.frame?.channels[0] ?? [])
          : [],
        {
          ...spectrumAnalysis,
          sampleRate,
        },
      ),
    [isVfxMode, recordedSource, sampleRate, sessionSnapshot.frame, spectrumAnalysis, visualMode],
  );
  const dynamicsConfig = useMemo(
    () =>
      resolveSpectrumDynamicsConfig(
        {
          ...dynamicsSettings,
          highFrequency,
          lowFrequency,
        },
        spectrumFrame,
      ),
    [dynamicsSettings, highFrequency, lowFrequency, spectrumFrame],
  );
  const spectrumInputState = spectrumDynamicsInputState(sessionSnapshot.status);
  const visualSyncCapability = useMemo<VisualSyncCapability>(
    () => ({
      canLookAhead: false,
      sourceKind: microphoneSource ? "Live microphone" : "Static demo",
    }),
    [microphoneSource],
  );
  const visualSyncResolution = resolveVisualSyncOffset(visualSyncOffsetMs, visualSyncCapability);
  const spectrumPresentation = useSpectrumPresentation({
    capability: visualSyncCapability,
    config: dynamicsConfig,
    frame: spectrumFrame,
    inputState: spectrumInputState,
    offsetMs: microphoneSource ? visualSyncOffsetMs : 0,
    sourceEpoch: sessionSnapshot.epoch,
  });
  const vfxFrame = useMemo(
    () =>
      vfxScenarioFrame(
        createBandEnergyFrameFromSpectrum(spectrumPresentation.frame, {
          bandCount: 8,
          frequencyScale: vfxBandScale,
        }),
        vfxEnergyScenario,
      ),
    [spectrumPresentation.frame, vfxBandScale, vfxEnergyScenario],
  );
  const pulseRingConfig = useMemo<PulseRingConfigInput>(
    () => ({
      backgroundColor: pulseRingBackground,
      bandReactivity: pulseRingReactivity,
      glowStrength: pulseRingGlow,
      motion: pulseRingMotion,
      primaryColor: pulseRingPrimary,
      quality: pulseRingQuality,
      rotationSpeed: pulseRingRotation,
      secondaryColor: pulseRingSecondary,
      sweepColor: pulseRingSweep,
      tertiaryColor: pulseRingTertiary,
      thickness: pulseRingThickness,
    }),
    [
      pulseRingGlow,
      pulseRingBackground,
      pulseRingMotion,
      pulseRingPrimary,
      pulseRingQuality,
      pulseRingReactivity,
      pulseRingRotation,
      pulseRingSecondary,
      pulseRingSweep,
      pulseRingTertiary,
      pulseRingThickness,
    ],
  );
  const activeVfxQuality: VfxQuality = isPulseRingMode
    ? pulseRingQuality
    : isNeonLinesMode
      ? neonLinesConfig.quality
      : isEqualizerGridMode
        ? equalizerGridConfig.quality
        : isWaveformRibbonMode
          ? waveformRibbonConfig.quality
          : isRoundedWobbleBarsMode
            ? roundedWobbleBarsConfig.quality
            : isSpectrumBarsVfxMode
              ? spectrumBarsVfxConfig.quality
              : isRadialSpikesMode
                ? radialSpikesConfig.quality
                : isTunnelWavesMode
                  ? tunnelWavesConfig.quality
                  : vortexRingsConfig.quality;
  const activeVfxMotion: VfxMotion = isPulseRingMode
    ? pulseRingMotion
    : isNeonLinesMode
      ? neonLinesConfig.motion
      : isEqualizerGridMode
        ? equalizerGridConfig.motion
        : isWaveformRibbonMode
          ? waveformRibbonConfig.motion
          : isRoundedWobbleBarsMode
            ? roundedWobbleBarsConfig.motion
            : isSpectrumBarsVfxMode
              ? spectrumBarsVfxConfig.motion
              : isRadialSpikesMode
                ? radialSpikesConfig.motion
                : isTunnelWavesMode
                  ? tunnelWavesConfig.motion
                  : vortexRingsConfig.motion;
  const spectrumConfig = useMemo<SpectrumConfigInput>(
    () => ({
      barGap,
      barWidth,
      color: signalColor,
      colorMode: spectrumColorMode,
      colorRoles: {
        accent: {
          alpha: accentAlpha,
          color: `var(--waveform-color-accent, ${accentColor})`,
        },
        base: {
          alpha: baseAlpha,
          color: `var(--waveform-color-base, ${signalColor})`,
        },
        crest: {
          alpha: crestAlpha,
          color: `var(--waveform-color-crest, ${crestColor})`,
        },
        middle: {
          alpha: middleAlpha,
          color: `var(--waveform-color-middle, ${middleColor})`,
        },
      },
      cornerRadius,
      crestDecibels,
      frequencyScale,
      geometry: spectrumGeometry,
      gradientRatio,
      highFrequency,
      interpolation: spectrumInterpolation,
      layout: spectrumLayout,
      lineWidth,
      lowFrequency,
      maximumDecibels,
      middleDecibels,
      minimumDecibels,
      pulseMode: spectrumPulseMode,
      radialArc,
      radialDeadzone,
      radialInvert,
      radialRotation,
      renderer: coreRenderer,
      roundedCaps,
      showGrid: showSpectrumGrid,
    }),
    [
      accentAlpha,
      accentColor,
      barGap,
      barWidth,
      baseAlpha,
      cornerRadius,
      crestAlpha,
      crestColor,
      crestDecibels,
      frequencyScale,
      gradientRatio,
      highFrequency,
      lineWidth,
      lowFrequency,
      maximumDecibels,
      middleAlpha,
      middleColor,
      middleDecibels,
      minimumDecibels,
      radialArc,
      radialDeadzone,
      radialInvert,
      radialRotation,
      coreRenderer,
      roundedCaps,
      signalColor,
      showSpectrumGrid,
      spectrumColorMode,
      spectrumGeometry,
      spectrumInterpolation,
      spectrumLayout,
      spectrumPulseMode,
    ],
  );
  const resolvedSpectrumConfig = useMemo(
    () => resolveSpectrumConfig(spectrumConfig, spectrumFrame),
    [spectrumConfig, spectrumFrame],
  );
  const spectrumFrequencyRange = useMemo(
    () => resolveSpectrumFrequencyRange(spectrumFrame, resolvedSpectrumConfig),
    [resolvedSpectrumConfig, spectrumFrame],
  );
  const meterFrame = useMemo(
    () =>
      analyzeMeter(sessionSnapshot.frame ?? new Float32Array(), {
        ...(channelMode === "single" ? { channelIndex } : {}),
        channelMode,
        minimumDecibels: meterMinimumDecibels,
        sampleRate,
      }),
    [channelIndex, channelMode, meterMinimumDecibels, sampleRate, sessionSnapshot.frame],
  );
  const resolvedMeterDynamics = useMemo(
    () => resolveMeterDynamicsConfig(meterDynamicsSettings, meterFrame),
    [meterDynamicsSettings, meterFrame],
  );
  const meterPresentation = useMemo<MeterDynamicsResult>(() => {
    const processor = createMeterDynamicsProcessor();
    const frames = analyzeMeterWindows(sessionSnapshot.frame ?? new Float32Array(), {
      ...(channelMode === "single" ? { channelIndex } : {}),
      channelMode,
      minimumDecibels: meterMinimumDecibels,
      sampleRate,
      windowSize: 256,
    });
    if (frames.length === 0)
      return processor.process(meterFrame, resolvedMeterDynamics, {
        sourceEpoch: sessionSnapshot.epoch,
        timestampMs: 0,
      });
    let result = processor.process(frames[0], resolvedMeterDynamics, {
      sourceEpoch: sessionSnapshot.epoch,
      timestampMs: 0,
    });
    for (let index = 1; index < frames.length; index += 1)
      result = processor.process(frames[index], resolvedMeterDynamics, {
        sourceEpoch: sessionSnapshot.epoch,
        timestampMs: (index * 256 * 1000) / sampleRate,
      });
    return result;
  }, [
    channelIndex,
    channelMode,
    meterFrame,
    meterMinimumDecibels,
    resolvedMeterDynamics,
    sampleRate,
    sessionSnapshot.epoch,
    sessionSnapshot.frame,
  ]);
  const meterConfig = useMemo<MeterConfigInput>(
    () => ({
      barWidth: meterBarWidth,
      channelGap: meterChannelGap,
      colorMode: meterColorMode,
      colorRoles: {
        accent: {
          alpha: accentAlpha,
          color: `var(--waveform-color-accent, ${accentColor})`,
        },
        base: {
          alpha: baseAlpha,
          color: `var(--waveform-color-base, ${signalColor})`,
        },
        crest: {
          alpha: crestAlpha,
          color: `var(--waveform-color-crest, ${crestColor})`,
        },
        middle: {
          alpha: middleAlpha,
          color: `var(--waveform-color-middle, ${middleColor})`,
        },
      },
      cornerRadius,
      crestDecibels,
      historyOpacity: meterHistoryOpacity,
      layout: meterLayout,
      maximumDecibels: meterMaximumDecibels,
      measurement: meterMeasurement,
      middleDecibels,
      minimumDecibels: meterMinimumDecibels,
      minimumSize: meterMinimumSize,
      mode: visualMode === "stepped-meter" ? "stepped-meter" : "meter",
      orientation,
      peakThresholdDb: resolvedMeterDynamics.peakThresholdDb,
      radialArc,
      radialDeadzone,
      radialInvert,
      radialRotation,
      reactThresholdDb: resolvedMeterDynamics.reactThresholdDb,
      renderer: coreRenderer,
      roundedCaps,
      showHistory: showMeterHistory,
      stepGap: meterStepGap,
      stepWidth: meterStepWidth,
    }),
    [
      accentAlpha,
      accentColor,
      baseAlpha,
      cornerRadius,
      crestAlpha,
      crestColor,
      crestDecibels,
      meterBarWidth,
      meterChannelGap,
      meterColorMode,
      meterHistoryOpacity,
      meterLayout,
      meterMaximumDecibels,
      meterMeasurement,
      meterMinimumDecibels,
      meterMinimumSize,
      meterStepGap,
      meterStepWidth,
      middleAlpha,
      middleColor,
      middleDecibels,
      orientation,
      radialArc,
      radialDeadzone,
      radialInvert,
      radialRotation,
      resolvedMeterDynamics.peakThresholdDb,
      resolvedMeterDynamics.reactThresholdDb,
      coreRenderer,
      roundedCaps,
      showMeterHistory,
      signalColor,
      visualMode,
    ],
  );
  const resolvedMeterConfig = useMemo(
    () => resolveMeterConfig(meterConfig, meterPresentation.frame),
    [meterConfig, meterPresentation.frame],
  );
  const rendererCapabilities = BUILTIN_RENDERER_CATALOG[renderer];
  const rendererSupport = getRendererSupport(renderer, {
    channelCount: isVfxMode ? 0 : selectedChannelCount,
    colorMode:
      visualMode === "spectrum" ? spectrumColorMode : isMeterMode ? meterColorMode : undefined,
    frameKind: isVfxMode
      ? "bands"
      : isMeterMode
        ? "meter"
        : visualMode === "spectrum"
          ? "spectrum"
          : visualMode === "envelope"
            ? "envelope"
            : "waveform",
    historyCount: isMeterMode ? meterPresentation.history.length : 0,
    layout: isVfxMode
      ? isPulseRingMode
        ? "radial"
        : "rectangular"
      : visualMode === "spectrum"
        ? spectrumLayout
        : isMeterMode
          ? meterLayout
          : undefined,
    mode: visualMode,
    pointCount: isVfxMode
      ? vfxFrame.bands.length
      : visualMode === "spectrum"
        ? spectrumFrame.bins.length
        : visualMode === "waveform" || visualMode === "envelope"
          ? (sessionSnapshot.frame?.sampleCount ?? 0)
          : 0,
    spectrumGeometry: visualMode === "spectrum" ? spectrumGeometry : undefined,
  });
  const rendererStatusCopy = !rendererSupport.enabled
    ? rendererSupport.reasons.join(" ")
    : (rendererSupport.warnings[0] ?? rendererCapabilities.description);
  const isTimeOverlay = visualMode === "waveform" || visualMode === "envelope";
  const overlayOrientation = visualMode === "spectrum" ? "horizontal" : orientation;
  const radialOverlayUnavailable =
    isVfxMode ||
    (visualMode === "spectrum" && spectrumLayout === "radial") ||
    (isMeterMode && meterLayout === "radial");
  const overlayHandles = useMemo<readonly SignalOverlayHandle[]>(() => {
    const commit = (label: string, value: number, unit: string) =>
      setOverlayEvent(`${label} committed at ${formatOverlayValue(value, unit)}`);
    if (radialOverlayUnavailable) return [];
    if (visualMode === "spectrum")
      return [
        {
          axis: "primary",
          domainMaximum: nyquist,
          domainMinimum: 20,
          formatValue: formatFrequency,
          id: "low-cutoff",
          guide: false,
          kind: "low-cutoff",
          label: "Low cutoff handle",
          maximum: Math.max(30, Math.min(highFrequency - 10, nyquist)),
          minimum: 20,
          onChange: (value, meta) => {
            setLowFrequency(Math.min(value, highFrequency - 10));
            if (meta.commit) commit("Low cutoff", value, "Hz");
          },
          scale: "log",
          step: 10,
          value: Math.max(20, lowFrequency),
        },
        {
          axis: "primary",
          domainMaximum: nyquist,
          domainMinimum: 20,
          formatValue: formatFrequency,
          id: "high-cutoff",
          guide: false,
          kind: "high-cutoff",
          label: "High cutoff handle",
          maximum: nyquist,
          minimum: Math.max(20, lowFrequency + 10),
          onChange: (value, meta) => {
            setHighFrequency(Math.max(value, lowFrequency + 10));
            if (meta.commit) commit("High cutoff", value, "Hz");
          },
          scale: "log",
          step: 10,
          value: Math.min(highFrequency, nyquist),
        },
        {
          axis: "cross",
          domainMaximum: maximumDecibels,
          domainMinimum: minimumDecibels,
          formatValue: (value) => `${value.toFixed(0)} dBFS`,
          id: "middle-threshold",
          kind: "react-threshold",
          label: "Middle threshold handle",
          maximum: resolvedSpectrumConfig.crestDecibels,
          minimum: minimumDecibels,
          onChange: (value, meta) => {
            setMiddleDecibels(Math.min(value, crestDecibels));
            if (meta.commit) commit("Middle threshold", value, "dBFS");
          },
          step: 1,
          value: resolvedSpectrumConfig.middleDecibels,
        },
        {
          axis: "cross",
          domainMaximum: maximumDecibels,
          domainMinimum: minimumDecibels,
          formatValue: (value) => `${value.toFixed(0)} dBFS`,
          id: "crest-threshold",
          kind: "peak-threshold",
          label: "Crest threshold handle",
          maximum: maximumDecibels,
          minimum: resolvedSpectrumConfig.middleDecibels,
          onChange: (value, meta) => {
            setCrestDecibels(Math.max(value, middleDecibels));
            if (meta.commit) commit("Crest threshold", value, "dBFS");
          },
          step: 1,
          value: resolvedSpectrumConfig.crestDecibels,
        },
      ];
    if (isMeterMode)
      return [
        {
          axis: "primary",
          domainMaximum: meterMaximumDecibels,
          domainMinimum: meterMinimumDecibels,
          formatValue: (value) => `${value.toFixed(0)} dBFS`,
          id: "react-threshold",
          kind: "react-threshold",
          label: "React threshold handle",
          maximum: resolvedMeterDynamics.peakThresholdDb,
          minimum: meterMinimumDecibels,
          onChange: (value, meta) => {
            setMeterDynamicsSettings((current) =>
              resolveMeterDynamicsConfig({ ...current, reactThresholdDb: value }, meterFrame),
            );
            if (meta.commit) commit("React threshold", value, "dBFS");
          },
          reversed: orientation === "vertical",
          step: 1,
          value: resolvedMeterDynamics.reactThresholdDb,
        },
        {
          axis: "primary",
          domainMaximum: meterMaximumDecibels,
          domainMinimum: meterMinimumDecibels,
          formatValue: (value) => `${value.toFixed(0)} dBFS`,
          id: "peak-threshold",
          kind: "peak-threshold",
          label: "Peak threshold handle",
          maximum: meterMaximumDecibels,
          minimum: resolvedMeterDynamics.reactThresholdDb,
          onChange: (value, meta) => {
            setMeterDynamicsSettings((current) =>
              resolveMeterDynamicsConfig({ ...current, peakThresholdDb: value }, meterFrame),
            );
            if (meta.commit) commit("Peak threshold", value, "dBFS");
          },
          reversed: orientation === "vertical",
          step: 1,
          value: resolvedMeterDynamics.peakThresholdDb,
        },
      ];
    return [
      {
        domainMaximum: 1,
        domainMinimum: 0,
        id: "playhead",
        kind: "playhead",
        label: "Playhead handle",
        maximum: 1,
        minimum: 0,
        onChange: (value, meta) => {
          setPlayheadPosition(value);
          if (meta.commit) commit("Playhead", value, "percent");
        },
        step: 0.01,
        value: playheadPosition,
      },
      {
        domainMaximum: 1,
        domainMinimum: 0,
        id: "selection-start",
        kind: "selection-start",
        label: "Selection start handle",
        maximum: Math.max(0, selectionRange.end - 0.01),
        minimum: 0,
        onChange: (value, meta) => {
          setSelectionRange((current) => ({
            ...current,
            start: Math.min(value, current.end - 0.01),
          }));
          if (meta.commit) commit("Selection start", value, "percent");
        },
        step: 0.01,
        value: selectionRange.start,
      },
      {
        domainMaximum: 1,
        domainMinimum: 0,
        id: "selection-end",
        kind: "selection-end",
        label: "Selection end handle",
        maximum: 1,
        minimum: Math.min(1, selectionRange.start + 0.01),
        onChange: (value, meta) => {
          setSelectionRange((current) => ({
            ...current,
            end: Math.max(value, current.start + 0.01),
          }));
          if (meta.commit) commit("Selection end", value, "percent");
        },
        step: 0.01,
        value: selectionRange.end,
      },
      {
        domainMaximum: 1,
        domainMinimum: 0,
        id: "loop-start",
        kind: "loop-start",
        label: "Loop start handle",
        maximum: Math.max(0, loopRange.end - 0.01),
        minimum: 0,
        onChange: (value, meta) => {
          setLoopRange((current) => ({
            ...current,
            start: Math.min(value, current.end - 0.01),
          }));
          if (meta.commit) commit("Loop start", value, "percent");
        },
        step: 0.01,
        value: loopRange.start,
      },
      {
        domainMaximum: 1,
        domainMinimum: 0,
        id: "loop-end",
        kind: "loop-end",
        label: "Loop end handle",
        maximum: 1,
        minimum: Math.min(1, loopRange.start + 0.01),
        onChange: (value, meta) => {
          setLoopRange((current) => ({
            ...current,
            end: Math.max(value, current.start + 0.01),
          }));
          if (meta.commit) commit("Loop end", value, "percent");
        },
        step: 0.01,
        value: loopRange.end,
      },
    ];
  }, [
    crestDecibels,
    highFrequency,
    isMeterMode,
    loopRange.end,
    loopRange.start,
    lowFrequency,
    maximumDecibels,
    meterFrame,
    meterMaximumDecibels,
    meterMinimumDecibels,
    middleDecibels,
    minimumDecibels,
    nyquist,
    orientation,
    playheadPosition,
    radialOverlayUnavailable,
    resolvedMeterDynamics.peakThresholdDb,
    resolvedMeterDynamics.reactThresholdDb,
    resolvedSpectrumConfig.crestDecibels,
    resolvedSpectrumConfig.middleDecibels,
    selectionRange.end,
    selectionRange.start,
    visualMode,
  ]);
  const formatOverlayInspection = (value: number) => {
    if (visualMode === "spectrum")
      return formatFrequency(
        normalizedToValue(
          value,
          spectrumFrequencyRange.lowFrequency,
          spectrumFrequencyRange.highFrequency,
          frequencyScale,
        ),
      );
    if (isMeterMode)
      return `${Math.round(normalizedToValue(value, meterMinimumDecibels, meterMaximumDecibels))} dBFS`;
    return `${Math.round(value * 1000) / 10}%`;
  };

  useEffect(() => {
    void session.attach(activeSource);
    return () => {
      void session.detach();
    };
  }, [activeSource, session]);

  const reset = () => {
    setVisualMode("waveform");
    setRenderer("canvas2d");
    setPresetId("broadcast");
    setSignalColor(PRESETS[0].color);
    setPulseRingThickness(DEFAULT_PULSE_RING_CONFIG.thickness);
    setPulseRingGlow(DEFAULT_PULSE_RING_CONFIG.glowStrength);
    setPulseRingRotation(DEFAULT_PULSE_RING_CONFIG.rotationSpeed);
    setPulseRingReactivity(DEFAULT_PULSE_RING_CONFIG.bandReactivity);
    setPulseRingQuality(DEFAULT_PULSE_RING_CONFIG.quality);
    setPulseRingPrimary(DEFAULT_PULSE_RING_CONFIG.primaryColor);
    setPulseRingSecondary(DEFAULT_PULSE_RING_CONFIG.secondaryColor);
    setPulseRingTertiary(DEFAULT_PULSE_RING_CONFIG.tertiaryColor);
    setPulseRingSweep(DEFAULT_PULSE_RING_CONFIG.sweepColor);
    setPulseRingBackground(DEFAULT_PULSE_RING_CONFIG.backgroundColor);
    setPulseRingMotion(DEFAULT_PULSE_RING_CONFIG.motion);
    setNeonLinesPresetId(NEON_LINES_PRESETS[0].id as NeonLinesPresetId);
    setNeonLinesConfig(DEFAULT_NEON_LINES_CONFIG);
    setEqualizerGridPresetId(EQUALIZER_GRID_PRESETS[0].id as EqualizerGridPresetId);
    setEqualizerGridConfig(DEFAULT_EQUALIZER_GRID_CONFIG);
    setWaveformRibbonPresetId(WAVEFORM_RIBBON_PRESETS[0].id as WaveformRibbonPresetId);
    setWaveformRibbonConfig(DEFAULT_WAVEFORM_RIBBON_CONFIG);
    setRoundedWobbleBarsPresetId(ROUNDED_WOBBLE_BARS_PRESETS[0].id as RoundedWobbleBarsPresetId);
    setRoundedWobbleBarsConfig(DEFAULT_ROUNDED_WOBBLE_BARS_CONFIG);
    setSpectrumBarsVfxPresetId(SPECTRUM_BARS_VFX_PRESETS[0].id as SpectrumBarsVfxPresetId);
    setSpectrumBarsVfxConfig(DEFAULT_SPECTRUM_BARS_VFX_CONFIG);
    setRadialSpikesPresetId(RADIAL_SPIKES_PRESETS[0].id as RadialSpikesPresetId);
    setRadialSpikesConfig(DEFAULT_RADIAL_SPIKES_CONFIG);
    setTunnelWavesPresetId(TUNNEL_WAVES_PRESETS[0].id as TunnelWavesPresetId);
    setTunnelWavesConfig(DEFAULT_TUNNEL_WAVES_CONFIG);
    setVortexRingsPresetId(VORTEX_RINGS_PRESETS[0].id as VortexRingsPresetId);
    setVortexRingsConfig(DEFAULT_VORTEX_RINGS_CONFIG);
    setVfxEnergyScenario("signal");
    setVfxBandScale("log");
    setSampleCount(2048);
    setAmplitude(DEFAULT_WAVEFORM_CONFIG.amplitude);
    setLineWidth(DEFAULT_WAVEFORM_CONFIG.lineWidth);
    setShowCenterLine(true);
    setChannelMode(DEFAULT_WAVEFORM_CONFIG.channelMode);
    setChannelIndex(0);
    setChannelLayout(DEFAULT_WAVEFORM_CONFIG.channelLayout);
    setChannelGap(DEFAULT_WAVEFORM_CONFIG.channelGap);
    setOrientation(DEFAULT_WAVEFORM_CONFIG.orientation);
    setWaveformPlacement(DEFAULT_WAVEFORM_CONFIG.amplitudePlacement);
    setEnvelopePlacement(DEFAULT_ENVELOPE_CONFIG.amplitudePlacement);
    setTimeDomainSizing("responsive");
    setFixedTimeDomainWidth(640);
    setRecordedSource(null);
    setMicrophoneSource(null);
    setAllowLargeFft(DEFAULT_SPECTRUM_ANALYSIS_CONFIG.allowLargeFft);
    setFftSize(DEFAULT_SPECTRUM_ANALYSIS_CONFIG.fftSize);
    setSpectrumWindow(DEFAULT_SPECTRUM_ANALYSIS_CONFIG.window);
    setPowerOfSineExponent(DEFAULT_SPECTRUM_ANALYSIS_CONFIG.powerOfSineExponent);
    setLowFrequency(DEFAULT_SPECTRUM_CONFIG.lowFrequency);
    setHighFrequency(DEFAULT_SPECTRUM_CONFIG.highFrequency);
    setMinimumDecibels(DEFAULT_SPECTRUM_CONFIG.minimumDecibels);
    setMaximumDecibels(DEFAULT_SPECTRUM_CONFIG.maximumDecibels);
    setFrequencyScale(DEFAULT_SPECTRUM_CONFIG.frequencyScale);
    setSpectrumInterpolation(DEFAULT_SPECTRUM_CONFIG.interpolation);
    setSpectrumGeometry(DEFAULT_SPECTRUM_CONFIG.geometry);
    setSpectrumLayout(DEFAULT_SPECTRUM_CONFIG.layout);
    setRadialInvert(DEFAULT_SPECTRUM_CONFIG.radialInvert);
    setRadialDeadzone(DEFAULT_SPECTRUM_CONFIG.radialDeadzone);
    setRadialArc(DEFAULT_SPECTRUM_CONFIG.radialArc);
    setRadialRotation(DEFAULT_SPECTRUM_CONFIG.radialRotation);
    setRoundedCaps(DEFAULT_SPECTRUM_CONFIG.roundedCaps);
    setCornerRadius(DEFAULT_SPECTRUM_CONFIG.cornerRadius);
    setBarWidth(DEFAULT_SPECTRUM_CONFIG.barWidth);
    setBarGap(DEFAULT_SPECTRUM_CONFIG.barGap);
    setSpectrumColorMode(DEFAULT_SPECTRUM_CONFIG.colorMode);
    setSpectrumPulseMode(DEFAULT_SPECTRUM_CONFIG.pulseMode);
    setBaseAlpha(DEFAULT_SPECTRUM_CONFIG.colorRoles.base.alpha);
    setMiddleColor(DEFAULT_SPECTRUM_CONFIG.colorRoles.middle.color);
    setMiddleAlpha(DEFAULT_SPECTRUM_CONFIG.colorRoles.middle.alpha);
    setCrestColor(DEFAULT_SPECTRUM_CONFIG.colorRoles.crest.color);
    setCrestAlpha(DEFAULT_SPECTRUM_CONFIG.colorRoles.crest.alpha);
    setAccentColor(DEFAULT_SPECTRUM_CONFIG.colorRoles.accent.color);
    setAccentAlpha(DEFAULT_SPECTRUM_CONFIG.colorRoles.accent.alpha);
    setGradientRatio(DEFAULT_SPECTRUM_CONFIG.gradientRatio);
    setMiddleDecibels(DEFAULT_SPECTRUM_CONFIG.middleDecibels);
    setCrestDecibels(DEFAULT_SPECTRUM_CONFIG.crestDecibels);
    setShowSpectrumGrid(DEFAULT_SPECTRUM_CONFIG.showGrid);
    setDynamicsSettings(DEFAULT_SPECTRUM_DYNAMICS_CONFIG);
    setVisualSyncOffsetMs(0);
    setMeterMeasurement(DEFAULT_METER_CONFIG.measurement);
    setMeterPresetId(METER_PRESETS[0].id);
    setMeterDynamicsSettings(DEFAULT_METER_DYNAMICS_CONFIG);
    setMeterLayout(DEFAULT_METER_CONFIG.layout);
    setMeterColorMode(DEFAULT_METER_CONFIG.colorMode);
    setMeterMinimumDecibels(DEFAULT_METER_CONFIG.minimumDecibels);
    setMeterMaximumDecibels(DEFAULT_METER_CONFIG.maximumDecibels);
    setMeterBarWidth(DEFAULT_METER_CONFIG.barWidth);
    setMeterChannelGap(DEFAULT_METER_CONFIG.channelGap);
    setMeterMinimumSize(DEFAULT_METER_CONFIG.minimumSize);
    setMeterStepWidth(DEFAULT_METER_CONFIG.stepWidth);
    setMeterStepGap(DEFAULT_METER_CONFIG.stepGap);
    setShowMeterHistory(DEFAULT_METER_CONFIG.showHistory);
    setMeterHistoryOpacity(DEFAULT_METER_CONFIG.historyOpacity);
    setShowOverlays(true);
    setOverlayDirection("ltr");
    setPlayheadPosition(0.32);
    setSelectionRange({ end: 0.42, start: 0.18 });
    setLoopRange({ end: 0.76, start: 0.56 });
    setActiveRegion("selection");
    setOverlayInspection(null);
    setOverlayEvent("No interaction yet");
    setCopyState("idle");
  };

  const updateDynamics = (patch: Partial<SpectrumDynamicsConfig>) => {
    setDynamicsSettings((current) => resolveSpectrumDynamicsConfig({ ...current, ...patch }));
  };

  const updateMeterDynamics = (patch: Partial<MeterDynamicsConfig>) => {
    setMeterDynamicsSettings((current) =>
      resolveMeterDynamicsConfig({ ...current, ...patch }, meterFrame),
    );
  };

  const loadMeterPreset = (id: (typeof METER_PRESETS)[number]["id"]) => {
    const next = METER_PRESETS.find((candidate) => candidate.id === id) ?? METER_PRESETS[0];
    setMeterPresetId(next.id);
    setMeterMeasurement(next.measurement);
    setMeterDynamicsSettings(
      resolveMeterDynamicsConfig({ ...DEFAULT_METER_DYNAMICS_CONFIG, ...next.config }, meterFrame),
    );
  };

  const updateNeonLines = (patch: Partial<NeonLinesConfig>) => {
    setNeonLinesConfig((current) => resolveNeonLinesConfig({ ...current, ...patch }));
    setNeonLinesPresetId("custom");
  };

  const loadNeonLinesPreset = (id: string) => {
    const next = NEON_LINES_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setNeonLinesPresetId(next.id as NeonLinesPresetId);
    setNeonLinesConfig(next.config);
  };

  const updateEqualizerGrid = (patch: Partial<EqualizerGridConfig>) => {
    setEqualizerGridConfig((current) => resolveEqualizerGridConfig({ ...current, ...patch }));
    setEqualizerGridPresetId("custom");
  };

  const loadEqualizerGridPreset = (id: string) => {
    const next = EQUALIZER_GRID_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setEqualizerGridPresetId(next.id as EqualizerGridPresetId);
    setEqualizerGridConfig(next.config);
  };

  const updateWaveformRibbon = (patch: Partial<WaveformRibbonConfig>) => {
    setWaveformRibbonConfig((current) => resolveWaveformRibbonConfig({ ...current, ...patch }));
    setWaveformRibbonPresetId("custom");
  };

  const loadWaveformRibbonPreset = (id: string) => {
    const next = WAVEFORM_RIBBON_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setWaveformRibbonPresetId(next.id as WaveformRibbonPresetId);
    setWaveformRibbonConfig(next.config);
  };

  const updateRoundedWobbleBars = (patch: Partial<RoundedWobbleBarsConfig>) => {
    setRoundedWobbleBarsConfig((current) =>
      resolveRoundedWobbleBarsConfig({ ...current, ...patch }),
    );
    setRoundedWobbleBarsPresetId("custom");
  };

  const loadRoundedWobbleBarsPreset = (id: string) => {
    const next = ROUNDED_WOBBLE_BARS_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setRoundedWobbleBarsPresetId(next.id as RoundedWobbleBarsPresetId);
    setRoundedWobbleBarsConfig(next.config);
  };

  const updateSpectrumBarsVfx = (patch: Partial<SpectrumBarsVfxConfig>) => {
    setSpectrumBarsVfxConfig((current) => resolveSpectrumBarsVfxConfig({ ...current, ...patch }));
    setSpectrumBarsVfxPresetId("custom");
  };

  const loadSpectrumBarsVfxPreset = (id: string) => {
    const next = SPECTRUM_BARS_VFX_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setSpectrumBarsVfxPresetId(next.id as SpectrumBarsVfxPresetId);
    setSpectrumBarsVfxConfig(next.config);
  };

  const updateRadialSpikes = (patch: Partial<RadialSpikesConfig>) => {
    setRadialSpikesConfig((current) => resolveRadialSpikesConfig({ ...current, ...patch }));
    setRadialSpikesPresetId("custom");
  };

  const loadRadialSpikesPreset = (id: string) => {
    const next = RADIAL_SPIKES_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setRadialSpikesPresetId(next.id as RadialSpikesPresetId);
    setRadialSpikesConfig(next.config);
  };

  const updateTunnelWaves = (patch: Partial<TunnelWavesConfig>) => {
    setTunnelWavesConfig((current) => resolveTunnelWavesConfig({ ...current, ...patch }));
    setTunnelWavesPresetId("custom");
  };

  const loadTunnelWavesPreset = (id: string) => {
    const next = TUNNEL_WAVES_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setTunnelWavesPresetId(next.id as TunnelWavesPresetId);
    setTunnelWavesConfig(next.config);
  };

  const updateVortexRings = (patch: Partial<VortexRingsConfig>) => {
    setVortexRingsConfig((current) => resolveVortexRingsConfig({ ...current, ...patch }));
    setVortexRingsPresetId("custom");
  };

  const loadVortexRingsPreset = (id: string) => {
    const next = VORTEX_RINGS_PRESETS.find((candidate) => candidate.id === id);
    if (!next) return;
    setVortexRingsPresetId(next.id as VortexRingsPresetId);
    setVortexRingsConfig(next.config);
  };

  const copyCode = async () => {
    const code = isPulseRingMode
      ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<PulseRing
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "pulse-ring",
    backgroundColor: "${pulseRingBackground}",
    thickness: ${pulseRingThickness.toFixed(3)},
    glowStrength: ${pulseRingGlow.toFixed(2)},
    rotationSpeed: ${pulseRingRotation.toFixed(2)},
    bandReactivity: ${pulseRingReactivity.toFixed(2)},
    motion: "${pulseRingMotion}",
    quality: "${pulseRingQuality}",
    primaryColor: "${pulseRingPrimary}",
    secondaryColor: "${pulseRingSecondary}",
    tertiaryColor: "${pulseRingTertiary}",
    sweepColor: "${pulseRingSweep}"
  }}
/>`
      : isNeonLinesMode
        ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<NeonLines
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "neon-lines",
    backgroundColor: "${neonLinesConfig.backgroundColor}",
    lineCount: ${neonLinesConfig.lineCount},
    waveHeight: ${neonLinesConfig.waveHeight.toFixed(2)},
    flowSpeed: ${neonLinesConfig.flowSpeed.toFixed(2)},
    lineThickness: ${neonLinesConfig.lineThickness.toFixed(3)},
    glowSize: ${neonLinesConfig.glowSize.toFixed(2)},
    energyReactivity: ${neonLinesConfig.energyReactivity.toFixed(2)},
    motion: "${neonLinesConfig.motion}",
    quality: "${neonLinesConfig.quality}",
    leftColor: "${neonLinesConfig.leftColor}",
    rightColor: "${neonLinesConfig.rightColor}",
    burstColor: "${neonLinesConfig.burstColor}"
  }}
/>`
        : isEqualizerGridMode
          ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<EqualizerGrid
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "equalizer-grid",
    backgroundColor: "${equalizerGridConfig.backgroundColor}",
    gridColumns: ${equalizerGridConfig.gridColumns},
    gridRows: ${equalizerGridConfig.gridRows},
    cellGap: ${equalizerGridConfig.cellGap.toFixed(2)},
    cellReactivity: ${equalizerGridConfig.cellReactivity.toFixed(2)},
    randomSpeed: ${equalizerGridConfig.randomSpeed.toFixed(2)},
    motion: "${equalizerGridConfig.motion}",
    quality: "${equalizerGridConfig.quality}",
    gradientColor1: "${equalizerGridConfig.gradientColor1}",
    gradientColor2: "${equalizerGridConfig.gradientColor2}",
    gradientColor3: "${equalizerGridConfig.gradientColor3}",
    gradientColor4: "${equalizerGridConfig.gradientColor4}"
  }}
/>`
          : isWaveformRibbonMode
            ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<WaveformRibbon
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "waveform-ribbon",
    backgroundColor: "${waveformRibbonConfig.backgroundColor}",
    waveHeight: ${waveformRibbonConfig.waveHeight.toFixed(2)},
    flowSpeed: ${waveformRibbonConfig.flowSpeed.toFixed(2)},
    ribbonThickness: ${waveformRibbonConfig.ribbonThickness.toFixed(3)},
    glowStrength: ${waveformRibbonConfig.glowStrength.toFixed(2)},
    reflectionStrength: ${waveformRibbonConfig.reflectionStrength.toFixed(2)},
    energyReactivity: ${waveformRibbonConfig.energyReactivity.toFixed(2)},
    motion: "${waveformRibbonConfig.motion}",
    quality: "${waveformRibbonConfig.quality}",
    leftColor: "${waveformRibbonConfig.leftColor}",
    rightColor: "${waveformRibbonConfig.rightColor}",
    peakFlashColor: "${waveformRibbonConfig.peakFlashColor}"
  }}
/>`
            : isRoundedWobbleBarsMode
              ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<RoundedWobbleBars
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "rounded-wobble-bars",
    backgroundColor: "${roundedWobbleBarsConfig.backgroundColor}",
    barCount: ${roundedWobbleBarsConfig.barCount},
    wobbleIntensity: ${roundedWobbleBarsConfig.wobbleIntensity.toFixed(2)},
    mirrorVertically: ${roundedWobbleBarsConfig.mirrorVertically},
    barGap: ${roundedWobbleBarsConfig.barGap.toFixed(2)},
    glowIntensity: ${roundedWobbleBarsConfig.glowIntensity.toFixed(2)},
    energyReactivity: ${roundedWobbleBarsConfig.energyReactivity.toFixed(2)},
    motion: "${roundedWobbleBarsConfig.motion}",
    quality: "${roundedWobbleBarsConfig.quality}",
    leftColor: "${roundedWobbleBarsConfig.leftColor}",
    rightColor: "${roundedWobbleBarsConfig.rightColor}",
    burstFlashColor: "${roundedWobbleBarsConfig.burstFlashColor}"
  }}
/>`
              : isSpectrumBarsVfxMode
                ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<SpectrumBars
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "spectrum-bars",
    backgroundColor: "${spectrumBarsVfxConfig.backgroundColor}",
    barCount: ${spectrumBarsVfxConfig.barCount},
    heightReactivity: ${spectrumBarsVfxConfig.heightReactivity.toFixed(2)},
    gapSize: ${spectrumBarsVfxConfig.gapSize.toFixed(2)},
    verticalPosition: ${spectrumBarsVfxConfig.verticalPosition.toFixed(2)},
    randomSpeed: ${spectrumBarsVfxConfig.randomSpeed.toFixed(2)},
    glowStrength: ${spectrumBarsVfxConfig.glowStrength.toFixed(2)},
    motion: "${spectrumBarsVfxConfig.motion}",
    quality: "${spectrumBarsVfxConfig.quality}",
    gradientColor1: "${spectrumBarsVfxConfig.gradientColor1}",
    gradientColor2: "${spectrumBarsVfxConfig.gradientColor2}",
    gradientColor3: "${spectrumBarsVfxConfig.gradientColor3}",
    gradientColor4: "${spectrumBarsVfxConfig.gradientColor4}"
  }}
/>`
                : isRadialSpikesMode
                  ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<RadialSpikes
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "radial-spikes",
    backgroundColor: "${radialSpikesConfig.backgroundColor}",
    spikeCount: ${radialSpikesConfig.spikeCount},
    baseRadius: ${radialSpikesConfig.baseRadius.toFixed(2)},
    spikeHeight: ${radialSpikesConfig.spikeHeight.toFixed(2)},
    spikeWidth: ${radialSpikesConfig.spikeWidth.toFixed(2)},
    arcDegrees: ${radialSpikesConfig.arcDegrees},
    rotationDegrees: ${radialSpikesConfig.rotationDegrees},
    energyReactivity: ${radialSpikesConfig.energyReactivity.toFixed(2)},
    glowStrength: ${radialSpikesConfig.glowStrength.toFixed(2)},
    motion: "${radialSpikesConfig.motion}",
    quality: "${radialSpikesConfig.quality}",
    baseColor: "${radialSpikesConfig.baseColor}",
    tipColor: "${radialSpikesConfig.tipColor}"
  }}
/>`
                  : isTunnelWavesMode
                    ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<TunnelWaves
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "tunnel-waves",
    backgroundColor: "${tunnelWavesConfig.backgroundColor}",
    ringDensity: ${tunnelWavesConfig.ringDensity},
    tunnelSpeed: ${tunnelWavesConfig.tunnelSpeed.toFixed(2)},
    tunnelDepth: ${tunnelWavesConfig.tunnelDepth.toFixed(2)},
    energyReactivity: ${tunnelWavesConfig.energyReactivity.toFixed(2)},
    glowStrength: ${tunnelWavesConfig.glowStrength.toFixed(2)},
    motion: "${tunnelWavesConfig.motion}",
    quality: "${tunnelWavesConfig.quality}",
    centerColor: "${tunnelWavesConfig.centerColor}",
    midColor: "${tunnelWavesConfig.midColor}",
    outerColor: "${tunnelWavesConfig.outerColor}"
  }}
/>`
                    : isVortexRingsMode
                      ? `const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8, frequencyScale: "${vfxBandScale}" });

<VortexRings
  data={bands}
  config={{
    renderer: "webgl2",
    mode: "vortex-rings",
    backgroundColor: "${vortexRingsConfig.backgroundColor}",
    twistAmount: ${vortexRingsConfig.twistAmount.toFixed(2)},
    spinSpeed: ${vortexRingsConfig.spinSpeed.toFixed(2)},
    ringDensity: ${vortexRingsConfig.ringDensity},
    vortexRadius: ${vortexRingsConfig.vortexRadius.toFixed(2)},
    energyReactivity: ${vortexRingsConfig.energyReactivity.toFixed(2)},
    glowStrength: ${vortexRingsConfig.glowStrength.toFixed(2)},
    motion: "${vortexRingsConfig.motion}",
    quality: "${vortexRingsConfig.quality}",
    primaryColor: "${vortexRingsConfig.primaryColor}",
    secondaryColor: "${vortexRingsConfig.secondaryColor}",
    accentColor: "${vortexRingsConfig.accentColor}"
  }}
/>`
                      : isMeterMode
                        ? `const meter = createMeterDynamicsProcessor();
const result = meter.process(
  analyzeMeter(samples, {
    channelMode: "${channelMode}",
    minimumDecibels: ${meterMinimumDecibels},
    sampleRate: ${sampleRate}
  }),
  {
    attackMs: ${resolvedMeterDynamics.attackMs},
    releaseMs: ${resolvedMeterDynamics.releaseMs},
    inertiaMs: ${resolvedMeterDynamics.inertiaMs},
    fastPeaks: ${resolvedMeterDynamics.fastPeaks},
    historyDurationMs: ${resolvedMeterDynamics.historyDurationMs},
    historyIntervalMs: ${resolvedMeterDynamics.historyIntervalMs}
  },
  { timestampMs: performance.now(), sourceEpoch: 0 }
);

<Meter
  data={result.frame}
  history={result.history}
  config={{
    mode: "${visualMode}",
    measurement: "${meterMeasurement}",
    layout: "${meterLayout}",
    orientation: "${orientation}",
    colorMode: "${meterColorMode}",
    minimumDecibels: ${meterMinimumDecibels},
    maximumDecibels: ${meterMaximumDecibels},
    minimumSize: ${meterMinimumSize},
    barWidth: ${meterBarWidth},
    channelGap: ${meterChannelGap},
    stepWidth: ${meterStepWidth},
    stepGap: ${meterStepGap},
    roundedCaps: ${roundedCaps},
    showHistory: ${showMeterHistory}
  }}
/>`
                        : visualMode === "spectrum"
                          ? `const dynamics = createSpectrumDynamicsProcessor();\n\n<Spectrum\n  data={dynamics.process(\n    analyzeSpectrum(samples, {\n      sampleRate: ${sampleRate},\n      fftSize: ${spectrumAnalysis.fftSize},\n      allowLargeFft: ${spectrumAnalysis.allowLargeFft},\n      window: "${spectrumAnalysis.window}",\n      powerOfSineExponent: ${spectrumAnalysis.powerOfSineExponent},\n      minimumDecibels: ${spectrumAnalysis.minimumDecibels},\n      maximumDecibels: ${spectrumAnalysis.maximumDecibels}\n    }),\n    {\n      smoothingMode: "${dynamicsSettings.smoothingMode}",\n      smoothingFactor: ${dynamicsSettings.smoothingFactor},\n      attackMs: ${dynamicsSettings.attackMs},\n      releaseMs: ${dynamicsSettings.releaseMs},\n      inertiaMs: ${dynamicsSettings.inertiaMs},\n      fastPeaks: ${dynamicsSettings.fastPeaks},\n      normalizationEnabled: ${dynamicsSettings.normalizationEnabled},\n      normalizationTargetDb: ${dynamicsSettings.normalizationTargetDb},\n      normalizationMaxGainDb: ${dynamicsSettings.normalizationMaxGainDb},\n      gaussianRadius: ${dynamicsSettings.gaussianRadius},\n      highFrequencySlopeDbPerOctave: ${dynamicsSettings.highFrequencySlopeDbPerOctave},\n      rolloffBandwidthHz: ${dynamicsSettings.rolloffBandwidthHz},\n      rolloffAttenuationDb: ${dynamicsSettings.rolloffAttenuationDb}\n    },\n    { timestampMs: performance.now(), sourceState: "ready" }\n  ).frame}\n  config={{\n    renderer: "canvas2d",\n    mode: "spectrum",\n    geometry: "${spectrumGeometry}",\n    layout: "${spectrumLayout}",\n    radialInvert: ${radialInvert},\n    radialDeadzone: ${radialDeadzone.toFixed(2)},\n    radialArc: ${radialArc},\n    radialRotation: ${radialRotation},\n    roundedCaps: ${roundedCaps},\n    cornerRadius: ${cornerRadius},\n    frequencyScale: "${frequencyScale}",\n    lowFrequency: ${lowFrequency},\n    highFrequency: ${highFrequency},\n    minimumDecibels: ${minimumDecibels},\n    maximumDecibels: ${maximumDecibels},\n    interpolation: "${spectrumInterpolation}",\n    lineWidth: ${lineWidth},\n    barWidth: ${barWidth},\n    barGap: ${barGap},\n    colorMode: "${spectrumColorMode}",\n    pulseMode: "${spectrumPulseMode}",\n    colorRoles: {\n      base: { color: "${signalColor}", alpha: ${baseAlpha.toFixed(2)} },\n      middle: { color: "${middleColor}", alpha: ${middleAlpha.toFixed(2)} },\n      crest: { color: "${crestColor}", alpha: ${crestAlpha.toFixed(2)} },\n      accent: { color: "${accentColor}", alpha: ${accentAlpha.toFixed(2)} }\n    },\n    gradientRatio: ${gradientRatio.toFixed(2)},\n    middleDecibels: ${middleDecibels},\n    crestDecibels: ${crestDecibels},\n    showGrid: ${showSpectrumGrid}\n  }}\n/>`
                          : visualMode === "envelope"
                            ? `<Envelope\n  data={magnitudes}\n  ${timeDomainSizing === "fixed" ? `width={${fixedTimeDomainWidth}}\n  ` : ""}config={{\n    renderer: "canvas2d",\n    mode: "envelope",\n    channelMode: "${channelMode}",${channelMode === "single" ? `\n    channelIndex: ${channelIndex},` : ""}\n    channelLayout: "${channelLayout}",\n    channelGap: ${channelGap},\n    amplitudePlacement: "${envelopePlacement}",\n    orientation: "${orientation}",\n    amplitude: ${amplitude.toFixed(2)},\n    lineWidth: ${lineWidth.toFixed(1)},\n    color: "${signalColor}",\n    showCenterLine: ${showCenterLine}\n  }}\n/>`
                            : `<Waveform\n  data={channels}\n  ${timeDomainSizing === "fixed" ? `width={${fixedTimeDomainWidth}}\n  ` : ""}config={{\n    renderer: "canvas2d",\n    mode: "waveform",\n    channelMode: "${channelMode}",${channelMode === "single" ? `\n    channelIndex: ${channelIndex},` : ""}\n    channelLayout: "${channelLayout}",\n    channelGap: ${channelGap},\n    amplitudePlacement: "${waveformPlacement}",\n    orientation: "${orientation}",\n    amplitude: ${amplitude.toFixed(2)},\n    lineWidth: ${lineWidth.toFixed(1)},\n    color: "${signalColor}",\n    showCenterLine: ${showCenterLine}\n  }}\n/>`;
    const rendererCode = isVfxMode
      ? code
      : code.includes("renderer:")
        ? code.replaceAll('renderer: "canvas2d"', `renderer: "${coreRenderer}"`)
        : code.replace("config={{", `config={{\n    renderer: "${coreRenderer}",`);
    try {
      await navigator.clipboard.writeText(rendererCode);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const spectrumCapabilityContext = {
    allowLargeFft,
    colorMode: spectrumColorMode,
    geometry: spectrumGeometry,
    layout: spectrumLayout,
    window: spectrumWindow,
  } as const;
  const powerExponentAvailability = getSpectrumControlAvailability(
    "powerOfSineExponent",
    spectrumCapabilityContext,
  );
  const lineWidthAvailability = getSpectrumControlAvailability(
    "lineWidth",
    spectrumCapabilityContext,
  );
  const barWidthAvailability = getSpectrumControlAvailability(
    "barWidth",
    spectrumCapabilityContext,
  );
  const radialAvailability = getSpectrumControlAvailability("radialArc", spectrumCapabilityContext);
  const roundedCapsAvailability = getSpectrumControlAvailability(
    "roundedCaps",
    spectrumCapabilityContext,
  );
  const cornerRadiusAvailability = getSpectrumControlAvailability(
    "cornerRadius",
    spectrumCapabilityContext,
  );
  const pulseModeAvailability = getSpectrumControlAvailability(
    "pulseMode",
    spectrumCapabilityContext,
  );
  const middleColorAvailability = getSpectrumControlAvailability(
    "middleColor",
    spectrumCapabilityContext,
  );
  const crestColorAvailability = getSpectrumControlAvailability(
    "crestColor",
    spectrumCapabilityContext,
  );
  const accentColorAvailability = getSpectrumControlAvailability(
    "accentColor",
    spectrumCapabilityContext,
  );
  const gradientRatioAvailability = getSpectrumControlAvailability(
    "gradientRatio",
    spectrumCapabilityContext,
  );
  const rangeThresholdAvailability = getSpectrumControlAvailability(
    "middleDecibels",
    spectrumCapabilityContext,
  );
  const temporalCapabilityReason = microphoneSource
    ? undefined
    : "Requires a clocked live frame stream; the deterministic demo has no cadence.";
  const syncCapabilityReason = microphoneSource
    ? visualSyncResolution.reason
    : "Requires a clocked source. Static previews have no audio/visual timeline to offset.";
  const spectrumStageStyle =
    visualMode === "spectrum" || isMeterMode
      ? ({
          "--waveform-color-accent": accentColor,
          "--waveform-color-base": signalColor,
          "--waveform-color-crest": crestColor,
          "--waveform-color-middle": middleColor,
        } as CSSProperties)
      : undefined;

  return (
    <div className="workbench" data-view={view}>
      <main className="workbench-main">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <div>
              <h1>Signal Workbench</h1>
              <p>Deterministic demo · signed PCM · 48 kHz</p>
            </div>
          </div>
          <div className="view-switch" role="group" aria-label="Workbench view">
            <button
              type="button"
              aria-pressed={view === "overview"}
              onClick={() => setView("overview")}
            >
              <IconLayoutGrid size={14} aria-hidden="true" />
              Overview
            </button>
            <button type="button" aria-pressed={view === "focus"} onClick={() => setView("focus")}>
              <IconFocus2 size={14} aria-hidden="true" />
              Focus
            </button>
          </div>
          <div className="status-readout" aria-label="Signal status">
            <span className="status-dot" />
            {sessionSnapshot.source?.kind.toUpperCase() ?? "NO SOURCE"} /{" "}
            {sessionSnapshot.status.state.toUpperCase()}
          </div>
        </header>

        <section className="artifact-area" aria-labelledby="artifact-title">
          <div className="artifact-card">
            <div className="artifact-meta">
              <div>
                <span className="eyebrow">LIVE ARTIFACT</span>
                <h2 id="artifact-title">
                  {microphoneSource
                    ? "Microphone"
                    : (recordedSource?.getTransportSnapshot().name ?? preset.label)}{" "}
                  {visualMode}
                </h2>
              </div>
              <div className="artifact-badges" aria-label="Active visualization">
                <span>{visualMode.toUpperCase()}</span>
                <span>{rendererCapabilities.label.toUpperCase()}</span>
                <span>
                  {visualMode === "spectrum"
                    ? `${spectrumLayout.toUpperCase()} · ${spectrumColorMode.toUpperCase()}`
                    : isVfxMode
                      ? `${vfxFrame.bands.length} BANDS · ${activeVfxQuality.toUpperCase()}`
                      : isMeterMode
                        ? `${meterLayout.toUpperCase()} · ${meterMeasurement.toUpperCase()}`
                        : `${selectedChannelCount} CH · ${channelLayout.toUpperCase()}`}
                </span>
              </div>
            </div>
            <div
              className="signal-stage"
              data-renderer={renderer}
              data-dynamics-policy={spectrumPresentation.result?.policy ?? "unprocessed"}
              data-spectrum-color-mode={visualMode === "spectrum" ? spectrumColorMode : undefined}
              data-spectrum-layout={visualMode === "spectrum" ? spectrumLayout : undefined}
              data-meter-layout={isMeterMode ? meterLayout : undefined}
              data-meter-mode={isMeterMode ? visualMode : undefined}
              data-vfx-mode={isVfxMode ? visualMode : undefined}
              data-vfx-scenario={isVfxMode ? vfxEnergyScenario : undefined}
              style={spectrumStageStyle}
            >
              {isVfxMode ? (
                renderer === "webgl2" ? (
                  isPulseRingMode ? (
                    <PulseRing
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Pulse Ring preview`}
                      className="primary-waveform"
                      config={pulseRingConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isNeonLinesMode ? (
                    <NeonLines
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Neon Lines preview`}
                      className="primary-waveform"
                      config={neonLinesConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isEqualizerGridMode ? (
                    <EqualizerGrid
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Equalizer Grid preview`}
                      className="primary-waveform"
                      config={equalizerGridConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isWaveformRibbonMode ? (
                    <WaveformRibbon
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Waveform Ribbon preview`}
                      className="primary-waveform"
                      config={waveformRibbonConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isRoundedWobbleBarsMode ? (
                    <RoundedWobbleBars
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Rounded Wobble Bars preview`}
                      className="primary-waveform"
                      config={roundedWobbleBarsConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isSpectrumBarsVfxMode ? (
                    <SpectrumBars
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Spectrum Bars preview`}
                      className="primary-waveform"
                      config={spectrumBarsVfxConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isRadialSpikesMode ? (
                    <RadialSpikes
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Radial Spikes preview`}
                      className="primary-waveform"
                      config={radialSpikesConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : isTunnelWavesMode ? (
                    <TunnelWaves
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Tunnel Waves preview`}
                      className="primary-waveform"
                      config={tunnelWavesConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  ) : (
                    <VortexRings
                      ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} audio-reactive Vortex Rings preview`}
                      className="primary-waveform"
                      config={vortexRingsConfig}
                      data={vfxFrame}
                      height="100%"
                    />
                  )
                ) : (
                  <div className="pulse-ring-engine-fallback" role="status">
                    <span aria-hidden="true" />
                    <strong>{visualMode} needs WebGL2</strong>
                    <small>
                      Select the WebGL2 rendering engine. Source and controls are preserved.
                    </small>
                  </div>
                )
              ) : recordedSource && !microphoneSource ? (
                <RecordedWaveformPlayer
                  ariaLabel={`${recordedSource.getTransportSnapshot().name} local waveform preview`}
                  className="primary-waveform"
                  config={timeDomainConfig}
                  height="100%"
                  session={session}
                  source={recordedSource}
                />
              ) : isMeterMode ? (
                <>
                  {meterLayout === "radial" ? (
                    <div className="radial-level-key" aria-hidden="true">
                      <span>
                        {meterMeasurement.toUpperCase()} · {meterMinimumDecibels} dBFS FLOOR
                      </span>
                      <span>
                        {Math.round(radialArc)}° ARC · {Math.round(radialRotation)}° START
                      </span>
                    </div>
                  ) : (
                    <div className="meter-scale" data-orientation={orientation} aria-hidden="true">
                      {meterScaleLabels(
                        meterMinimumDecibels,
                        meterMaximumDecibels,
                        orientation,
                      ).map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                  )}
                  <Meter
                    ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} ${meterMeasurement} ${visualMode} preview`}
                    className="primary-waveform"
                    config={meterConfig}
                    data={meterPresentation.frame}
                    height="100%"
                    history={meterPresentation.history}
                  />
                </>
              ) : visualMode === "spectrum" ? (
                <>
                  {spectrumLayout === "radial" ? (
                    <div className="radial-level-key" aria-hidden="true">
                      <span>
                        INNER{" "}
                        {radialInvert ? `CEILING ${maximumDecibels}` : `FLOOR ${minimumDecibels}`}{" "}
                        dB
                      </span>
                      <span>
                        OUTER{" "}
                        {radialInvert ? `FLOOR ${minimumDecibels}` : `CEILING ${maximumDecibels}`}{" "}
                        dB
                      </span>
                    </div>
                  ) : (
                    <div className="signal-scale" aria-hidden="true">
                      <span>{maximumDecibels} dB</span>
                      <span>{Math.round((minimumDecibels + maximumDecibels) / 2)} dB</span>
                      <span>{minimumDecibels} dB</span>
                    </div>
                  )}
                  <Spectrum
                    ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} ordered spectrum preview`}
                    className="primary-waveform"
                    config={spectrumConfig}
                    data={spectrumPresentation.frame}
                    data-dynamics-visible={spectrumPresentation.result?.visible ?? true}
                    height="100%"
                  />
                  {spectrumPresentation.buffering ? (
                    <div className="signal-policy-state" role="status">
                      Buffering {visualSyncResolution.offsetMs} ms visual offset · audio unchanged
                    </div>
                  ) : spectrumPresentation.result?.visible === false ? (
                    <div className="signal-policy-state" role="status">
                      Hidden · below silence policy
                    </div>
                  ) : null}
                  <div
                    className={
                      spectrumLayout === "radial" ? "radial-frequency-key" : "frequency-axis"
                    }
                    aria-hidden="true"
                  >
                    <span>{formatFrequency(spectrumFrequencyRange.lowFrequency)}</span>
                    <span>
                      {spectrumLayout === "radial"
                        ? `${Math.round(radialArc)}° ARC · ${Math.round(radialRotation)}° START`
                        : frequencyScale === "log"
                          ? "LOG Hz"
                          : "LINEAR Hz"}
                    </span>
                    <span>{formatFrequency(spectrumFrequencyRange.highFrequency)}</span>
                  </div>
                </>
              ) : visualMode === "envelope" ? (
                <>
                  <div className="signal-scale" data-orientation={orientation} aria-hidden="true">
                    {envelopeScale(envelopePlacement, orientation).map((label, index) => (
                      <span key={`${label}-${index}`}>{label}</span>
                    ))}
                  </div>
                  <Envelope
                    ariaLabel={`${microphoneSource ? "Live microphone" : preset.label} magnitude envelope preview`}
                    className="primary-waveform"
                    config={timeDomainConfig}
                    data={envelopeFrame}
                    height="100%"
                    width={timeDomainSizing === "fixed" ? fixedTimeDomainWidth : "100%"}
                    style={{ marginInline: "auto" }}
                  />
                </>
              ) : (
                <>
                  <div className="signal-scale" data-orientation={orientation} aria-hidden="true">
                    {waveformScale(waveformPlacement, orientation).map((label, index) => (
                      <span key={`${label}-${index}`}>{label}</span>
                    ))}
                  </div>
                  <SessionWaveform
                    ariaLabel={
                      microphoneSource
                        ? "Live microphone waveform preview"
                        : `${preset.label} deterministic waveform preview`
                    }
                    className="primary-waveform"
                    config={timeDomainConfig}
                    height="100%"
                    session={session}
                    width={timeDomainSizing === "fixed" ? fixedTimeDomainWidth : "100%"}
                    style={{ marginInline: "auto" }}
                  />
                  {!microphoneSource && orientation === "horizontal" ? (
                    <div className="transient-guide" aria-hidden="true">
                      <span>TRANSIENT</span>
                      <i />
                    </div>
                  ) : null}
                </>
              )}
              {renderer === "webgl2" && !isVfxMode ? (
                <div className="signal-policy-state" role="status">
                  Canvas 2D fallback · WebGL2 is scoped to clean-room VFX modes
                </div>
              ) : null}
              {showOverlays &&
              rendererSupport.enabled &&
              !recordedSource &&
              !radialOverlayUnavailable ? (
                <SignalOverlay
                  ariaLabel={`${visualMode} semantic interaction overlay`}
                  direction={isTimeOverlay ? overlayDirection : "ltr"}
                  formatHoverValue={formatOverlayInspection}
                  handles={overlayHandles}
                  markers={
                    isTimeOverlay
                      ? [
                          {
                            description: "Loop entry cue",
                            id: "loop-cue",
                            label: "Loop cue marker",
                            onActivate: () => setOverlayEvent("Loop cue marker activated"),
                            position: loopRange.start,
                          },
                          {
                            description: "Detected transient study point",
                            id: "transient",
                            label: "Transient marker",
                            onActivate: () => setOverlayEvent("Transient marker activated"),
                            position: 0.68,
                          },
                        ]
                      : []
                  }
                  hoverLabel={
                    visualMode === "spectrum" ? "Frequency" : isMeterMode ? "Level" : "Time"
                  }
                  hoverReversed={isMeterMode && orientation === "vertical"}
                  onHoverChange={setOverlayInspection}
                  orientation={overlayOrientation}
                  regions={
                    isTimeOverlay
                      ? [
                          {
                            active: activeRegion === "selection",
                            description: "Controlled selection range",
                            end: selectionRange.end,
                            id: "selection",
                            kind: "selection",
                            label: "Active selection region",
                            onActivate: (id) => {
                              setActiveRegion(id);
                              setOverlayEvent("Selection region activated");
                            },
                            start: selectionRange.start,
                          },
                          {
                            active: activeRegion === "loop",
                            description: "Controlled playback loop",
                            end: loopRange.end,
                            id: "loop",
                            kind: "loop",
                            label: "Playback loop region",
                            onActivate: (id) => {
                              setActiveRegion(id);
                              setOverlayEvent("Loop region activated");
                            },
                            start: loopRange.start,
                          },
                          {
                            active: activeRegion === "transient-region",
                            description: "Annotated transient region",
                            end: 0.72,
                            id: "transient-region",
                            kind: "region",
                            label: "Transient annotation region",
                            onActivate: (id) => {
                              setActiveRegion(id);
                              setOverlayEvent("Transient annotation activated");
                            },
                            start: 0.64,
                          },
                        ]
                      : []
                  }
                  seek={
                    isTimeOverlay
                      ? {
                          formatValue: (value) => `${Math.round(value * 1000) / 10}%`,
                          label: "Seek deterministic signal",
                          onChange: (value, meta) => {
                            setPlayheadPosition(value);
                            if (meta.commit)
                              setOverlayEvent(
                                `Seek committed at ${Math.round(value * 1000) / 10}%`,
                              );
                          },
                          step: 0.01,
                          value: playheadPosition,
                        }
                      : undefined
                  }
                />
              ) : null}
            </div>
            <div className="artifact-footer">
              <span>
                {isVfxMode
                  ? `${vfxFrame.bands.length} BANDS · ${vfxEnergyScenario.toUpperCase()} · CLEAN-ROOM VFX`
                  : visualMode === "spectrum"
                    ? `${spectrumFrame.bins.length.toLocaleString()} BINS · ${spectrumAnalysis.fftSize.toLocaleString()} FFT`
                    : isMeterMode
                      ? `${meterPresentation.frame.channels.length} CH · ${meterPresentation.history.length}/${meterPresentation.historyCapacity} HISTORY`
                      : `${(sessionSnapshot.frame?.sampleCount ?? 0).toLocaleString()} DISPLAY SAMPLES`}
              </span>
              <span>
                {isPulseRingMode
                  ? `THICKNESS ${pulseRingThickness.toFixed(3)} · GLOW ${pulseRingGlow.toFixed(2)}×`
                  : isNeonLinesMode
                    ? `${neonLinesConfig.lineCount} LINES · HEIGHT ${neonLinesConfig.waveHeight.toFixed(2)} · GLOW ${neonLinesConfig.glowSize.toFixed(2)}×`
                    : isEqualizerGridMode
                      ? `${equalizerGridConfig.gridColumns}×${equalizerGridConfig.gridRows} CELLS · GAP ${equalizerGridConfig.cellGap.toFixed(2)}`
                      : isWaveformRibbonMode
                        ? `HEIGHT ${waveformRibbonConfig.waveHeight.toFixed(2)} · REFLECTION ${waveformRibbonConfig.reflectionStrength.toFixed(2)} · GLOW ${waveformRibbonConfig.glowStrength.toFixed(2)}×`
                        : isRoundedWobbleBarsMode
                          ? `${roundedWobbleBarsConfig.barCount} BARS · ${roundedWobbleBarsConfig.mirrorVertically ? "MIRRORED" : "BASELINE"} · GAP ${roundedWobbleBarsConfig.barGap.toFixed(2)}`
                          : isSpectrumBarsVfxMode
                            ? `${spectrumBarsVfxConfig.barCount} BARS · BASELINE ${spectrumBarsVfxConfig.verticalPosition.toFixed(2)} · GAP ${spectrumBarsVfxConfig.gapSize.toFixed(2)}`
                            : isRadialSpikesMode
                              ? `${radialSpikesConfig.spikeCount} SPIKES · ARC ${radialSpikesConfig.arcDegrees}° · RADIUS ${radialSpikesConfig.baseRadius.toFixed(2)}`
                              : isTunnelWavesMode
                                ? `${tunnelWavesConfig.ringDensity} RINGS · DEPTH ${tunnelWavesConfig.tunnelDepth.toFixed(2)} · SPEED ${tunnelWavesConfig.tunnelSpeed.toFixed(2)}`
                                : isVortexRingsMode
                                  ? `${vortexRingsConfig.ringDensity} RINGS · TWIST ${vortexRingsConfig.twistAmount.toFixed(2)} · RADIUS ${vortexRingsConfig.vortexRadius.toFixed(2)}`
                                  : visualMode === "spectrum"
                                    ? spectrumPresentation.result
                                      ? `PEAK ${spectrumPresentation.result.peakDb.toFixed(1)} dBFS · ${spectrumPresentation.result.reacting ? "REACTING" : "IDLE"}`
                                      : "DYNAMICS INITIALIZING"
                                    : isMeterMode
                                      ? `${meterMeasurement.toUpperCase()} ${meterPresentation.frame.channels[0]?.[meterMeasurement === "rms" ? "rmsDbfs" : "peakDbfs"].toFixed(1) ?? meterMinimumDecibels} dBFS · ${meterPresentation.peaking ? "PEAKING" : meterPresentation.reacting ? "REACTING" : "IDLE"}`
                                      : visualMode === "envelope"
                                        ? "MAGNITUDE 0…1 · POLARITY SEPARATE"
                                        : "SIGNED −1…+1 · POLARITY PRESERVED"}
              </span>
              <span>
                {isPulseRingMode
                  ? `${rendererCapabilities.label.toUpperCase()} · ${pulseRingQuality.toUpperCase()} · ${pulseRingRotation.toFixed(2)} REV/S`
                  : isVfxMode
                    ? `${rendererCapabilities.label.toUpperCase()} · ${activeVfxQuality.toUpperCase()} · ${activeVfxMotion.toUpperCase()}`
                    : visualMode === "spectrum"
                      ? `${spectrumPresentation.result?.policy.toUpperCase() ?? "UNPROCESSED"} · ${rendererCapabilities.label.toUpperCase()} · ${spectrumLayout.toUpperCase()}/${spectrumColorMode.toUpperCase()}`
                      : isMeterMode
                        ? `${resolvedMeterDynamics.attackMs}/${resolvedMeterDynamics.releaseMs} ms · ${rendererCapabilities.label.toUpperCase()} · ${meterLayout.toUpperCase()}/${meterColorMode.toUpperCase()}`
                        : `${rendererCapabilities.label.toUpperCase()} · ${orientation.toUpperCase()} · ${timeDomainSizing.toUpperCase()}`}
              </span>
            </div>
          </div>

          <section className="preset-section" aria-labelledby="preset-heading">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DETERMINISTIC SOURCES</span>
                <h2 id="preset-heading">Signal studies</h2>
              </div>
              <span>
                {renderer === "dom" || renderer === "webgl2"
                  ? `Canvas thumbnails · ${rendererCapabilities.label} is mode scoped`
                  : "Same component · four configurations"}
              </span>
            </div>
            <div className="preset-grid">
              {PRESETS.map((candidate) => {
                const selected = candidate.id === preset.id;
                return (
                  <button
                    type="button"
                    className="preset-card"
                    data-selected={selected}
                    aria-pressed={selected}
                    key={candidate.id}
                    onClick={() => {
                      setPresetId(candidate.id);
                      setSignalColor(candidate.color);
                    }}
                  >
                    <Waveform
                      ariaLabel={`${candidate.label} preset thumbnail`}
                      data={createDemoWaveform({
                        phase: candidate.phase,
                        sampleCount: 384,
                      })}
                      config={{
                        ...timeDomainConfig,
                        amplitudePlacement: "centered",
                        backgroundColor: "transparent",
                        channelLayout: "stacked",
                        channelMode: "source",
                        color: candidate.color,
                        lineWidth: 1,
                        mode: "waveform",
                        orientation: "horizontal",
                        padding: 4,
                        renderer: renderer === "dom" ? "canvas2d" : coreRenderer,
                        showCenterLine: false,
                      }}
                      height={50}
                    />
                    <span className="preset-copy">
                      <strong>{candidate.label}</strong>
                      <small>{selected ? "ACTIVE" : "LOAD PRESET"}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </section>
      </main>

      <aside className="inspector" aria-label="Waveform controls">
        <header className="inspector-header">
          <div>
            <span className="eyebrow">PLAYGROUND</span>
            <h2>Signal 013</h2>
          </div>
          <span className="version-tag">v0.1 core</span>
        </header>

        <div className="inspector-scroll">
          <ControlSection title="Source & transport">
            <StaticRow
              label="Source"
              value={
                microphoneSource
                  ? "Live microphone"
                  : recordedSource
                    ? "Local recorded audio"
                    : "Deterministic demo · session"
              }
            />
            {microphoneSource ? (
              <MicrophoneControl
                source={microphoneSource}
                onDisconnect={() => setMicrophoneSource(null)}
              />
            ) : (
              <button
                type="button"
                className="source-action"
                onClick={() => {
                  setRecordedSource(null);
                  setChannelMode("source");
                  setChannelLayout("stacked");
                  setChannelIndex(0);
                  if (fftSize === GUARDED_SPECTRUM_FFT_SIZE) {
                    setFftSize(32768);
                    setAllowLargeFft(false);
                  }
                  setMicrophoneSource(createMicrophoneSource());
                }}
              >
                Connect microphone
              </button>
            )}
            <label className="file-control">
              <span>Local audio</span>
              <span className="file-control-action">Choose file</span>
              <input
                aria-label="Load local audio"
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (!file) return;
                  setVisualMode("waveform");
                  setMicrophoneSource(null);
                  setChannelMode("source");
                  setChannelLayout("stacked");
                  setChannelIndex(0);
                  setRecordedSource(
                    createRecordedAudioSource(file, {
                      id: `local-${file.name}-${file.lastModified}`,
                      name: file.name,
                    }),
                  );
                }}
              />
            </label>
            <p className="control-note">
              {recordedSource
                ? "Decoded and played locally. The file never leaves this browser."
                : microphoneSource
                  ? "Capture started only after your action. Disconnect releases package-owned tracks."
                  : "No permission, network, or audio device required."}
            </p>
          </ControlSection>

          <ControlSection title="Visualization">
            <div className="mode-control" role="group" aria-label="Visual mode">
              <button
                type="button"
                aria-describedby={
                  renderer === "dom" || renderer === "webgl2" ? "renderer-support-note" : undefined
                }
                aria-pressed={visualMode === "waveform"}
                disabled={renderer === "dom" || renderer === "webgl2"}
                onClick={() => setVisualMode("waveform")}
              >
                Waveform
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource
                    ? "time-domain-source-limit"
                    : renderer === "dom" || renderer === "webgl2"
                      ? "renderer-support-note"
                      : undefined
                }
                aria-pressed={visualMode === "envelope"}
                disabled={Boolean(recordedSource) || renderer === "dom" || renderer === "webgl2"}
                onClick={() => setVisualMode("envelope")}
              >
                Envelope
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource
                    ? "time-domain-source-limit"
                    : renderer === "webgl2"
                      ? "renderer-support-note"
                      : undefined
                }
                aria-pressed={visualMode === "spectrum"}
                disabled={Boolean(recordedSource) || renderer === "webgl2"}
                onClick={() => setVisualMode("spectrum")}
              >
                Spectrum
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource
                    ? "time-domain-source-limit"
                    : renderer === "webgl2"
                      ? "renderer-support-note"
                      : undefined
                }
                aria-pressed={visualMode === "meter"}
                disabled={Boolean(recordedSource) || renderer === "webgl2"}
                onClick={() => setVisualMode("meter")}
              >
                Meter
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource
                    ? "time-domain-source-limit"
                    : renderer === "webgl2"
                      ? "renderer-support-note"
                      : undefined
                }
                aria-pressed={visualMode === "stepped-meter"}
                disabled={Boolean(recordedSource) || renderer === "webgl2"}
                onClick={() => setVisualMode("stepped-meter")}
              >
                Stepped meter
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "pulse-ring"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("pulse-ring")}
              >
                Pulse Ring
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "neon-lines"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("neon-lines")}
              >
                Neon Lines
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "equalizer-grid"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("equalizer-grid")}
              >
                Equalizer Grid
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "waveform-ribbon"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("waveform-ribbon")}
              >
                Waveform Ribbon
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "rounded-wobble-bars"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("rounded-wobble-bars")}
              >
                Wobble Bars
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "spectrum-bars"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("spectrum-bars")}
              >
                Spectrum Bars VFX
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "radial-spikes"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("radial-spikes")}
              >
                Radial Spikes
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "tunnel-waves"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("tunnel-waves")}
              >
                Tunnel Waves
              </button>
              <button
                type="button"
                aria-describedby={
                  recordedSource ? "time-domain-source-limit" : "renderer-support-note"
                }
                aria-pressed={visualMode === "vortex-rings"}
                disabled={Boolean(recordedSource) || renderer !== "webgl2"}
                onClick={() => setVisualMode("vortex-rings")}
              >
                Vortex Rings
              </button>
            </div>
            <SelectControl
              definition={{
                description:
                  "Switch the rendering adapter without replacing source or controlled editor state.",
                label: "Rendering engine",
                options: [
                  { label: "Canvas 2D", value: "canvas2d" },
                  { label: "SVG", value: "svg" },
                  { label: "DOM/CSS", value: "dom" },
                  { label: "WebGL2", value: "webgl2" },
                ],
              }}
              value={renderer}
              onChange={(value) => setRenderer(value as BuiltinRendererId)}
            />
            <p
              className="control-note"
              id={recordedSource ? "time-domain-source-limit" : undefined}
            >
              {recordedSource
                ? "Envelope, spectrum, and meters are disabled: this transport exposes bounded peaks, not raw PCM. Signed polarity remains in the player."
                : "Mode and engine are separate public contracts. WebGL2 exposes six clean-room VFX modes; core modes remain available through an explicit Canvas 2D fallback in the stage."}
            </p>
            <p
              className="capability-note"
              data-enabled={rendererSupport.enabled}
              data-renderer-support={renderer}
              id="renderer-support-note"
              role="status"
            >
              {rendererStatusCopy}
            </p>
          </ControlSection>

          <ControlSection title="Overlays & interaction">
            <ToggleControl
              checked={showOverlays}
              description="Semantic DOM regions, markers, inspection, and direct handles above every supported visual renderer."
              disabled={Boolean(recordedSource) || isVfxMode || !rendererSupport.enabled}
              disabledReason={
                recordedSource
                  ? "Recorded playback already exposes its controlled transport slider; raw overlay data is unavailable."
                  : isVfxMode
                    ? "Clean-room VFX surfaces keep editor overlays unmounted."
                    : rendererSupport.reasons.join(" ")
              }
              label="Semantic overlays"
              onChange={setShowOverlays}
            />
            <SelectControl
              definition={{
                description: "Logical direction for horizontal seeking and handle keyboard input.",
                label: "Overlay direction",
                options: [
                  { label: "Left to right", value: "ltr" },
                  { label: "Right to left", value: "rtl" },
                ],
              }}
              disabled={
                !showOverlays ||
                Boolean(recordedSource) ||
                radialOverlayUnavailable ||
                !isTimeOverlay
              }
              disabledReason={
                recordedSource
                  ? "Recorded playback exposes bounded peaks and its own transport, not raw overlay coordinates."
                  : !showOverlays
                    ? "Enable semantic overlays on a raw analysis source."
                    : radialOverlayUnavailable
                      ? "Direct one-dimensional handles are unavailable for radial layouts."
                      : !isTimeOverlay
                        ? "The current spectrum and meter renderers keep an LTR value axis; time overlays demonstrate RTL."
                        : "Overlay direction is available."
              }
              value={overlayDirection}
              onChange={(value) => setOverlayDirection(value as "ltr" | "rtl")}
            />
            {isTimeOverlay && !recordedSource ? (
              <>
                <RangeControl
                  label="Overlay playhead"
                  min={0}
                  max={1}
                  step={0.01}
                  value={playheadPosition}
                  valueLabel={`${Math.round(playheadPosition * 1000) / 10}%`}
                  disabled={!showOverlays}
                  disabledReason="Enable semantic overlays to control the playhead."
                  onChange={setPlayheadPosition}
                />
                <RangeControl
                  label="Selection start"
                  min={0}
                  max={Math.max(0, selectionRange.end - 0.01)}
                  step={0.01}
                  value={selectionRange.start}
                  valueLabel={`${Math.round(selectionRange.start * 1000) / 10}%`}
                  disabled={!showOverlays}
                  disabledReason="Enable semantic overlays to edit the selection."
                  onChange={(start) => setSelectionRange((current) => ({ ...current, start }))}
                />
                <RangeControl
                  label="Selection end"
                  min={Math.min(1, selectionRange.start + 0.01)}
                  max={1}
                  step={0.01}
                  value={selectionRange.end}
                  valueLabel={`${Math.round(selectionRange.end * 1000) / 10}%`}
                  disabled={!showOverlays}
                  disabledReason="Enable semantic overlays to edit the selection."
                  onChange={(end) => setSelectionRange((current) => ({ ...current, end }))}
                />
                <RangeControl
                  label="Loop start"
                  min={0}
                  max={Math.max(0, loopRange.end - 0.01)}
                  step={0.01}
                  value={loopRange.start}
                  valueLabel={`${Math.round(loopRange.start * 1000) / 10}%`}
                  disabled={!showOverlays}
                  disabledReason="Enable semantic overlays to edit the loop."
                  onChange={(start) => setLoopRange((current) => ({ ...current, start }))}
                />
                <RangeControl
                  label="Loop end"
                  min={Math.min(1, loopRange.start + 0.01)}
                  max={1}
                  step={0.01}
                  value={loopRange.end}
                  valueLabel={`${Math.round(loopRange.end * 1000) / 10}%`}
                  disabled={!showOverlays}
                  disabledReason="Enable semantic overlays to edit the loop."
                  onChange={(end) => setLoopRange((current) => ({ ...current, end }))}
                />
              </>
            ) : null}
            <StaticRow
              label="Direct handles"
              value={
                recordedSource
                  ? "Unavailable · recorded peaks"
                  : isVfxMode
                    ? "Unavailable · VFX surface"
                    : !showOverlays
                      ? "Hidden · overlays off"
                      : radialOverlayUnavailable
                        ? "Unavailable · radial"
                        : visualMode === "spectrum"
                          ? "Cutoff rail + dB thresholds"
                          : isMeterMode
                            ? "React + peak thresholds"
                            : "Seek + selection + loop"
              }
            />
            <StaticRow
              label="Inspection"
              value={
                recordedSource || radialOverlayUnavailable
                  ? isVfxMode
                    ? "Unavailable · VFX surface"
                    : "Unavailable"
                  : !showOverlays
                    ? "Enable overlays"
                    : overlayInspection === null
                      ? "Move over artifact"
                      : formatOverlayInspection(overlayInspection)
              }
            />
            <p className="control-note">{overlayEvent}</p>
          </ControlSection>

          {isMeterMode ? (
            <ControlSection title="Meter analysis">
              <SelectControl
                definition={{
                  description: "Peak captures transients; RMS measures sustained signal energy.",
                  label: "Measurement",
                  options: [
                    { label: "RMS", value: "rms" },
                    { label: "Peak", value: "peak" },
                  ],
                }}
                value={meterMeasurement}
                onChange={(value) => setMeterMeasurement(value as MeterMeasurement)}
              />
              <RangeControl
                label="Meter floor"
                min={-120}
                max={Math.min(-1, meterMaximumDecibels - 1)}
                step={1}
                value={meterMinimumDecibels}
                valueLabel={`${meterMinimumDecibels} dBFS`}
                onChange={(value) =>
                  setMeterMinimumDecibels(Math.min(value, meterMaximumDecibels - 1))
                }
              />
              <RangeControl
                label="Meter ceiling"
                min={Math.max(-60, meterMinimumDecibels + 1)}
                max={12}
                step={1}
                value={meterMaximumDecibels}
                valueLabel={`${meterMaximumDecibels} dBFS`}
                onChange={(value) =>
                  setMeterMaximumDecibels(Math.max(value, meterMinimumDecibels + 1))
                }
              />
              <p className="control-note">
                Values are dBFS referenced to linear amplitude 1. RMS and peak are computed
                independently from the selected PCM channels.
              </p>
            </ControlSection>
          ) : null}

          {visualMode === "spectrum" ? (
            <ControlSection title="Analysis">
              <SelectControl
                definition={spectrumControl("fftSize")}
                options={spectrumControl("fftSize").options?.map((option) => ({
                  ...option,
                  disabled: option.value === GUARDED_SPECTRUM_FFT_SIZE && !allowLargeFft,
                }))}
                value={fftSize}
                onChange={(value) => setFftSize(Number(value))}
              />
              <label className="toggle-control">
                <span>
                  <strong>{spectrumControl("allowLargeFft").label}</strong>
                  <small>
                    {microphoneSource
                      ? "Unavailable for live capture to protect frame cadence."
                      : spectrumControl("allowLargeFft").description}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={allowLargeFft}
                  disabled={Boolean(microphoneSource)}
                  onChange={(event) => {
                    const allowed = event.currentTarget.checked;
                    setAllowLargeFft(allowed);
                    if (!allowed && fftSize === GUARDED_SPECTRUM_FFT_SIZE) setFftSize(32768);
                  }}
                />
              </label>
              <SelectControl
                definition={spectrumControl("window")}
                value={spectrumWindow}
                onChange={(value) => setSpectrumWindow(value as SpectrumWindow)}
              />
              <RangeControl
                label={spectrumControl("powerOfSineExponent").label}
                min={0.1}
                max={10}
                step={0.1}
                value={powerOfSineExponent}
                valueLabel={`${powerOfSineExponent.toFixed(1)}×`}
                disabled={!powerExponentAvailability.enabled}
                disabledReason={powerExponentAvailability.reason}
                onChange={setPowerOfSineExponent}
              />
              <SelectControl
                definition={spectrumControl("frequencyScale")}
                value={frequencyScale}
                onChange={(value) => setFrequencyScale(value as SpectrumFrequencyScale)}
              />
              <RangeControl
                label={spectrumControl("lowFrequency").label}
                min={0}
                max={nyquist}
                step={10}
                value={Math.min(lowFrequency, nyquist)}
                valueLabel={formatFrequency(lowFrequency)}
                onChange={(value) => setLowFrequency(Math.min(value, highFrequency - 10))}
              />
              <RangeControl
                label={spectrumControl("highFrequency").label}
                min={0}
                max={nyquist}
                step={10}
                value={Math.min(highFrequency, nyquist)}
                valueLabel={formatFrequency(Math.min(highFrequency, nyquist))}
                onChange={(value) => setHighFrequency(Math.max(value, lowFrequency + 10))}
              />
              <RangeControl
                label={spectrumControl("minimumDecibels").label}
                min={-180}
                max={Math.min(-1, maximumDecibels - 1)}
                step={1}
                value={minimumDecibels}
                valueLabel={`${minimumDecibels} dBFS`}
                onChange={(value) => setMinimumDecibels(Math.min(value, maximumDecibels - 1))}
              />
              <RangeControl
                label={spectrumControl("maximumDecibels").label}
                min={Math.max(-120, minimumDecibels + 1)}
                max={12}
                step={1}
                value={maximumDecibels}
                valueLabel={`${maximumDecibels} dBFS`}
                onChange={(value) => setMaximumDecibels(Math.max(value, minimumDecibels + 1))}
              />
            </ControlSection>
          ) : null}

          {visualMode === "spectrum" ? (
            <>
              <ControlSection title="Dynamics">
                <SelectControl
                  definition={{
                    description: "Frame-rate-independent temporal response",
                    label: "Smoothing",
                    options: [
                      { label: "None", value: "none" },
                      { label: "Simple EMA", value: "ema" },
                      { label: "Attack / release", value: "time-variant-ema" },
                    ],
                  }}
                  disabled={!microphoneSource}
                  disabledReason={temporalCapabilityReason}
                  value={dynamicsSettings.smoothingMode}
                  onChange={(value) =>
                    updateDynamics({
                      smoothingMode: value as SpectrumSmoothingMode,
                    })
                  }
                />
                {dynamicsSettings.smoothingMode === "ema" ? (
                  <RangeControl
                    label="EMA persistence"
                    min={0}
                    max={0.99}
                    step={0.01}
                    value={dynamicsSettings.smoothingFactor}
                    valueLabel={dynamicsSettings.smoothingFactor.toFixed(2)}
                    disabled={!microphoneSource}
                    disabledReason={temporalCapabilityReason}
                    onChange={(value) => updateDynamics({ smoothingFactor: value })}
                  />
                ) : dynamicsSettings.smoothingMode === "time-variant-ema" ? (
                  <>
                    <RangeControl
                      label="Attack"
                      min={0}
                      max={1000}
                      step={5}
                      value={dynamicsSettings.attackMs}
                      valueLabel={`${dynamicsSettings.attackMs} ms`}
                      disabled={!microphoneSource}
                      disabledReason={temporalCapabilityReason}
                      onChange={(value) => updateDynamics({ attackMs: value })}
                    />
                    <RangeControl
                      label="Release"
                      min={0}
                      max={2000}
                      step={10}
                      value={dynamicsSettings.releaseMs}
                      valueLabel={`${dynamicsSettings.releaseMs} ms`}
                      disabled={!microphoneSource}
                      disabledReason={temporalCapabilityReason}
                      onChange={(value) => updateDynamics({ releaseMs: value })}
                    />
                  </>
                ) : null}
                <RangeControl
                  label="Inertia"
                  min={0}
                  max={1000}
                  step={5}
                  value={dynamicsSettings.inertiaMs}
                  valueLabel={`${dynamicsSettings.inertiaMs} ms`}
                  disabled={!microphoneSource}
                  disabledReason={temporalCapabilityReason}
                  onChange={(value) => updateDynamics({ inertiaMs: value })}
                />
                <ToggleControl
                  checked={dynamicsSettings.fastPeaks}
                  description="Rising bins bypass temporal smoothing"
                  disabled={!microphoneSource}
                  disabledReason={temporalCapabilityReason}
                  label="Fast peaks"
                  onChange={(fastPeaks) => updateDynamics({ fastPeaks })}
                />
                <RangeControl
                  label="React threshold"
                  min={minimumDecibels}
                  max={dynamicsSettings.peakThresholdDb}
                  step={1}
                  value={dynamicsConfig.reactThresholdDb}
                  valueLabel={`${dynamicsConfig.reactThresholdDb} dBFS`}
                  onChange={(reactThresholdDb) => updateDynamics({ reactThresholdDb })}
                />
                <RangeControl
                  label="Peak threshold"
                  min={dynamicsSettings.reactThresholdDb}
                  max={maximumDecibels}
                  step={1}
                  value={dynamicsConfig.peakThresholdDb}
                  valueLabel={`${dynamicsConfig.peakThresholdDb} dBFS`}
                  onChange={(peakThresholdDb) => updateDynamics({ peakThresholdDb })}
                />
                <ToggleControl
                  checked={dynamicsSettings.normalizationEnabled}
                  description="Move valid signal toward a target with a hard gain cap"
                  label="Normalization"
                  onChange={(normalizationEnabled) => updateDynamics({ normalizationEnabled })}
                />
                {dynamicsSettings.normalizationEnabled ? (
                  <>
                    <RangeControl
                      label="Normalization target"
                      min={minimumDecibels}
                      max={maximumDecibels}
                      step={1}
                      value={dynamicsConfig.normalizationTargetDb}
                      valueLabel={`${dynamicsConfig.normalizationTargetDb} dBFS`}
                      onChange={(normalizationTargetDb) =>
                        updateDynamics({ normalizationTargetDb })
                      }
                    />
                    <RangeControl
                      label="Maximum gain"
                      min={0}
                      max={36}
                      step={1}
                      value={dynamicsSettings.normalizationMaxGainDb}
                      valueLabel={`+${dynamicsSettings.normalizationMaxGainDb} dB`}
                      onChange={(normalizationMaxGainDb) =>
                        updateDynamics({ normalizationMaxGainDb })
                      }
                    />
                  </>
                ) : null}
              </ControlSection>

              <ControlSection title="Spectral filtering">
                <RangeControl
                  label="Gaussian radius"
                  min={0}
                  max={8}
                  step={0.25}
                  value={dynamicsSettings.gaussianRadius}
                  valueLabel={`${dynamicsSettings.gaussianRadius.toFixed(2)} bins`}
                  onChange={(gaussianRadius) => updateDynamics({ gaussianRadius })}
                />
                <RangeControl
                  label="High-frequency slope"
                  min={-24}
                  max={24}
                  step={0.5}
                  value={dynamicsSettings.highFrequencySlopeDbPerOctave}
                  valueLabel={`${formatSigned(dynamicsSettings.highFrequencySlopeDbPerOctave)} dB/oct`}
                  onChange={(highFrequencySlopeDbPerOctave) =>
                    updateDynamics({ highFrequencySlopeDbPerOctave })
                  }
                />
                <RangeControl
                  label="Slope reference"
                  min={20}
                  max={Math.min(12_000, nyquist)}
                  step={10}
                  value={Math.min(dynamicsSettings.highFrequencySlopeReference, nyquist)}
                  valueLabel={formatFrequency(dynamicsSettings.highFrequencySlopeReference)}
                  onChange={(highFrequencySlopeReference) =>
                    updateDynamics({ highFrequencySlopeReference })
                  }
                />
                <RangeControl
                  label="Roll-off bandwidth"
                  min={0}
                  max={Math.min(10_000, nyquist)}
                  step={100}
                  value={Math.min(dynamicsSettings.rolloffBandwidthHz, nyquist)}
                  valueLabel={formatFrequency(dynamicsSettings.rolloffBandwidthHz)}
                  onChange={(rolloffBandwidthHz) => updateDynamics({ rolloffBandwidthHz })}
                />
                <RangeControl
                  label="Roll-off attenuation"
                  min={0}
                  max={60}
                  step={1}
                  value={dynamicsSettings.rolloffAttenuationDb}
                  valueLabel={`${dynamicsSettings.rolloffAttenuationDb} dB`}
                  onChange={(rolloffAttenuationDb) => updateDynamics({ rolloffAttenuationDb })}
                />
              </ControlSection>

              <ControlSection title="Source policy">
                <RangeControl
                  label="Silence threshold"
                  min={minimumDecibels}
                  max={Math.min(-1, maximumDecibels)}
                  step={1}
                  value={dynamicsConfig.silenceThresholdDb}
                  valueLabel={`${dynamicsConfig.silenceThresholdDb} dBFS`}
                  disabled={!microphoneSource}
                  disabledReason={temporalCapabilityReason}
                  onChange={(silenceThresholdDb) => updateDynamics({ silenceThresholdDb })}
                />
                <ToggleControl
                  checked={dynamicsSettings.hideSilent}
                  description="Hide the visual surface after the source enters silent state"
                  disabled={!microphoneSource}
                  disabledReason={temporalCapabilityReason}
                  label="Hide silent input"
                  onChange={(hideSilent) => updateDynamics({ hideSilent })}
                />
                <ToggleControl
                  checked={dynamicsSettings.processMuted}
                  description="Off holds the last frame instead of processing muted input"
                  disabled={!microphoneSource}
                  disabledReason={temporalCapabilityReason}
                  label="Process muted input"
                  onChange={(processMuted) => updateDynamics({ processMuted })}
                />
                <RangeControl
                  label="Visual sync offset"
                  min={-500}
                  max={1000}
                  step={10}
                  value={visualSyncOffsetMs}
                  valueLabel={`${formatSigned(visualSyncOffsetMs)} ms`}
                  disabled={!microphoneSource}
                  disabledReason={syncCapabilityReason}
                  onChange={setVisualSyncOffsetMs}
                />
                <p className="control-note">
                  Positive values buffer visuals only. This package never delays host audio;
                  negative values require a source that can provide future frames.
                </p>
              </ControlSection>
            </>
          ) : null}

          {isMeterMode ? (
            <ControlSection title="Meter ballistics & history">
              <SelectControl
                definition={{
                  description: "Named response curves with explicit measurement semantics.",
                  label: "Meter preset",
                  options: METER_PRESETS.map((candidate) => ({
                    label: candidate.label,
                    value: candidate.id,
                  })),
                }}
                value={meterPresetId}
                onChange={(value) => loadMeterPreset(value as (typeof METER_PRESETS)[number]["id"])}
              />
              <RangeControl
                label="Meter attack"
                min={0}
                max={2000}
                step={5}
                value={resolvedMeterDynamics.attackMs}
                valueLabel={`${resolvedMeterDynamics.attackMs} ms`}
                onChange={(attackMs) => updateMeterDynamics({ attackMs })}
              />
              <RangeControl
                label="Meter release"
                min={0}
                max={4000}
                step={10}
                value={resolvedMeterDynamics.releaseMs}
                valueLabel={`${resolvedMeterDynamics.releaseMs} ms`}
                onChange={(releaseMs) => updateMeterDynamics({ releaseMs })}
              />
              <RangeControl
                label="Meter inertia"
                min={0}
                max={2000}
                step={5}
                value={resolvedMeterDynamics.inertiaMs}
                valueLabel={`${resolvedMeterDynamics.inertiaMs} ms`}
                onChange={(inertiaMs) => updateMeterDynamics({ inertiaMs })}
              />
              <ToggleControl
                checked={resolvedMeterDynamics.fastPeaks}
                description="Peak rises immediately while RMS retains its configured attack."
                label="Fast meter peaks"
                onChange={(fastPeaks) => updateMeterDynamics({ fastPeaks })}
              />
              <RangeControl
                label="React level"
                min={meterMinimumDecibels}
                max={resolvedMeterDynamics.peakThresholdDb}
                step={1}
                value={resolvedMeterDynamics.reactThresholdDb}
                valueLabel={`${resolvedMeterDynamics.reactThresholdDb} dBFS`}
                onChange={(reactThresholdDb) => updateMeterDynamics({ reactThresholdDb })}
              />
              <RangeControl
                label="Peak level"
                min={resolvedMeterDynamics.reactThresholdDb}
                max={meterMaximumDecibels}
                step={1}
                value={resolvedMeterDynamics.peakThresholdDb}
                valueLabel={`${resolvedMeterDynamics.peakThresholdDb} dBFS`}
                onChange={(peakThresholdDb) => updateMeterDynamics({ peakThresholdDb })}
              />
              <RangeControl
                label="History duration"
                min={100}
                max={10_000}
                step={100}
                value={resolvedMeterDynamics.historyDurationMs}
                valueLabel={`${(resolvedMeterDynamics.historyDurationMs / 1000).toFixed(1)} s`}
                onChange={(historyDurationMs) => updateMeterDynamics({ historyDurationMs })}
              />
              <RangeControl
                label="History interval"
                min={5}
                max={500}
                step={5}
                value={resolvedMeterDynamics.historyIntervalMs}
                valueLabel={`${resolvedMeterDynamics.historyIntervalMs} ms`}
                onChange={(historyIntervalMs) => updateMeterDynamics({ historyIntervalMs })}
              />
              <ToggleControl
                checked={showMeterHistory}
                description="Draw recent response ghosts; analysis history remains bounded either way."
                label="Show meter history"
                onChange={setShowMeterHistory}
              />
              <RangeControl
                label="History opacity"
                min={0}
                max={1}
                step={0.01}
                value={meterHistoryOpacity}
                valueLabel={`${Math.round(meterHistoryOpacity * 100)}%`}
                disabled={!showMeterHistory}
                disabledReason="Enable meter history to tune its visual opacity."
                onChange={setMeterHistoryOpacity}
              />
              <p className="control-note">
                Capacity {meterPresentation.historyCapacity.toLocaleString()} frames · hard ceiling
                16,384 · reset on source epoch, channel count, sample rate, or backwards time.
              </p>
            </ControlSection>
          ) : null}

          <ControlSection title="Geometry">
            {isVfxMode ? (
              <>
                <SelectControl
                  definition={{
                    description:
                      "Deterministic energy input for normal, silent, and hostile-overload proof.",
                    label: "Energy fixture",
                    options: [
                      { label: "Signal · analyzed bands", value: "signal" },
                      { label: "Zero · silent bands", value: "zero" },
                      { label: "Overload · clipped bounds", value: "overload" },
                    ],
                  }}
                  value={vfxEnergyScenario}
                  onChange={(value) => setVfxEnergyScenario(value as VfxEnergyScenario)}
                />
                <SelectControl
                  definition={{
                    description:
                      "Build ordered VFX bands from logarithmic musical spacing or equal-width frequency intervals.",
                    label: "Band spacing",
                    options: [
                      { label: "Logarithmic", value: "log" },
                      { label: "Linear", value: "linear" },
                    ],
                  }}
                  value={vfxBandScale}
                  onChange={(value) => setVfxBandScale(value as SpectrumFrequencyScale)}
                />
              </>
            ) : null}
            {isPulseRingMode ? (
              <>
                <RangeControl
                  label="Ring thickness"
                  min={0.01}
                  max={0.18}
                  step={0.005}
                  value={pulseRingThickness}
                  valueLabel={`${(pulseRingThickness * 100).toFixed(1)}%`}
                  onChange={setPulseRingThickness}
                />
                <RangeControl
                  label="Glow strength"
                  min={0}
                  max={2}
                  step={0.05}
                  value={pulseRingGlow}
                  valueLabel={`${pulseRingGlow.toFixed(2)}×`}
                  onChange={setPulseRingGlow}
                />
                <RangeControl
                  label="Rotation speed"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={pulseRingRotation}
                  valueLabel={`${pulseRingRotation.toFixed(2)} rev/s`}
                  onChange={setPulseRingRotation}
                />
                <RangeControl
                  label="Band reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={pulseRingReactivity}
                  valueLabel={`${pulseRingReactivity.toFixed(2)}×`}
                  onChange={setPulseRingReactivity}
                />
                <SelectControl
                  definition={{
                    description:
                      "Follow the OS preference, animate continuously, or draw one deterministic frame.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={pulseRingMotion}
                  onChange={(value) => setPulseRingMotion(value as VfxMotion)}
                />
                <SelectControl
                  definition={{
                    description:
                      "Bound the backing-buffer DPR and pixel allocation without changing CSS size.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={pulseRingQuality}
                  onChange={(value) => setPulseRingQuality(value as PulseRingQuality)}
                />
                <p className="control-note">
                  Eight ordered logarithmic energy bands drive one bounded full-screen triangle. No
                  textures are allocated.
                </p>
              </>
            ) : isNeonLinesMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Load an immutable, fully specified Neon Lines configuration.",
                    label: "VFX preset",
                    options: [
                      ...NEON_LINES_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={neonLinesPresetId}
                  onChange={loadNeonLinesPreset}
                />
                <RangeControl
                  label="Line count"
                  min={2}
                  max={12}
                  step={1}
                  value={neonLinesConfig.lineCount}
                  valueLabel={`${neonLinesConfig.lineCount} lines`}
                  onChange={(lineCount) => updateNeonLines({ lineCount })}
                />
                <RangeControl
                  label="Wave height"
                  min={0.02}
                  max={0.45}
                  step={0.01}
                  value={neonLinesConfig.waveHeight}
                  valueLabel={`${Math.round(neonLinesConfig.waveHeight * 100)}%`}
                  onChange={(waveHeight) => updateNeonLines({ waveHeight })}
                />
                <RangeControl
                  label="Flow speed"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={neonLinesConfig.flowSpeed}
                  valueLabel={`${neonLinesConfig.flowSpeed.toFixed(2)} cycles/s`}
                  onChange={(flowSpeed) => updateNeonLines({ flowSpeed })}
                />
                <RangeControl
                  label="Line thickness"
                  min={0.002}
                  max={0.04}
                  step={0.001}
                  value={neonLinesConfig.lineThickness}
                  valueLabel={`${(neonLinesConfig.lineThickness * 100).toFixed(1)}%`}
                  onChange={(lineThickness) => updateNeonLines({ lineThickness })}
                />
                <RangeControl
                  label="Glow size"
                  min={0}
                  max={3}
                  step={0.05}
                  value={neonLinesConfig.glowSize}
                  valueLabel={`${neonLinesConfig.glowSize.toFixed(2)}×`}
                  onChange={(glowSize) => updateNeonLines({ glowSize })}
                />
                <RangeControl
                  label="Energy reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={neonLinesConfig.energyReactivity}
                  valueLabel={`${neonLinesConfig.energyReactivity.toFixed(2)}×`}
                  onChange={(energyReactivity) => updateNeonLines({ energyReactivity })}
                />
                <SelectControl
                  definition={{
                    description:
                      "Follow the OS preference, animate continuously, or draw one deterministic frame.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={neonLinesConfig.motion}
                  onChange={(motion) => updateNeonLines({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={neonLinesConfig.quality}
                  onChange={(quality) => updateNeonLines({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  Maximum 12 shader iterations · 16 sampled bands · one fullscreen triangle · no
                  textures.
                </p>
              </>
            ) : isEqualizerGridMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Load an immutable, fully specified Equalizer Grid configuration.",
                    label: "VFX preset",
                    options: [
                      ...EQUALIZER_GRID_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={equalizerGridPresetId}
                  onChange={loadEqualizerGridPreset}
                />
                <RangeControl
                  label="Grid columns"
                  min={4}
                  max={48}
                  step={1}
                  value={equalizerGridConfig.gridColumns}
                  valueLabel={`${equalizerGridConfig.gridColumns} columns`}
                  onChange={(gridColumns) => updateEqualizerGrid({ gridColumns })}
                />
                <RangeControl
                  label="Grid rows"
                  min={2}
                  max={24}
                  step={1}
                  value={equalizerGridConfig.gridRows}
                  valueLabel={`${equalizerGridConfig.gridRows} rows`}
                  onChange={(gridRows) => updateEqualizerGrid({ gridRows })}
                />
                <RangeControl
                  label="Cell gap"
                  min={0}
                  max={0.45}
                  step={0.01}
                  value={equalizerGridConfig.cellGap}
                  valueLabel={`${Math.round(equalizerGridConfig.cellGap * 100)}%`}
                  onChange={(cellGap) => updateEqualizerGrid({ cellGap })}
                />
                <RangeControl
                  label="Cell reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={equalizerGridConfig.cellReactivity}
                  valueLabel={`${equalizerGridConfig.cellReactivity.toFixed(2)}×`}
                  onChange={(cellReactivity) => updateEqualizerGrid({ cellReactivity })}
                />
                <RangeControl
                  label="Shimmer speed"
                  min={0}
                  max={2}
                  step={0.05}
                  value={equalizerGridConfig.randomSpeed}
                  valueLabel={`${equalizerGridConfig.randomSpeed.toFixed(2)} cycles/s`}
                  onChange={(randomSpeed) => updateEqualizerGrid({ randomSpeed })}
                />
                <SelectControl
                  definition={{
                    description:
                      "Follow the OS preference, animate continuously, or draw one deterministic frame.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={equalizerGridConfig.motion}
                  onChange={(motion) => updateEqualizerGrid({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={equalizerGridConfig.quality}
                  onChange={(quality) => updateEqualizerGrid({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  Procedural O(1) cell addressing · maximum 48×24 logical grid · 16 sampled bands ·
                  no textures.
                </p>
              </>
            ) : isWaveformRibbonMode ? (
              <>
                <SelectControl
                  definition={{
                    description:
                      "Load an immutable, fully specified Waveform Ribbon configuration.",
                    label: "VFX preset",
                    options: [
                      ...WAVEFORM_RIBBON_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={waveformRibbonPresetId}
                  onChange={loadWaveformRibbonPreset}
                />
                <RangeControl
                  label="Wave height"
                  min={0.02}
                  max={0.38}
                  step={0.01}
                  value={waveformRibbonConfig.waveHeight}
                  valueLabel={`${Math.round(waveformRibbonConfig.waveHeight * 100)}%`}
                  onChange={(waveHeight) => updateWaveformRibbon({ waveHeight })}
                />
                <RangeControl
                  label="Flow speed"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={waveformRibbonConfig.flowSpeed}
                  valueLabel={`${waveformRibbonConfig.flowSpeed.toFixed(2)} cycles/s`}
                  onChange={(flowSpeed) => updateWaveformRibbon({ flowSpeed })}
                />
                <RangeControl
                  label="Ribbon thickness"
                  min={0.015}
                  max={0.28}
                  step={0.005}
                  value={waveformRibbonConfig.ribbonThickness}
                  valueLabel={`${(waveformRibbonConfig.ribbonThickness * 100).toFixed(1)}%`}
                  onChange={(ribbonThickness) => updateWaveformRibbon({ ribbonThickness })}
                />
                <RangeControl
                  label="Glow strength"
                  min={0}
                  max={3}
                  step={0.05}
                  value={waveformRibbonConfig.glowStrength}
                  valueLabel={`${waveformRibbonConfig.glowStrength.toFixed(2)}×`}
                  onChange={(glowStrength) => updateWaveformRibbon({ glowStrength })}
                />
                <RangeControl
                  label="Reflection"
                  min={0}
                  max={1}
                  step={0.05}
                  value={waveformRibbonConfig.reflectionStrength}
                  valueLabel={`${Math.round(waveformRibbonConfig.reflectionStrength * 100)}%`}
                  onChange={(reflectionStrength) => updateWaveformRibbon({ reflectionStrength })}
                />
                <RangeControl
                  label="Energy reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={waveformRibbonConfig.energyReactivity}
                  valueLabel={`${waveformRibbonConfig.energyReactivity.toFixed(2)}×`}
                  onChange={(energyReactivity) => updateWaveformRibbon({ energyReactivity })}
                />
                <SelectControl
                  definition={{
                    description: "Follow the OS preference, animate, or draw one stable phase.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={waveformRibbonConfig.motion}
                  onChange={(motion) => updateWaveformRibbon({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={waveformRibbonConfig.quality}
                  onChange={(quality) => updateWaveformRibbon({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  One procedural ribbon plus bounded reflection · 16 ordered bands · one fullscreen
                  triangle · no textures.
                </p>
              </>
            ) : isRoundedWobbleBarsMode ? (
              <>
                <SelectControl
                  definition={{
                    description:
                      "Load an immutable, fully specified Rounded Wobble Bars configuration.",
                    label: "VFX preset",
                    options: [
                      ...ROUNDED_WOBBLE_BARS_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={roundedWobbleBarsPresetId}
                  onChange={loadRoundedWobbleBarsPreset}
                />
                <RangeControl
                  label="Bar count"
                  min={4}
                  max={64}
                  step={1}
                  value={roundedWobbleBarsConfig.barCount}
                  valueLabel={`${roundedWobbleBarsConfig.barCount} bars`}
                  onChange={(barCount) => updateRoundedWobbleBars({ barCount })}
                />
                <RangeControl
                  label="Wobble intensity"
                  min={0}
                  max={1}
                  step={0.05}
                  value={roundedWobbleBarsConfig.wobbleIntensity}
                  valueLabel={`${roundedWobbleBarsConfig.wobbleIntensity.toFixed(2)}×`}
                  onChange={(wobbleIntensity) => updateRoundedWobbleBars({ wobbleIntensity })}
                />
                <ToggleControl
                  checked={roundedWobbleBarsConfig.mirrorVertically}
                  description="Reflect every rounded bar around the central baseline."
                  label="Mirror vertically"
                  onChange={(mirrorVertically) => updateRoundedWobbleBars({ mirrorVertically })}
                />
                <RangeControl
                  label="Bar gap"
                  min={0}
                  max={0.78}
                  step={0.01}
                  value={roundedWobbleBarsConfig.barGap}
                  valueLabel={`${Math.round(roundedWobbleBarsConfig.barGap * 100)}%`}
                  onChange={(barGap) => updateRoundedWobbleBars({ barGap })}
                />
                <RangeControl
                  label="Glow intensity"
                  min={0}
                  max={3}
                  step={0.05}
                  value={roundedWobbleBarsConfig.glowIntensity}
                  valueLabel={`${roundedWobbleBarsConfig.glowIntensity.toFixed(2)}×`}
                  onChange={(glowIntensity) => updateRoundedWobbleBars({ glowIntensity })}
                />
                <RangeControl
                  label="Energy reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={roundedWobbleBarsConfig.energyReactivity}
                  valueLabel={`${roundedWobbleBarsConfig.energyReactivity.toFixed(2)}×`}
                  onChange={(energyReactivity) => updateRoundedWobbleBars({ energyReactivity })}
                />
                <SelectControl
                  definition={{
                    description: "Follow the OS preference, animate, or draw one stable phase.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={roundedWobbleBarsConfig.motion}
                  onChange={(motion) => updateRoundedWobbleBars({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={roundedWobbleBarsConfig.quality}
                  onChange={(quality) =>
                    updateRoundedWobbleBars({ quality: quality as VfxQuality })
                  }
                />
                <p className="control-note">
                  Procedural O(1) addressing · maximum 64 rounded bars · 16 ordered bands · no
                  density-sized buffers or textures.
                </p>
              </>
            ) : isSpectrumBarsVfxMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Load an immutable, fully specified Spectrum Bars configuration.",
                    label: "VFX preset",
                    options: [
                      ...SPECTRUM_BARS_VFX_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={spectrumBarsVfxPresetId}
                  onChange={loadSpectrumBarsVfxPreset}
                />
                <RangeControl
                  label="Bar count"
                  min={4}
                  max={96}
                  step={1}
                  value={spectrumBarsVfxConfig.barCount}
                  valueLabel={`${spectrumBarsVfxConfig.barCount} bars`}
                  onChange={(barCount) => updateSpectrumBarsVfx({ barCount })}
                />
                <RangeControl
                  label="Height reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={spectrumBarsVfxConfig.heightReactivity}
                  valueLabel={`${spectrumBarsVfxConfig.heightReactivity.toFixed(2)}×`}
                  onChange={(heightReactivity) => updateSpectrumBarsVfx({ heightReactivity })}
                />
                <RangeControl
                  label="Gap size"
                  min={0}
                  max={0.82}
                  step={0.01}
                  value={spectrumBarsVfxConfig.gapSize}
                  valueLabel={`${Math.round(spectrumBarsVfxConfig.gapSize * 100)}%`}
                  onChange={(gapSize) => updateSpectrumBarsVfx({ gapSize })}
                />
                <RangeControl
                  label="Baseline position"
                  min={0.05}
                  max={0.72}
                  step={0.01}
                  value={spectrumBarsVfxConfig.verticalPosition}
                  valueLabel={`${Math.round(spectrumBarsVfxConfig.verticalPosition * 100)}%`}
                  onChange={(verticalPosition) => updateSpectrumBarsVfx({ verticalPosition })}
                />
                <RangeControl
                  label="Random speed"
                  min={0}
                  max={2}
                  step={0.05}
                  value={spectrumBarsVfxConfig.randomSpeed}
                  valueLabel={`${spectrumBarsVfxConfig.randomSpeed.toFixed(2)} cycles/s`}
                  onChange={(randomSpeed) => updateSpectrumBarsVfx({ randomSpeed })}
                />
                <RangeControl
                  label="Glow strength"
                  min={0}
                  max={3}
                  step={0.05}
                  value={spectrumBarsVfxConfig.glowStrength}
                  valueLabel={`${spectrumBarsVfxConfig.glowStrength.toFixed(2)}×`}
                  onChange={(glowStrength) => updateSpectrumBarsVfx({ glowStrength })}
                />
                <SelectControl
                  definition={{
                    description: "Follow the OS preference, animate, or freeze shimmer.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={spectrumBarsVfxConfig.motion}
                  onChange={(motion) => updateSpectrumBarsVfx({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={spectrumBarsVfxConfig.quality}
                  onChange={(quality) => updateSpectrumBarsVfx({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  Procedural O(1) addressing · maximum 96 bars · 16 ordered bands · no density-sized
                  buffers or textures.
                </p>
              </>
            ) : isRadialSpikesMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Load an immutable, fully specified Radial Spikes configuration.",
                    label: "VFX preset",
                    options: [
                      ...RADIAL_SPIKES_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={radialSpikesPresetId}
                  onChange={loadRadialSpikesPreset}
                />
                <RangeControl
                  label="Spike count"
                  min={4}
                  max={128}
                  step={1}
                  value={radialSpikesConfig.spikeCount}
                  valueLabel={`${radialSpikesConfig.spikeCount} spikes`}
                  onChange={(spikeCount) => updateRadialSpikes({ spikeCount })}
                />
                <RangeControl
                  label="Base radius"
                  min={0.12}
                  max={0.62}
                  step={0.01}
                  value={radialSpikesConfig.baseRadius}
                  valueLabel={`${Math.round(radialSpikesConfig.baseRadius * 100)}% half-stage`}
                  onChange={(baseRadius) => updateRadialSpikes({ baseRadius })}
                />
                <RangeControl
                  label="Spike height"
                  min={0.02}
                  max={Math.min(0.6, 0.92 - radialSpikesConfig.baseRadius)}
                  step={0.01}
                  value={radialSpikesConfig.spikeHeight}
                  valueLabel={`${Math.round(radialSpikesConfig.spikeHeight * 100)}% half-stage`}
                  onChange={(spikeHeight) => updateRadialSpikes({ spikeHeight })}
                />
                <RangeControl
                  label="Spike width"
                  min={0.08}
                  max={0.92}
                  step={0.01}
                  value={radialSpikesConfig.spikeWidth}
                  valueLabel={`${Math.round(radialSpikesConfig.spikeWidth * 100)}% cell`}
                  onChange={(spikeWidth) => updateRadialSpikes({ spikeWidth })}
                />
                <RangeControl
                  label="Arc"
                  min={30}
                  max={360}
                  step={1}
                  value={radialSpikesConfig.arcDegrees}
                  valueLabel={`${radialSpikesConfig.arcDegrees}°`}
                  onChange={(arcDegrees) => updateRadialSpikes({ arcDegrees })}
                />
                <RangeControl
                  label="Rotation"
                  min={-180}
                  max={180}
                  step={1}
                  value={radialSpikesConfig.rotationDegrees}
                  valueLabel={`${radialSpikesConfig.rotationDegrees}°`}
                  onChange={(rotationDegrees) => updateRadialSpikes({ rotationDegrees })}
                />
                <RangeControl
                  label="Energy reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={radialSpikesConfig.energyReactivity}
                  valueLabel={`${radialSpikesConfig.energyReactivity.toFixed(2)}×`}
                  onChange={(energyReactivity) => updateRadialSpikes({ energyReactivity })}
                />
                <RangeControl
                  label="Glow strength"
                  min={0}
                  max={3}
                  step={0.05}
                  value={radialSpikesConfig.glowStrength}
                  valueLabel={`${radialSpikesConfig.glowStrength.toFixed(2)}×`}
                  onChange={(glowStrength) => updateRadialSpikes({ glowStrength })}
                />
                <SelectControl
                  definition={{
                    description: "Follow the OS preference, animate brightness, or freeze phase.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={radialSpikesConfig.motion}
                  onChange={(motion) => updateRadialSpikes({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={radialSpikesConfig.quality}
                  onChange={(quality) => updateRadialSpikes({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  Procedural angular addressing · maximum 128 spikes · combined reach capped at 0.92
                  half-stage · 16 ordered bands · no density-sized buffers or textures.
                </p>
              </>
            ) : isTunnelWavesMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Load an immutable, fully specified Tunnel Waves configuration.",
                    label: "VFX preset",
                    options: [
                      ...TUNNEL_WAVES_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={tunnelWavesPresetId}
                  onChange={loadTunnelWavesPreset}
                />
                <RangeControl
                  label="Ring density"
                  min={3}
                  max={48}
                  step={1}
                  value={tunnelWavesConfig.ringDensity}
                  valueLabel={`${tunnelWavesConfig.ringDensity} rings`}
                  onChange={(ringDensity) => updateTunnelWaves({ ringDensity })}
                />
                <RangeControl
                  label="Tunnel speed"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={tunnelWavesConfig.tunnelSpeed}
                  valueLabel={`${tunnelWavesConfig.tunnelSpeed.toFixed(2)} cycles/s`}
                  onChange={(tunnelSpeed) => updateTunnelWaves({ tunnelSpeed })}
                />
                <RangeControl
                  label="Tunnel depth"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={tunnelWavesConfig.tunnelDepth}
                  valueLabel={`${Math.round(tunnelWavesConfig.tunnelDepth * 100)}%`}
                  onChange={(tunnelDepth) => updateTunnelWaves({ tunnelDepth })}
                />
                <RangeControl
                  label="Energy reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={tunnelWavesConfig.energyReactivity}
                  valueLabel={`${tunnelWavesConfig.energyReactivity.toFixed(2)}×`}
                  onChange={(energyReactivity) => updateTunnelWaves({ energyReactivity })}
                />
                <RangeControl
                  label="Glow strength"
                  min={0}
                  max={3}
                  step={0.05}
                  value={tunnelWavesConfig.glowStrength}
                  valueLabel={`${tunnelWavesConfig.glowStrength.toFixed(2)}×`}
                  onChange={(glowStrength) => updateTunnelWaves({ glowStrength })}
                />
                <SelectControl
                  definition={{
                    description: "Follow the OS preference, travel, or freeze the tunnel phase.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={tunnelWavesConfig.motion}
                  onChange={(motion) => updateTunnelWaves({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={tunnelWavesConfig.quality}
                  onChange={(quality) => updateTunnelWaves({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  Perspective field with maximum 48 procedural intervals · radial band order stays
                  fixed while phase travels · no density-sized buffers or textures.
                </p>
              </>
            ) : isVortexRingsMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Load an immutable, fully specified Vortex Rings configuration.",
                    label: "VFX preset",
                    options: [
                      ...VORTEX_RINGS_PRESETS.map((candidate) => ({
                        label: candidate.label,
                        value: candidate.id,
                      })),
                      { disabled: true, label: "Custom", value: "custom" },
                    ],
                  }}
                  value={vortexRingsPresetId}
                  onChange={loadVortexRingsPreset}
                />
                <RangeControl
                  label="Twist amount"
                  min={-4}
                  max={4}
                  step={0.05}
                  value={vortexRingsConfig.twistAmount}
                  valueLabel={`${vortexRingsConfig.twistAmount.toFixed(2)} turns`}
                  onChange={(twistAmount) => updateVortexRings({ twistAmount })}
                />
                <RangeControl
                  label="Spin speed"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={vortexRingsConfig.spinSpeed}
                  valueLabel={`${vortexRingsConfig.spinSpeed.toFixed(2)} cycles/s`}
                  onChange={(spinSpeed) => updateVortexRings({ spinSpeed })}
                />
                <RangeControl
                  label="Ring density"
                  min={3}
                  max={48}
                  step={1}
                  value={vortexRingsConfig.ringDensity}
                  valueLabel={`${vortexRingsConfig.ringDensity} rings`}
                  onChange={(ringDensity) => updateVortexRings({ ringDensity })}
                />
                <RangeControl
                  label="Vortex radius"
                  min={0.25}
                  max={0.95}
                  step={0.01}
                  value={vortexRingsConfig.vortexRadius}
                  valueLabel={`${Math.round(vortexRingsConfig.vortexRadius * 100)}% half-stage`}
                  onChange={(vortexRadius) => updateVortexRings({ vortexRadius })}
                />
                <RangeControl
                  label="Energy reactivity"
                  min={0}
                  max={2}
                  step={0.05}
                  value={vortexRingsConfig.energyReactivity}
                  valueLabel={`${vortexRingsConfig.energyReactivity.toFixed(2)}×`}
                  onChange={(energyReactivity) => updateVortexRings({ energyReactivity })}
                />
                <RangeControl
                  label="Glow strength"
                  min={0}
                  max={3}
                  step={0.05}
                  value={vortexRingsConfig.glowStrength}
                  valueLabel={`${vortexRingsConfig.glowStrength.toFixed(2)}×`}
                  onChange={(glowStrength) => updateVortexRings({ glowStrength })}
                />
                <SelectControl
                  definition={{
                    description: "Follow the OS preference, spin, or freeze the spiral phase.",
                    label: "Motion",
                    options: [
                      { label: "Auto · follow system", value: "auto" },
                      { label: "Full · animate", value: "full" },
                      { label: "Reduced · static", value: "reduced" },
                    ],
                  }}
                  value={vortexRingsConfig.motion}
                  onChange={(motion) => updateVortexRings({ motion: motion as VfxMotion })}
                />
                <SelectControl
                  definition={{
                    description: "Cap DPR before absolute dimension and pixel ceilings.",
                    label: "GPU quality",
                    options: [
                      { label: "Low · 1× cap", value: "low" },
                      { label: "Balanced · 1.5× cap", value: "balanced" },
                      { label: "High · 2× cap", value: "high" },
                    ],
                  }}
                  value={vortexRingsConfig.quality}
                  onChange={(quality) => updateVortexRings({ quality: quality as VfxQuality })}
                />
                <p className="control-note">
                  Seam-free periodic angular warp · maximum 48 spiral intervals · stable
                  center-to-edge bands · no density-sized buffers or textures.
                </p>
              </>
            ) : visualMode === "spectrum" ? (
              <>
                <SelectControl
                  definition={spectrumControl("geometry")}
                  options={spectrumControl("geometry").options?.map((option) => ({
                    ...option,
                    disabled: renderer === "dom" && option.value !== "bars",
                  }))}
                  value={spectrumGeometry}
                  onChange={(value) => setSpectrumGeometry(value as SpectrumGeometry)}
                />
                <SelectControl
                  definition={spectrumControl("layout")}
                  options={spectrumControl("layout").options?.map((option) => ({
                    ...option,
                    disabled: renderer === "dom" && option.value !== "rectangular",
                  }))}
                  value={spectrumLayout}
                  onChange={(value) => setSpectrumLayout(value as SpectrumLayout)}
                />
                <SelectControl
                  definition={spectrumControl("interpolation")}
                  value={spectrumInterpolation}
                  onChange={(value) => setSpectrumInterpolation(value as SpectrumInterpolation)}
                />
                <RangeControl
                  label="Line width"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={lineWidth}
                  valueLabel={`${lineWidth.toFixed(1)} px`}
                  disabled={!lineWidthAvailability.enabled}
                  disabledReason={lineWidthAvailability.reason}
                  onChange={setLineWidth}
                />
                <RangeControl
                  label={spectrumControl("barWidth").label}
                  min={1}
                  max={32}
                  step={1}
                  value={barWidth}
                  valueLabel={`${barWidth} px`}
                  disabled={!barWidthAvailability.enabled}
                  disabledReason={barWidthAvailability.reason}
                  onChange={setBarWidth}
                />
                <RangeControl
                  label={spectrumControl("barGap").label}
                  min={0}
                  max={16}
                  step={1}
                  value={barGap}
                  valueLabel={`${barGap} px`}
                  disabled={!barWidthAvailability.enabled}
                  disabledReason={barWidthAvailability.reason}
                  onChange={setBarGap}
                />
                <ToggleControl
                  checked={radialInvert}
                  description={spectrumControl("radialInvert").description}
                  disabled={!radialAvailability.enabled}
                  disabledReason={radialAvailability.reason}
                  label={spectrumControl("radialInvert").label}
                  onChange={setRadialInvert}
                />
                <RangeControl
                  label={spectrumControl("radialDeadzone").label}
                  min={0}
                  max={100}
                  step={1}
                  value={radialDeadzone * 100}
                  valueLabel={`${Math.round(radialDeadzone * 100)}%`}
                  disabled={!radialAvailability.enabled}
                  disabledReason={radialAvailability.reason}
                  onChange={(value) => setRadialDeadzone(value / 100)}
                />
                <RangeControl
                  label={spectrumControl("radialArc").label}
                  min={0}
                  max={360}
                  step={1}
                  value={radialArc}
                  valueLabel={`${Math.round(radialArc)}°`}
                  disabled={!radialAvailability.enabled}
                  disabledReason={radialAvailability.reason}
                  onChange={setRadialArc}
                />
                <RangeControl
                  label={spectrumControl("radialRotation").label}
                  min={0}
                  max={360}
                  step={1}
                  value={radialRotation}
                  valueLabel={`${Math.round(radialRotation)}°`}
                  disabled={!radialAvailability.enabled}
                  disabledReason={radialAvailability.reason}
                  onChange={setRadialRotation}
                />
                <ToggleControl
                  checked={roundedCaps}
                  description={spectrumControl("roundedCaps").description}
                  disabled={!roundedCapsAvailability.enabled}
                  disabledReason={roundedCapsAvailability.reason}
                  label={spectrumControl("roundedCaps").label}
                  onChange={setRoundedCaps}
                />
                <RangeControl
                  label={spectrumControl("cornerRadius").label}
                  min={0}
                  max={32}
                  step={1}
                  value={cornerRadius}
                  valueLabel={`${cornerRadius} px`}
                  disabled={!cornerRadiusAvailability.enabled}
                  disabledReason={cornerRadiusAvailability.reason}
                  onChange={setCornerRadius}
                />
              </>
            ) : isMeterMode ? (
              <>
                <SelectControl
                  definition={{
                    description: "Select PCM channels before RMS or peak analysis.",
                    label: "Meter channels",
                    options: [
                      { label: "Source channels", value: "source" },
                      { label: "Mono mix", value: "mono" },
                      {
                        disabled: sourceChannelCount < 2,
                        label: "Stereo pair",
                        value: "stereo",
                      },
                      { label: "Single channel", value: "single" },
                    ],
                  }}
                  value={channelMode}
                  onChange={(value) => setChannelMode(value as WaveformChannelMode)}
                />
                {channelMode === "single" ? (
                  <RangeControl
                    label="Meter channel index"
                    min={0}
                    max={Math.max(0, sourceChannelCount - 1)}
                    step={1}
                    value={Math.min(channelIndex, Math.max(0, sourceChannelCount - 1))}
                    valueLabel={`${Math.min(channelIndex, Math.max(0, sourceChannelCount - 1)) + 1} / ${sourceChannelCount}`}
                    onChange={setChannelIndex}
                  />
                ) : null}
                <SelectControl
                  definition={{
                    description: "Use linear lanes or concentric radial tracks.",
                    label: "Meter layout",
                    options: [
                      { label: "Rectangular", value: "rectangular" },
                      {
                        disabled: renderer === "dom",
                        label: "Radial",
                        value: "radial",
                      },
                    ],
                  }}
                  value={meterLayout}
                  onChange={(value) => setMeterLayout(value as SpectrumLayout)}
                />
                <SelectControl
                  definition={{
                    description: "Choose the dB progression direction for rectangular meters.",
                    label: "Meter orientation",
                    options: [
                      { label: "Horizontal", value: "horizontal" },
                      { label: "Vertical", value: "vertical" },
                    ],
                  }}
                  disabled={meterLayout === "radial"}
                  disabledReason="Radial meters progress around their configured arc."
                  value={orientation}
                  onChange={(value) => setOrientation(value as WaveformOrientation)}
                />
                <RangeControl
                  label="Meter width"
                  min={1}
                  max={64}
                  step={1}
                  value={meterBarWidth}
                  valueLabel={`${meterBarWidth} px`}
                  onChange={setMeterBarWidth}
                />
                <RangeControl
                  label="Meter channel gap"
                  min={0}
                  max={64}
                  step={1}
                  value={meterChannelGap}
                  valueLabel={`${meterChannelGap} px`}
                  disabled={meterPresentation.frame.channels.length < 2}
                  disabledReason="Channel spacing requires at least two selected channels."
                  onChange={setMeterChannelGap}
                />
                <RangeControl
                  label="Minimum meter size"
                  min={0}
                  max={32}
                  step={1}
                  value={meterMinimumSize}
                  valueLabel={`${meterMinimumSize} px`}
                  onChange={setMeterMinimumSize}
                />
                <RangeControl
                  label="Step width"
                  min={1}
                  max={32}
                  step={1}
                  value={meterStepWidth}
                  valueLabel={`${meterStepWidth} px`}
                  disabled={visualMode !== "stepped-meter"}
                  disabledReason="Step width applies only to stepped-meter geometry."
                  onChange={setMeterStepWidth}
                />
                <RangeControl
                  label="Step gap"
                  min={0}
                  max={16}
                  step={1}
                  value={meterStepGap}
                  valueLabel={`${meterStepGap} px`}
                  disabled={visualMode !== "stepped-meter"}
                  disabledReason="Step gap applies only to stepped-meter geometry."
                  onChange={setMeterStepGap}
                />
                <ToggleControl
                  checked={radialInvert}
                  description="Reverse meter progression around the arc."
                  disabled={meterLayout !== "radial"}
                  disabledReason="Select radial meter layout to invert its arc."
                  label="Invert meter arc"
                  onChange={setRadialInvert}
                />
                <RangeControl
                  label="Meter deadzone"
                  min={0}
                  max={100}
                  step={1}
                  value={radialDeadzone * 100}
                  valueLabel={`${Math.round(radialDeadzone * 100)}%`}
                  disabled={meterLayout !== "radial"}
                  disabledReason="Deadzone applies only to radial meter layout."
                  onChange={(value) => setRadialDeadzone(value / 100)}
                />
                <RangeControl
                  label="Meter arc"
                  min={0}
                  max={360}
                  step={1}
                  value={radialArc}
                  valueLabel={`${Math.round(radialArc)}°`}
                  disabled={meterLayout !== "radial"}
                  disabledReason="Arc applies only to radial meter layout."
                  onChange={setRadialArc}
                />
                <RangeControl
                  label="Meter rotation"
                  min={0}
                  max={360}
                  step={1}
                  value={radialRotation}
                  valueLabel={`${Math.round(radialRotation)}°`}
                  disabled={meterLayout !== "radial"}
                  disabledReason="Rotation applies only to radial meter layout."
                  onChange={setRadialRotation}
                />
                <ToggleControl
                  checked={roundedCaps}
                  description="Round bar ends and stepped segments."
                  label="Rounded meter caps"
                  onChange={setRoundedCaps}
                />
                <RangeControl
                  label="Meter corner radius"
                  min={0}
                  max={32}
                  step={1}
                  value={cornerRadius}
                  valueLabel={`${cornerRadius} px`}
                  disabled={!roundedCaps || meterLayout === "radial"}
                  disabledReason={
                    meterLayout === "radial"
                      ? "Radial geometry uses line caps instead of corner radius."
                      : "Enable rounded meter caps to use corner radius."
                  }
                  onChange={setCornerRadius}
                />
              </>
            ) : (
              <>
                <SelectControl
                  definition={{
                    description: "Select source channels before layout",
                    label: "Channel mode",
                    options: [
                      { label: "Source channels", value: "source" },
                      { label: "Mono mix", value: "mono" },
                      {
                        disabled: sourceChannelCount < 2,
                        label: "Stereo pair",
                        value: "stereo",
                      },
                      { label: "Single channel", value: "single" },
                    ],
                  }}
                  value={channelMode}
                  onChange={(value) => {
                    const next = value as WaveformChannelMode;
                    setChannelMode(next);
                    if (next === "mono" || next === "single") setChannelLayout("stacked");
                  }}
                />
                {channelMode === "single" ? (
                  <RangeControl
                    label="Channel index"
                    min={0}
                    max={Math.max(0, sourceChannelCount - 1)}
                    step={1}
                    value={Math.min(channelIndex, Math.max(0, sourceChannelCount - 1))}
                    valueLabel={`${Math.min(channelIndex, Math.max(0, sourceChannelCount - 1)) + 1} / ${sourceChannelCount}`}
                    onChange={setChannelIndex}
                  />
                ) : null}
                <SelectControl
                  definition={{
                    description: "Arrange selected channels without changing their samples",
                    label: "Channel layout",
                    options: [
                      { label: "Stacked lanes", value: "stacked" },
                      {
                        disabled: selectedChannelCount !== 2,
                        label: "Split panels",
                        value: "split",
                      },
                      {
                        disabled: selectedChannelCount < 2,
                        label: "Overlay channels",
                        value: "overlay",
                      },
                    ],
                  }}
                  value={channelLayout}
                  onChange={(value) => setChannelLayout(value as WaveformChannelLayout)}
                />
                <RangeControl
                  label="Channel spacing"
                  min={0}
                  max={96}
                  step={1}
                  value={channelGap}
                  valueLabel={`${channelGap} px`}
                  disabled={channelLayout === "overlay" || selectedChannelCount < 2}
                  disabledReason={
                    channelLayout === "overlay"
                      ? "Overlaid channels share one lane, so spacing does not apply."
                      : selectedChannelCount < 2
                        ? "Spacing requires more than one selected channel."
                        : undefined
                  }
                  onChange={setChannelGap}
                />
                <SelectControl
                  definition={{
                    description:
                      visualMode === "envelope"
                        ? "Magnitude grows from a baseline or mirrors around center"
                        : "Signed polarity or an explicit positive/negative half",
                    label: "Amplitude placement",
                    options:
                      visualMode === "envelope"
                        ? [
                            { label: "Baseline", value: "baseline" },
                            { label: "Mirrored", value: "mirrored" },
                          ]
                        : [
                            { label: "Centered signed", value: "centered" },
                            { label: "Positive only", value: "positive-only" },
                            { label: "Negative only", value: "negative-only" },
                          ],
                  }}
                  value={visualMode === "envelope" ? envelopePlacement : waveformPlacement}
                  onChange={(value) =>
                    visualMode === "envelope"
                      ? setEnvelopePlacement(value as EnvelopeAmplitudePlacement)
                      : setWaveformPlacement(value as WaveformAmplitudePlacement)
                  }
                />
                <SelectControl
                  definition={{
                    description: "Time runs across or down the component",
                    label: "Orientation",
                    options: [
                      { label: "Horizontal", value: "horizontal" },
                      { label: "Vertical", value: "vertical" },
                    ],
                  }}
                  value={orientation}
                  onChange={(value) => setOrientation(value as WaveformOrientation)}
                />
                <SelectControl
                  definition={{
                    description: "Fill the stage or request a bounded internal width",
                    label: "Sizing",
                    options: [
                      { label: "Responsive", value: "responsive" },
                      { label: "Fixed width", value: "fixed" },
                    ],
                  }}
                  value={timeDomainSizing}
                  onChange={(value) => setTimeDomainSizing(value as "fixed" | "responsive")}
                />
                {timeDomainSizing === "fixed" ? (
                  <RangeControl
                    label="Component width"
                    min={240}
                    max={1200}
                    step={20}
                    value={fixedTimeDomainWidth}
                    valueLabel={`${fixedTimeDomainWidth} px`}
                    onChange={setFixedTimeDomainWidth}
                  />
                ) : null}
                <RangeControl
                  label="Amplitude"
                  min={0.2}
                  max={1.5}
                  step={0.01}
                  value={amplitude}
                  valueLabel={`${amplitude.toFixed(2)}×`}
                  onChange={setAmplitude}
                />
                <RangeControl
                  label="Line width"
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={lineWidth}
                  valueLabel={`${lineWidth.toFixed(1)} px`}
                  onChange={setLineWidth}
                />
                <RangeControl
                  label="Sample density"
                  min={256}
                  max={4096}
                  step={256}
                  value={sampleCount}
                  valueLabel={sampleCount.toLocaleString()}
                  onChange={setSampleCount}
                />
              </>
            )}
          </ControlSection>

          <ControlSection title="Color & guides">
            {isPulseRingMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={pulseRingBackground}
                  onChange={setPulseRingBackground}
                />
                <label className="color-control">
                  <span>Primary color</span>
                  <span className="color-readout">
                    <input
                      type="color"
                      aria-label="Primary color"
                      value={pulseRingPrimary}
                      onChange={(event) => setPulseRingPrimary(event.currentTarget.value)}
                    />
                    {pulseRingPrimary.toUpperCase()}
                  </span>
                </label>
                <label className="color-control">
                  <span>Secondary color</span>
                  <span className="color-readout">
                    <input
                      type="color"
                      aria-label="Secondary color"
                      value={pulseRingSecondary}
                      onChange={(event) => setPulseRingSecondary(event.currentTarget.value)}
                    />
                    {pulseRingSecondary.toUpperCase()}
                  </span>
                </label>
                <label className="color-control">
                  <span>Tertiary color</span>
                  <span className="color-readout">
                    <input
                      type="color"
                      aria-label="Tertiary color"
                      value={pulseRingTertiary}
                      onChange={(event) => setPulseRingTertiary(event.currentTarget.value)}
                    />
                    {pulseRingTertiary.toUpperCase()}
                  </span>
                </label>
                <label className="color-control">
                  <span>Sweep flash color</span>
                  <span className="color-readout">
                    <input
                      type="color"
                      aria-label="Sweep flash color"
                      value={pulseRingSweep}
                      onChange={(event) => setPulseRingSweep(event.currentTarget.value)}
                    />
                    {pulseRingSweep.toUpperCase()}
                  </span>
                </label>
                <p className="control-note">
                  Five independent shader roles; forced-colors mode substitutes a manual
                  high-contrast palette for canvas pixels.
                </p>
              </>
            ) : isNeonLinesMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={neonLinesConfig.backgroundColor}
                  onChange={(backgroundColor) => updateNeonLines({ backgroundColor })}
                />
                <VfxColorControl
                  label="Left color"
                  value={neonLinesConfig.leftColor}
                  onChange={(leftColor) => updateNeonLines({ leftColor })}
                />
                <VfxColorControl
                  label="Right color"
                  value={neonLinesConfig.rightColor}
                  onChange={(rightColor) => updateNeonLines({ rightColor })}
                />
                <VfxColorControl
                  label="Burst color"
                  value={neonLinesConfig.burstColor}
                  onChange={(burstColor) => updateNeonLines({ burstColor })}
                />
                <p className="control-note">
                  Horizontal position blends left to right; mapped peak energy blends the burst role
                  independently per line.
                </p>
              </>
            ) : isEqualizerGridMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={equalizerGridConfig.backgroundColor}
                  onChange={(backgroundColor) => updateEqualizerGrid({ backgroundColor })}
                />
                <VfxColorControl
                  label="Gradient color 1"
                  value={equalizerGridConfig.gradientColor1}
                  onChange={(gradientColor1) => updateEqualizerGrid({ gradientColor1 })}
                />
                <VfxColorControl
                  label="Gradient color 2"
                  value={equalizerGridConfig.gradientColor2}
                  onChange={(gradientColor2) => updateEqualizerGrid({ gradientColor2 })}
                />
                <VfxColorControl
                  label="Gradient color 3"
                  value={equalizerGridConfig.gradientColor3}
                  onChange={(gradientColor3) => updateEqualizerGrid({ gradientColor3 })}
                />
                <VfxColorControl
                  label="Gradient color 4"
                  value={equalizerGridConfig.gradientColor4}
                  onChange={(gradientColor4) => updateEqualizerGrid({ gradientColor4 })}
                />
                <p className="control-note">
                  Frequency position and row level traverse all four stops; peak cells blend the
                  fourth role.
                </p>
              </>
            ) : isWaveformRibbonMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={waveformRibbonConfig.backgroundColor}
                  onChange={(backgroundColor) => updateWaveformRibbon({ backgroundColor })}
                />
                <VfxColorControl
                  label="Left color"
                  value={waveformRibbonConfig.leftColor}
                  onChange={(leftColor) => updateWaveformRibbon({ leftColor })}
                />
                <VfxColorControl
                  label="Right color"
                  value={waveformRibbonConfig.rightColor}
                  onChange={(rightColor) => updateWaveformRibbon({ rightColor })}
                />
                <VfxColorControl
                  label="Peak flash color"
                  value={waveformRibbonConfig.peakFlashColor}
                  onChange={(peakFlashColor) => updateWaveformRibbon({ peakFlashColor })}
                />
                <p className="control-note">
                  Ordered horizontal position blends left to right; energetic crests blend the peak
                  role into both primary and reflected ribbons.
                </p>
              </>
            ) : isRoundedWobbleBarsMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={roundedWobbleBarsConfig.backgroundColor}
                  onChange={(backgroundColor) => updateRoundedWobbleBars({ backgroundColor })}
                />
                <VfxColorControl
                  label="Left color"
                  value={roundedWobbleBarsConfig.leftColor}
                  onChange={(leftColor) => updateRoundedWobbleBars({ leftColor })}
                />
                <VfxColorControl
                  label="Right color"
                  value={roundedWobbleBarsConfig.rightColor}
                  onChange={(rightColor) => updateRoundedWobbleBars({ rightColor })}
                />
                <VfxColorControl
                  label="Burst flash color"
                  value={roundedWobbleBarsConfig.burstFlashColor}
                  onChange={(burstFlashColor) => updateRoundedWobbleBars({ burstFlashColor })}
                />
                <p className="control-note">
                  Ordered bar position blends the edge roles; energetic tips receive the independent
                  burst role.
                </p>
              </>
            ) : isSpectrumBarsVfxMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={spectrumBarsVfxConfig.backgroundColor}
                  onChange={(backgroundColor) => updateSpectrumBarsVfx({ backgroundColor })}
                />
                <VfxColorControl
                  label="Gradient color 1"
                  value={spectrumBarsVfxConfig.gradientColor1}
                  onChange={(gradientColor1) => updateSpectrumBarsVfx({ gradientColor1 })}
                />
                <VfxColorControl
                  label="Gradient color 2"
                  value={spectrumBarsVfxConfig.gradientColor2}
                  onChange={(gradientColor2) => updateSpectrumBarsVfx({ gradientColor2 })}
                />
                <VfxColorControl
                  label="Gradient color 3"
                  value={spectrumBarsVfxConfig.gradientColor3}
                  onChange={(gradientColor3) => updateSpectrumBarsVfx({ gradientColor3 })}
                />
                <VfxColorControl
                  label="Gradient color 4"
                  value={spectrumBarsVfxConfig.gradientColor4}
                  onChange={(gradientColor4) => updateSpectrumBarsVfx({ gradientColor4 })}
                />
                <p className="control-note">
                  Ordered bar position traverses all four gradient roles; peak energy reinforces the
                  fourth stop without reordering bars.
                </p>
              </>
            ) : isRadialSpikesMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={radialSpikesConfig.backgroundColor}
                  onChange={(backgroundColor) => updateRadialSpikes({ backgroundColor })}
                />
                <VfxColorControl
                  label="Base color"
                  value={radialSpikesConfig.baseColor}
                  onChange={(baseColor) => updateRadialSpikes({ baseColor })}
                />
                <VfxColorControl
                  label="Tip color"
                  value={radialSpikesConfig.tipColor}
                  onChange={(tipColor) => updateRadialSpikes({ tipColor })}
                />
                <p className="control-note">
                  The continuous base ring and spike roots use the base role; ordered energetic
                  reach blends toward the tip role.
                </p>
              </>
            ) : isTunnelWavesMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={tunnelWavesConfig.backgroundColor}
                  onChange={(backgroundColor) => updateTunnelWaves({ backgroundColor })}
                />
                <VfxColorControl
                  label="Center color"
                  value={tunnelWavesConfig.centerColor}
                  onChange={(centerColor) => updateTunnelWaves({ centerColor })}
                />
                <VfxColorControl
                  label="Mid color"
                  value={tunnelWavesConfig.midColor}
                  onChange={(midColor) => updateTunnelWaves({ midColor })}
                />
                <VfxColorControl
                  label="Outer color"
                  value={tunnelWavesConfig.outerColor}
                  onChange={(outerColor) => updateTunnelWaves({ outerColor })}
                />
                <p className="control-note">
                  Fixed center-to-edge depth traverses the three roles; animation moves phase only,
                  never the source ordering.
                </p>
              </>
            ) : isVortexRingsMode ? (
              <>
                <VfxColorControl
                  label="Background color"
                  value={vortexRingsConfig.backgroundColor}
                  onChange={(backgroundColor) => updateVortexRings({ backgroundColor })}
                />
                <VfxColorControl
                  label="Primary color"
                  value={vortexRingsConfig.primaryColor}
                  onChange={(primaryColor) => updateVortexRings({ primaryColor })}
                />
                <VfxColorControl
                  label="Secondary color"
                  value={vortexRingsConfig.secondaryColor}
                  onChange={(secondaryColor) => updateVortexRings({ secondaryColor })}
                />
                <VfxColorControl
                  label="Accent color"
                  value={vortexRingsConfig.accentColor}
                  onChange={(accentColor) => updateVortexRings({ accentColor })}
                />
                <p className="control-note">
                  Alternating radial intervals blend primary and secondary roles; the central eye
                  and peak energy receive the accent role.
                </p>
              </>
            ) : visualMode === "spectrum" ? (
              <>
                <SelectControl
                  definition={spectrumControl("colorMode")}
                  value={spectrumColorMode}
                  onChange={(value) => setSpectrumColorMode(value as SpectrumColorMode)}
                />
                <SelectControl
                  definition={spectrumControl("pulseMode")}
                  value={spectrumPulseMode}
                  disabled={!pulseModeAvailability.enabled}
                  disabledReason={pulseModeAvailability.reason}
                  onChange={(value) => setSpectrumPulseMode(value as SpectrumPulseMode)}
                />
                <ColorRoleControl
                  alpha={baseAlpha}
                  color={signalColor}
                  description="Primary role; inherited by both renderers through --waveform-color-base."
                  label="Base"
                  onAlpha={setBaseAlpha}
                  onColor={setSignalColor}
                />
                <ColorRoleControl
                  alpha={middleAlpha}
                  color={middleColor}
                  description="Intermediate energy role for ordered dB ranges."
                  disabled={!middleColorAvailability.enabled}
                  disabledReason={middleColorAvailability.reason}
                  label="Middle"
                  onAlpha={setMiddleAlpha}
                  onColor={setMiddleColor}
                />
                <ColorRoleControl
                  alpha={crestAlpha}
                  color={crestColor}
                  description="High-energy role for gradients and ordered dB ranges."
                  disabled={!crestColorAvailability.enabled}
                  disabledReason={crestColorAvailability.reason}
                  label="Crest"
                  onAlpha={setCrestAlpha}
                  onColor={setCrestColor}
                />
                <ColorRoleControl
                  alpha={accentAlpha}
                  color={accentColor}
                  description="Reactive destination role for peak pulse mapping."
                  disabled={!accentColorAvailability.enabled}
                  disabledReason={accentColorAvailability.reason}
                  label="Accent"
                  onAlpha={setAccentAlpha}
                  onColor={setAccentColor}
                />
                <RangeControl
                  label={spectrumControl("gradientRatio").label}
                  min={0}
                  max={4}
                  step={0.05}
                  value={gradientRatio}
                  valueLabel={`${gradientRatio.toFixed(2)}×`}
                  disabled={!gradientRatioAvailability.enabled}
                  disabledReason={gradientRatioAvailability.reason}
                  onChange={setGradientRatio}
                />
                <RangeControl
                  label={spectrumControl("middleDecibels").label}
                  min={minimumDecibels}
                  max={maximumDecibels}
                  step={1}
                  value={resolvedSpectrumConfig.middleDecibels}
                  valueLabel={`${resolvedSpectrumConfig.middleDecibels} dBFS`}
                  disabled={!rangeThresholdAvailability.enabled}
                  disabledReason={rangeThresholdAvailability.reason}
                  onChange={(value) =>
                    setMiddleDecibels(Math.min(value, resolvedSpectrumConfig.crestDecibels))
                  }
                />
                <RangeControl
                  label={spectrumControl("crestDecibels").label}
                  min={minimumDecibels}
                  max={maximumDecibels}
                  step={1}
                  value={resolvedSpectrumConfig.crestDecibels}
                  valueLabel={`${resolvedSpectrumConfig.crestDecibels} dBFS`}
                  disabled={!rangeThresholdAvailability.enabled}
                  disabledReason={rangeThresholdAvailability.reason}
                  onChange={(value) =>
                    setCrestDecibels(Math.max(value, resolvedSpectrumConfig.middleDecibels))
                  }
                />
                <ToggleControl
                  checked={showSpectrumGrid}
                  description="Floor, midpoint, and ceiling reference"
                  label="dB grid"
                  onChange={setShowSpectrumGrid}
                />
              </>
            ) : isMeterMode ? (
              <>
                <SelectControl
                  definition={{
                    description:
                      "Use one role, a continuous threshold gradient, or discrete ranges.",
                    label: "Meter color mode",
                    options: [
                      { label: "Gradient", value: "gradient" },
                      { label: "Ranges", value: "range" },
                      { label: "Solid", value: "solid" },
                    ],
                  }}
                  value={meterColorMode}
                  onChange={(value) => setMeterColorMode(value as MeterColorMode)}
                />
                <ColorRoleControl
                  alpha={baseAlpha}
                  color={signalColor}
                  description="Nominal meter level and solid fill role."
                  label="Meter base"
                  onAlpha={setBaseAlpha}
                  onColor={setSignalColor}
                />
                <ColorRoleControl
                  alpha={middleAlpha}
                  color={middleColor}
                  description="Intermediate dB range role."
                  disabled={meterColorMode === "solid"}
                  disabledReason="Solid meters use only the base role."
                  label="Meter middle"
                  onAlpha={setMiddleAlpha}
                  onColor={setMiddleColor}
                />
                <ColorRoleControl
                  alpha={crestAlpha}
                  color={crestColor}
                  description="High-energy range role before peaking."
                  disabled={meterColorMode === "solid"}
                  disabledReason="Solid meters use only the base role."
                  label="Meter crest"
                  onAlpha={setCrestAlpha}
                  onColor={setCrestColor}
                />
                <ColorRoleControl
                  alpha={accentAlpha}
                  color={accentColor}
                  description="Peak threshold and ceiling role."
                  disabled={meterColorMode === "solid"}
                  disabledReason="Solid meters use only the base role."
                  label="Meter peak"
                  onAlpha={setAccentAlpha}
                  onColor={setAccentColor}
                />
                <RangeControl
                  label="Meter middle threshold"
                  min={meterMinimumDecibels}
                  max={meterMaximumDecibels}
                  step={1}
                  value={resolvedMeterConfig.middleDecibels}
                  valueLabel={`${resolvedMeterConfig.middleDecibels} dBFS`}
                  disabled={meterColorMode === "solid"}
                  disabledReason="Thresholds apply to gradient and range color modes."
                  onChange={(value) =>
                    setMiddleDecibels(Math.min(value, resolvedMeterConfig.crestDecibels))
                  }
                />
                <RangeControl
                  label="Meter crest threshold"
                  min={meterMinimumDecibels}
                  max={meterMaximumDecibels}
                  step={1}
                  value={resolvedMeterConfig.crestDecibels}
                  valueLabel={`${resolvedMeterConfig.crestDecibels} dBFS`}
                  disabled={meterColorMode === "solid"}
                  disabledReason="Thresholds apply to gradient and range color modes."
                  onChange={(value) =>
                    setCrestDecibels(Math.max(value, resolvedMeterConfig.middleDecibels))
                  }
                />
              </>
            ) : (
              <>
                <label className="color-control">
                  <span>Signal color</span>
                  <span className="color-readout">
                    <input
                      type="color"
                      aria-label="Signal color"
                      value={signalColor}
                      onChange={(event) => setSignalColor(event.currentTarget.value)}
                    />
                    {signalColor.toUpperCase()}
                  </span>
                </label>
                <ToggleControl
                  checked={showCenterLine}
                  description={
                    visualMode === "envelope"
                      ? "Magnitude baseline reference"
                      : "Zero-amplitude reference"
                  }
                  label="Center line"
                  onChange={setShowCenterLine}
                />
              </>
            )}
          </ControlSection>

          <ControlSection title="Contract">
            <dl className="contract-list">
              <div>
                <dt>Input</dt>
                <dd>
                  {isVfxMode
                    ? "ordered logarithmic band energy"
                    : visualMode === "spectrum"
                      ? "ordered dB bins"
                      : isMeterMode
                        ? `independent ${meterMeasurement.toUpperCase()} + peak channels`
                        : visualMode === "envelope"
                          ? "magnitude channels"
                          : "signed PCM channels"}
                </dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>
                  {isVfxMode
                    ? "0…1 RMS amplitude per band"
                    : visualMode === "spectrum"
                      ? `${minimumDecibels}…${maximumDecibels} dBFS`
                      : isMeterMode
                        ? `${meterMinimumDecibels}…${meterMaximumDecibels} dBFS · ref 1`
                        : visualMode === "envelope"
                          ? "0…1 magnitude"
                          : "−1…+1 signed"}
                </dd>
              </div>
              <div>
                <dt>Renderer</dt>
                <dd>{rendererCapabilities.label}</dd>
              </div>
              <div>
                <dt>Resize</dt>
                <dd>
                  {renderer === "webgl2"
                    ? "bounded DPR bitmap"
                    : renderer === "canvas2d"
                      ? "DPR bitmap"
                      : renderer === "svg"
                        ? "responsive viewBox"
                        : "observed CSS boxes"}
                </dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>
                  {renderer === "webgl2"
                    ? `${rendererCapabilities.limits.maximumBands} bands · 4,194,304 pixels`
                    : renderer === "canvas2d"
                      ? "dense core"
                      : `${rendererCapabilities.limits.maximumSpectrumPoints} points · ${rendererCapabilities.limits.maximumNodes} nodes`}
                </dd>
              </div>
              <div>
                <dt>Import</dt>
                <dd>SSR safe</dd>
              </div>
              <div>
                <dt>Lifecycle</dt>
                <dd>Epoch {sessionSnapshot.epoch}</dd>
              </div>
              <div>
                <dt>Ownership</dt>
                <dd>{sessionSnapshot.source?.ownership ?? "none"}</dd>
              </div>
            </dl>
          </ControlSection>
        </div>

        <footer className="inspector-actions">
          <button type="button" className="secondary-action" onClick={reset}>
            <IconRefresh size={15} aria-hidden="true" />
            Reset
          </button>
          <button type="button" className="primary-action" onClick={copyCode}>
            {copyState === "copied" ? (
              <IconCheck size={15} aria-hidden="true" />
            ) : copyState === "failed" ? (
              <IconCode size={15} aria-hidden="true" />
            ) : (
              <IconCopy size={15} aria-hidden="true" />
            )}
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy blocked"
                : "Copy code"}
          </button>
          <span className="copy-status" aria-live="polite">
            {copyState === "failed"
              ? "Clipboard unavailable. Try again after granting access."
              : ""}
          </span>
        </footer>
      </aside>
    </div>
  );
}

interface SpectrumPresentation {
  readonly buffering: boolean;
  readonly frame: SpectrumFrame;
  readonly result: SpectrumDynamicsResult | null;
  readonly sourceEpoch: number;
}

function useSpectrumPresentation({
  capability,
  config,
  frame,
  inputState,
  offsetMs,
  sourceEpoch,
}: {
  readonly capability: VisualSyncCapability;
  readonly config: SpectrumDynamicsConfig;
  readonly frame: SpectrumFrame;
  readonly inputState: SpectrumInputState;
  readonly offsetMs: number;
  readonly sourceEpoch: number;
}): SpectrumPresentation {
  const engine = useMemo(
    () => ({
      delay: new SpectrumFrameDelay(),
      dynamics: createSpectrumDynamicsProcessor(),
    }),
    [sourceEpoch],
  );
  const [presentation, setPresentation] = useState<SpectrumPresentation>({
    buffering: false,
    frame,
    result: null,
    sourceEpoch,
  });

  useEffect(() => {
    const timestampMs = typeof performance === "undefined" ? Date.now() : performance.now();
    const result = engine.dynamics.process(frame, config, {
      sourceState: inputState,
      timestampMs,
    });
    const sync = resolveVisualSyncOffset(offsetMs, capability);
    let displayFrame = result.frame;
    let buffering = false;
    if (sync.enabled && sync.offsetMs > 0) {
      const delayedFrame = engine.delay.push(result.frame, timestampMs, sync.offsetMs);
      buffering = delayedFrame === null;
      displayFrame =
        delayedFrame ??
        createSpectrumFrame(
          new Float32Array(result.frame.bins.length).fill(result.frame.minimumDecibels),
          result.frame,
        );
    } else {
      engine.delay.clear();
    }
    setPresentation({ buffering, frame: displayFrame, result, sourceEpoch });
  }, [capability, config, engine, frame, inputState, offsetMs, sourceEpoch]);

  return presentation.sourceEpoch === sourceEpoch
    ? presentation
    : { buffering: false, frame, result: null, sourceEpoch };
}

function spectrumDynamicsInputState(status: WaveformSessionStatus): SpectrumInputState {
  if (status.state === "muted" || status.state === "silent") return status.state;
  return "ready";
}

function ControlSection({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="control-section">
      <h3>{title}</h3>
      <div className="control-stack">{children}</div>
    </section>
  );
}

function StaticRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="static-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ToggleControl({
  checked,
  description,
  disabled = false,
  disabledReason,
  label,
  onChange,
}: {
  readonly checked: boolean;
  readonly description: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly label: string;
  readonly onChange: (checked: boolean) => void;
}) {
  const descriptionId = useId();
  return (
    <label className="toggle-control" data-disabled={disabled || undefined}>
      <span>
        <strong>{label}</strong>
        <small id={descriptionId}>{disabledReason ?? description}</small>
      </span>
      <input
        type="checkbox"
        aria-describedby={descriptionId}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </label>
  );
}

function VfxColorControl({
  label,
  onChange,
  value,
}: {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}) {
  return (
    <label className="color-control">
      <span>{label}</span>
      <span className="color-readout">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        {value.toUpperCase()}
      </span>
    </label>
  );
}

function ColorRoleControl({
  alpha,
  color,
  description,
  disabled = false,
  disabledReason,
  label,
  onAlpha,
  onColor,
}: {
  readonly alpha: number;
  readonly color: string;
  readonly description: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly label: string;
  readonly onAlpha: (alpha: number) => void;
  readonly onColor: (color: string) => void;
}) {
  const descriptionId = useId();
  const alphaId = useId();
  return (
    <div className="color-role-control" data-disabled={disabled || undefined}>
      <div className="color-role-heading">
        <span>
          <strong>{label}</strong>
          <small id={descriptionId}>{disabledReason ?? description}</small>
        </span>
        <span className="color-readout">
          <input
            type="color"
            aria-describedby={descriptionId}
            aria-label={`${label} color`}
            disabled={disabled}
            value={color}
            onChange={(event) => onColor(event.currentTarget.value)}
          />
          {color.toUpperCase()}
        </span>
      </div>
      <div className="color-alpha-heading">
        <label htmlFor={alphaId}>{label} alpha</label>
        <output htmlFor={alphaId}>{Math.round(alpha * 100)}%</output>
      </div>
      <input
        id={alphaId}
        type="range"
        aria-describedby={descriptionId}
        disabled={disabled}
        min={0}
        max={1}
        step={0.01}
        value={alpha}
        onChange={(event) => onAlpha(Number(event.currentTarget.value))}
      />
    </div>
  );
}

function MicrophoneControl({
  onDisconnect,
  source,
}: {
  readonly onDisconnect: () => void;
  readonly source: MicrophoneSource;
}) {
  const snapshot = useMicrophoneSource(source);
  const recovery =
    snapshot.state === "denied"
      ? "Permission denied. Allow microphone access in the browser, then reconnect."
      : snapshot.state === "unavailable"
        ? "No usable microphone. Check the device, then reconnect."
        : snapshot.state === "ended"
          ? "Microphone disconnected. Check the device, then disconnect and reconnect."
          : snapshot.state === "muted"
            ? "The microphone input is muted. Unmute the device to continue."
            : snapshot.error?.message;
  return (
    <div className="microphone-control">
      <div role="status" aria-label="Microphone status" aria-live="polite">
        <span className="microphone-dot" data-state={snapshot.state} aria-hidden="true" />
        Microphone · {snapshot.state}
      </div>
      {recovery ? <p>{recovery}</p> : null}
      <button type="button" className="source-action" onClick={onDisconnect}>
        Disconnect microphone
      </button>
    </div>
  );
}

interface RangeControlProps {
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly step: number;
  readonly value: number;
  readonly valueLabel: string;
}

function RangeControl({
  disabled = false,
  disabledReason,
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: RangeControlProps) {
  const inputId = useId();
  const reasonId = useId();
  return (
    <div className="range-control" data-disabled={disabled || undefined}>
      <span>
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={inputId}>{valueLabel}</output>
      </span>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-describedby={disabledReason ? reasonId : undefined}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      {disabledReason ? (
        <small className="capability-note" id={reasonId}>
          {disabledReason}
        </small>
      ) : null}
    </div>
  );
}

interface SelectOption {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: number | string;
}

function SelectControl({
  definition,
  disabled = false,
  disabledReason,
  onChange,
  options = definition.options,
  value,
}: {
  readonly definition: Pick<SpectrumControlDefinition, "description" | "label"> & {
    readonly options?: readonly SelectOption[];
  };
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly onChange: (value: string) => void;
  readonly options?: readonly SelectOption[];
  readonly value: number | string;
}) {
  const inputId = useId();
  const descriptionId = useId();
  return (
    <label className="select-control" data-disabled={disabled || undefined} htmlFor={inputId}>
      <span>
        <strong>{definition.label}</strong>
        <small id={descriptionId}>{disabledReason ?? definition.description}</small>
      </span>
      <select
        id={inputId}
        aria-describedby={descriptionId}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        {options?.map((option) => (
          <option disabled={option.disabled} key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function spectrumControl(id: SpectrumControlId): SpectrumControlDefinition {
  const definition = SPECTRUM_CONTROL_DEFINITIONS.find((control) => control.id === id);
  if (!definition) throw new Error(`Missing spectrum control definition: ${id}`);
  return definition;
}

function formatFrequency(value: number): string {
  if (value >= 1000) {
    const kilohertz = value / 1000;
    return `${kilohertz >= 10 ? kilohertz.toFixed(0) : kilohertz.toFixed(1)} kHz`;
  }
  return `${Math.round(value)} Hz`;
}

function formatOverlayValue(value: number, unit: "dBFS" | "Hz" | "percent" | string): string {
  if (unit === "percent") return `${Math.round(value * 1000) / 10}%`;
  if (unit === "Hz") return formatFrequency(value);
  if (unit === "dBFS") return `${Math.round(value)} dBFS`;
  return `${Math.round(value * 1000) / 1000} ${unit}`;
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

function envelopeScale(
  placement: EnvelopeAmplitudePlacement,
  orientation: WaveformOrientation,
): readonly string[] {
  if (placement === "mirrored") return ["1.0", "0.0", "1.0"];
  return orientation === "horizontal" ? ["1.0", "0.5", "0.0"] : ["0.0", "0.5", "1.0"];
}

function waveformScale(
  placement: WaveformAmplitudePlacement,
  orientation: WaveformOrientation,
): readonly string[] {
  if (orientation === "vertical") {
    if (placement === "positive-only") return ["0.0", "+0.5", "+1.0"];
    if (placement === "negative-only") return ["−1.0", "−0.5", "0.0"];
    return ["−1.0", "0.0", "+1.0"];
  }
  if (placement === "positive-only") return ["+1.0", "+0.5", "0.0"];
  if (placement === "negative-only") return ["0.0", "−0.5", "−1.0"];
  return ["+1.0", "0.0", "−1.0"];
}

function meterScaleLabels(
  minimum: number,
  maximum: number,
  orientation: WaveformOrientation,
): readonly string[] {
  const labels = [`${minimum} dB`, `${Math.round((minimum + maximum) / 2)} dB`, `${maximum} dB`];
  return orientation === "horizontal" ? labels : [...labels].reverse();
}

function vfxScenarioFrame(frame: BandEnergyFrame, scenario: VfxEnergyScenario): BandEnergyFrame {
  if (scenario === "signal") return frame;
  const sourceBands =
    frame.bands.length > 0
      ? frame.bands
      : Array.from({ length: 8 }, (_, index) => ({
          energy: 0,
          highFrequency: 40 * 2 ** (index + 1),
          id: `fixture-${index}`,
          lowFrequency: 40 * 2 ** index,
        }));
  return Object.freeze({
    bands: Object.freeze(
      sourceBands.map((band, index) =>
        Object.freeze({
          ...band,
          energy: scenario === "zero" ? 0 : index % 3 === 0 ? 1.75 : index % 3 === 1 ? -0.25 : 0.8,
        }),
      ),
    ),
    kind: "bands",
    state: "ready",
  });
}
