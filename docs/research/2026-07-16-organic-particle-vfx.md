# Organic and particle VFX clean-room note

Date: 2026-07-16
Ticket: 017
Scope: original Liquid Blobs and Starfield Burst contracts, deterministic seeds, bounded time/work, response mapping, and lifecycle proof.

## Sources and clean-room boundary

Local inspection was deliberately limited to declarative product metadata:

- `.scratch/references/audio-wave-main/data/effects/liquid-blobs.effect.ini`
- `.scratch/references/audio-wave-main/data/effects/starfield-burst.effect.ini`

The metadata names Liquid Blob Size/Glow Strength and Base/Blob/Peak Flash colors; it names Starfield Burst Speed/Star Size and Core/Edge/Treble Flash colors. Ticket 017 adds blob/star counts, drift, merge threshold, trails, reactivity, deterministic seeds/time, presets, work ceilings, long-frame recovery, offscreen behavior, reduced motion, and disposal requirements. These names are observable requirements only.

No `.effect` shader, GPL implementation, expression, constant, algorithm, control flow, or source structure was opened, copied, translated, or adapted. Both shaders, integer hashes, field/sector geometry, bounds, presets, fallbacks, mappings, and tests are original clean-room work. Platform behavior remains grounded in the official [WebGL 2.0 specification](https://registry.khronos.org/webgl/specs/latest/2.0/) and [OpenGL ES Shading Language 3.00 specification](https://registry.khronos.org/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf).

## Determinism and long-frame contract

Both effects are stateless procedural fields. They do not own a particle array, velocity state, delta accumulator, simulation step, or catch-up loop. The public integer seed is rounded and clamped to `0..65535`, then mixed with stable logical blob/star indices through original unsigned integer hashing. The same validated config, canonical frame, seed, bounded time, and drawing-buffer dimensions therefore reproduce the same inputs and output field on the same WebGL2 implementation.

Shared VFX time freezes at zero for reduced motion and otherwise wraps every 4,096 seconds. A tab suspension or long frame advances directly to the corresponding bounded absolute phase; it cannot enqueue integration work or allocate catch-up state. When an animated surface leaves the viewport, `IntersectionObserver` cancels its only RAF chain. Re-entry resumes rendering without replacing the program/buffer/VAO tuple or changing the resource generation.

## Liquid Blobs design and bounds

- A fixed shader loop has exactly 24 possible contributors; `blobCount` resolves to 2–24 and never changes buffer size, program source, or allocations.
- Seeded anchors and orbital phases define an original metaball-like scalar field. `blobSize` resolves to 0.08–0.36 of the shortest half-stage; a radial mask contains body and halo under hostile count/size/energy.
- `threshold` resolves to 0.2–0.9 and changes the connection cutoff. `driftSpeed` resolves to −1.5–1.5; its sign changes orbital direction and its value remains visible in the reduced-motion phase.
- The RMS energy of the lowest 35% of ordered bands expands contributors through `lowFrequencyReactivity` (0–2). Global/ordered peaks blend the independent flash role. Silence retains seeded base bodies rather than becoming blank.

## Starfield Burst design and bounds

- `starCount` resolves to 12–256 angular sectors. Each fragment checks only its logical sector and two neighbors, so work is constant with respect to the public count and no particle collection exists.
- Each seeded sector owns stable angle, depth, speed, size, and brightness variation. Absolute time moves the head outward; a bounded 0–0.55 trail extends inward without history storage.
- The highest 35% of ordered bands plus peak crest drive `transientReactivity` (0–2.5), head width, brightness, and the independent treble flash role. Silence retains a dim seeded burst and central origin.
- Star size resolves to 0.4–4 drawing-buffer pixels, speed to 0–2.5 cycles/s, and the outer mask contains heads/halos before the stage boundary.

## Proof target and current evidence

Focused schema/adapter/React tests cover clamping, low/high mappings, seed equality, long-time wrapping, reduced time, unavailable/SSR fallbacks, offscreen pause/resume, context recreation, and idempotent teardown. The installed-Chrome scenario changes every numeric/color control, distinguishes bass/treble and zero/overload, reproduces preset/seed screenshots exactly, pauses the active RAF offscreen, restores Starfield generation 2 through real `WEBGL_lose_context`, cycles both effects, checks narrow containment, and returns every active GPU/RAF/observer resource to baseline.

Rendered evidence under `.scratch/evidence/017-organic-particle-vfx/` covers default, zero, overload, preset, context-lost, and recovered states. The dedicated Chrome scenario passes with no browser errors, observer baseline 5→5, zero active programs/buffers/VAOs/textures/RAFs, and zero textures created. One real context loss invalidates one resource generation, so 17 tuples were created and 16 legally deleted; active-resource counts are the leak authority.
