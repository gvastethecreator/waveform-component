# 015 — Add Ribbon and reactive bar VFX as original slices

Status: ready-for-human

Resolution: completed and verified in commits `45ee9f0` and `e0fb26d`.

Type: AFK  
Blocked by: 013  
User stories: 74–76, 84–94, 103–110

## Outcome

Original Waveform Ribbon, Rounded Wobble Bars, and Spectrum Bars effects cover their full named controls through typed schemas, deterministic presets, distributed-energy input, and bounded geometry.

## Work

1. Implement Waveform Ribbon height, speed, thickness, glow, reflection, and reactivity.
2. Implement Rounded Wobble Bars count, wobble, mirror, gap, glow, and reactivity.
3. Implement Spectrum Bars count, reactivity, gap, baseline, and glow.
4. Add capability metadata, schemas, presets, reduced-motion states, deterministic clocks, and evidence captures.
5. Exercise maximum density, rapid effect switching, resize, silence, overload, and disposal.

## Acceptance

- No anonymous generic option slots appear in public config or UI.
- Reflection, mirror, baseline, counts, gaps, and glow are visibly distinct and bounded.
- Source energy mapping remains ordered and stable across resize.
- Reduced motion and zero-signal states retain a composed artifact.
- GPU resources and animation work return to baseline after cycling all three effects.

## Completion evidence

- `WaveformRibbonConfig`, `RoundedWobbleBarsConfig`, and `SpectrumBarsConfig` expose effect-specific typed numeric, color, select, and boolean controls with public defaults, immutable presets, validation, and hard geometry limits.
- Three original GLSL ES 3.00 programs consume canonical bounded `BandEnergyFrame` input. Ribbon uses one procedural signed-distance field plus a bounded reflection; Wobble and Spectrum address at most 64 and 96 bars without count-sized buffers, textures, or shader variants.
- The shared recoverable WebGL2 lifecycle owns compilation, resize/DPR budgets, context loss/restoration, diagnostics, and idempotent teardown while every effect retains a distinct adapter, uniform mapper, React surface, CSS fallback, and capability record.
- The Signal Workbench exposes every parameter, semantic mirror control, exact presets/reset, Signal/Zero/Overload fixtures, motion/quality states, effect-specific copy output, and natural `SpectrumBars` public aliases. A freshly packed external consumer typechecks the components, configs, presets, schemas, and renderer factories.
- Installed-Chrome proof changed every numeric/color control, exercised mirror and baseline semantics, reproduced presets exactly, pressured maximum density, narrow sizing, reduced motion, three rapid switch cycles, and returned 24 created programs/buffers/VAOs to 24 deletions with zero active GPU/RAF/texture resources and observers 5→5.
- Rendered inspection covered default, preset, zero, and overload states for all three effects. Evidence is under `.scratch/evidence/015-ribbon-bars-vfx/`; clean-room provenance and bounded design are documented in `docs/research/2026-07-16-ribbon-bars-vfx.md`.
- Final gate: 54 files and 228/228 tests in stable single-worker mode; typecheck, lint, format, library/types/playground builds, SSR import, fresh packed-consumer typecheck, and 22/22 isolated-port Chrome E2E paths pass.
