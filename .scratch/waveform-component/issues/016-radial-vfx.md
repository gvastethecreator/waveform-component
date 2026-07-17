# 016 — Add radial spatial VFX as original slices

Status: ready-for-human

Resolution: completed and verified in commit `d3093ba`.

Type: AFK  
Blocked by: 013  
User stories: 77–78, 81, 84–94, 103–110

## Outcome

Original Radial Spikes, Tunnel Waves, and Vortex Rings translate ordered/distributed energy into three distinct spatial compositions with complete parameter schemas and deterministic proof.

## Work

1. Implement Radial Spikes count, radius, height, width, arc, rotation, and color controls.
2. Implement Tunnel Waves density, speed, depth, and color controls.
3. Implement Vortex Rings twist, spin, density, radius, reactivity, and color controls.
4. Guard counts, depths, radii, arcs, and motion; add curated presets and capability metadata.
5. Add deterministic evidence, reduced-motion states, log/linear band fixtures, and lifecycle checks.

## Acceptance

- The three silhouettes remain materially distinct and readable.
- Log/linear band ordering is preserved rather than randomly distributed.
- Extreme counts/arcs/radii/depth/twist/spin remain finite and within budgets.
- Resize and context restoration reproduce stable output.
- Preset, screenshot, capability, and disposal checks pass for all three effects.

## Completion evidence

- `RadialSpikesConfig`, `TunnelWavesConfig`, and `VortexRingsConfig` expose complete effect-specific controls, immutable presets, structured definitions, validation, and hard spatial bounds. Radial radius/height resolve together so reach cannot exceed `0.92`; density is capped at 128 spikes or 48 rings.
- Three original clean-room GLSL ES 3.00 programs preserve ordered low-to-high `BandEnergyFrame` placement through angular or center-to-edge coordinates. Animation changes phase and emphasis without reassigning band identity, and explicit logarithmic/linear aggregation is public before the renderer seam.
- All three adapters reuse the recoverable WebGL2 lifecycle and expose separate React surfaces, forced-color/context-loss fallbacks, public exports, capabilities, docs, copied examples, and a fresh packed-consumer surface.
- The Signal Workbench includes every numeric/color control, exact presets/reset, Signal/Zero/Overload, log/linear spacing, reduced/full motion, low/balanced/high GPU quality, and effect-specific copy output.
- Installed-Chrome proof changed every control, reproduced presets exactly, checked hostile counts/arcs/radii/depth/twist/spin, rapid three-effect cycles, narrow containment, and real `WEBGL_lose_context` generation-2 recovery. The final report has no browser errors, observers 5→5, and zero active programs, buffers, VAOs, textures, or RAFs.
- Rendered inspection covered default, silence, overload, preset, context-lost, and restored states. It rejected and repaired an initially weak Tunnel Waves silence/overload contrast; final evidence is under `.scratch/evidence/016-radial-vfx/`.
- Final gate: 57 files and 248/248 tests in stable single-worker mode; format, typecheck, lint, library/types/playground builds, SSR import, fresh packed-consumer typecheck, and 23/23 isolated-port Chrome E2E paths pass.
