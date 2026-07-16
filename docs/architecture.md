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

Ticket 002 adds the approved framework-neutral `WaveformSession`, source adapters, canonical multi-kind frames, epochs, ownership, and cleanup. Later tickets add pure analysis modules, SVG/DOM/WebGL2 adapters, capability-scoped schemas, original clean-room VFX, and standalone code export without changing the package/playground dependency direction established here.

## Provenance

The project is a clean-room implementation. OBS references are used to enumerate desired controls and behaviors; their GPL C/C++/shader implementations are excluded. Platform behavior is grounded in the official sources linked by the research note.
