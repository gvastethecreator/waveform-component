import {
  SessionWaveform,
  Spectrum,
  RecordedWaveformPlayer,
  Waveform,
  createDemoWaveform,
  analyzeSpectrum,
  createMicrophoneSource,
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
const spectrum = analyzeSpectrum(samples, {
  fftSize: 512,
  sampleRate: 48_000,
  window: "blackman-harris",
});
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

export function SpectrumConsumerExample() {
  return (
    <Spectrum
      ariaLabel="External ordered spectrum"
      data={spectrum}
      config={{
        frequencyScale: "log",
        geometry: "bars",
        highFrequency: 20_000,
        interpolation: "lanczos",
        lowFrequency: 20,
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
