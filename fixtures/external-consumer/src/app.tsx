import {
  Envelope,
  Meter,
  SessionWaveform,
  Spectrum,
  RecordedWaveformPlayer,
  Waveform,
  createDemoWaveform,
  createEnvelopeFrameFromWaveform,
  analyzeSpectrum,
  analyzeMeter,
  createMicrophoneSource,
  createMeterDynamicsProcessor,
  createSpectrumDynamicsProcessor,
  createStaticWaveformFrame,
  createStaticWaveformSource,
  createWaveformSession,
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

export function ExternalConsumerExample() {
  return (
    <Waveform
      ariaLabel="External consumer waveform"
      data={frame}
      config={{ color: "#62dcf5", lineWidth: 2, renderer: "canvas2d", mode: "waveform" }}
    />
  );
}

export function SharedSessionExample() {
  return <SessionWaveform ariaLabel="Shared external session" session={session} />;
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
