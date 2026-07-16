# 004 — Connect, explain, and recover live microphone input

Status: ready-for-human

Resolution: completed and verified in commit `b09153c`.

Type: AFK  
Blocked by: 002  
User stories: 12–17, 20, 62, 103–105, 109

## Outcome

Microphone capture begins only after an explicit user action and exposes requesting, live, muted, silent, ended, denied, unavailable, and recoverable-error states. Owned and borrowed streams follow different cleanup rules.

## Work

1. Add explicit connect/disconnect controls and the owned microphone adapter.
2. Support borrowed `MediaStream` input without stopping host-owned tracks.
3. Drive realtime frames through the session analyser path.
4. Model permission, device loss, mute/silence, stale request, disconnect, and reconnect behavior.
5. Add semantic announcements and focused browser/lifecycle proof with controllable media mocks where real hardware is unavailable.

## Acceptance

- No permission request occurs on import, mount, or source-menu navigation.
- Stale permission results are ignored after source change or disposal.
- Denial and device loss include actionable recovery copy.
- Disconnect releases only package-owned resources and reconnect works repeatedly.
- Repeated cycles return listeners, tracks, nodes, contexts, and animation work to baseline.

## Verification

- `bun run verify:tracer`: passed with 44/44 unit/component tests, type/lint/format, library/types/playground builds, SSR import, and a fresh packed external consumer compiling microphone factories, types, and hook declarations.
- Microphone-source tests prove explicit attach-before-permission, live/silent/muted/ended state propagation, denial mapping, stale permission suppression, immediate device-end release, exact owned cleanup, listener removal, and borrowed-track preservation.
- `bun run test:e2e`: passed 6/6 installed-Chrome paths. Controllable browser media mocks prove zero requests before Connect, live/mute/unmute/end announcements, two complete reconnect cycles, exact track/context release counts, denial guidance, and recovery to the deterministic demo.
- Browser inspection: live capture settles at `MICROPHONE / READY`, keeps 1440×960 at zero document overflow, emits no console errors, and uses a stable localized-independent file picker next to the microphone controls.
- Evidence: `.scratch/evidence/004-microphone/desktop-final.png` (generated evidence is intentionally ignored by Git).
