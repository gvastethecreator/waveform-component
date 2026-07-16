# 009 — Add trustworthy meters, stepped meters, and bounded history

Status: ready-for-agent

Type: AFK  
Blocked by: 002, 006, 007  
User stories: 21–25, 35–37, 42–47, 84–85, 89–94, 102–108

## Outcome

RMS, peak, meter, stepped-meter, and bounded-history modes represent distinct audio meanings with configurable ballistics and geometry across mono and stereo sources.

## Work

1. Implement independent RMS and peak analysis with explicit units and reference levels.
2. Add meter and stepped-meter frames/rendering, minimum height, widths, gaps, and rounded geometry.
3. Add configurable history duration with a documented memory ceiling and reset policy.
4. Integrate attack/release/fast-peak behavior and named presets through the capability inspector.
5. Add transient, steady-state, resize, and source-replacement fixtures.

## Acceptance

- RMS and peak are neither named nor calculated as the same value.
- History memory remains bounded for every public duration/sample-rate combination.
- Independent fixtures validate steady tones, impulses, silence, and decay.
- Resize/source replacement cannot leak stale channel or history values.
- Meter controls remain keyboard-accessible and capability-aware.
