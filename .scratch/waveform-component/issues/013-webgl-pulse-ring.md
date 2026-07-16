# 013 — Open the WebGL2 path with Pulse Ring and graceful fallback

Status: ready-for-human

Resolution: completed and verified in commit `2ec5c25`.

Type: AFK  
Blocked by: 006, 008  
User stories: 66–71, 84–85, 89–94, 103–109

## Outcome

A clean-room WebGL2 adapter establishes resource lifecycle, capability reporting, context-loss recovery, unsupported fallback, and the original Pulse Ring effect driven by canonical band energy.

## Work

1. Implement the WebGL2 adapter, resize/DPR flow, shared uniforms, buffer/program ownership, and disposal.
2. Add explicit unavailable, initialization-failure, context-lost, restoring, and recovered states.
3. Implement Pulse Ring with thickness, glow, rotation, band-reactivity, color, and bounded quality controls.
4. Add deterministic time/energy injection for tests, screenshots, and reduced-motion output.
5. Record clean-room design provenance without copying GPL implementation or shader source.

## Acceptance

- WebGL2 absence and context loss never leave an unexplained blank surface.
- Programs, buffers, textures, observers, and animation frames return to baseline after disposal.
- Pulse Ring uses canonical frame data and every named control affects its output.
- Reduced motion retains a meaningful static state.
- Context-loss/restoration, resize, invalid config, and adapter-switch browser tests pass.

## Completion evidence

- `BuiltinRendererId`, `BUILTIN_RENDERER_CATALOG`, and `WEBGL2_RENDERER_CAPABILITIES` add an honest `pulse-ring -> bands` VFX path without widening or silently degrading the core Canvas/SVG/DOM config types.
- `createBandEnergyFrameFromSpectrum` derives immutable 1–16-band logarithmic RMS-amplitude energy from canonical ordered spectrum frames; invalid density/frequency domains fail explicitly.
- The public adapter owns one WebGL2 program, buffer, vertex array, uniform set, and listener set; it exposes initializing/ready/unavailable/context-lost/restoring/error/destroyed status, surfaces compiler/linker logs, fully recreates resources after restoration, and disposes idempotently.
- Pulse Ring is an original GLSL ES 3.00 full-screen-triangle effect. Its thickness, glow, rotation, band reactivity, four colors, and low/balanced/high quality controls are bounded, deterministic, documented, exported, and each changes either rendered pixels or the backing allocation.
- `PulseRing` is SSR-safe, owns one ResizeObserver, starts one RAF chain only for ready full-motion output, renders one static reduced-motion frame, substitutes a high-contrast pixel palette, and keeps a labeled CSS silhouette visible for every non-ready state.
- The Signal Workbench exposes WebGL2 and Pulse Ring separately, retains source/epoch/control state, displays an explicit Canvas 2D fallback for core/recorded views, keeps VFX overlays unmounted, exports copyable code, and resets all controls deterministically.
- Real installed-Chrome proof used ratified `WEBGL_lose_context`: generation 1 lost to a visible fallback, generation 2 rebuilt and rendered, then adapter teardown returned observers 5→5 and active program/buffer/VAO/RAF/texture counts to zero. Pulse Ring created zero textures and emitted zero browser errors.
- Rendered inspection repaired an angular band-wrap seam, an oversized recovery silhouette, and additive forced-colors washout before closure. Evidence is under `.scratch/evidence/013-webgl-pulse-ring/`.
- Final gate: 48 files and 194/194 tests in stable single-worker mode; typecheck, lint, format, library/types/playground builds, SSR import, fresh packed-consumer typecheck, and 20/20 isolated-port Chrome E2E paths pass.
