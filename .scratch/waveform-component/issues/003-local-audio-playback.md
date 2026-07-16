# 003 — Decode, play, inspect, and scrub local audio

Status: blocked

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
