# 005 — Render a physically meaningful spectrum

Status: ready-for-human

Resolution: completed and verified in commit `0b1b917`.

Type: AFK  
Blocked by: 002  
User stories: 21, 26–31, 40, 42–43, 50–53, 84, 89–90, 92, 106–108

## Outcome

Ordered spectrum frames and real Canvas curve/bar modes expose explicit FFT, window, cutoff, scale, dB, interpolation, geometry, and color controls without confusing frequency in hertz with bin indices.

## Work

1. Implement guarded FFT-size selection and None, Hann, Hamming, Blackman, Blackman-Harris, and Power-of-Sine windows.
2. Map low/high cutoffs in hertz against sample rate and Nyquist.
3. Support linear/log frequency scales and dBFS floor/ceiling.
4. Add nearest, Lanczos, and Catmull-Rom resampling needed by Canvas spectrum curve and bars.
5. Expose only applicable capability-scoped controls with typed metadata, units, ranges, defaults, and descriptions.

## Acceptance

- Frequency placement and window behavior pass independent DSP fixtures.
- Invalid FFT/window/cutoff/dB combinations reject or normalize predictably.
- Hz never masquerades as an array index or display-only label.
- Log scale handles zero/invalid bounds without non-finite geometry.
- Disabled controls explain the capability constraint instead of silently doing nothing.

## Verification

- `bun run verify:tracer`: passed with 59/59 unit/component tests, type/lint/format, library/types/playground builds, SSR import, and a fresh packed consumer compiling analyzer, Spectrum component, config, and interpolation APIs.
- Independent DSP fixtures cover six literal windows, an exact-bin 3 kHz full-scale sine, FFT guard/normalization, malformed inputs, dB range policy, Hz/bin conversion, Nyquist clamping, linear/log geometry, degenerate viewports, bounded bars, and nearest/Lanczos/Catmull-Rom resampling.
- `bun run test:e2e`: passed 7/7 installed-Chrome paths. The spectrum path proves disabled/enabled 65,536 FFT gating, window-specific exponent availability, curve→bars pixel change, Hz cutoff controls, linear/log scale, recorded-peak capability blocking, and live microphone spectrum frames.
- Browser inspection: deterministic bars settle at `DEMO / READY`, render an ordered `SPECTRUM / CANVAS 2D` artifact, keep 1440×960 at zero document overflow and 390 px at zero horizontal overflow, and emit no console errors.
- Evidence: `.scratch/evidence/005-spectrum/desktop-final.png` and `narrow-final.png` (generated evidence is intentionally ignored by Git).
