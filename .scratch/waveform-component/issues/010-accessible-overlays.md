# 010 — Make seeking, regions, loops, markers, and signal handles accessible

Status: ready-for-human

Resolution: completed and verified in commit `be53601`.

Type: AFK  
Blocked by: 003, 007, 009  
User stories: 55–65, 91–92, 105, 108–110

## Outcome

Playback and editor overlays provide controlled seeking, selection, loops, markers, hover inspection, and direct cutoff/threshold handles with correct display/slider/range/editor semantics outside the bitmap.

## Work

1. Define one normalized coordinate/value contract for pointer, touch, keyboard, RTL-safe layout where applicable, and host callbacks.
2. Add selectable and loopable time regions, markers/annotations, hover inspection, and controlled activation callbacks.
3. Add direct cutoff, threshold, playhead, selection, and loop handles tethered to the signal.
4. Add semantic DOM mirrors, visible focus, logical tab order, values, state announcements, and recovery messages.
5. Verify zoom, high contrast, forced colors, screen-reader naming, and reduced motion.

## Acceptance

- Host state remains authoritative; internal previews cannot silently commit controlled state.
- Pointer, touch, and keyboard map to the same bounded values.
- Canvas is never the sole source of name, value, selection, or error meaning.
- Overlapping handles remain operable and have an explicit focus strategy.
- Browser tests cover seek, region, loop, marker, and direct-handle behavior.

## Completion evidence

- `SignalOverlay` keeps values host-controlled while exposing separate preview and commit callbacks for seek and handles.
- One coordinate policy covers horizontal/vertical, RTL, reversed axes, linear/log scaling, keyboard input, Pointer Events, and pointer-cancel recovery.
- Regions, loops, markers, hover inspection, and cutoff/threshold/playhead/selection handles remain semantic DOM outside the Canvas bitmap.
- Stable collision lanes, 24 px hit targets, explicit focus elevation, forced-colors focus rings, and described ranges keep overlaps operable.
- `bun run verify:tracer` passed 139 tests plus typecheck, lint, format, builds, SSR import, and fresh packed-consumer verification; 13/13 installed-Chrome E2E paths passed.
- Rendered evidence under `.scratch/evidence/010-accessible-overlays/` covers desktop, RTL, spectrum handles, vertical meter reversal, narrow forced colors, reduced motion, and actual 200% page scale with zero reported horizontal overflow or console errors.
