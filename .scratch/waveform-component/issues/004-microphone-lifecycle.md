# 004 — Connect, explain, and recover live microphone input

Status: ready-for-agent

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
