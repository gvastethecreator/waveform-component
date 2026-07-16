# WebGL2 Pulse Ring lifecycle decision

Date: 2026-07-16

## Question

What lifecycle, failure-state, resource, resize, and test contracts must the first WebGL2 renderer implement so Pulse Ring can recover from context loss, remain deterministic under reduced motion, and never leave a blank or leaking surface?

## Answer

Use one canvas-scoped WebGL2 adapter with an explicit state machine:

`initializing -> ready -> context-lost -> restoring -> ready`

Creation failure, shader compile/link failure, and restoration failure enter visible `unavailable` or `error` states. Final teardown enters `destroyed`. React owns one ResizeObserver and, only while motion is allowed and the adapter is ready, one requestAnimationFrame loop. The adapter owns its WebGL context listeners, program, shaders during linking, vertex buffer, vertex array, uniform locations, viewport, draw calls, and deterministic disposal.

Pulse Ring consumes a bounded canonical `BandEnergyFrame`, not ordered spectrum bins disguised as effect energy. Its original GLSL ES 3.00 implementation may use only the behavioral names in the local metadata: ring thickness, glow strength, rotation speed, band reactivity, and four named colors. The GPL shader/effect source remains unread and is not copied or translated.

## Authoritative findings

1. Request WebGL2 with `canvas.getContext("webgl2", attributes)`. The current WebGL 2.0 specification defines context creation, drawing-buffer creation, and a `null` result after a context-creation error. Context-error listeners therefore need to exist before the request. [Khronos WebGL 2.0 specification, Context Creation](https://registry.khronos.org/webgl/specs/latest/2.0/#2.1)
2. A context-lost event invalidates every resource. Calling `preventDefault()` on `webglcontextlost` is required to make restoration possible; rendering must stop while lost. After `webglcontextrestored`, prior programs, buffers, vertex arrays, extensions, and state are invalid and must all be recreated. [Khronos WebGL specification, Context Lost and Restored Events](https://registry.khronos.org/webgl/specs/latest/1.0/#5.15.2)
3. `WEBGL_lose_context` is the ratified deterministic test seam. `loseContext()` simulates real loss and resource destruction. `restoreContext()` is asynchronous and only succeeds after the canceled loss event has completed, so tests must wait for the lost state before requesting restoration and for the restored callback before drawing. [Khronos `WEBGL_lose_context` extension, revision 15](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/)
4. Program readiness is not inferred from non-null handles. WebGL exposes compile and link status queries; the adapter must surface their information logs and delete partial resources on failure. [Khronos WebGL 2.0 specification, Programs and Shaders](https://registry.khronos.org/webgl/specs/latest/2.0/#3.7.12)
5. The local clean-room behavior source names exactly four numeric controls—Ring Thickness, Glow Strength, Rotation Speed, Band Reactivity—and four colors—Primary, Secondary, Tertiary, Sweep Flash. No ranges or defaults are authoritative there, so this project must choose, validate, document, and test its own bounded values. Sources: `.scratch/references/audio-wave-main/data/effects/pulse-ring.effect.ini` and `.scratch/references/audio-wave-main/README.md`.

## Implementation decisions

- Add `BuiltinRendererId = CoreRendererId | "webgl2"`; keep core configs limited to Canvas/SVG/DOM so a core component cannot silently treat WebGL2 as Canvas.
- Extend renderer capability queries with `pulse-ring -> bands`; WebGL2 initially declares only Pulse Ring. Unsupported core/WebGL combinations remain visible and recoverable in the workbench.
- Aggregate spectrum into 8 logarithmic, normalized energy bands through a pure analysis helper; cap public Pulse Ring input at 16 bands.
- Use one full-screen triangle buffer and one original fragment program. No textures or copied shader code are required for this effect.
- Clamp drawing-buffer DPR by a named `low | balanced | high` quality setting, a maximum dimension, and a maximum pixel count. CSS size remains responsive.
- Freeze time at zero under reduced motion while retaining the current energy-shaped ring. In normal motion, deterministic injected time drives rotation.
- During unavailable/lost/restoring/error states, show a semantic status plus a static CSS ring silhouette; never rely on a cleared bitmap for feedback.
- Expose structured renderer state callbacks and data attributes for host UX and proof, but keep loss simulation on the standard extension rather than adding a production-only debug API.

## Proof required

- Pure fixtures: band aggregation, config bounds, uniform mapping, deterministic time, reduced-motion freeze, quality/DPR/pixel limits.
- Adapter fixtures: unavailable context, compile/link failures, resize, draw mapping, lost/restored resource recreation, idempotent destroy, no calls after destroy.
- React/SSR fixtures: semantic states, one observer/RAF, cleanup, static reduced-motion output, no browser globals at import.
- Installed Chrome: nonblank pixels, every named control changes output, DPR/resize, real `WEBGL_lose_context` loss/restoration, repeated engine switching, visible unsupported fallback, clean console, and resource/observer/RAF baseline.

## Remaining uncertainty

Actual device/GPU limits vary. This slice avoids claiming universal performance; ticket 021 will profile representative WebGL states. The first adapter deliberately supports Pulse Ring only, and later tickets expand the catalog without widening 013 silently.
