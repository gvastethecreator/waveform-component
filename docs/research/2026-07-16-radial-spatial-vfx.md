# Radial spatial VFX clean-room research

Date: 2026-07-16
Scope: ticket 016, Radial Spikes, Tunnel Waves, and Vortex Rings

## Sources and clean-room boundary

Local inspection was deliberately limited to declarative product metadata:

- `.scratch/references/audio-wave-main/data/effects/radial-spikes.effect.ini`
- `.scratch/references/audio-wave-main/data/effects/tunnel-waves.effect.ini`
- `.scratch/references/audio-wave-main/data/effects/vortex-rings.effect.ini`

That metadata names spike count/radius/height/width and base/tip colors; tunnel density/speed and center/mid/outer colors; and vortex twist/spin/density plus primary/secondary/accent colors. Ticket 016 adds explicit arc, rotation, depth, radius, energy-reactivity, glow, preset, motion, quality, ordered-band, and lifecycle requirements. These names are observable requirements only.

No `.effect` shader, GPL implementation, expression, constant, algorithm, control flow, or source structure was opened, copied, translated, or adapted. All geometry, distance fields, color composition, bounds, presets, fallbacks, and tests in this repository are original clean-room work. Platform behavior remains grounded in the official [WebGL 2.0 specification](https://registry.khronos.org/webgl/specs/latest/2.0/) and [OpenGL ES Shading Language 3.00 specification](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf).

## Input and ordering contract

The three effects consume `BandEnergyFrame`, not renderer-private FFT bins. `createBandEnergyFrameFromSpectrum` now accepts an explicit `frequencyScale: "log" | "linear"`; logarithmic remains the compatible default. Both strategies produce monotonically ordered low-to-high frequency bands. The fixed 16-float upload preserves that array order, and shader animation changes phase or brightness without randomly choosing or cyclically reassigning bands.

Hostile energy is clamped to `[0, 1]` before upload. More than 16 source bands are deterministically reduced in contiguous order. Empty and zero-energy inputs retain a composed base ring, tunnel field, or vortex eye rather than returning a blank surface.

## Original designs and hard bounds

### Radial Spikes

- One fragment procedurally addresses an angular cell inside a configurable 30–360 degree arc; spike count is rounded and clamped to 4–128 before addressing.
- Base radius and spike height are resolved together so their sum cannot exceed `0.92` of the shortest half-stage dimension.
- Ordered arc position samples ordered band energy. Energy changes reach and tip emphasis; it never changes spike identity.
- A continuous arc ring composes silence. Width, rotation, two color roles, halo, and subtle motion breathing remain independent controls.

### Tunnel Waves

- One perspective coordinate maps center-to-edge depth into at most 48 procedural wave intervals. Density never allocates count-sized geometry or generates a shader variant.
- `tunnelDepth` changes the radial exponent and visible spacing. `tunnelSpeed` moves wave phase forward or backward while band sampling stays fixed to depth.
- Center, mid, and outer roles form a continuous depth gradient. A bounded portal and baseline wave width keep zero input intentional.

### Vortex Rings

- At most 48 radial intervals are warped by a seam-free periodic angular function. Twist sign changes handedness; spin moves phase; neither reorders center-to-edge bands.
- Vortex radius is clamped to 0.25–0.95 of the shortest half-stage dimension, and the outer mask prevents halo escape.
- Primary and secondary roles alternate by stable radial interval. The accent role belongs to the central eye and peak-reactive highlights.

## Shared lifecycle and proof target

Every surface reuses the established WebGL2 lifecycle: one program, one six-vertex fullscreen buffer, one vertex-array object, no textures, one observer, and either one motion-gated RAF chain or one deterministic reduced-motion draw. Drawing-buffer quality is capped by DPR, 4,096 pixels per dimension, and 4,194,304 total pixels. Context restoration recreates the complete resource tuple and increments the public generation.

Focused tests cover schemas, dependent clamps, log/linear order fixtures, uniforms, SSR, unavailable fallbacks, reduced motion, and teardown. Installed-Chrome evidence under `.scratch/evidence/016-radial-vfx/` covers every numeric/color control, exact preset reproduction, zero/overload, maximum density/radius/arc/depth/twist, both band scales, narrow resize, real `WEBGL_lose_context`, rapid switching, and final resource baselines.

## Verification result

The final package gate passed format, typecheck, lint, production library/playground builds, SSR import, and a fresh tarball consumer typecheck. The stable serial Vitest run passed 248 tests across 57 files. The complete installed-Chrome matrix passed 23/23 paths, including the dedicated radial-spatial path.

Rendered review covered default, zero, overload, preset, context-lost, and restored captures for all three effects. That review rejected the first Tunnel Waves response because silence and overload were visually too similar; the shader now keeps only a faint structural field at zero and increases line width, luminance, halo, and portal emphasis with signal. The repaired dedicated browser path passed again before the full matrix.

The final browser report is console-clean, returns the ResizeObserver count to its five-observer host baseline, and ends with zero active programs, buffers, vertex arrays, textures, or RAF chains. One real context loss invalidates its generation instead of issuing legal WebGL deletes, so 25 resources were created and 24 explicitly deleted for each program/buffer/vertex-array category; active-resource counts are the authoritative zero-leak result. No texture was created.
