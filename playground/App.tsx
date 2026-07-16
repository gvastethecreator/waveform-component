import {
  IconCheck,
  IconCode,
  IconCopy,
  IconFocus2,
  IconLayoutGrid,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_SPECTRUM_ANALYSIS_CONFIG,
  DEFAULT_SPECTRUM_CONFIG,
  DEFAULT_SPECTRUM_DYNAMICS_CONFIG,
  DEFAULT_ENVELOPE_CONFIG,
  DEFAULT_WAVEFORM_CONFIG,
  Envelope,
  GUARDED_SPECTRUM_FFT_SIZE,
  RecordedWaveformPlayer,
  SessionWaveform,
  Spectrum,
  SpectrumFrameDelay,
  SPECTRUM_CONTROL_DEFINITIONS,
  Waveform,
  analyzeSpectrum,
  createDemoWaveform,
  createDemoWaveformSource,
  createEnvelopeFrameFromWaveform,
  createMicrophoneSource,
  createRecordedAudioSource,
  createSpectrumFrame,
  createSpectrumDynamicsProcessor,
  createWaveformSession,
  getSpectrumControlAvailability,
  resolveSpectrumAnalysisConfig,
  resolveSpectrumConfig,
  resolveSpectrumDynamicsConfig,
  resolveSpectrumFrequencyRange,
  resolveVisualSyncOffset,
  useWaveformSession,
  useMicrophoneSource,
  type CanvasSpectrumConfig,
  type CanvasWaveformConfigInput,
  type EnvelopeAmplitudePlacement,
  type EnvelopeFrame,
  type RecordedAudioSource,
  type MicrophoneSource,
  type SpectrumControlDefinition,
  type SpectrumControlId,
  type SpectrumDynamicsConfig,
  type SpectrumDynamicsResult,
  type SpectrumFrequencyScale,
  type SpectrumFrame,
  type SpectrumGeometry,
  type SpectrumInputState,
  type SpectrumInterpolation,
  type SpectrumSmoothingMode,
  type VisualSyncCapability,
  type WaveformSessionStatus,
  type SpectrumWindow,
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

export default function App() {
  const [view, setView] = useState<"overview" | "focus">("overview");
  const [visualMode, setVisualMode] = useState<"envelope" | "spectrum" | "waveform">("waveform");
  const [presetId, setPresetId] = useState<Preset["id"]>("broadcast");
  const [signalColor, setSignalColor] = useState<string>(PRESETS[0].color);
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
  const [barWidth, setBarWidth] = useState(DEFAULT_SPECTRUM_CONFIG.barWidth);
  const [barGap, setBarGap] = useState(DEFAULT_SPECTRUM_CONFIG.barGap);
  const [showSpectrumGrid, setShowSpectrumGrid] = useState(DEFAULT_SPECTRUM_CONFIG.showGrid);
  const [dynamicsSettings, setDynamicsSettings] = useState<SpectrumDynamicsConfig>(
    DEFAULT_SPECTRUM_DYNAMICS_CONFIG,
  );
  const [visualSyncOffsetMs, setVisualSyncOffsetMs] = useState(0);
  const session = useMemo(() => createWaveformSession<WaveformFrame>(), []);
  const preset = PRESETS.find((candidate) => candidate.id === presetId) ?? PRESETS[0];
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
  const timeDomainConfig = useMemo<CanvasWaveformConfigInput>(
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
        visualMode === "spectrum" && !recordedSource
          ? (sessionSnapshot.frame?.channels[0] ?? [])
          : [],
        {
          ...spectrumAnalysis,
          sampleRate,
        },
      ),
    [recordedSource, sampleRate, sessionSnapshot.frame, spectrumAnalysis, visualMode],
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
  const spectrumConfig = useMemo<Partial<CanvasSpectrumConfig>>(
    () => ({
      barGap,
      barWidth,
      color: signalColor,
      frequencyScale,
      geometry: spectrumGeometry,
      highFrequency,
      interpolation: spectrumInterpolation,
      lineWidth,
      lowFrequency,
      maximumDecibels,
      minimumDecibels,
      showGrid: showSpectrumGrid,
    }),
    [
      barGap,
      barWidth,
      frequencyScale,
      highFrequency,
      lineWidth,
      lowFrequency,
      maximumDecibels,
      minimumDecibels,
      signalColor,
      showSpectrumGrid,
      spectrumGeometry,
      spectrumInterpolation,
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

  useEffect(() => {
    void session.attach(activeSource);
    return () => {
      void session.detach();
    };
  }, [activeSource, session]);

  const reset = () => {
    setVisualMode("waveform");
    setPresetId("broadcast");
    setSignalColor(PRESETS[0].color);
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
    setBarWidth(DEFAULT_SPECTRUM_CONFIG.barWidth);
    setBarGap(DEFAULT_SPECTRUM_CONFIG.barGap);
    setShowSpectrumGrid(DEFAULT_SPECTRUM_CONFIG.showGrid);
    setDynamicsSettings(DEFAULT_SPECTRUM_DYNAMICS_CONFIG);
    setVisualSyncOffsetMs(0);
    setCopyState("idle");
  };

  const updateDynamics = (patch: Partial<SpectrumDynamicsConfig>) => {
    setDynamicsSettings((current) => resolveSpectrumDynamicsConfig({ ...current, ...patch }));
  };

  const copyCode = async () => {
    const code =
      visualMode === "spectrum"
        ? `const dynamics = createSpectrumDynamicsProcessor();\n\n<Spectrum\n  data={dynamics.process(\n    analyzeSpectrum(samples, {\n      sampleRate: ${sampleRate},\n      fftSize: ${spectrumAnalysis.fftSize},\n      allowLargeFft: ${spectrumAnalysis.allowLargeFft},\n      window: "${spectrumAnalysis.window}",\n      powerOfSineExponent: ${spectrumAnalysis.powerOfSineExponent},\n      minimumDecibels: ${spectrumAnalysis.minimumDecibels},\n      maximumDecibels: ${spectrumAnalysis.maximumDecibels}\n    }),\n    {\n      smoothingMode: "${dynamicsSettings.smoothingMode}",\n      smoothingFactor: ${dynamicsSettings.smoothingFactor},\n      attackMs: ${dynamicsSettings.attackMs},\n      releaseMs: ${dynamicsSettings.releaseMs},\n      inertiaMs: ${dynamicsSettings.inertiaMs},\n      fastPeaks: ${dynamicsSettings.fastPeaks},\n      normalizationEnabled: ${dynamicsSettings.normalizationEnabled},\n      normalizationTargetDb: ${dynamicsSettings.normalizationTargetDb},\n      normalizationMaxGainDb: ${dynamicsSettings.normalizationMaxGainDb},\n      gaussianRadius: ${dynamicsSettings.gaussianRadius},\n      highFrequencySlopeDbPerOctave: ${dynamicsSettings.highFrequencySlopeDbPerOctave},\n      rolloffBandwidthHz: ${dynamicsSettings.rolloffBandwidthHz},\n      rolloffAttenuationDb: ${dynamicsSettings.rolloffAttenuationDb}\n    },\n    { timestampMs: performance.now(), sourceState: "ready" }\n  ).frame}\n  config={{\n    renderer: "canvas2d",\n    mode: "spectrum",\n    geometry: "${spectrumGeometry}",\n    frequencyScale: "${frequencyScale}",\n    lowFrequency: ${lowFrequency},\n    highFrequency: ${highFrequency},\n    minimumDecibels: ${minimumDecibels},\n    maximumDecibels: ${maximumDecibels},\n    interpolation: "${spectrumInterpolation}",\n    lineWidth: ${lineWidth},\n    barWidth: ${barWidth},\n    barGap: ${barGap},\n    showGrid: ${showSpectrumGrid},\n    color: "${signalColor}"\n  }}\n/>`
        : visualMode === "envelope"
          ? `<Envelope\n  data={magnitudes}\n  ${timeDomainSizing === "fixed" ? `width={${fixedTimeDomainWidth}}\n  ` : ""}config={{\n    renderer: "canvas2d",\n    mode: "envelope",\n    channelMode: "${channelMode}",${channelMode === "single" ? `\n    channelIndex: ${channelIndex},` : ""}\n    channelLayout: "${channelLayout}",\n    channelGap: ${channelGap},\n    amplitudePlacement: "${envelopePlacement}",\n    orientation: "${orientation}",\n    amplitude: ${amplitude.toFixed(2)},\n    lineWidth: ${lineWidth.toFixed(1)},\n    color: "${signalColor}",\n    showCenterLine: ${showCenterLine}\n  }}\n/>`
          : `<Waveform\n  data={channels}\n  ${timeDomainSizing === "fixed" ? `width={${fixedTimeDomainWidth}}\n  ` : ""}config={{\n    renderer: "canvas2d",\n    mode: "waveform",\n    channelMode: "${channelMode}",${channelMode === "single" ? `\n    channelIndex: ${channelIndex},` : ""}\n    channelLayout: "${channelLayout}",\n    channelGap: ${channelGap},\n    amplitudePlacement: "${waveformPlacement}",\n    orientation: "${orientation}",\n    amplitude: ${amplitude.toFixed(2)},\n    lineWidth: ${lineWidth.toFixed(1)},\n    color: "${signalColor}",\n    showCenterLine: ${showCenterLine}\n  }}\n/>`;
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const spectrumCapabilityContext = {
    allowLargeFft,
    geometry: spectrumGeometry,
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
  const temporalCapabilityReason = microphoneSource
    ? undefined
    : "Requires a clocked live frame stream; the deterministic demo has no cadence.";
  const syncCapabilityReason = microphoneSource
    ? visualSyncResolution.reason
    : "Requires a clocked source. Static previews have no audio/visual timeline to offset.";

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
                <span>CANVAS 2D</span>
                <span>
                  {visualMode === "spectrum"
                    ? "MONO"
                    : `${selectedChannelCount} CH · ${channelLayout.toUpperCase()}`}
                </span>
              </div>
            </div>
            <div
              className="signal-stage"
              data-dynamics-policy={spectrumPresentation.result?.policy ?? "unprocessed"}
            >
              {recordedSource && !microphoneSource ? (
                <RecordedWaveformPlayer
                  ariaLabel={`${recordedSource.getTransportSnapshot().name} local waveform preview`}
                  className="primary-waveform"
                  config={timeDomainConfig}
                  height="100%"
                  session={session}
                  source={recordedSource}
                />
              ) : visualMode === "spectrum" ? (
                <>
                  <div className="signal-scale" aria-hidden="true">
                    <span>{maximumDecibels} dB</span>
                    <span>{Math.round((minimumDecibels + maximumDecibels) / 2)} dB</span>
                    <span>{minimumDecibels} dB</span>
                  </div>
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
                  <div className="frequency-axis" aria-hidden="true">
                    <span>{formatFrequency(spectrumFrequencyRange.lowFrequency)}</span>
                    <span>{frequencyScale === "log" ? "LOG Hz" : "LINEAR Hz"}</span>
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
            </div>
            <div className="artifact-footer">
              <span>
                {visualMode === "spectrum"
                  ? `${spectrumFrame.bins.length.toLocaleString()} BINS · ${spectrumAnalysis.fftSize.toLocaleString()} FFT`
                  : `${(sessionSnapshot.frame?.sampleCount ?? 0).toLocaleString()} DISPLAY SAMPLES`}
              </span>
              <span>
                {visualMode === "spectrum"
                  ? spectrumPresentation.result
                    ? `PEAK ${spectrumPresentation.result.peakDb.toFixed(1)} dBFS · ${spectrumPresentation.result.reacting ? "REACTING" : "IDLE"}`
                    : "DYNAMICS INITIALIZING"
                  : visualMode === "envelope"
                    ? "MAGNITUDE 0…1 · POLARITY SEPARATE"
                    : "SIGNED −1…+1 · POLARITY PRESERVED"}
              </span>
              <span>
                {visualMode === "spectrum"
                  ? `${spectrumPresentation.result?.policy.toUpperCase() ?? "UNPROCESSED"} · VISUAL ONLY`
                  : `${orientation.toUpperCase()} · ${timeDomainSizing.toUpperCase()}`}
              </span>
            </div>
          </div>

          <section className="preset-section" aria-labelledby="preset-heading">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DETERMINISTIC SOURCES</span>
                <h2 id="preset-heading">Signal studies</h2>
              </div>
              <span>Same component · four configurations</span>
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
                      data={createDemoWaveform({ phase: candidate.phase, sampleCount: 384 })}
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
            <h2>Signal 007</h2>
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
                aria-pressed={visualMode === "waveform"}
                onClick={() => setVisualMode("waveform")}
              >
                Waveform
              </button>
              <button
                type="button"
                aria-describedby={recordedSource ? "time-domain-source-limit" : undefined}
                aria-pressed={visualMode === "envelope"}
                disabled={Boolean(recordedSource)}
                onClick={() => setVisualMode("envelope")}
              >
                Envelope
              </button>
              <button
                type="button"
                aria-describedby={recordedSource ? "time-domain-source-limit" : undefined}
                aria-pressed={visualMode === "spectrum"}
                disabled={Boolean(recordedSource)}
                onClick={() => setVisualMode("spectrum")}
              >
                Spectrum
              </button>
            </div>
            <StaticRow label="Rendering engine" value="Canvas 2D" />
            <p
              className="control-note"
              id={recordedSource ? "time-domain-source-limit" : undefined}
            >
              {recordedSource
                ? "Envelope and spectrum are disabled: this transport exposes bounded peaks, not raw PCM. Signed polarity remains in the player."
                : "Mode and engine are separate public contracts."}
            </p>
          </ControlSection>

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
                    updateDynamics({ smoothingMode: value as SpectrumSmoothingMode })
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

          <ControlSection title="Geometry">
            {visualMode === "spectrum" ? (
              <>
                <SelectControl
                  definition={spectrumControl("geometry")}
                  value={spectrumGeometry}
                  onChange={(value) => setSpectrumGeometry(value as SpectrumGeometry)}
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
            <label className="toggle-control">
              <span>
                <strong>{visualMode === "spectrum" ? "dB grid" : "Center line"}</strong>
                <small>
                  {visualMode === "spectrum"
                    ? "Floor, midpoint, and ceiling reference"
                    : visualMode === "envelope"
                      ? "Magnitude baseline reference"
                      : "Zero-amplitude reference"}
                </small>
              </span>
              <input
                type="checkbox"
                checked={visualMode === "spectrum" ? showSpectrumGrid : showCenterLine}
                onChange={(event) =>
                  visualMode === "spectrum"
                    ? setShowSpectrumGrid(event.currentTarget.checked)
                    : setShowCenterLine(event.currentTarget.checked)
                }
              />
            </label>
          </ControlSection>

          <ControlSection title="Contract">
            <dl className="contract-list">
              <div>
                <dt>Input</dt>
                <dd>
                  {visualMode === "spectrum"
                    ? "ordered dB bins"
                    : visualMode === "envelope"
                      ? "magnitude channels"
                      : "signed PCM channels"}
                </dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>
                  {visualMode === "spectrum"
                    ? `${minimumDecibels}…${maximumDecibels} dBFS`
                    : visualMode === "envelope"
                      ? "0…1 magnitude"
                      : "−1…+1 signed"}
                </dd>
              </div>
              <div>
                <dt>Resize</dt>
                <dd>DPR aware</dd>
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
    () => ({ delay: new SpectrumFrameDelay(), dynamics: createSpectrumDynamicsProcessor() }),
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
    const result = engine.dynamics.process(frame, config, { sourceState: inputState, timestampMs });
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
