# 007 — Preserve channel meaning across time-domain layouts

Status: ready-for-agent

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
