# 006 — Tune dynamics, filtering, normalization, and synchronization

Status: blocked

Type: AFK  
Blocked by: 005  
User stories: 24–25, 32–41, 51, 84–85, 89–94, 103–106

## Outcome

Reactive behavior is deliberate and frame-rate independent through smoothing, ballistics, thresholds, normalization, visual sync, resampling/filtering, spectral compensation, and silence/mute policy.

## Work

1. Add no smoothing, simple EMA, time-variant EMA, inertia, fast peaks, attack, and release.
2. Add react/peak dB thresholds and capped target/max-gain normalization.
3. Add visual sync offset only where a source can support it and explain limits elsewhere.
4. Add optional Gaussian geometric filtering, high-frequency slope, and roll-off bandwidth/attenuation.
5. Add explicit hide-silent and process-muted policies with named session states.

## Acceptance

- Time constants behave consistently across different frame cadences.
- Normalization cannot exceed configured maximum gain or amplify invalid silence.
- Unsupported sync behavior is visible and does not imply audio delay ownership.
- Silence/mute transitions are deterministic and testable.
- DSP fixtures use independently derived expected values rather than repeating implementation code.
