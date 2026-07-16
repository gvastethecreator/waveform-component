# 021 — Keep long data, live analysis, and inactive rendering responsive

Status: blocked

Type: AFK  
Blocked by: 003–006, 013, 019  
User stories: 26, 48, 69, 102–106, 109–110

## Outcome

Long files, live analysis, high-DPR rendering, and VFX remain responsive through measured scheduling, bounded buffers, backpressure, inactive/offscreen pause behavior, and resource audits.

## Work

1. Define representative long-file, high-bin, live-source, multi-view, offscreen, and effect-cycle performance scenarios and budgets.
2. Optimize multi-resolution peaks, reuse hot buffers, and move extraction off the main thread only where measurement justifies it.
3. Add frame scheduling/backpressure and pause/reduce analysis and drawing while hidden, offscreen, muted, or inactive according to config.
4. Instrument active tracks, contexts, nodes, observers, workers, listeners, RAFs, WebGL resources, and large buffers in test scenarios.
5. Document budgets, measurement method, browser limitations, and remaining tradeoffs.

## Acceptance

- The agreed long-file/live scenarios stay interactive and within documented memory/work budgets.
- Pause/resume retains correct source, playback, analysis, and renderer state.
- Repeated source/renderer/effect cycling returns instrumented resource counts to baseline.
- Optimization does not change deterministic fixture output beyond declared tolerances.
- Performance claims have recorded measurements, not source-only inference.
