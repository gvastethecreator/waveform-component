# 012 — Deliver DOM/CSS renderer parity through the shared contract

Status: blocked

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
