# waveform-component

A headless-first audio visualization package with a React convenience layer and an artifact-dominant Signal Workbench. The current tracer slice renders deterministic signed static waveform data through Canvas 2D; the approved roadmap expands the same frame/config/session contracts across sources, DSP, renderers, and original VFX.

## Quick start

```tsx
import { Waveform, createDemoWaveform } from "waveform-component";

const samples = createDemoWaveform({ sampleCount: 2048 });

export function Example() {
  return (
    <Waveform
      data={samples}
      config={{
        renderer: "canvas2d",
        mode: "waveform",
        color: "#62dcf5",
        amplitude: 0.86,
      }}
    />
  );
}
```

Static values must be finite and normalized to `[-1, 1]`. Empty input produces an explicit empty frame. The package does not access `window`, `document`, Web Audio, or media devices at module scope.

## Shared headless session

`WaveformSession` separates source ownership and frame publication from React. One source connection can feed several views, and source epochs prevent stale async work from publishing after replacement.

```tsx
import {
  SessionWaveform,
  createDemoWaveformSource,
  createWaveformSession,
  type WaveformFrame,
} from "waveform-component";

const session = createWaveformSession<WaveformFrame>();
await session.attach(createDemoWaveformSource({ sampleCount: 2048 }));

export function SharedViews() {
  return (
    <>
      <SessionWaveform session={session} ariaLabel="Primary waveform" />
      <SessionWaveform session={session} ariaLabel="Mirrored waveform" />
    </>
  );
}
```

Sources declare `owned` or `borrowed` semantics. Borrowed media streams, elements, and audio nodes are detached without stopping or disconnecting host resources; owned stream tracks stop exactly once. Call `detach()` to replace/remove a source and `dispose()` for terminal session teardown.

## Local recorded audio

`createRecordedAudioSource` accepts a `File`, `Blob`, URL, or `ArrayBuffer`. Local inputs are decoded with Web Audio and played through an owned in-memory media URL; they are never uploaded. The source publishes a bounded multi-resolution signed peak pyramid and a display frame through the same session.

`RecordedWaveformPlayer` adds played/unplayed colors, play/pause, position labels, a controlled seek surface, and explicit Arrow, Page, Home, End, and Space keyboard behavior. Decode, playback, media, and not-ready failures are structured and recoverable by replacing the source.

```tsx
const source = createRecordedAudioSource(file, { name: file.name });
await session.attach(source);

<RecordedWaveformPlayer source={source} session={session} />;
```

## Live microphone and host streams

`createMicrophoneSource` is intentionally inert until its source is attached to a session, so importing the package, rendering the playground, or creating the adapter never opens a permission prompt. The adapter reports requesting, live, muted, silent, ended, denied, unavailable, and recoverable-error states through `useMicrophoneSource`.

```tsx
const microphone = createMicrophoneSource();

// Call from an explicit user action.
await session.attach(microphone);

// Stops package-owned tracks and releases its analyser/context.
await session.detach();
```

Use `createLiveMediaStreamSource(stream)` for a host-owned stream. It disconnects its own analyser/context but leaves borrowed tracks running; pass `{ ownership: "owned" }` only when the package should stop them. Permission denial and device loss remain visible, recoverable session states while the waveform surface stays mounted.

## Ordered spectrum

`analyzeSpectrum` is a pure advanced analyzer for signed PCM. It applies an explicit None, Hann, Hamming, Blackman, Blackman-Harris, or Power-of-Sine window, runs a radix-2 FFT, and returns increasing frequency bins in dBFS. FFT sizes normalize to platform-style powers of two from 32 through 32,768; 65,536 requires `allowLargeFft: true`.

```tsx
const spectrum = analyzeSpectrum(samples, {
  sampleRate: 48_000,
  fftSize: 2048,
  window: "hann",
  minimumDecibels: -100,
  maximumDecibels: 0,
});

<Spectrum
  data={spectrum}
  config={{
    geometry: "curve", // or "bars"
    frequencyScale: "log",
    lowFrequency: 20,
    highFrequency: 20_000,
    interpolation: "catmull-rom",
  }}
/>;
```

Cutoffs remain in hertz and clamp against source Nyquist only when geometry is built; fractional bins are internal. `nearest`, `lanczos`, and `catmull-rom` change only display resampling. `SPECTRUM_CONTROL_DEFINITIONS` exposes typed labels, units, ranges, defaults, descriptions, and capability reasons for a custom inspector.

## Dynamics, filtering, and visual synchronization

`createSpectrumDynamicsProcessor` turns ordered spectrum frames into a deliberate reactive stream. Its time-domain response uses elapsed timestamps, so simple EMA, attack/release, inertia, and fast-peak behavior do not change when the host cadence changes. Stateless controls cover capped target normalization, Gaussian bin filtering, high-frequency slope compensation, and cutoff roll-off.

```tsx
const dynamics = createSpectrumDynamicsProcessor();

function onSpectrumFrame(frame: SpectrumFrame, timestampMs: number) {
  const result = dynamics.process(
    frame,
    {
      smoothingMode: "time-variant-ema",
      attackMs: 35,
      releaseMs: 240,
      inertiaMs: 40,
      normalizationEnabled: true,
      normalizationTargetDb: -12,
      normalizationMaxGainDb: 6,
      gaussianRadius: 1.25,
    },
    { timestampMs, sourceState: "ready" },
  );

  return <Spectrum data={result.frame} ariaLabel="Reactive spectrum" />;
}
```

The result reports `reacting`, `peakActive`, `peakDb`, `visible`, and a named `processed`, `held-muted`, or `hidden-silent` policy. Floor-only silence is never normalized. With `processMuted: false`, the processor holds the previous frame; `hideSilent` applies only to explicit silence or the configured dB threshold.

Visual sync remains separate from audio ownership. `resolveVisualSyncOffset` rejects negative look-ahead when the source cannot supply future frames. `SpectrumFrameDelay` can buffer positive visual offsets, but it never delays or controls host audio.

## Development

Requires Bun 1.3.14.

```bash
bun install
bun run dev
bun run verify:tracer
bun run test:e2e
```

The playground imports `waveform-component` through the public entry point and drives its main artifact through a shared session. `fixtures/external-consumer` installs a freshly packed tarball and typechecks convenience, session, recorded-player, microphone, analyzer, spectrum-dynamics, and spectrum-renderer interfaces against generated declarations exactly as an external consumer would.

## Project records

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Research/provenance: [`docs/research/2026-07-16-waveform-component-foundations.md`](docs/research/2026-07-16-waveform-component-foundations.md)
- Product requirements: [`.scratch/waveform-component/PRD.md`](.scratch/waveform-component/PRD.md)
- Execution frontier: [`.scratch/waveform-component/issues/`](.scratch/waveform-component/issues/)

## License and clean-room boundary

Project source is MIT. Local OBS plugin references are used only to study behavior and control vocabulary; their GPL source and shaders are not copied or adapted. ElevenLabs UI is an MIT reference for conceptual comparison, not a source dependency.
