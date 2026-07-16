# 005 — Render a physically meaningful spectrum

Status: ready-for-agent

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
