# 014 — Add Neon Lines and Equalizer Grid as original VFX slices

Status: ready-for-human

Resolution: completed and verified in commit `1480a89`.

Type: AFK  
Blocked by: 013  
User stories: 72–73, 84–94, 103–110

## Outcome

Original clean-room Neon Lines and Equalizer Grid effects expose complete named schemas, curated presets, distributed-energy mapping, capability-aware controls, deterministic proof, and bounded GPU work.

## Work

1. Implement Neon Lines height, speed, thickness, glow, and per-line energy controls.
2. Implement Equalizer Grid columns, rows, gap, and reactivity controls.
3. Map canonical distributed bands into stable line/grid positions and color roles.
4. Add schemas with name, type, range, step, unit, default, description, and constraints.
5. Add deterministic presets, screenshots, zero/overload fixtures, and lifecycle/performance checks.

## Acceptance

- Every parameter has a semantic name and observable effect.
- Counts/density are bounded before buffer allocation or shader iteration.
- Zero energy, clipped energy, resize, and reduced motion remain intentional.
- Presets reset and reproduce exactly.
- Clean-room provenance and focused renderer/browser tests are recorded.

## Completion evidence

- `NeonLinesConfig` and `EqualizerGridConfig` expose complete effect-specific schemas with semantic names, types, ranges, steps, units, defaults, descriptions, constraints, compatibility metadata, hard line/grid bounds, and immutable preset catalogs.
- Both original GLSL ES 3.00 programs consume the canonical bounded band-energy upload. Neon Lines uses a static 12-line loop and edge-aware displacement; Equalizer Grid addresses a procedural maximum 48×24 grid without density-sized buffers, textures, or shader variants.
- One generic WebGL2 lifecycle now owns compilation, uniforms, resize/DPR budgets, diagnostics, context loss/restoration, and idempotent teardown for Pulse Ring, Neon Lines, and Equalizer Grid while each public adapter retains its typed config and uniform mapping.
- Public SSR-safe React components provide composed reduced-motion, unsupported, lost, restoring, error, and forced-colors states. The playground separates mode from engine, exposes every named control, exact preset reset/reload, Signal/Zero/Overload fixtures, resource diagnostics, and effect-specific copy output.
- Installed-Chrome pressure changed every numeric/color control and observed distinct pixels, reproduced presets exactly, compiled both shaders, exercised zero/overload/high-quality/narrow states and real `WEBGL_lose_context`, and returned active programs/buffers/VAOs/textures/RAFs to zero with observers 5→5 and no browser errors.
- Rendered inspection caught overload clipping in Neon Lines; normalization and per-line edge-distance bounds repaired it. Evidence is under `.scratch/evidence/014-neon-grid-vfx/` and clean-room design/provenance is documented in `docs/research/2026-07-16-neon-grid-vfx.md`.
- Final gate: 51 files and 209/209 tests in stable single-worker mode; typecheck, lint, format, library/types/playground builds, SSR import, fresh packed-consumer typecheck, and 21/21 isolated-port Chrome E2E paths pass.
