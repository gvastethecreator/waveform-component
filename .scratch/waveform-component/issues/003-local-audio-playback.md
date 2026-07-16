# 003 — Decode, play, inspect, and scrub local audio

Status: ready-for-human

Resolution: completed and verified in commit `0d77bf6`.

Type: AFK  
Blocked by: 002  
User stories: 8–11, 19, 54–57, 94, 102, 104–105, 109

## Outcome

Users can load local audio without upload, see multi-resolution signed peaks, play/pause, understand position/duration, and seek with pointer, touch, or keyboard through the real package and playground paths.

## Work

1. Implement File/Blob/URL/ArrayBuffer decode and existing-media-element attachment through session adapters.
2. Produce bounded multi-resolution signed peaks and playback progress layers.
3. Add transport, current/duration labels, playhead, and controlled seek callbacks.
4. Share one coordinate contract across pointer, touch, and keyboard interaction.
5. Render loading, empty, corrupt, unsupported, interrupted, and recoverable states.

## Acceptance

- Local files never leave the browser.
- Rapid source replacement ignores stale decode results.
- Arrow, Page, Home, End, and Space behavior is named, bounded, and browser-tested.
- Empty, corrupt, zero-duration, and long inputs remain responsive and recoverable.
- Playback state and played/unplayed layers stay synchronized without hidden source ownership changes.

## Verification

- `bun run verify:tracer`: passed with 39/39 unit/component tests, type/lint/format, package/types/playground builds, SSR import, fresh packed consumer, and recorded-player declarations.
- Recorded-source tests prove Blob decode without fetch/upload, bounded signed peak pyramids, play/pause/seek, stale delayed-decode suppression, exact context/object-URL cleanup, corrupt recovery state, and explicit zero-duration output.
- `bun run test:e2e`: passed 4/4 installed-Chrome paths, including a generated local WAV, Play/Space, Arrow/Page/Home/End seeking, corrupt-file explanation, and successful replacement recovery.
- Browser inspection: real WAV settles at `RECORDED-AUDIO / READY`, uses a 1-second controlled seek range, keeps desktop at zero document overflow and narrow at zero horizontal overflow, and emits no console errors.
- Evidence: `.scratch/evidence/003-recorded/desktop-final.png` and `narrow.png` (generated evidence is intentionally ignored by Git).
