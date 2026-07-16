# 002 — Make `WaveformSession` lifecycle and source ownership reusable

Status: ready-for-human

Resolution: completed and verified in commit `7f14d5f`.

Type: AFK  
Blocked by: 001  
User stories: 4–18, 21, 67–68, 103–105, 108

## Outcome

A framework-neutral `WaveformSession` owns frame publication, source replacement, status/error reporting, source epochs, and cleanup. React remains a convenience layer, and several renderers or views can share one live session safely.

## Work

1. Define canonical typed frames for signed waveform, envelope, ordered spectrum, meters, bands, and metadata.
2. Add session subscribe/snapshot/status/error/dispose behavior and discriminated source ownership.
3. Add demo, normalized static, PCM, `AudioBuffer`, existing media element, `MediaStream`, and `AudioNode` adapter contracts at the appropriate implementation depth.
4. Guard async decode/permission work with monotonically increasing source epochs.
5. Wire React bindings and prove that two views can observe one session without duplicating the source lifecycle.

## Acceptance

- Stale async work cannot publish frames or resurrect a previous source.
- Borrowed resources survive detach; owned resources stop exactly once.
- Replacement and disposal remove listeners, animation frames, observers, nodes, contexts, workers, and tracks created by the package.
- Status and errors are structured, typed, and independently renderable by a host.
- Lifecycle fixtures cover attach, replace, abort, dispose, and shared observation.

## Verification

- `bun run verify:tracer`: passed with 30/30 unit/component tests, TypeScript 7, lint/format, package/types/playground builds, SSR import, fresh packed-tarball install, and external-consumer typecheck.
- Session-focused tests cover two subscribers/two React views, generic analysis frames, async stale publication, late-handle disposal, cleanup failure, structured connection errors, terminal disposal, AudioBuffer copying, MediaStream ownership/mute/end, and borrowed AudioNode behavior.
- `bun run test:e2e`: passed 2/2 installed-Chrome paths after the playground migrated its primary artifact/status to one shared session.
- Browser inspection after rapid Broadcast → Transient → Nocturne → Signal red changes: `DEMO / READY`, owned source, epoch 9, correct 2048-sample Canvas, zero document overflow, and clean console.
- Evidence: `.scratch/evidence/002-session/desktop.png` (generated evidence is intentionally ignored by Git).
