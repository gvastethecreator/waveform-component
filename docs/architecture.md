# Architecture

## Boundaries

`src/` is the reusable package. `playground/` is a consumer and may only import the package through `waveform-component`. Package modules never import playground code. `fixtures/external-consumer/` installs a freshly packed tarball and proves generated declarations outside Vite aliases.

The package has no browser side effects at module scope. Rendering and media work begins only inside an explicit component/session lifecycle. This keeps imports compatible with SSR and build tooling.

## Tracer contracts

- `WaveformFrame` preserves signed normalized channels and explicitly distinguishes empty and ready data.
- `EnvelopeFrame` preserves non-negative magnitudes as a different canonical kind; conversion from signed PCM is explicit rather than hidden in geometry.
- `createStaticWaveformFrame` copies and validates caller data so later mutations cannot change a published frame.
- `selectTimeDomainChannels` keeps source/stereo/single identity or performs a documented finite mono average before layout.
- `buildTimeDomainSegments` is pure orientation-neutral geometry. It bins extrema per primary-axis pixel, retains source/display channel indices, applies only valid waveform/envelope amplitude placement, and lays out stacked/split/overlay channels without reading DOM or Canvas state.
- `CanvasWaveformConfig` is discriminated by data mode and channel selection. Runtime frame-count/layout constraints raise `WaveformConfigError`; the React layer surfaces that structured failure without unmounting the semantic canvas.
- `renderCanvasTimeDomain` consumes a canonical frame/config/viewport, groups overlay strokes by channel color, and splits playback by normalized progress in either orientation.
- Spectrum geometry keeps rectangular and polar coordinates pure. Full arcs close without duplicating radial bars; partial arcs include both frequency endpoints; deadzone/inversion never alter ordered-bin meaning.
- The spectrum color grammar is renderer-independent at its decision seam: thresholds select named roles, pulse mapping produces a bounded factor, and Canvas resolves typed alpha/CSS variables only at the drawing boundary.
- `MeterFrame` stores linear and dBFS peak/RMS values together with its amplitude-1 reference, so measurement units and meaning cannot be inferred from a generic array.
- Meter ballistics is a stateful stage between analysis and geometry. Timestamp-derived attack/release remains cadence-independent; fast peak bypass is narrower than RMS response; source epoch/channel/sample-rate/backwards-time incompatibility resets smoothing and history.
- Meter history is bounded twice: analysis capacity is derived from duration/interval under a 16,384-entry hard ceiling, while Canvas samples at most 64 compatible ghosts per draw. Geometry stays pure across continuous/stepped, rectangular/radial, mono/stereo, resize, and degenerate viewports.
- `syncCanvasSize` assigns the backing-store dimensions and an absolute DPR transform, avoiding cumulative scale.
- `Waveform` and `Envelope` are React convenience interfaces over one internal Canvas lifecycle. They create static frames when needed, observe fixed or responsive containers, and draw only after mount.

## Planned seams

`WaveformSession` is the framework-neutral lifecycle boundary. It publishes immutable snapshots through `subscribe/getSnapshot`, accepts generic canonical analysis frames, assigns a new epoch on every source transition, aborts old work, ignores stale callbacks, disposes late async handles, and distinguishes terminal disposal from ordinary detach. Sources own their resource policy: borrowed host streams/elements/nodes remove only package listeners, while owned stream tracks stop exactly once.

React uses `useSyncExternalStore` through `useWaveformSession`; `SessionWaveform` is a convenience view over waveform frames. The playground's artifact and status readout share one session connection.

Recorded audio remains a source adapter rather than a special playground path. It resolves local or URL input lazily, owns its decoding context/media element/object URL, publishes a bounded min/max peak pyramid and signed display frame, and exposes a separate external-store transport snapshot. Source epochs suppress stale decode publication; late owned resources still dispose. `RecordedWaveformPlayer` composes the session frame with controlled transport rather than taking ownership away from the source.

Live capture follows the same source boundary. `createMicrophoneSource` defers `getUserMedia` until session attachment after an explicit UI action, then owns its stream, analyser, audio context, listeners, and animation loop. Track events and sustained low input map to visible microphone/session states. Device end releases analysis resources immediately; ordinary detach and stale permission results are idempotent. `createLiveMediaStreamSource` borrows tracks by default while retaining ownership of only the package-created analysis graph.

Spectrum analysis is a pure PCM-to-`SpectrumFrame` module. Window coefficients and the radix-2 transform have no DOM or audio-node dependency; coherent-gain normalization produces ordered dBFS bins. FFT/window/dB validation is shared by programmatic use and the playground. Spectrum geometry converts public hertz cutoffs to fractional bins only at its boundary, handles linear/log axes, and resamples with nearest, Lanczos, or Catmull-Rom before Canvas curve/bar drawing. Its public control catalog describes applicability separately from values, so disabled settings retain an explicit capability reason.

Spectrum dynamics is a separate stateful stage after analysis and before geometry. It applies capped normalization, spectral slope/roll-off, Gaussian bin filtering, then timestamp-derived temporal response. EMA persistence is converted to a 60 Hz-equivalent time constant; attack/release and inertia share the same elapsed-time model, so host cadence does not redefine the configured behavior. The result carries thresholds and named visibility/mute policy rather than hiding source state in renderer code.

Visual synchronization is also outside the renderer. Capability resolution rejects look-ahead for live sources, while a bounded frame queue supports positive visual delay without claiming ownership of the audio clock or output. The playground enables temporal/source/sync controls only for clocked live input and explains why static previews cannot demonstrate them.

Meter analysis follows the same channel-selection seam as time-domain geometry. `analyzeMeterWindows` creates explicit measurement windows; `createMeterDynamicsProcessor` owns response and history; pure meter geometry maps configured dBFS to lanes, segments, or concentric arcs; Canvas owns only drawing and CSS/system-color resolution. The public capability catalog describes when stepped, radial, history, channel, and color controls apply.

Later tickets add SVG/DOM/WebGL2 adapters, original clean-room VFX, and standalone code export without changing the dependency direction established here.

## Provenance

The project is a clean-room implementation. OBS references are used to enumerate desired controls and behaviors; their GPL C/C++/shader implementations are excluded. Platform behavior is grounded in the official sources linked by the research note.
