# waveform-component

A headless-first audio visualization package with a React convenience layer and an artifact-dominant Signal Workbench. Canonical waveform, envelope, spectrum, meter, and band-energy frames feed bounded Canvas 2D, SVG, DOM/CSS, and WebGL2 surfaces without coupling source ownership to rendering.

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

## Channels, layouts, and magnitude envelopes

Signed waveform channels remain distinct from non-negative envelope magnitudes. `Waveform` accepts mono or nested channel arrays in `[-1, 1]`; `Envelope` accepts magnitudes in `[0, 1]`. `createEnvelopeFrameFromWaveform` performs an explicit absolute-magnitude conversion when that is the intended view.

```tsx
const stereo = [leftPcm, rightPcm];

<Waveform
  data={stereo}
  config={{
    channelMode: "stereo", // source | mono | stereo | single
    channelLayout: "split", // stacked | split | overlay
    channelGap: 12,
    amplitudePlacement: "centered", // positive-only | negative-only
    orientation: "horizontal", // or vertical
    channelColors: ["#62dcf5", "#f8d65c"],
  }}
/>;

<Envelope
  data={createEnvelopeFrameFromWaveform(frame)}
  config={{
    mode: "envelope",
    amplitudePlacement: "mirrored", // or baseline
    channelMode: "source",
    channelLayout: "stacked",
  }}
  width={320}
  height={160}
/>;
```

Mono mixing averages only channels that contain the current sample, so uneven tails remain finite and phase-inverted stereo can cancel correctly. Stereo requires two source channels; single-channel mode requires a valid `channelIndex`; split requires exactly two selected channels; overlay requires at least two. Pure geometry APIs throw a structured `WaveformConfigError` for invalid combinations, while React surfaces the same code and recovery message over the mounted canvas instead of leaving an unexplained blank artifact.

The layouts are deliberately distinct: `stacked` partitions the amplitude axis into lanes, `split` gives a stereo pair separate panels along the time axis, and `overlay` draws channels in one shared lane without mixing their samples.

`buildTimeDomainSegments` is orientation-neutral and keeps source/display channel indices on every segment. Numeric width and height request fixed internal sizing; percentage/string sizing remains responsive, and a fixed width clamps to its container on narrow layouts. Canvas backing stores are recreated from current CSS bounds and DPR with an absolute transform.

## Radial spectrum and color roles

Spectrum keeps visual primitive (`curve` or `bars`) separate from layout (`rectangular` or `radial`). Polar geometry exposes an explicit deadzone ratio, 0…360° arc, wraparound rotation, inward inversion, and rounded caps. A zero arc intentionally draws no signal; a 100% deadzone intentionally collapses magnitude extent while keeping every coordinate finite.

```tsx
<Spectrum
  className="themed-spectrum"
  data={spectrumFrame}
  config={{
    geometry: "bars",
    layout: "radial",
    radialDeadzone: 0.24,
    radialArc: 300,
    radialRotation: 300,
    roundedCaps: true,
    colorMode: "gradient", // line | solid | gradient | pulse | range
    colorRoles: {
      base: { color: "var(--signal-base, #62dcf5)", alpha: 0.72 },
      crest: { color: "var(--signal-crest, #f8d65c)", alpha: 1 },
    },
    gradientRatio: 1.5,
  }}
/>
```

```css
.themed-spectrum {
  --signal-base: #62dcf5;
  --signal-crest: #f8d65c;
}
```

`pulse` blends base→accent from peak magnitude or peak-frequency position. `range` maps ordered base/middle/crest roles using normalized `middleDecibels <= crestDecibels` thresholds. Every role has independent alpha. The React Canvas path resolves inherited CSS custom properties at draw time; direct headless/Canvas callers can pass computed CSS colors as typed values.

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

## RMS, peak, and bounded meters

`analyzeMeter` computes linear peak, linear RMS, peak dBFS, and RMS dBFS independently for every selected channel. dBFS values explicitly use linear amplitude `1` as the `0 dBFS` reference. An impulse therefore has a higher peak than RMS; a full-scale sine is approximately `0 dBFS` peak and `-3.01 dBFS` RMS.

```tsx
const processor = createMeterDynamicsProcessor();
const result = processor.process(
  analyzeMeter(samples, {
    channelMode: "stereo", // source | mono | stereo | single
    minimumDecibels: -60,
    sampleRate: 48_000,
  }),
  {
    attackMs: 80,
    releaseMs: 420,
    fastPeaks: true,
    historyDurationMs: 2_000,
    historyIntervalMs: 50,
  },
  { sourceEpoch, timestampMs: performance.now() },
);

<Meter
  data={result.frame}
  history={result.history}
  config={{
    mode: "stepped-meter", // or meter
    measurement: "rms", // or peak
    layout: "rectangular", // or radial
    stepWidth: 8,
    stepGap: 3,
    minimumSize: 2,
    roundedCaps: true,
  }}
/>;
```

Attack/release uses elapsed timestamps rather than frame count. `fastPeaks` bypasses attack only for a rising peak; RMS retains its configured ballistics. `METER_PRESETS` provides `Broadcast RMS`, `Fast peak`, and `Slow RMS` starting points without hiding their values.

History capacity is `min(maximumHistoryEntries, floor(duration / interval) + 1)`. Public inputs clamp to at most 600 seconds and 16,384 entries. The processor drops expired frames and resets smoothing/history when the source epoch, channel count, sample rate, or timestamp direction changes. Canvas samples at most 64 compatible history frames for drawing, so a long analysis history cannot create an unbounded render pass. `METER_CONTROL_DEFINITIONS` and `getMeterControlAvailability` expose the inspector's named controls and disabled reasons.

## Accessible seeking and editor overlays

`SignalOverlay` is a controlled semantic layer for a positioned waveform, envelope, spectrum, or meter. Canvas or SVG remains a noninteractive visual renderer; seek value, regions, markers, selection state, and direct handles are independently named DOM controls. The host owns every value and receives both preview (`commit: false`) and committed (`commit: true`) changes.

```tsx
const [playhead, setPlayhead] = useState(0.32);

<div style={{ height: 240, position: "relative" }}>
  <Waveform data={frame} />
  <SignalOverlay
    ariaLabel="Waveform editor"
    seek={{
      label: "Seek waveform",
      onChange: setPlayhead,
      step: 0.01,
      value: playhead,
    }}
    handles={[
      {
        domainMinimum: 0,
        domainMaximum: 1,
        id: "playhead",
        kind: "playhead",
        label: "Playhead",
        minimum: 0,
        maximum: 1,
        onChange: setPlayhead,
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
  />
</div>;
```

`minimum`/`maximum` describe the value a handle may currently commit. Optional `domainMinimum`/`domainMaximum` describe where that value sits on the shared signal axis; paired selection, loop, or cutoff handles therefore cannot cross but do not jump when their allowed range changes. Horizontal controls honor LTR/RTL, vertical controls use up/down keys, and Home/End/Page keys remain bounded. Set `reversed` on a seek surface or handle for a bottom-up or otherwise physically reversed value axis without changing the logical value domain. Pointer events cover mouse, pen, and touch; cancellation restores the value present at pointer-down. Overlapping ranges receive separate hit-target lanes, overlapping markers/handles receive deterministic point lanes, and every control remains a separate tab stop with a component-owned focus indicator and polite commit/activation announcements.

## Canvas, SVG, and DOM/CSS renderer parity

The existing `Waveform`, `Envelope`, `Spectrum`, `Meter`, `SessionWaveform`, and recorded-player interfaces switch adapters through the same config field. Frames, source/session state, playback, and controlled overlays are not recreated by an engine change.

```tsx
const [renderer, setRenderer] = useState<CoreRendererId>("canvas2d");

<Waveform data={frame} config={{ renderer }} />;
<Spectrum
  data={spectrumFrame}
  config={{ renderer, geometry: "bars", layout: renderer === "dom" ? "rectangular" : "radial" }}
/>;
<Meter data={meterFrame} history={history} config={{ renderer, mode: "stepped-meter" }} />;
```

`CORE_RENDERER_CATALOG`, the three built-in capability records, and `getRendererSupport` publish supported modes plus practical limits. SVG supports every currently implemented core waveform/envelope/spectrum/meter layout and color mode, but it is deliberately bounded to 32 channels, 1,024 time-domain columns, 512 spectrum points, 16 meter-history layers, and 4,096 rendered shape nodes. Reductions are exposed through `data-svg-message` and the returned `SvgScene.messages`; an exceeded channel or node budget produces a visible `SVG_RENDER_UNSUPPORTED` state rather than silently dropping config.

For headless or custom integrations, `SVG_RENDERER_ADAPTER`/`renderSvgFrame` route canonical frame kinds through one capability-bearing seam; `renderSvgTimeDomain`, `renderSvgSpectrum`, and `renderSvgMeter` expose its focused functions. All return immutable `SvgScene` descriptors. Supply a stable, instance-unique `idPrefix` when multiple headless scenes will share a document; the React interfaces derive one from `useId`, so gradient IDs and references remain stable and collision-free automatically. SVG inherits CSS color roles, substitutes system roles in forced colors, has no animation of its own, and reuses `SignalOverlay` instead of introducing focusable SVG hit regions.

DOM/CSS intentionally supports only rectangular spectrum `bars`, `meter`, and `stepped-meter`; waveform/envelope curves and every radial layout return a visible `DOM_RENDER_UNSUPPORTED` state. It preserves CSS-variable color roles without headless resolution, uses system colors under forced colors, samples at most 256 spectrum bars and four compatible history layers, supports eight channels, and never exposes more than 1,024 shape boxes. Excessive stepped density is rejected before geometry allocation. `DOM_RENDERER_ADAPTER`/`renderDomFrame`, `renderDomSpectrum`, and `renderDomMeter` return immutable `DomScene` descriptors, while React exposes matching `data-dom-*` counts/messages and mounts no renderer-specific interaction targets or animation work.

## WebGL2 Pulse Ring

WebGL2 is a VFX renderer rather than a silent substitute for the core adapters. `PulseRing` consumes a canonical `BandEnergyFrame`; `createBandEnergyFrameFromSpectrum` derives 1–16 ordered logarithmic bands from a `SpectrumFrame` by averaging bin power and returning RMS amplitude energy in `[0, 1]`.

```tsx
import {
  PulseRing,
  createBandEnergyFrameFromSpectrum,
  type SpectrumFrame,
} from "waveform-component";

export function AudioRing({ spectrum }: { spectrum: SpectrumFrame }) {
  const bands = createBandEnergyFrameFromSpectrum(spectrum, { bandCount: 8 });

  return (
    <PulseRing
      data={bands}
      config={{
        thickness: 0.055,
        glowStrength: 0.75,
        rotationSpeed: 0.18,
        bandReactivity: 1,
        primaryColor: "#62dcf5",
        secondaryColor: "#a7f59c",
        tertiaryColor: "#ff7892",
        sweepColor: "#f8d65c",
        quality: "balanced",
      }}
    />
  );
}
```

The clean-room Pulse Ring owns one program, one vertex buffer, one vertex-array object, and no textures. Quality caps backing-buffer DPR at `1×`, `1.5×`, or `2×`, with absolute limits of 4,096 pixels per dimension and 4,194,304 total pixels. The adapter fully recreates GPU resources after `webglcontextrestored`; unavailable, compilation/link failure, context loss, restoration, and terminal error states keep a labeled CSS fallback visible instead of exposing a blank canvas. `destroy()` removes listeners and releases every live resource.

`motion: "auto"` follows `prefers-reduced-motion`; reduced motion renders one deterministic static frame and starts no animation loop. Forced colors use a manual high-contrast pixel palette because browser system colors cannot be passed directly to GLSL. The React surface exposes `data-webgl-state`, generation, resource counts, backing-buffer size/DPR, degradation, animation state, and draw calls for host diagnostics. `WEBGL2_RENDERER_CAPABILITIES` and `BUILTIN_RENDERER_CATALOG` keep its `pulse-ring`-only scope explicit; the core `Waveform`, `Envelope`, `Spectrum`, and `Meter` configs continue to accept only `CoreRendererId`.

## Development

Requires Bun 1.3.14.

```bash
bun install
bun run dev
bun run verify:tracer
bun run test:e2e
```

The playground imports `waveform-component` through the public entry point and drives its main artifact through a shared session. `fixtures/external-consumer` installs a freshly packed tarball and typechecks waveform/envelope layout, session, recorded-player, microphone, analyzer, spectrum-dynamics, Canvas/SVG/DOM renderers, WebGL2 Pulse Ring and adapter APIs, meter-analysis, meter-history, and controlled overlay interfaces against generated declarations exactly as an external consumer would.

## Project records

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Research/provenance: [`docs/research/2026-07-16-waveform-component-foundations.md`](docs/research/2026-07-16-waveform-component-foundations.md)
- WebGL2 lifecycle research: [`docs/research/2026-07-16-webgl2-pulse-ring-lifecycle.md`](docs/research/2026-07-16-webgl2-pulse-ring-lifecycle.md)
- Product requirements: [`.scratch/waveform-component/PRD.md`](.scratch/waveform-component/PRD.md)
- Execution frontier: [`.scratch/waveform-component/issues/`](.scratch/waveform-component/issues/)

## License and clean-room boundary

Project source is MIT. Local OBS plugin references are used only to study behavior and control vocabulary; their GPL source and shaders are not copied or adapted. ElevenLabs UI is an MIT reference for conceptual comparison, not a source dependency.
