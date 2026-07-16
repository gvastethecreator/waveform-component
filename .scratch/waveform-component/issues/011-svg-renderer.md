# 011 — Deliver SVG renderer parity through the shared contract

Status: ready-for-agent

Type: AFK  
Blocked by: 007, 008, 009, 010  
User stories: 48–69, 89–94, 107–110

## Outcome

The SVG adapter consumes the canonical frame/config, declares its actual support, and renders supported waveform, spectrum, meter, color, and overlay modes without changing source/session state.

## Work

1. Implement SVG paths/shapes for the declared rectangular and radial core modes.
2. Reuse semantic overlays and CSS color roles rather than creating renderer-specific behavior contracts.
3. Publish capability limits and explain unsupported controls in the playground.
4. Support live engine switching while retaining session, source, playback, and controlled editor state.
5. Add canonical renderer-contract and screenshot comparisons against Canvas.

## Acceptance

- One canonical frame/config produces comparable intent in SVG and Canvas.
- Unsupported features are declared; the adapter never silently ignores enabled config.
- SVG output has stable keys/IDs and no duplicate referenced identifiers.
- Switching adapters does not duplicate subscriptions, listeners, or timers.
- Resize, theme, reduced motion, keyboard overlays, and SSR-safe import stay green.
