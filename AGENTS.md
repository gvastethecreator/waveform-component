# Agent Guide — Waveform Component

Standalone reusable React 19 waveform package plus a Vite 8 Signal Workbench playground. Pure frontend, no backend, credentials, telemetry, or remote audio. Package manager/runtime: **Bun**.

## Source of truth

- Product and behavior: `.scratch/waveform-component/PRD.md`.
- Work frontier: `.scratch/waveform-component/issues/` in dependency order.
- Architecture evidence: `docs/research/2026-07-16-waveform-component-foundations.md` and `docs/architecture.md`.
- Durable execution record: `.scratch/planning/2026-07-16-waveform-component/`.

## Boundaries

- OBS plugins under ignored `.scratch/references/` are behavior/control research only. Never copy GPL source or shaders.
- The playground must consume public exports from `waveform-component`; package modules must not import playground code.
- Avoid browser globals at module scope so package import remains SSR-safe.
- Keep analysis and geometry pure; source ownership and cleanup must be explicit.
- Preserve focused verification per issue and run the full batch only at major checkpoints.
