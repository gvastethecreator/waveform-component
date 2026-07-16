# 012 — Deliver DOM/CSS renderer parity through the shared contract

Status: ready-for-human

Resolution: completed and verified in commit `f848255`.

Type: AFK  
Blocked by: 007, 008, 009, 010  
User stories: 42–69, 89–94, 107–110

## Outcome

The DOM/CSS adapter renders bounded bars, stepped bars, meters, and stepped meters through shared frames/config, CSS-variable theming, semantic overlays, and honest capability reporting.

## Work

1. Implement the supported bar/meter families with a hard DOM-node budget.
2. Reuse color roles, channel layouts, status, editor semantics, and responsive contracts.
3. Declare curves, unsupported radial/VFX modes, and density limits in capability metadata.
4. Support live engine switching without re-owning source/session resources.
5. Add contract, accessibility, high-contrast, reduced-motion, and DOM-budget tests.

## Acceptance

- DOM node count remains within the documented budget at maximum public density.
- Unsupported modes are disabled and explained.
- High contrast, zoom, forced colors, and reduced motion remain usable.
- Switching renderers cannot duplicate observers, listeners, or animation work.
- Canonical renderer tests prove comparable values, ordering, colors, and channel intent.

## Completion evidence

- `renderer: "dom"` now flows through the existing Spectrum and Meter public components, shared canonical frames/configs, semantic overlays, source/session state, and live Canvas/SVG/DOM switching.
- Capability metadata limits DOM/CSS to rectangular spectrum bars plus continuous/stepped meters; time-domain, curves, radial layouts, and excessive density return visible reasons instead of silent approximation.
- Pure DOM scenes retain CSS-variable color roles, sample spectrum/history within declared limits, and preflight stepped-meter density before geometry allocation. The hard public ceiling is 1,024 rendered nodes.
- Forced-colors rendering uses system color roles inside a visual-only `forced-color-adjust: none` surface, while reduced motion produces zero animations and controls remain native DOM outside the visual layer.
- Browser proof preserved recorded playback/seek state, kept active ResizeObserver count at its five-observer baseline after repeated adapter switching, and matched published/rendered node counts exactly.
- Final proof: 173/173 tests in the stable single-worker mode, typecheck, lint, format, library/types/playground builds, SSR import, fresh packed-consumer typecheck, and 17/17 isolated-port Chrome E2E paths. Rendered evidence and the clean lifecycle report live under `.scratch/evidence/012-dom-renderer/`.
