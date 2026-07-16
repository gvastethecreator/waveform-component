# Research: waveform component foundations

Date: 2026-07-16  
Status: decision-ready  
Primary question: Which product structure, public seams, rendering model, control taxonomy, and license boundary let this project inherit the strengths of `folders` while delivering a genuinely reusable and highly customizable web waveform component?

## Bottom line

Build a static Bun/React/TypeScript/Vite/Tailwind project with two deliverables: a packageable waveform library and an inspector-workbench playground. Reuse the architectural pattern from `folders`—one typed config, deterministic defaults and presets, shared geometry/data contracts, capability-aware adapters, overview/focus preview modes, a Controls/Code rail, and evidence-heavy tests—but do not copy its folder domain or couple the package to its playground.

The library should use a headless session/controller seam with source adapters, an analysis module, and rendering adapters. Ship semantic DOM around the visual surface. Canvas 2D is the default renderer for core waveform/spectrum/meter modes; SVG and DOM provide inspectable alternatives; WebGL2 owns the original VFX family. All renderers consume the same signed waveform, envelope, ordered spectrum, meter, and optional distributed-energy frame model.

Treat both OBS snapshots as behavioral research only. They are GPL-licensed. Reimplement the requirements clean-room and originally; do not copy their C++, FFT code, or shaders. ElevenLabs UI is MIT and offers useful browser patterns, but its monolithic waveform file, incomplete slider accessibility, uncancelled async/RAF paths, and missing long-data/test strategy should not become this project's baseline.

## Sources and authority

### Repository-owned and local primary sources

- `D:/DEV/folders/package.json`, `README.md`, `docs/architecture.md`, `docs/agents/*`, `src/types.ts`, `src/config/playgroundCatalog.ts`, `src/animation/*`, `src/components/*`, `src/index.css`, `e2e/*`, and `.github/workflows/*`. These define the requested baseline's product, stack, structure, UI, and proof model.
- `.scratch/references/audio-wave-main/src/audio-shader-source.cpp`, bundled `.effect`/`.effect.ini` files, `README.md`, `buildspec.json`, and `LICENSE`. These define actual Audio Shader Engine controls, analysis behavior, VFX behavior, and GPL v2 licensing.
- `.scratch/references/waveform-master/src/source.cpp`, `source_generic.cpp`, `source.hpp`, `filter.hpp`, `data/gradient.effect`, `data/locale/en-US.ini`, `CMakeLists.txt`, `changelog.md`, and `LICENSE`. These define Waveform 1.9.1 controls, DSP/render behavior, failure paths, and GPL v3-or-later licensing.
- `.scratch/references/elevenlabs-ui/apps/www/registry/elevenlabs-ui/ui/{waveform,live-waveform,bar-visualizer,scrub-bar,audio-player}.tsx`, matching docs/examples, root/app manifests, and `LICENSE.md`. These define the local ElevenLabs reference APIs and MIT terms.
- Rendered `folders` evidence: `.scratch/evidence/baseline-folders/{desktop,narrow,single}.png`, captured in installed Chrome at 1440×960 and 390×844 on 2026-07-16.

The three reference snapshots do not include Git metadata, so their exact commit date cannot be established. Claims below point to the local source snapshot rather than an inferred upstream version.

### Current official platform sources

- [Web Audio API 1.1](https://www.w3.org/TR/webaudio-1.1/) defines `AnalyserNode`, `AudioBuffer`, analysis ranges, and browser audio graph behavior. Inspected 2026-07-16.
- [Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/) defines explicit microphone permission, rejection, device, track, and revocation behavior. Inspected 2026-07-16.
- [HTML Living Standard: Canvas](https://html.spec.whatwg.org/multipage/canvas.html) defines Canvas 2D, bitmap sizing, fallback content, export, and offscreen transfer. The inspected document was updated 2026-07-15.
- [React `useEffect`](https://react.dev/reference/react/useEffect) defines lifecycle synchronization and symmetric cleanup for external systems, including the development Strict Mode stress cycle. Inspected 2026-07-16.

## Findings

### 1. What to inherit from `folders`

`folders` is a pure-frontend, static React 19.2/Vite 8/Tailwind 4/TypeScript 7 app run with Bun 1.3.14. It uses strict TypeScript, oxlint, oxfmt, Vitest, Testing Library, Playwright, and SHA-pinned GitHub Actions (`D:/DEV/folders/package.json:16-63`, `tsconfig.json:2-27`, `.github/workflows/ci.yml:11-55`).

Its strongest reusable pattern is not any individual visual effect. It is the contract:

- one typed `PlaygroundConfig`, public defaults, reducer, and stable randomization (`src/types.ts:69-229`);
- catalogs for engines, capabilities, presets, and palettes (`src/animation/engineCatalog.ts:22-79`, `src/config/playgroundCatalog.ts:10-159`);
- shared geometry/timing consumed by several adapters (`docs/architecture.md:10-32`);
- an artifact-dominant viewport with overview and focused preview modes (`src/App.tsx:141-312`);
- a compact right inspector with Controls/Code, accessible tabs, disclosures, conditional controls, reset, and copy feedback (`src/components/PlaygroundControls.tsx:437-1206`);
- deterministic, standalone code export that includes only the selected adapter (`src/animation/engineCatalog.ts:79-500`);
- unit/component tests plus Chromium E2E for parity, interruption, touch, responsive layout, reduced motion, fallback, and export (`e2e/animation-compatibility.spec.ts`, `e2e/playground.spec.ts`).

Rendered evidence confirms a desktop no-scroll workbench with a 320 px inspector and a main artifact field. At 390 px the inspector moves first in DOM/visual order with bounded height and the gallery follows in a two-column grid. Focus mode gives one artifact visual sovereignty plus direct previous/next selection. These relationships should map to waveform overview/focus, not be repainted as generic dashboard cards.

`folders` itself is a private SPA and has no package `exports` (`package.json:2-10`). The new project must add a library build, stable public interfaces, generated declarations, and an external-consumer smoke test rather than assuming the playground bundle is a reusable component.

### 2. OBS control taxonomy that must be represented

The mature `waveform-master` source establishes the functional taxonomy. Defaults live at `src/source.cpp:119-173`; property options/ranges and conditional visibility live at `src/source.cpp:176-460`.

| Family                        | Required web controls or equivalents                                                                                                                 | Primary source                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Source and lifecycle          | demo/file/microphone/external source; sync offset; hide on silence; muted processing; explicit status/error/retry                                    | `waveform-master/src/source.cpp:176-220,676-779`; Media Capture spec                                                             |
| Normalization                 | enable, target dBFS, maximum gain, react/peak thresholds, attack, release                                                                            | `waveform-master/src/source.cpp:207-220`; `audio-wave-main/src/audio-shader-source.cpp:849-919`                                  |
| Display/data mode             | signed waveform, envelope, ordered spectrum curve, bars, stepped bars, meter, stepped meter, optional distributed energy                             | `waveform-master/data/locale/en-US.ini`; `source_generic.cpp:26-390`; Audio Shader analysis at `audio-shader-source.cpp:425-537` |
| Canvas/layout                 | responsive or explicit dimensions; orientation; mirror; radial; invert; deadzone; arc; rotation; rounded caps                                        | `waveform-master/src/source.cpp:233-335`                                                                                         |
| Channels                      | mono, stereo, single channel, channel index, spacing                                                                                                 | `waveform-master/src/source.cpp:328-346,1077-1103`                                                                               |
| FFT/window                    | FFT size, guarded large FFT, none/Hann/Hamming/Blackman/Blackman-Harris/power-of-sine window, sine exponent                                          | `waveform-master/src/source.cpp:347-381`; Web Audio `AnalyserNode`                                                               |
| Temporal/geometric processing | no/EMA/time-variant EMA smoothing, inertia, fast peaks, nearest/Lanczos/Catmull-Rom interpolation, none/Gaussian filter, radius                      | `waveform-master/src/source.cpp:382-417`; `filter.hpp:40-64`                                                                     |
| Spectral mapping              | low/high cutoff Hz, linear/log scale, floor/ceiling dBFS, slope, roll-off bandwidth and rate                                                         | `waveform-master/src/source.cpp:418-431`; `source_generic.cpp:26-180`                                                            |
| Geometry                      | bar width/gap, step width/gap, minimum bar height, line width, amplitude scale, baseline/center alignment                                            | `waveform-master/src/source.cpp:284-327` plus web-specific extension                                                             |
| Color                         | line/solid/gradient/pulse/range, pulse by magnitude/frequency, base/middle/crest RGBA, ratio, middle/crest dB thresholds, played/unplayed web layers | `waveform-master/src/source.cpp:432-460,1672-1743`                                                                               |
| Meter/history                 | RMS/peak, history/buffer duration, update rate                                                                                                       | `waveform-master/src/source.cpp:233-283`; `source_generic.cpp:182-390`                                                           |
| Quality/performance           | DPR, frame/update rate, visibility pause, quality cap, renderer/backend, reduced motion                                                              | WHATWG Canvas; React lifecycle docs; ElevenLabs local source                                                                     |

The Audio Shader Engine adds level, peak, bass, mid, treble, 8–64 bands, four colors, and thirteen visual families. Its actual effects directory, rather than the shorter README list, is authoritative:

1. pulse ring;
2. neon lines;
3. equalizer grid;
4. waveform ribbon;
5. rounded wobble bars;
6. spectrum bars;
7. radial spikes;
8. tunnel waves;
9. liquid blobs;
10. starfield burst;
11. vortex rings;
12. reactive camera frame;
13. storm lightning.

Each effect must expose named, typed parameters with real units/ranges/defaults in a TS schema. Do not repeat the OBS sidecar limitation where every effect receives anonymous `option1..8` values from 0 to 1 (`audio-wave-main/src/audio-shader-source.cpp:129-233,849-919`). The WebGL2 implementations must be original; the local HLSL files are GPL behavioral references, not transplantable assets.

The Audio Shader Engine's 64-cell texture is not an ordered spectrum. It finds local peaks and redistributes them across a pseudo-random energy field (`audio-shader-source.cpp:478-537`). The new frame contract must expose `orderedSpectrum` and `distributedEnergy` separately so a frequency chart cannot accidentally render VFX scatter as Hz order.

### 3. ElevenLabs patterns worth keeping—and correcting

The local ElevenLabs source validates Canvas 2D + `ResizeObserver` + DPR + RAF as a practical browser baseline (`ui/waveform.tsx:46-132`, `ui/live-waveform.tsx:72-99`). It also provides three useful interface ideas:

- controlled playback/scrub values (`currentTime`, `duration`, `onSeek`);
- explicit live status and stream lifecycle callbacks;
- a headless audio provider separated from transport controls.

It is not sufficient as the implementation base:

- `ui/waveform.tsx` is a 1,658-line module that combines seven concerns and duplicates lifecycle logic;
- several elements claim slider semantics but implement mouse-only dragging, with no complete keyboard/touch behavior (`waveform.tsx:416-471,1197-1329,1589-1655`);
- live acquisition has no epoch/abort guard after asynchronous permission resolution (`live-waveform.tsx:253-313`);
- some RAF fade loops are not retained/cancelled and one live loop continues while inactive (`live-waveform.tsx:202-226,408-518`);
- frequency cutoffs are treated as array indices in one hook rather than converting Hz to bins (`bar-visualizer.tsx:126-140,194-219`);
- there are no waveform/audio-specific tests in the snapshot.

The new project should use Pointer Events with capture/cancel, keyboard slider behavior, accessible value text, native media events, explicit async epochs, RAF only while active, deterministic fixtures, and no per-frame React state for raw analysis frames.

### 4. Public seam alternatives

Constraints shared by all alternatives:

- callers include a static display, controlled scrubber, live microphone view, audio player, preset gallery, external `MediaStream`/`AudioNode` owner, and custom renderer author;
- browser audio and animation objects must be created only after mount/user action and destroyed symmetrically;
- analysis frames can update at 30–60 Hz without rerendering the React tree at that rate;
- signed PCM waveform, envelope, spectrum, meter, and energy data cannot be conflated;
- the package must remain SSR-import safe even though runtime audio is browser-only;
- semantics depend on behavior: image/display, slider, range, or editor are distinct.

#### Alternative A — one smart component

`<Waveform source=... mode=... playback=... analysis=... visual=... />` owns acquisition, decode, transport, analysis, drawing, and interaction.

- Depth: high for the happy path, low once source/interaction combinations multiply.
- Locality: poor; permission, playback, analysis, rendering, and semantics converge in one module.
- Test surface: one huge matrix.
- Verdict: reject. It repeats the ElevenLabs monolith.

#### Alternative B — hooks plus a dumb renderer

Hooks return arrays/status; callers compose `<WaveformCanvas frame=... />` and their own transport.

- Depth: analysis hooks are focused, but callers own synchronization and error composition.
- Locality: good inside each hook, poor across complete workflows.
- Leverage: good for advanced consumers, weak for common use.
- Verdict: keep as low-level escape hatches, not the only interface.

#### Alternative C — headless session plus adapters and convenience React interfaces

A framework-neutral session owns lifecycle/state and publishes stable snapshots. Source adapters provide static peaks, decoded audio/media, microphone, and external nodes/streams. Analysis consumes PCM and publishes a typed frame. Rendering adapters consume the same frame/config. React interfaces subscribe without moving raw frames through React state; convenience modules cover display, controlled scrubber, and live input.

- Depth: highest; one session interface hides acquisition and lifecycle without hiding source ownership.
- Locality: source, DSP, renderer, playback, and interaction bugs remain in their own modules.
- Leverage: one frame/config contract unlocks Canvas, SVG, DOM, WebGL2, custom renderers, playground, and export.
- Test surface: pure DSP/geometry, source lifecycle, renderer contract, React semantics, and end-to-end workflows are separable.
- Cost: more initial modules and explicit capability metadata.
- Verdict: select. The cost is justified by the requested customization breadth and multiple real adapters.

### 5. Platform implications

Web Audio's `AnalyserNode` allows `fftSize` powers of two from 32 to 32768; larger sizes cost more and smoothing is constrained to 0–1. That is a useful live default but cannot express every OBS window/interpolation/filter contract. The first deep interface should therefore permit a native analyser adapter and an advanced analysis adapter rather than baking browser-native limitations into public types.

Microphone acquisition must be explicit and user-initiated. `getUserMedia()` returns a promise and can reject for permission, missing devices, inactive documents, or constraints. The UI must distinguish idle, requesting, live, muted, silent, ended, denied, unavailable, and recoverable error states, and it must stop tracks and close audio contexts when ownership belongs to the component.

Canvas is appropriate for dense animated visual data, but the HTML Standard requires equivalent purpose/fallback content. Controls, playback state, values, and errors stay in semantic DOM. A display canvas gets an accessible image description; a scrubber gets a real slider interface with keyboard/Pointer behavior rather than canvas-only hit regions.

## Product and design decision

Classify the playground as an interactive audio lab / creative instrument. User mode is create + explore; the primary artifact is the live waveform/spectrum/effect; pressure is low-consequence but high-frequency comparison; input is pointer + keyboard + touch; spatial model is an inspector workbench.

The selected direction should preserve `folders`' artifact sovereignty and overview/focus grammar, but replace the passive gallery with a synchronized signal stage and transport. The waveform itself becomes the signature: direct overlay handles show thresholds, frequency window, playhead, loop/selection, and channel scope on the artifact they change. Diagnostics remain collapsed until an error or explicit inspection.

Two plausible alternatives remain useful as rejected direction records rather than hidden ambiguity: a phase-locked multi-engine matrix and a modulation patchbay. The matrix over-weights comparison at the expense of focus; the patchbay makes the common task slower and introduces learned interaction before the component's core contract is proven.

## How this changes the next decisions

1. Wayfinder can close baseline, control, license, public seam, and visual-direction tickets without more broad research.
2. The PRD must describe both package and playground; a private SPA alone is not acceptable.
3. Tickets should be vertical tracer slices through source → analysis → renderer → React interface → playground → tests, not horizontal “build DSP” or “build controls” layers.
4. Core modes and controls must work before original VFX families; WebGL2 effects can land as independently demoable slices over the same session/frame contract.
5. Browser proof must include desktop, 390 px, reduced motion, keyboard/touch scrubbing, permission denial/recovery, decode failure, WebGL2 unsupported fallback, long data, and runnable standalone export.

## Remaining uncertainty

- Exact package name and public repository URL are not known; use a local private package name until the user provides publishing identity.
- Cross-browser audio MIME/MediaRecorder behavior is intentionally not assumed. Chromium is the initial automated browser baseline; Firefox/Safari claims stay unverified until added and executed.
- Reusing any substantial ElevenLabs code would require preserving its MIT notice. Current recommendation is original implementation, so no third-party source reuse is planned.
- A legal review is required before any literal GPL code or shader reuse; this plan avoids that path.

## Recommended next action

Resolve the Wayfinder decision map, persist the three design direction artifacts and selected direction, then synthesize the local PRD and dependency-ordered vertical slices. After the required seams/ticket review, create the durable goal and start with a package/playground tracer bullet.
