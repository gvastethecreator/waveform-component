# Waveform Component and Signal Workbench

Status: ready-for-agent

## Problem Statement

Web audio products repeatedly need waveforms, spectra, meters, scrubbers, and audio-reactive visuals, but available components usually solve only one narrow case. They often combine microphone permission, playback, analysis, drawing, and interaction in one shallow component; update React state at frame rate; conflate signed waveform samples with amplitude envelopes or frequency bins; expose mouse-only controls with incomplete slider semantics; and provide too few extension points for a serious creative tool.

The requested references show the desired breadth but cannot be used as-is. The OBS plugins provide a mature analysis, layout, color, metering, and VFX control taxonomy, yet their native C++/shader implementations are GPL-licensed and tied to OBS. The ElevenLabs components demonstrate useful Canvas, microphone, scrubber, and headless-player ideas, but do not provide the required DSP fidelity, accessibility, lifecycle safety, renderer extensibility, long-data strategy, or proof coverage. The `folders` project provides the right product intent and playground discipline, but it is a private component-comparison SPA rather than a distributable package.

Users need one coherent, typed waveform system that keeps audio source ownership, analysis data, rendering, playback interaction, and playground-only configuration distinct. They also need a real playground where every control visibly affects representative audio, unsupported combinations explain themselves, errors have recovery paths, and the selected configuration can be copied or consumed as a reusable React component.

## Solution

Create a static Bun/React/TypeScript project with two coupled but separately buildable products:

1. A reusable waveform library built around a headless `WaveformSession`, typed source adapters, a canonical `WaveformFrame`, pure analysis modules, capability-aware renderer adapters, and convenience React interfaces.
2. A Signal Workbench playground inspired by `folders`: artifact-dominant Overview and Focus modes, a compact Controls/Code inspector, deterministic presets, direct manipulation on the signal, visible lifecycle feedback, standalone selected-adapter export, and strong browser evidence.

The canonical frame distinguishes signed time-domain waveform, amplitude envelope, ordered frequency spectrum, meters/bands, and optional distributed VFX energy. Canvas 2D is the default renderer. SVG and DOM/CSS provide inspectable alternatives for supported core modes. WebGL2 provides original, clean-room audio-reactive VFX. Every renderer consumes the same frame/config contracts and declares its capabilities so invalid combinations are disabled or fall back visibly.

The playground follows the selected Signal Workbench direction. The live signal stage owns the first viewport. Visual Mode and Rendering Engine are separate labeled decisions. The primary route is explicit: Play or connect a source → adjust directly on the signal or inspector → Copy code. Cutoffs, thresholds, playhead, selection/loop region, and relevant layout handles are tethered to the artifact they alter. The interface contains no marketing preamble, random fake proof, decorative dashboard metrics, or visual effects unrelated to audio state.

## User Stories

1. As a React developer, I want to render deterministic waveform data with one component, so that I can add a useful visualization without adopting the playground.
2. As a React developer, I want package exports and generated declarations, so that my application receives stable types and editor support.
3. As a server-rendered application developer, I want the package to be safe to import without browser globals, so that SSR and build tooling do not fail before hydration.
4. As a framework integrator, I want a framework-neutral session interface beneath React, so that source, analysis, and rendering logic can be tested and reused independently.
5. As an advanced consumer, I want to create and own a `WaveformSession`, so that several views can share one source and analysis lifecycle.
6. As a common-case consumer, I want convenience React interfaces, so that I do not have to assemble source adapters and subscriptions manually.
7. As an application developer, I want to supply normalized static values, so that server-provided or precomputed waveforms can render without Web Audio.
8. As an audio application developer, I want to supply signed PCM channels, so that the waveform preserves polarity instead of becoming an absolute envelope.
9. As an audio application developer, I want to supply an `AudioBuffer`, so that decoded local audio can be analyzed without redundant decoding.
10. As an audio application developer, I want to supply a `File`, `Blob`, URL, or `ArrayBuffer`, so that common recorded-audio inputs are supported.
11. As a media-player developer, I want to attach an existing media element, so that the waveform follows my application's transport and buffering state.
12. As a realtime application developer, I want to attach an existing `MediaStream`, so that microphone ownership can remain in the host application.
13. As a Web Audio application developer, I want to attach an existing `AudioNode`, so that visualization can observe an established audio graph.
14. As a privacy-conscious user, I want microphone capture to start only after an explicit action, so that the page never records unexpectedly.
15. As a microphone user, I want requesting, live, muted, silent, ended, denied, unavailable, and recoverable-error states, so that I understand what the application is doing.
16. As a component consumer, I want explicit owned-versus-borrowed source semantics, so that the component never stops resources it does not own.
17. As a user changing sources quickly, I want stale permission or decode results ignored, so that an old request cannot resurrect after I moved on.
18. As a playground visitor, I want a deterministic generated signal available immediately, so that I can evaluate every visual without granting permission or loading a file.
19. As a playground visitor, I want to load a local audio file, so that I can tune the component against real content without uploading it.
20. As a playground visitor, I want to connect and disconnect a microphone with visible feedback, so that I can evaluate realtime behavior safely.
21. As an audio engineer, I want waveform, envelope, ordered spectrum, meter, stepped meter, and distributed-energy modes to be distinct, so that each graph preserves the meaning of its data.
22. As an audio engineer, I want mono, stereo, and single-channel modes, so that channel structure is represented accurately.
23. As a stereo-content user, I want configurable channel spacing and stacked, split, or overlaid layouts, so that channel comparison remains legible.
24. As an audio engineer, I want RMS and peak meters, so that I can choose sustained loudness or transient response.
25. As an audio engineer, I want configurable history or meter-buffer duration, so that short transients and long envelopes can be inspected.
26. As an audio engineer, I want FFT size control with a guarded large-FFT option, so that I can trade time resolution, frequency resolution, latency, and cost deliberately.
27. As an audio engineer, I want None, Hann, Hamming, Blackman, Blackman-Harris, and Power-of-Sine windows, so that leakage behavior is an explicit analysis choice.
28. As an audio engineer, I want a sine exponent when Power-of-Sine is selected, so that the selected window is fully configurable.
29. As an audio engineer, I want low and high cutoff controls expressed in Hz and limited by Nyquist, so that band selection is physically meaningful.
30. As an audio engineer, I want linear and logarithmic frequency scales, so that I can prioritize mathematical spacing or perceptual readability.
31. As an audio engineer, I want floor and ceiling controls in dBFS, so that low-level noise and peak range map predictably to the visual.
32. As an audio engineer, I want high-frequency slope compensation, so that quiet upper bands can remain readable without changing the source.
33. As an audio engineer, I want roll-off bandwidth and attenuation controls, so that frequencies outside the selected range fade rather than end abruptly.
34. As an audio engineer, I want no smoothing, simple EMA, and time-variant EMA modes, so that temporal behavior can fit the content.
35. As an audio engineer, I want inertia and fast-peak controls, so that rising transients and decay can be tuned separately.
36. As a creative technologist, I want attack and release times, so that reactive visuals respond quickly or gracefully.
37. As a creative technologist, I want react and peak dB thresholds, so that the same visual can adapt to quiet and loud sources.
38. As an audio engineer, I want optional volume normalization with target level and maximum gain, so that content with different levels produces comparable visuals.
39. As a user monitoring a delayed source, I want a visual sync offset, so that the visualization can align with audible playback within source capabilities.
40. As an advanced user, I want nearest, Lanczos, and Catmull-Rom interpolation, so that resampled curves and bars can favor speed or smoothness.
41. As an advanced user, I want optional Gaussian geometric filtering and a filter radius, so that visual noise can be reduced independently of temporal smoothing.
42. As a creative developer, I want curve, bars, stepped bars, waveform, envelope, meter, and stepped-meter geometry families, so that the same data supports different visual grammars.
43. As a creative developer, I want bar width, bar gap, step width, step gap, minimum height, line width, and amplitude controls, so that density and silhouette are deeply customizable.
44. As a creative developer, I want centered, baseline, positive-only, negative-only, and mirrored amplitude layouts where meaningful, so that the graph can fit different compositions.
45. As a creative developer, I want horizontal and vertical orientation, so that the component can fit players, sidebars, cards, and stages.
46. As a creative developer, I want radial layout, inversion, deadzone, arc, and rotation controls, so that spectrum and meter data can become circular compositions.
47. As a creative developer, I want rounded caps and corner radius controls, so that bars and meters can range from technical to soft.
48. As a creative developer, I want responsive sizing plus optional explicit internal dimensions, so that the component can be crisp in flexible and fixed-resolution contexts.
49. As a design-system consumer, I want light, dark, and high-contrast-safe styling through CSS variables and typed color roles, so that the component integrates without forking source.
50. As a creative developer, I want line, solid, gradient, pulse, and dB-range color modes, so that color can communicate structure and audio state.
51. As a creative developer, I want pulse behavior driven by peak magnitude or peak frequency, so that color reactivity can represent intensity or spectral position.
52. As a creative developer, I want base, middle, crest, and accent colors with alpha, so that layered and transparent compositions are possible.
53. As a creative developer, I want gradient ratio and middle/crest dB thresholds, so that color transitions follow intentional ranges.
54. As a media-player developer, I want played and unplayed color layers, so that playback progress is visible without obscuring the waveform.
55. As a media-player user, I want a visible playhead and current/duration labels, so that position is understandable at a glance.
56. As a media-player user, I want pointer, touch, and keyboard seeking, so that the waveform is usable with my input method.
57. As a keyboard user, I want Arrow, Page, Home, End, and Space behavior where applicable, so that seeking and playback do not require a pointer.
58. As an editor user, I want a selectable time region and optional loop region, so that the component can represent a bounded range without pretending to be a full DAW.
59. As an editor user, I want markers and annotations rendered above the waveform, so that meaningful events can be named without altering audio data.
60. As a component consumer, I want controlled callbacks for seek, selection, loop, marker activation, and hover inspection, so that host state remains authoritative.
61. As a component consumer, I want display, slider, range, and editor semantics to be explicit, so that the accessibility contract matches actual behavior.
62. As a screen-reader user, I want useful names, values, state changes, and recovery messages in semantic DOM, so that the Canvas or WebGL bitmap is not the only source of meaning.
63. As a keyboard user, I want visible focus and logical tab order, so that dense controls remain navigable.
64. As a motion-sensitive user, I want reduced motion to stop nonessential animation while preserving state, so that the visualization remains usable.
65. As a low-vision user, I want the component to survive zoom, high contrast, and forced colors where applicable, so that controls and status remain legible.
66. As a creative technologist, I want Canvas 2D, SVG, DOM/CSS, and WebGL2 renderers to consume the same frame/config, so that I can compare capability and integration cost honestly.
67. As a creative technologist, I want each renderer to declare supported modes and limits, so that the UI does not silently ignore controls.
68. As an advanced consumer, I want a custom renderer interface, so that I can add a specialized visual without forking source or analysis.
69. As a Canvas consumer, I want DPR-aware resizing and stable geometry, so that output remains sharp without cumulative scaling errors.
70. As a WebGL2 consumer, I want visible unsupported and context-loss recovery paths, so that a graphics failure does not leave a blank surface.
71. As a creative technologist, I want a Pulse Ring effect with thickness, glow, rotation, and band-reactivity controls, so that intensity can drive a focused radial artifact.
72. As a creative technologist, I want Neon Lines with height, speed, thickness, glow, and per-line energy controls, so that spectral motion can become layered ribbons.
73. As a creative technologist, I want Equalizer Grid with columns, rows, gap, and reactivity controls, so that audio can drive a two-dimensional field.
74. As a creative technologist, I want Waveform Ribbon with height, speed, thickness, glow, reflection, and reactivity controls, so that a procedural ribbon can remain audio-linked.
75. As a creative technologist, I want Rounded Wobble Bars with count, wobble, mirror, gap, glow, and reactivity controls, so that bars can feel organic without losing density control.
76. As a creative technologist, I want Spectrum Bars with count, reactivity, gap, baseline, and glow controls, so that a classic spectrum can range from restrained to expressive.
77. As a creative technologist, I want Radial Spikes with count, radius, height, width, arc, rotation, and color controls, so that ordered or distributed energy can form a circular burst.
78. As a creative technologist, I want Tunnel Waves with density, speed, depth, and color controls, so that audio can drive an original spatial tunnel.
79. As a creative technologist, I want Liquid Blobs with size, count, drift, glow, threshold, and color controls, so that low-frequency energy can drive an organic field.
80. As a creative technologist, I want Starfield Burst with speed, size, count, trail, reactivity, and color controls, so that transients can drive a radial particle composition.
81. As a creative technologist, I want Vortex Rings with twist, spin, density, radius, reactivity, and color controls, so that frequency energy can drive a legible spiral.
82. As a creative technologist, I want Reactive Frame with inset, thickness, corner ratio, bar height, trigger, cluster width, count, glow, and color controls, so that a camera or content frame can respond to sound.
83. As a creative technologist, I want Storm Lightning with threshold, ray count, length, segment count, core width, glow width, reactivity, flicker, and color controls, so that transients can drive a dramatic but configurable effect.
84. As a preset author, I want each effect parameter to have a meaningful name, type, range, step, default, unit, and description, so that the inspector never exposes anonymous option slots.
85. As a preset author, I want presets to share the same validated config contract as manual controls, so that loading, editing, reset, and export cannot drift.
86. As a playground visitor, I want a curated Overview of core and VFX presets, so that I can discover capability without opening every control group.
87. As a playground visitor, I want a Focus mode with a large interactive stage, so that detailed tuning is not constrained by gallery thumbnails.
88. As a playground visitor, I want Visual Mode and Rendering Engine shown as separate controls, so that I do not confuse data/geometry with backend.
89. As a playground visitor, I want unavailable controls disabled with a concise capability explanation, so that I understand why a setting cannot apply.
90. As a playground visitor, I want only relevant control groups expanded, so that the full control breadth does not become a parameter dump.
91. As a playground visitor, I want direct handles for cutoffs, thresholds, playhead, selection, and loops, so that advanced tuning stays tethered to the signal.
92. As a playground visitor, I want every change to update the real artifact immediately, so that the inspector is trustworthy.
93. As a playground visitor, I want Reset to restore a complete public default contract, so that experimentation is reversible.
94. As a playground visitor, I want deterministic preset and source behavior, so that screenshots, tests, and copied code reproduce the same result.
95. As a playground visitor, I want a Code panel that reflects the current supported configuration, so that the playground leads directly to integration.
96. As a developer, I want copied standalone code to include only the selected renderer and required helpers, so that it does not import the entire playground or every backend.
97. As a developer, I want copied code to avoid project-local imports and remote demo assets, so that it can run in an isolated React project.
98. As a developer, I want copy success and failure feedback with a recovery path, so that clipboard restrictions are not silent.
99. As a mobile user, I want the inspector before the stage with bounded internal scrolling, so that all controls remain reachable without horizontal overflow.
100. As a desktop user, I want the main workbench to fit without document scrolling, so that transport, signal, and active controls remain spatially stable.
101. As an ultrawide user, I want the stage to grow without unreadable lines or an excessively wide inspector, so that density remains intentional.
102. As a user with a very long file, I want peak extraction and rendering to remain responsive, so that the browser does not freeze or allocate unbounded memory.
103. As a user with an inactive or offscreen visual, I want analysis and drawing work reduced or paused, so that the component does not waste CPU or battery.
104. As a user repeatedly connecting sources, I want all tracks, contexts, observers, workers, listeners, and animation frames cleaned up, so that the application remains stable.
105. As a developer, I want structured errors and status callbacks, so that my application can render its own recovery UI.
106. As a maintainer, I want pure DSP and geometry modules with independent fixtures, so that expected values do not merely repeat implementation logic.
107. As a maintainer, I want renderer contract tests over one canonical frame/config, so that backend parity can be evaluated.
108. As a maintainer, I want component tests at public behavior seams, so that refactors do not lock tests to private modules.
109. As a maintainer, I want browser tests for source lifecycle, seeking, capability gating, responsive layout, reduced motion, and export, so that real paths are proven.
110. As a maintainer, I want comparable desktop and narrow screenshots plus detail crops, so that hierarchy and finish are inspected rather than inferred from CSS.
111. As a maintainer, I want an isolated external-consumer fixture, so that package boundaries and generated code are proven outside the playground.
112. As a maintainer, I want lint, format, typecheck, tests, build, E2E, and coverage commands aligned with the baseline repo, so that local and CI verification match.
113. As a project contributor, I want architecture, control semantics, capability limits, examples, and verification instructions documented, so that future work does not require rediscovering the references.
114. As a project owner, I want the implementation divided into independently green vertical slices, so that progress remains demoable and resumable.
115. As a project owner, I want logical commits after verified checkpoints, so that history explains what changed and why.

## Implementation Decisions

- The project uses Bun, React 19, React DOM 19, strict TypeScript 7, Vite 8, Tailwind 4, Tabler icons, oxlint, oxfmt, Vitest, Testing Library, Playwright, and GitHub Actions in the same general toolchain as the baseline.
- Runtime animation and drawing use browser primitives by default. No GSAP, Motion, Anime.js, FFT, or state-management dependency is added unless a later measured need justifies it.
- The repository produces both a static playground application and a tree-shakeable library build with declarations and explicit public exports.
- The playground is a package consumer. It may not import private library implementation modules.
- Importing the package performs no browser work and reads no `window`, `document`, media, Canvas, or Web Audio globals.
- `WaveformSession` is the deep lifecycle interface. It owns configuration, source attachment, analysis snapshots, status, subscriptions, capability reporting, and deterministic teardown.
- Session snapshots are stable and subscribe through an external-store pattern. Raw analysis frames do not trigger React component state updates at audio or animation frame rate.
- `WaveformSourceAdapter` is the source seam. Built-in adapters cover deterministic demo PCM, precomputed/static data, decoded audio, media elements, microphone/media streams, and externally supplied audio nodes.
- Every source adapter declares whether the session owns or borrows its underlying resource. Teardown stops only owned tracks/nodes/elements/contexts.
- Async source setup uses a generation or epoch token. Completion from a stale request is discarded and cleaned up.
- `WaveformFrame` separates time, sample rate, channel metadata, signed waveform channels, envelope channels, ordered spectrum channels, RMS/peak meters, named bands, and optional distributed energy.
- Ordered spectrum values always correspond to increasing frequency. Distributed energy is never accepted by ordered-spectrum render modes.
- Static peaks preserve signed minimum and maximum values per bucket rather than averaging away transients.
- Long-data peak extraction is cancellable, chunked, cacheable by source/config identity, and eligible for worker execution. The UI stays responsive and exposes progress and cancellation.
- The analysis module exposes pure functions for windows, FFT mapping, dB conversion, channel mixing, smoothing, attack/release, normalization, cutoffs, slope, roll-off, interpolation, filtering, meters, envelopes, and frequency-band aggregation.
- Native `AnalyserNode` is a supported realtime adapter for common configurations. An advanced analyzer processes time-domain frames for window/interpolation/filter behavior the native analyser cannot express.
- Native analyser FFT sizes follow its platform range. The advanced analyzer may expose a guarded 65,536 size with visible latency/resource warning and reduced update cadence.
- Low and high cutoffs are expressed in Hz, validated against Nyquist, and converted to bins internally. They are never treated as raw array indices.
- Invalid paired ranges are rejected or corrected through one documented validation policy; controls and programmatic config use the same validator.
- Positive sync offset is implemented by buffering visual frames. Negative offset is capability-dependent and available only when the source can seek or provide future decoded data; unsupported live lookahead is explained rather than faked.
- `WaveformRenderer` is the rendering seam. It mounts, resizes, renders a canonical frame/config, reports capabilities, handles context events, and destroys its resources.
- Built-in renderer identifiers are Canvas 2D, SVG, DOM/CSS, and WebGL2. A custom renderer can implement the same interface.
- Canvas 2D is the default and supports all core waveform, envelope, spectrum, bars, stepped bars, meter, radial, mirror, color, playback, selection, marker, and overlay capabilities.
- SVG supports core static and moderate-rate modes where DOM size remains bounded. Its capability record exposes practical point/count limits.
- DOM/CSS supports bounded bar/meter modes and is not used for dense curves, long waveforms, or shader-like VFX.
- WebGL2 supports the original clean-room VFX catalog plus compatible core modes. Context loss renders a visible recoverable state and can fall back to Canvas 2D when the selected mode permits.
- The VFX catalog is an original implementation informed only by behavioral requirements. No GPL C++, FFT, HLSL, or shader source is copied or translated.
- Every VFX parameter is declared in a typed schema with name, type, range/options, step, default, unit, description, visibility rule, and compatible renderers/data modes.
- The VFX catalog includes Pulse Ring, Neon Lines, Equalizer Grid, Waveform Ribbon, Rounded Wobble Bars, Spectrum Bars, Radial Spikes, Tunnel Waves, Liquid Blobs, Starfield Burst, Vortex Rings, Reactive Frame, and Storm Lightning.
- Effect parameters use meaningful domain names. Anonymous numbered option slots are not public interfaces.
- `WaveformConfig` is divided into validated capability-scoped groups: source, analysis, data mode, channels, layout, geometry, color, motion/reactivity, playback/interaction, renderer, effect, accessibility, and quality.
- Config groups are discriminated where combinations are invalid. A single untyped bag of optional properties is rejected.
- Public defaults are immutable and deterministic. Reset, presets, programmatic config, renderers, and code generation share the same defaults and validator.
- Renderer and mode catalogs are the source of truth for labels, descriptions, capabilities, warnings, and standalone export requirements.
- Presets are complete validated configurations with deterministic source fixtures and do not rely on remote assets or random values.
- Convenience React interfaces include a visual display, controlled scrubber, live waveform, and audio-waveform player composition. Advanced consumers can use the session and renderer interfaces directly.
- The visual display uses image semantics and a useful accessible description when it is not interactive.
- The scrubber uses controlled time/duration/seek state, Pointer Events with capture and cancellation, and complete keyboard slider behavior.
- Selection/loop interaction uses explicit range semantics and exposes start/end value text. It is not disguised as a single-value slider.
- Markers and annotations are semantic overlay elements when interactive. The canvas bitmap does not own focusable hit regions without equivalent DOM controls.
- Playback follows native media events for ready, buffering, playing, paused, seeking, ended, rate, and errors. RAF updates position only while animation is useful.
- Microphone access is explicit, permission-aware, and never starts on render. The session exposes requesting, live, muted, silent, ended, denied, unavailable, and error states.
- Silence and mute are distinct. Hide-on-silence is a rendering option and does not destroy the source or erase status.
- The drawing loop runs only when the source/config requires animation. It pauses when inactive, offscreen, hidden, reduced-motion-limited, or destroyed.
- `ResizeObserver` updates bitmap dimensions using DPR without cumulative transform scaling. Zero-size and extremely large surfaces are guarded.
- The package exposes structured status and error objects with stable error kinds, source ownership, recoverability, and optional cause.
- The playground follows the Signal Workbench direction and uses Overview and Focus as playground-only viewport state, not package configuration.
- Desktop composition reserves a stable 320-pixel inspector and gives the remaining viewport to transport, signal stage, and compact preset strip without document scrolling.
- Narrow composition places the bounded-height inspector first and stage second, preserves DOM order for keyboard users, and prohibits horizontal overflow.
- The first meaningful viewport contains the real signal stage. There is no landing-page hero or feature-card preamble.
- Visual Mode and Rendering Engine are separate labeled controls. The selected mode filters compatible engines and the selected engine filters relevant controls.
- Control groups follow user intent: Source & Transport, Visual Mode & Engine, Analysis, Channels, Geometry & Layout, Color & Reactivity, Effect, Playback & Overlays, Accessibility & Quality, and Diagnostics.
- Only controls relevant to the selected mode/renderer are interactive. Disabled controls retain their value and provide an accessible capability explanation.
- Direct manipulation overlays cover playhead, selection/loop region, cutoff frequencies, dB thresholds, and compatible radial/layout handles.
- The primary path is visibly ordered: Play or connect source, adjust on the signal, then Copy code.
- The Code panel generates a runnable standalone React component containing only the selected renderer/effect helpers, current validated config, deterministic demo data when needed, and inline or self-contained styling.
- Generated code has no project-local imports, remote assets, playground state, or inactive renderer dependencies.
- Clipboard success and failure are visible through an accessible live status. A manual-select fallback is available when programmatic copy fails.
- The playground includes deterministic error fixtures for decode failure, permission denial, autoplay block, ended stream, missing WebGL2, context loss, export failure, and extreme config validation.
- The playground records diagnostics such as actual sample rate, frame rate, active renderer, source ownership, analysis cadence, point count, and degraded capability, but keeps them collapsed unless needed.
- Themes use role-based CSS variables for canvas, surface, text, muted text, edge, accent, focus, selection, played/unplayed, and semantic status. Status colors remain semantically exclusive.
- Reduced motion removes nonessential VFX movement and smooth transitions but preserves state changes, static analysis, playback position, and user control.
- All visible controls use semantic buttons, links, labels, selects, native range inputs where suitable, or fully implemented custom slider/range behavior.
- The project includes local research, architecture, domain/control glossary, verification, readiness, deployment, and technical-debt documentation.
- Git is initialized during the foundation slice. References and durable scratch planning remain local; product source and durable project documentation are committed.
- No package publishing, remote creation, deployment, push, or production release occurs without separate user authorization.

## Testing Decisions

- Good tests observe public behavior at the highest practical seam. Expected values come from independently calculated fixtures, specifications, literal examples, or stable prior behavior rather than recomputing the implementation algorithm.
- Pure analysis tests cover signed peak extraction, min/max bucket preservation, RMS, peak, dB conversion, mono/stereo/single channels, window coefficients, FFT bin/frequency mapping, linear/log spacing, cutoffs, floor/ceiling validation, slope, roll-off, normalization, attack/release, EMA modes, fast peaks, interpolation, Gaussian filtering, and band aggregation.
- Boundary analysis fixtures cover silence, DC signal, single tone, impulse, two-tone stereo, phase inversion, clipping, sub-bin frequencies, Nyquist edge, odd lengths, empty channels, invalid config, guarded large FFT, and cancellation.
- The source-adapter seam is tested for owned versus borrowed teardown, start/stop idempotence, repeated source switching, stale async completion, decode rejection, media ended/error events, microphone denial/retry, track ending, suspended audio context, and unsupported browser capability.
- The session seam is tested for stable snapshots, subscription cleanup, config validation, deterministic reset, capability changes, no updates after destroy, and no raw-frame React rerender dependency.
- The renderer contract is tested against the same canonical frames and configs. Tests assert finite geometry, ordered positions, clipping bounds, channel layout, mirror/radial transforms, played/unplayed split, markers, selection, and capability responses.
- Canvas tests verify DPR resize, no cumulative scaling, zero-size recovery, deterministic drawing commands or pixels, and export-safe output.
- SVG and DOM/CSS tests verify bounded node counts, semantic containment, geometry parity for supported modes, and capability rejection for unsupported dense/VFX modes.
- WebGL2 tests verify shader compile/link handling, uniform/config mapping, nonblank representative output, context loss/restoration, unsupported fallback, deterministic effect fixtures, and cleanup.
- Each VFX family receives focused tests for schema validation, default render, every exposed parameter changing observable output, extreme values staying finite, and color/alpha mapping.
- React component tests cover image versus slider/range/editor semantics, labels, value text, live status, focus order, keyboard interactions, Pointer Events including cancel, controlled updates, reduced motion, disabled capability explanations, and error recovery.
- The playground follows the baseline repo's prior art: typed reducer/preset tests, control-panel behavior tests, standalone export tests, engine/renderer parity tests, and browser scenarios for real interaction rather than private module assertions.
- Browser tests cover deterministic demo startup, local file decode, microphone permission grant/denial with controlled fixtures, playback, seeking, range selection, markers, source switching, mode/engine switching, all conditional controls, reset, preset/custom state, copy success/failure, and standalone export execution.
- Browser tests cover rapid interactions and interruption: repeated play/pause, drag cancellation, changing renderer during playback, changing source during pending decode/permission, closing while an effect is active, and repeated mount/unmount.
- Responsive browser proof covers 1440×960, 390×844, 320-pixel narrow, and an ultrawide viewport. Assertions include no desktop document scroll on the main path, no narrow horizontal overflow, reachable controls, stable inspector width, and artifact sovereignty.
- Visual proof captures same-state desktop and narrow screenshots, Focus and Overview, one representative core mode, one WebGL2 VFX, permission denial/recovery, unsupported renderer fallback, and DPR 2 detail crops for dense controls, focus, overlays, scrollbars, and icons.
- A hidden-brief read validates that an unfamiliar reader identifies the product and the Play → adjust on signal → Copy code path. A material mismatch reopens the direction gate.
- Accessibility checks include automated semantics plus manual keyboard navigation, focus visibility, zoom, reduced motion, forced-colors inspection where supported, and explicit disclosure that automated screen-reader coverage is not manual assistive-technology certification.
- Performance checks use representative live, long-file, overview, and WebGL2 states. They inspect long tasks, frame cadence, peak-extraction responsiveness, inactive/offscreen pausing, memory growth, and resource cleanup rather than claiming performance from source inspection.
- A lifecycle audit repeats start/stop/source/renderer changes and confirms no live media tracks, contexts, workers, observers, listeners, WebGL resources, or RAF callbacks remain after teardown.
- The external-consumer fixture imports the built package from outside the playground, typechecks, builds, renders a deterministic waveform, uses one controlled interaction, and verifies there are no private/playground imports.
- The standalone export fixture compiles and runs each selected renderer family independently and verifies no remote assets, project-local paths, or unrelated renderer dependencies.
- Per ticket, run focused tests and focused lint/format checks for edited surfaces. Run full typecheck, lint, format check, unit/component suite, coverage, browser suite, library build, playground build, and consumer/export fixtures only at major checkpoints and final batch.
- Final acceptance requires an adversarial autopsy of the rendered artifact, reconciliation of independent review findings, a scope/diff audit, documentation consistency, and logical verified commits.
- Initial automated browser support is Chromium/installed Chrome. Firefox, Safari, manual screen-reader testing, npm publishing, and hosted deployment remain unverified until explicitly added and executed.

## Out of Scope

- Native OBS plugin binaries, OBS source/output-bus integration, C++ modules, FFTW, or direct loading of OBS `.effect` files.
- Literal copying, translation, or adaptation of GPL C++, FFT, HLSL, or shader source from the local OBS references.
- Full modular patch-cable routing in the first release; the Modulation Patchbay remains a future product direction.
- A permanently visible four-renderer matrix; renderer comparison is a bounded Overview mode using like-for-like data and config.
- Full DAW behavior: destructive edits, multitrack timeline, fades, crossfades, clip splitting, mastering, source separation, transcription, MIDI sequencing, or project persistence.
- Backend services, accounts, cloud storage, collaboration, telemetry, analytics, hosted audio, or required API keys.
- Automatic microphone capture, background recording, or network transmission of captured audio.
- Arbitrary user-supplied shader compilation in the first release; extensibility is provided through the typed renderer interface.
- Guaranteeing negative visual lookahead for live sources that cannot provide future audio.
- Guaranteed Firefox, Safari, mobile-WebView, manual screen-reader, or package-registry support without corresponding executed proof.
- Publishing to npm, creating a remote repository, deploying a site, pushing commits, or releasing artifacts without explicit authorization.

## Further Notes

- The project uses the baseline's Local Markdown tracker and `ready-for-agent` vocabulary.
- The reference snapshots have no Git metadata, so the research records local source paths and observed versions rather than claiming exact upstream commits.
- `audio-wave-main` is GPL v2; `waveform-master` is GPL v3-or-later; ElevenLabs UI is MIT. The planned implementation is original and avoids third-party source reuse. If substantial MIT code is later copied, its notice must be preserved. Any GPL reuse requires separate legal and product review and is not authorized by this PRD.
- The accepted design direction came from three rendered, materially different wireframes and an independent blind read. The read selected Signal Workbench and required Visual Mode and Rendering Engine to be clearly separated while reinforcing the primary Play → adjust → Copy code path.
- Package identity and public repository URL are intentionally deferred. The local package remains private until publishing authority and naming are provided.
