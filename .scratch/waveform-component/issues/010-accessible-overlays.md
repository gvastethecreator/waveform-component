# 010 — Make seeking, regions, loops, markers, and signal handles accessible

Status: ready-for-agent

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
