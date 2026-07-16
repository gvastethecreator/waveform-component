# 008 — Add radial geometry and the complete color grammar

Status: ready-for-human

Resolution: completed and verified in commit `4476f49`.

Type: AFK  
Blocked by: 005, 007  
User stories: 43–53, 66–69, 84–85, 89–94, 106–108

## Outcome

Canvas modes support radial layout and a complete typed color grammar, with every parameter reflected in the artifact and constrained by declared renderer/mode capabilities.

## Work

1. Add radial layout, inversion, deadzone, arc, rotation, rounded caps, and corner radius.
2. Add line, solid, gradient, pulse, and dB-range color modes.
3. Add peak-magnitude and peak-frequency pulse mapping plus base/middle/crest/accent roles with alpha.
4. Add gradient ratio and middle/crest dB thresholds through CSS variables and typed values.
5. Add stressed geometry/color fixtures and conditional inspector controls.

## Acceptance

- Zero/full arcs, wraparound rotation, inversion, and deadzone extremes remain finite and intentional.
- Transparent and high-contrast-safe color roles retain legibility.
- Every enabled control changes the real artifact; every disabled control explains why.
- Gradient and threshold ordering reject or normalize invalid states predictably.
- Canvas contract tests cover rectangular and radial outputs at multiple DPRs.

## Verification

- `bun run verify:tracer`: passed with 95/95 unit/component tests, type/lint/format, library/types/playground builds, SSR import, and a fresh packed consumer compiling radial gradient roles.
- Pure fixtures cover zero/full/partial arcs, wraparound rotation, inward/outward radii, 0–100% deadzones, finite degenerate geometry, gradient/pulse/range decisions, alpha preservation, CSS-variable fallback, threshold ordering, and forced-colors system roles.
- `bun run test:e2e`: passed 10/10 installed-Chrome paths. The radial path proves rectangular corner radius, radial caps, deadzone/arc/rotation/inversion, gradient ratio/crest alpha, magnitude/frequency pulse, ordered range thresholds, capability feedback, pixel differences, and bounded layout.
- Browser inspection: 1440×960, 390×844, and DPR-2 forced-colors captures render the same 300° radial gradient contract without document/stage horizontal overflow, console errors, or stale Canvas sizing.
- Evidence: `.scratch/evidence/008-radial-color/desktop-final.png`, `narrow-final.png`, `forced-colors-final.png`, and `browser-report.json` (generated evidence is intentionally ignored by Git).
