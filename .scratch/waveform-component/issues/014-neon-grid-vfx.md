# 014 — Add Neon Lines and Equalizer Grid as original VFX slices

Status: ready-for-agent

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
