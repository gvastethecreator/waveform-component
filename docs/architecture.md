# Architecture

## Boundaries

`src/` is the reusable package. `playground/` is a consumer and may only import the package through `waveform-component`. Package modules never import playground code. `fixtures/external-consumer/` installs a freshly packed tarball and proves generated declarations outside Vite aliases.

The package has no browser side effects at module scope. Rendering and media work begins only inside an explicit component/session lifecycle. This keeps imports compatible with SSR and build tooling.

## Tracer contracts

- `WaveformFrame` preserves signed normalized channels and explicitly distinguishes empty and ready data.
- `createStaticWaveformFrame` copies and validates caller data so later mutations cannot change a published frame.
- `buildWaveformColumns` is pure geometry. It bins min/max values per horizontal pixel, retains polarity, and stacks channels without reading DOM or Canvas state.
- `renderCanvasWaveform` consumes a canonical frame/config/viewport.
- `syncCanvasSize` assigns the backing-store dimensions and an absolute DPR transform, avoiding cumulative scale.
- `Waveform` is the React convenience interface. It creates a static frame when needed, observes its container, and draws only after mount.

## Planned seams

`WaveformSession` is the framework-neutral lifecycle boundary. It publishes immutable snapshots through `subscribe/getSnapshot`, accepts generic canonical analysis frames, assigns a new epoch on every source transition, aborts old work, ignores stale callbacks, disposes late async handles, and distinguishes terminal disposal from ordinary detach. Sources own their resource policy: borrowed host streams/elements/nodes remove only package listeners, while owned stream tracks stop exactly once.

React uses `useSyncExternalStore` through `useWaveformSession`; `SessionWaveform` is a convenience view over waveform frames. The playground's artifact and status readout share one session connection.

Recorded audio remains a source adapter rather than a special playground path. It resolves local or URL input lazily, owns its decoding context/media element/object URL, publishes a bounded min/max peak pyramid and signed display frame, and exposes a separate external-store transport snapshot. Source epochs suppress stale decode publication; late owned resources still dispose. `RecordedWaveformPlayer` composes the session frame with controlled transport rather than taking ownership away from the source.

Live capture follows the same source boundary. `createMicrophoneSource` defers `getUserMedia` until session attachment after an explicit UI action, then owns its stream, analyser, audio context, listeners, and animation loop. Track events and sustained low input map to visible microphone/session states. Device end releases analysis resources immediately; ordinary detach and stale permission results are idempotent. `createLiveMediaStreamSource` borrows tracks by default while retaining ownership of only the package-created analysis graph.

Later tickets add spectrum analysis, pure DSP modules, SVG/DOM/WebGL2 adapters, capability-scoped schemas, original clean-room VFX, and standalone code export without changing the dependency direction established here.

## Provenance

The project is a clean-room implementation. OBS references are used to enumerate desired controls and behaviors; their GPL C/C++/shader implementations are excluded. Platform behavior is grounded in the official sources linked by the research note.
