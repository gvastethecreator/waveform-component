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

## Development

Requires Bun 1.3.14.

```bash
bun install
bun run dev
bun run verify:tracer
bun run test:e2e
```

The playground imports `waveform-component` through the public entry point. `fixtures/external-consumer` installs a freshly packed tarball and typechecks against the generated declarations exactly as an external consumer would.

## Project records

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Research/provenance: [`docs/research/2026-07-16-waveform-component-foundations.md`](docs/research/2026-07-16-waveform-component-foundations.md)
- Product requirements: [`.scratch/waveform-component/PRD.md`](.scratch/waveform-component/PRD.md)
- Execution frontier: [`.scratch/waveform-component/issues/`](.scratch/waveform-component/issues/)

## License and clean-room boundary

Project source is MIT. Local OBS plugin references are used only to study behavior and control vocabulary; their GPL source and shaders are not copied or adapted. ElevenLabs UI is an MIT reference for conceptual comparison, not a source dependency.
