# 013 — Open the WebGL2 path with Pulse Ring and graceful fallback

Status: ready-for-agent

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
