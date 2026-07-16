# 011 — Deliver SVG renderer parity through the shared contract

Status: ready-for-human

Resolution: completed and verified in commit `630b174`.

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

## Completion evidence

- `renderer: "svg"` now flows through the same canonical waveform, envelope, spectrum, meter, stepped-meter, session, recorded-playback, and controlled-overlay contracts as Canvas.
- One public SVG adapter routes immutable time-domain, spectrum, and meter scenes; capability metadata declares supported modes plus channel, sampling, history, and 4,096-shape limits instead of silently dropping config.
- Per-instance `useId` prefixes plus stable logical suffixes keep gradient references unique and resolvable, while grouped paths avoid one DOM node per sample.
- Live Canvas/SVG switching preserves source epoch, session, playback, editor state, and the active observer baseline; unsupported combinations render an explicit visible error state.
- Responsive/theme/forced-colors/reduced-motion/SSR behavior and shared keyboard overlays are covered in unit and installed-Chrome tests. A discovered point/region hit-target overlap was repaired by reserving region lanes before marker/handle lanes.
- Final proof: 158/158 tests, typecheck, lint, format, library/types/playground builds, SSR import, fresh packed-consumer typecheck, and 15/15 Chrome E2E paths. Rendered comparisons and a clean browser report live under `.scratch/evidence/011-svg-renderer/`.
