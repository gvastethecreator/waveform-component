import {
  SessionWaveform,
  Waveform,
  createDemoWaveform,
  createStaticWaveformFrame,
  createStaticWaveformSource,
  createWaveformSession,
  type WaveformFrame,
} from "waveform-component";

const samples = createDemoWaveform({ sampleCount: 512 });
const frame = createStaticWaveformFrame(samples, { sampleRate: 48_000 });
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
