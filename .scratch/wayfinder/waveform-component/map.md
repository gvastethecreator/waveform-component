# Wayfinder: implementation-ready waveform component

## Destination

An implementation-ready spec for a reusable, highly customizable waveform package and its static inspector-workbench playground, with source, analysis, renderer, interaction, visual, accessibility, failure, proof, and delivery decisions explicit enough for vertical-slice tickets.

## Notes

- Structural baseline: `D:\DEV\folders`.
- Primary research: `docs/research/2026-07-16-waveform-component-foundations.md`.
- Design evidence: `.scratch/design/waveform-component/`.
- Local tracker convention: `.scratch/waveform-component/` with `ready-for-agent` statuses.
- Preserve GPL references as behavioral evidence only; implementation is clean-room and original.
- User explicitly requested continued planning through PRD/issues and then a durable completion goal.

## Decisions So Far

- [Baseline inheritance](tickets/001-baseline-inheritance.md) - Inherit the `folders` stack, typed-config/adapters discipline, overview/focus workbench, Controls/Code rail, export, and proof model; add a real library build.
- [Control and license boundary](tickets/002-control-license-boundary.md) - Represent the full web-portable OBS control taxonomy while clean-room reimplementing every GPL-derived behavior.
- [Public module seams](tickets/003-public-module-seams.md) - Select a headless session plus source/analysis/render adapters and convenience React interfaces over a smart monolith.
- [Playground direction](tickets/004-playground-direction.md) - Select Signal Workbench; direct signal overlays are the signature and the primary route is Play → adjust on signal → Copy code.
- [Verification and rollout contract](tickets/005-verification-rollout.md) - Require public-seam, DSP, renderer parity, lifecycle, states, accessibility, viewport, performance, export, and final-batch proof.

## Frontier

- Wayfinding complete. Route to PRD and vertical-slice issues.

## Not Yet Specified

- Public package scope/name and repository URL; local implementation can use a private placeholder identity.
- Firefox/Safari automation; Chromium is the initial proven baseline and other browser claims remain limited until executed.

## Out Of Scope

- OBS plugin binaries, native OBS integration, or literal reuse of GPL code/shaders.
- Backend, accounts, hosted media, cloud persistence, analytics, or secret-bearing services.
- DAW-style multitrack editing, transcription, source separation, mastering, or destructive audio processing.
- Deployment, publishing, push, or package release without separate authorization.
