# Verification and rollout contract

Type: task  
Status: resolved  
Blocked by: Playground direction

## Question

What evidence, state matrix, browser surface, performance boundary, issue frontier, and release stop condition make the spec safe for autonomous vertical-slice implementation?

## Answer

Work one vertical slice at a time through public source/session → analysis frame → renderer → React interface → playground → focused tests. Each slice remains runnable and demoable. Full suites run at batch/final checkpoints, not after every edit.

Required gates:

1. Scope and provenance: diff audit plus source pointers for every nontrivial contract.
2. Package: declarations and exports build; an external-consumer fixture imports the package without playground internals or browser globals at import time.
3. DSP/data: independent fixtures verify signed waveform, envelope, spectrum ordering, RMS/peak, dB mapping, channel modes, windows, smoothing/attack/release, cutoffs, interpolation, filtering, and normalization boundaries.
4. Renderer parity: the same frame/config produces equivalent geometry across supported Canvas 2D, SVG, DOM/CSS, and WebGL2 capabilities; unsupported combinations are disabled with an explanation.
5. Runtime lifecycle: repeated start/stop/source changes leave no live track, context, listener, observer, worker, or RAF; stale async permission/decode results cannot resurrect an old session.
6. User states: deterministic demo, empty, decode pending/failure, playback blocked, ready/playing/paused/seeking/ended, permission requesting/denied/retry, muted, silent, unsupported renderer, export success/failure.
7. Interaction/accessibility: Pointer Events with capture/cancel, keyboard arrows/Page/Home/End/Space where applicable, focus-visible, accessible value text/status, reduced motion, and semantic distinction between image/slider/range/editor.
8. Viewports: 1440×960, 390×844, 320 px, and ultrawide; desktop main path has no page scroll, narrow layout has no horizontal overflow, and every control remains reachable.
9. Visual direction: same-state desktop/narrow captures, selected direction/signature visible, finish ledger green, and hidden-brief read identifies Play → adjust on signal → Copy code.
10. Performance/recovery: default steady animation produces no uncaught errors or sustained long tasks; offscreen/inactive views pause; large data and guarded large FFT do not freeze the UI; WebGL2 loss/absence has a working fallback.
11. Export: generated selected-adapter component compiles and runs in an isolated fixture with no project-local imports or remote asset requirement.
12. Final batch: typecheck, lint, format check, unit/component tests, coverage report, Playwright, production library/app builds, and adversarial autopsy.

Initial automated browser baseline is installed Chrome/Chromium. Firefox, Safari, screen-reader, package publish, deploy, and push remain explicit unverified/deferred gates unless separately authorized.
