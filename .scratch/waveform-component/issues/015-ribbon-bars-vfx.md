# 015 — Add Ribbon and reactive bar VFX as original slices

Status: blocked

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
