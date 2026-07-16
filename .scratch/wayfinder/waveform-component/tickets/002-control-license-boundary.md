# Control and license boundary

Type: research  
Status: resolved  
Blocked by: Baseline inheritance

## Question

What behavior and control surface do the OBS/ElevenLabs references actually provide, which controls belong in the web product, and what source-reuse boundary is safe?

## Answer

Represent the complete web-portable taxonomy as typed, conditionally visible control groups: source/lifecycle; normalization/thresholds/attack/release; waveform/envelope/spectrum/meter/energy modes; canvas/layout/channel controls; FFT/window; temporal/interpolation/filter; cutoffs and dB mapping; geometry; color/reactivity; meter/history; quality/performance; plus named schemas for all thirteen VFX families.

Keep ordered spectrum and distributed VFX energy as different frame fields. Keep signed waveform distinct from absolute envelope. Map OBS source selection to demo, file/media, microphone, and externally owned stream/node adapters. Report visible idle/requesting/live/muted/silent/ended/error states.

`audio-wave-main` is GPL v2 and `waveform-master` GPL v3-or-later. Their code, FFT implementation, and shaders are not reusable in an MIT-style package. Treat them as behavioral requirements and implement originally. ElevenLabs UI is MIT, but the selected architecture reimplements its useful concepts instead of copying its monolith; preserve its license if substantial code is ever reused.

Evidence: `docs/research/2026-07-16-waveform-component-foundations.md`.
