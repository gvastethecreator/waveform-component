# 018 — Add Reactive Frame and Storm Lightning as original slices

Status: blocked

Type: AFK  
Blocked by: 013  
User stories: 82–84, 85–94, 102–110

## Outcome

Original Reactive Frame and Storm Lightning effects expose every requested parameter while keeping flashes, geometry, randomization, and resource cost bounded and suitable for reduced-motion users.

## Work

1. Implement Reactive Frame inset, thickness, corner ratio, bar height, trigger, cluster width/count, glow, and color.
2. Implement Storm Lightning threshold, ray count, length, segments, core/glow widths, reactivity, flicker, and color.
3. Add deterministic seed/time/energy injection, typed schemas, capability metadata, and curated presets.
4. Add safe bounds for clusters, rays, segments, flicker cadence, brightness, and geometry around content.
5. Add reduced-motion, low-energy, overload, resize, context-loss, and cleanup proof.

## Acceptance

- Frame content remains legible and lightning never becomes an unbounded full-screen flicker.
- Low-motion mode removes nonessential flashing while preserving state meaning.
- Thresholds and transient mappings are independently testable.
- Every public parameter has an observable, bounded effect.
- Deterministic screenshots, capability tests, and resource audits pass.
