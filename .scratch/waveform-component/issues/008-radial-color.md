# 008 — Add radial geometry and the complete color grammar

Status: ready-for-agent

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
