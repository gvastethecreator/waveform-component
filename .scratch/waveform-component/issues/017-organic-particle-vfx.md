# 017 — Add organic and particle VFX as original slices

Status: blocked

Type: AFK  
Blocked by: 013  
User stories: 79–80, 84–94, 102–110

## Outcome

Original Liquid Blobs and Starfield Burst effects provide bounded organic and particle compositions with deterministic seeds, complete typed controls, meaningful low-frequency/transient mappings, and performance evidence.

## Work

1. Implement Liquid Blobs size, count, drift, glow, threshold, and color controls.
2. Implement Starfield Burst speed, size, count, trail, reactivity, and color controls.
3. Add deterministic seed/time injection, capability metadata, schemas, and curated presets.
4. Bound simulation steps, allocations, particle/blob counts, trails, and recovery after long frames.
5. Add zero-signal, overload, resize, offscreen, reduced-motion, and lifecycle evidence.

## Acceptance

- The same seed, frame, config, time, and viewport reproduce the same evidence frame.
- Long frames cannot cause unbounded simulation catch-up or allocation growth.
- Low-frequency and transient mappings remain meaningful and documented.
- Reduced motion and silence remain composed rather than blank or frozen mid-event.
- Performance, screenshot, preset, and disposal checks pass for both effects.
