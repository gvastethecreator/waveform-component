# 007 — Preserve channel meaning across time-domain layouts

Status: ready-for-human

Resolution: completed and verified in commit `73781a2`.

Type: AFK  
Blocked by: 003, 005  
User stories: 8, 21–23, 42–48, 69, 89–94, 106–108

## Outcome

Waveform and envelope modes preserve signed channel data across mono, stereo, and single-channel selection; stacked, split, and overlaid layouts; amplitude placements; orientation; and responsive/fixed sizing.

## Work

1. Implement mono/stereo/single selection and stacked/split/overlaid channel layout.
2. Add signed waveform and envelope frame/render paths without conflating polarity and magnitude.
3. Add centered, baseline, positive-only, negative-only, and mirrored amplitude layouts where valid.
4. Add horizontal/vertical orientation, channel spacing, width/gap/line/amplitude controls, and responsive/internal sizing.
5. Encode invalid mode/layout combinations in discriminated config types and runtime validation.

## Acceptance

- Polarity and channel identity survive analysis and rendering.
- Zero-length channels, degenerate dimensions, extreme spacing, and source replacement produce finite geometry.
- Inapplicable layouts are unrepresentable or rejected with structured feedback.
- Resize and DPR changes retain sharp, stable output without stale geometry.
- Canonical geometry fixtures cover each public time-domain layout.

## Verification

- `bun run verify:tracer`: passed with 85/85 unit/component tests, type/lint/format, library/types/playground builds, SSR import, and a fresh packed consumer compiling both `Waveform` and `Envelope` paths.
- Canonical fixtures cover source/mono/stereo/single selection, uneven tails, phase cancellation, signed versus magnitude frames, every layout and placement, both orientations, degenerate dimensions, extreme spacing, per-channel Canvas color, resize, and DPR replacement.
- `bun run test:e2e`: passed 9/9 installed-Chrome paths. The channel path proves stacked/overlay pixel differences, mono capability blocking, stereo split panels, mirrored vertical envelope, fixed sizing, and no render error or horizontal overflow.
- Browser inspection: 1440×960 renders two colored vertical split panels at a fixed 480 px width; 390×844 remains horizontally bounded. Both captures have finite Canvas bounds and no console/render errors.
- Evidence: `.scratch/evidence/007-channels/desktop-final.png`, `narrow-final.png`, and `browser-report.json` (generated evidence is intentionally ignored by Git).
