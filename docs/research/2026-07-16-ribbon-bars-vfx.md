# Clean-room Waveform Ribbon and reactive bar VFX

Date: 2026-07-16

## Scope and boundary

This slice implements three original WebGL2 effects: Waveform Ribbon, Rounded Wobble Bars, and Spectrum Bars. The local OBS reference is GPL-licensed. Only the declarative `.effect.ini` metadata for the three named effects was read to enumerate product vocabulary; no `.effect` shader, C/C++ implementation, algorithm, expression, control mapping, or source structure was inspected, copied, translated, or adapted.

Allowed local metadata:

- `.scratch/references/audio-wave-main/data/effects/waveform-ribbon.effect.ini`
- `.scratch/references/audio-wave-main/data/effects/rounded-wobble-bars.effect.ini`
- `.scratch/references/audio-wave-main/data/effects/spectrum-bars.effect.ini`

The metadata names wave height, flow speed, ribbon thickness, glow, three ribbon color roles, bar count, wobble, vertical mirror, gap, four spectrum gradient roles, vertical position, and random speed. Ticket 015 additionally requires explicit energy reactivity, reflection, baseline, and glow semantics. Those names define observable requirements only.

Platform behavior remains grounded in the official [WebGL 2.0 specification](https://registry.khronos.org/webgl/specs/latest/2.0/) and [OpenGL ES Shading Language 3.00 specification](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf).

## Original designs

### Waveform Ribbon

- One fullscreen triangle evaluates an original signed-distance ribbon field.
- Horizontal position samples the canonical ordered band array; flow changes phase, never source order.
- Energy affects centerline, body width, glow, and peak flash within explicit bounds.
- Reflection is a separately bounded lower field with configurable opacity/reach. A zero value removes it; overload cannot push either field outside the stage.
- Silence intentionally retains a low-motion composed ribbon so reduced-motion and zero-signal states are not blank.

### Rounded Wobble Bars

- Each fragment procedurally addresses one of at most 64 bar cells; bar count never creates a count-sized buffer or shader variant.
- Ordered band position determines height and gradient role. Wobble offsets the bar progressively toward its tip without reordering cells.
- `mirrorVertically` is a semantic boolean: enabled bars share a centered mirrored baseline; disabled bars grow from a lower baseline.
- Rounded-box distance, gap, glow, and energy response remain bounded at maximum count and overload.

### Spectrum Bars

- Each fragment procedurally addresses one of at most 96 ordered bars.
- Baseline position is clamped before height calculation; available space caps every bar at the upper edge.
- Four explicit gradient roles traverse low to high band position.
- Random speed controls deterministic brightness shimmer only; it cannot move, reorder, add, or remove bars. Reduced motion freezes one stable seed.
- Silence retains a thin baseline artifact and overload remains inside the stage.

## Shared resource and lifecycle bounds

All three effects reuse `createWebglBandVfxRenderer`: one program, one six-vertex fullscreen buffer, one vertex-array object, a fixed 16-float band upload, and zero textures per mounted surface. Drawing-buffer quality is capped before allocation by DPR, 4,096 pixels per dimension, and 4,194,304 total pixels. One React surface owns one observer and either one RAF chain for full motion or one deterministic static draw for reduced motion.

Rapid Chrome cycling created and deleted 24 programs, buffers, and VAOs exactly. Final active programs, buffers, VAOs, textures, and RAFs were zero; texture creation remained zero and the observer baseline returned to 5. Maximum 64/96 density, narrow resize, every named control, preset reproduction, Signal/Zero/Overload, SSR import, and a freshly packed external consumer are covered by focused tests and evidence under `.scratch/evidence/015-ribbon-bars-vfx/`.
