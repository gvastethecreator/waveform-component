import {
  Envelope,
  EqualizerGrid,
  EQUALIZER_GRID_CONTROL_DEFINITIONS,
  EQUALIZER_GRID_PRESETS,
  DOM_RENDERER_ADAPTER,
  DOM_RENDERER_CAPABILITIES,
  Meter,
  NeonLines,
  NEON_LINES_CONTROL_DEFINITIONS,
  NEON_LINES_PRESETS,
  PulseRing,
  SignalOverlay,
  SVG_RENDERER_CAPABILITIES,
  SVG_RENDERER_ADAPTER,
  WEBGL2_RENDERER_CAPABILITIES,
  SessionWaveform,
  Spectrum,
  RecordedWaveformPlayer,
  Waveform,
  createDemoWaveform,
  createBandEnergyFrameFromSpectrum,
  createEnvelopeFrameFromWaveform,
  analyzeSpectrum,
  analyzeMeter,
  createMicrophoneSource,
  createMeterDynamicsProcessor,
  createSpectrumDynamicsProcessor,
  createStaticWaveformFrame,
  createStaticWaveformSource,
  createWaveformSession,
  createWebglPulseRingRenderer,
  createWebglEqualizerGridRenderer,
  createWebglNeonLinesRenderer,
  renderSvgMeter,
  renderSvgSpectrum,
  renderDomMeter,
  renderDomSpectrum,
  resolvePulseRingConfig,
  resolveEqualizerGridConfig,
  resolveNeonLinesConfig,
  useMicrophoneSource,
  type MicrophoneSource,
  type WaveformFrame,
  type RecordedAudioSource,
} from "waveform-component";

const samples = createDemoWaveform({ sampleCount: 512 });
const frame = createStaticWaveformFrame(samples, { sampleRate: 48_000 });
const envelope = createEnvelopeFrameFromWaveform(frame);
const spectrum = analyzeSpectrum(samples, {
  fftSize: 512,
  sampleRate: 48_000,
  window: "blackman-harris",
});
const pulseRingBands = createBandEnergyFrameFromSpectrum(spectrum, {
  bandCount: 8,
});
const pulseRingConfig = resolvePulseRingConfig({
  bandReactivity: 1.2,
  glowStrength: 0.9,
  quality: "balanced",
  thickness: 0.06,
});
const neonLinesConfig = resolveNeonLinesConfig({
  ...NEON_LINES_PRESETS[1].config,
  lineCount: 9,
  motion: "reduced",
});
const equalizerGridConfig = resolveEqualizerGridConfig({
  ...EQUALIZER_GRID_PRESETS[2].config,
  gridColumns: 32,
  quality: "high",
});
const dynamics = createSpectrumDynamicsProcessor();
const meterDynamics = createMeterDynamicsProcessor();
const meter = meterDynamics.process(analyzeMeter(frame, { minimumDecibels: -60 }), undefined, {
  sourceEpoch: 1,
  timestampMs: 0,
});
const responsiveSpectrum = dynamics.process(
  spectrum,
  {
    gaussianRadius: 1.25,
    normalizationEnabled: true,
    normalizationMaxGainDb: 6,
    normalizationTargetDb: -12,
    smoothingMode: "time-variant-ema",
  },
  { timestampMs: 0 },
);
const session = createWaveformSession<WaveformFrame>();
void session.attach(createStaticWaveformSource(samples, { id: "external-static" }));
const svgTimeScene = SVG_RENDERER_ADAPTER.render(
  { config: { renderer: "svg" }, frame },
  { height: 180, width: 640 },
  { idPrefix: "external-time" },
);
const svgSpectrumScene = renderSvgSpectrum(
  responsiveSpectrum.frame,
  { height: 180, width: 640 },
  { renderer: "svg" },
  { idPrefix: "external-spectrum" },
);
const svgMeterScene = renderSvgMeter(
  meter.frame,
  { height: 180, width: 640 },
  { renderer: "svg" },
  meter.history,
  { idPrefix: "external-meter" },
);
const domTimeScene = DOM_RENDERER_ADAPTER.render(
  { config: { renderer: "dom" }, frame },
  { height: 180, width: 640 },
);
const domSpectrumScene = renderDomSpectrum(
  responsiveSpectrum.frame,
  { height: 180, width: 640 },
  { geometry: "bars", layout: "rectangular", renderer: "dom" },
);
const domMeterScene = renderDomMeter(
  meter.frame,
  { height: 180, width: 640 },
  { layout: "rectangular", renderer: "dom" },
  meter.history,
);

export function ExternalConsumerExample() {
  return (
    <Waveform
      ariaLabel="External consumer waveform"
      data={frame}
      config={{
        color: "#62dcf5",
        lineWidth: 2,
        renderer: "canvas2d",
        mode: "waveform",
      }}
    />
  );
}

export function SharedSessionExample() {
  return <SessionWaveform ariaLabel="Shared external session" session={session} />;
}

export function SvgConsumerExample() {
  return (
    <section
      data-svg-budget={SVG_RENDERER_CAPABILITIES.limits.maximumNodes}
      data-svg-scenes={`${svgTimeScene.status}/${svgSpectrumScene.status}/${svgMeterScene.status}`}
    >
      <Waveform ariaLabel="External SVG waveform" data={frame} config={{ renderer: "svg" }} />
      <Spectrum
        ariaLabel="External SVG spectrum"
        data={responsiveSpectrum.frame}
        config={{ renderer: "svg" }}
      />
      <Meter
        ariaLabel="External SVG meter"
        data={meter.frame}
        history={meter.history}
        config={{ renderer: "svg" }}
      />
    </section>
  );
}

export function DomConsumerExample() {
  return (
    <section
      data-dom-budget={DOM_RENDERER_CAPABILITIES.limits.maximumNodes}
      data-dom-scenes={`${domTimeScene.status}/${domSpectrumScene.status}/${domMeterScene.status}`}
    >
      <Spectrum
        ariaLabel="External DOM spectrum"
        data={responsiveSpectrum.frame}
        config={{ geometry: "bars", layout: "rectangular", renderer: "dom" }}
      />
      <Meter
        ariaLabel="External DOM meter"
        data={meter.frame}
        history={meter.history}
        config={{ layout: "rectangular", renderer: "dom" }}
      />
    </section>
  );
}

export function EnvelopeConsumerExample() {
  return (
    <Envelope
      ariaLabel="External magnitude envelope"
      data={envelope}
      config={{
        amplitudePlacement: "mirrored",
        channelLayout: "stacked",
        channelMode: "source",
        mode: "envelope",
        orientation: "vertical",
      }}
      height={320}
      width={160}
    />
  );
}

export function SpectrumConsumerExample() {
  return (
    <Spectrum
      ariaLabel="External ordered spectrum"
      data={responsiveSpectrum.frame}
      config={{
        colorMode: "gradient",
        colorRoles: {
          base: { alpha: 0.7, color: "#62dcf5" },
          crest: { alpha: 1, color: "#f8d65c" },
        },
        frequencyScale: "log",
        geometry: "bars",
        gradientRatio: 1.5,
        highFrequency: 20_000,
        interpolation: "lanczos",
        layout: "radial",
        lowFrequency: 20,
        radialArc: 300,
        radialDeadzone: 0.24,
        radialRotation: 300,
        roundedCaps: true,
      }}
    />
  );
}

export function MeterConsumerExample() {
  return (
    <Meter
      ariaLabel="External RMS meter"
      data={meter.frame}
      history={meter.history}
      config={{
        colorMode: "range",
        measurement: "rms",
        mode: "stepped-meter",
        stepGap: 3,
        stepWidth: 8,
      }}
    />
  );
}

export function PulseRingConsumerExample() {
  return (
    <section data-webgl2-band-budget={WEBGL2_RENDERER_CAPABILITIES.limits.maximumBands}>
      <PulseRing
        ariaLabel="External audio-reactive Pulse Ring"
        config={pulseRingConfig}
        data={pulseRingBands}
      />
    </section>
  );
}

export function createExternalPulseRingRenderer(canvas: HTMLCanvasElement) {
  return createWebglPulseRingRenderer(canvas);
}

export function NeonGridConsumerExample() {
  return (
    <section
      data-grid-controls={EQUALIZER_GRID_CONTROL_DEFINITIONS.length}
      data-neon-controls={NEON_LINES_CONTROL_DEFINITIONS.length}
    >
      <NeonLines
        ariaLabel="External audio-reactive Neon Lines"
        config={neonLinesConfig}
        data={pulseRingBands}
      />
      <EqualizerGrid
        ariaLabel="External audio-reactive Equalizer Grid"
        config={equalizerGridConfig}
        data={pulseRingBands}
      />
    </section>
  );
}

export function createExternalNeonLinesRenderer(canvas: HTMLCanvasElement) {
  return createWebglNeonLinesRenderer(canvas);
}

export function createExternalEqualizerGridRenderer(canvas: HTMLCanvasElement) {
  return createWebglEqualizerGridRenderer(canvas);
}

export function OverlayConsumerExample({
  playhead,
  onPlayheadChange,
}: {
  readonly playhead: number;
  readonly onPlayheadChange: (value: number) => void;
}) {
  return (
    <div style={{ height: 180, position: "relative", width: 640 }}>
      <Waveform ariaLabel="Editable external waveform" data={frame} />
      <SignalOverlay
        ariaLabel="External waveform editor"
        handles={[
          {
            domainMaximum: 1,
            domainMinimum: 0,
            id: "playhead",
            kind: "playhead",
            label: "Playhead",
            maximum: 1,
            minimum: 0,
            onChange: (value) => onPlayheadChange(value),
            step: 0.01,
            value: playhead,
          },
        ]}
        markers={[{ id: "transient", label: "Transient marker", position: 0.68 }]}
        regions={[
          {
            active: true,
            end: 0.42,
            id: "selection",
            kind: "selection",
            label: "Active selection",
            start: 0.18,
          },
        ]}
        seek={{
          label: "Seek waveform",
          onChange: (value) => onPlayheadChange(value),
          step: 0.01,
          value: playhead,
        }}
      />
    </div>
  );
}

export function RecordedConsumerExample({ source }: { readonly source: RecordedAudioSource }) {
  return <RecordedWaveformPlayer ariaLabel="Local recording" session={session} source={source} />;
}

export function createExternalMicrophone() {
  return createMicrophoneSource({ id: "external-microphone" });
}

export function MicrophoneStatus({ source }: { readonly source: MicrophoneSource }) {
  const snapshot = useMicrophoneSource(source);
  return <output>{snapshot.state}</output>;
}
