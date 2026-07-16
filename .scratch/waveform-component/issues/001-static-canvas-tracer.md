# 001 — Ship the static Canvas waveform tracer bullet

Status: ready-for-agent

Type: AFK  
Blocked by: none  
User stories: 1–7, 18, 48, 66, 69, 94, 106–108, 111–115

## Outcome

A greenfield Bun/React/TypeScript package and playground render deterministic signed waveform data through the public package API and Canvas 2D adapter. The first slice proves the package boundary, SSR-safe import, DPR-aware geometry, and focused verification end to end.

## Work

1. Initialize Git and inherit the approved `folders` toolchain, structure, scripts, and static-playground intent without copying domain code blindly.
2. Establish package source, public exports, a separate playground, and an isolated external-consumer fixture.
3. Define the smallest public typed frame/config and React convenience interface needed for a signed static waveform.
4. Implement deterministic demo/static input and a Canvas 2D renderer with stable resize/DPR behavior.
5. Add the minimal Signal Workbench shell needed to select the deterministic signal and see the real artifact.
6. Document the slice and preserve the clean-room/license boundary.

## Acceptance

- The playground imports only public package exports.
- Importing the package without browser globals does not fail.
- Signed values preserve polarity and invalid/empty values have explicit behavior.
- Repeated resize does not accumulate Canvas scale or produce non-finite geometry.
- The external consumer builds against generated declarations.
- Focused type, unit, component, build, and browser checks pass before a logical commit.
