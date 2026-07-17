# Neon Lines and Equalizer Grid clean-room research

Date: 2026-07-16
Scope: ticket 014, WebGL2 VFX parameter contracts and bounded runtime

## Sources and boundary

The local reference inspection was deliberately limited to descriptive metadata:

- `.scratch/references/audio-wave-main/data/effects/neon-lines.effect.ini`
- `.scratch/references/audio-wave-main/data/effects/equalizer-grid.effect.ini`
- `.scratch/references/audio-wave-main/README.md`

The metadata supplied the requested vocabulary only. Neon Lines names wave height, flow speed, line thickness, glow size, left/right colors, and burst glow color. Equalizer Grid names columns, rows, cell gap, cell reactivity, random speed, and four gradient colors.

No `.effect` shader, GPL implementation file, algorithm, expression, constant, control flow, or structural layout was opened, copied, translated, or adapted. The implementation in this repository is an original clean-room design. Common quality, motion, background, distributed-band response, preset, fallback, and lifecycle semantics come from this package's own contracts.

The platform constraints were checked against the official [WebGL 2.0 specification](https://registry.khronos.org/webgl/specs/latest/2.0/) and [OpenGL ES Shading Language 3.00 specification](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf). WebGL2 shader sources therefore declare GLSL ES 3.00 explicitly, use a statically bounded line loop, keep grid addressing procedural, and avoid runtime-generated shader variants.

## Contract decisions

### Shared input and allocation

- Both effects accept only a canonical `BandEnergyFrame`.
- Hostile or excessive band energy is clamped and reduced to at most 16 ordered values before upload.
- Each effect owns one program, one six-float fullscreen-triangle buffer, one vertex-array object, and no textures.
- Drawing-buffer DPR is capped by `low | balanced | high`, then by 4,096 pixels per dimension and 4,194,304 total pixels.
- Context loss invalidates the resource tuple; restoration recompiles, relinks, rebinds every uniform, and increments the public generation.

### Neon Lines

- `lineCount` is rounded and clamped to `2..12` before the fixed `MAX_LINES = 12` shader loop.
- Each stable line position samples the ordered band field independently.
- `waveHeight`, `flowSpeed`, `lineThickness`, `glowSize`, and `energyReactivity` affect separate displacement, phase, core, halo, and response terms.
- Requested displacement is bounded by each line's distance to the stage edge, preventing high-energy or overload configurations from clipping the trace outside the canvas.
- Left/right colors follow horizontal position; the burst role follows the mapped line response and crest.

### Equalizer Grid

- Columns are rounded/clamped to `4..48`; rows are rounded/clamped to `2..24`.
- Cell lookup is O(1) per fragment. Grid counts change coordinate addressing, not buffer allocation or shader variants.
- Column position samples ordered bands; row position is a stable amplitude threshold.
- Gap, response, and shimmer are independent. Shimmer is deterministic from cell coordinates and time and never changes cell identity.
- Four color stops form a continuous positional gradient; peak cells blend the fourth role.

### Motion and presets

- `motion: "auto"` follows `prefers-reduced-motion`; `reduced` draws exactly one frame with time fixed at zero.
- Speed remains observable in a reduced-motion image through a documented stable phase offset rather than hidden animation.
- Three immutable presets per effect store fully resolved configs. Selecting a preset replaces the complete config, and selecting it again after manual edits reproduces the same pixels.
- The playground exposes analyzed, zero-energy, and hostile-overload fixtures. The overload fixture intentionally includes out-of-range values so the CPU clamp is exercised in the real component path.

## Verification evidence

The Chrome quality gate at `.scratch/evidence/014-neon-grid-vfx/browser-report.json` records:

- no console or page errors;
- zero active programs, buffers, vertex arrays, textures, and animation frames after teardown;
- zero textures created across both effects;
- one real context loss followed by successful resource recreation;
- the renderer-observer count restored to its original baseline.

The same evidence directory contains deterministic default, zero, overload, preset, context-lost, and recovered screenshots. The browser test also proves that every numeric and color control changes pixels, presets reproduce exactly, both quality bounds resize the backing buffer, reduced motion remains static, narrow layouts do not overflow, and resource counts stay bounded while switching effects.
