# Quality mission: waveform component

## Contract

Artifact and user outcome: a reusable, highly customizable waveform package plus a real-user-ready static playground based on `folders`, covering the portable OBS controls and learning from ElevenLabs UI.  
Mission mode: goal after PRD/issues publication; current slice is planning/decision preparation.  
In scope: research, architecture, product/design direction, spec, vertical issues, implementation, proof, docs, and logical commits.  
Out of scope: GPL source reuse, OBS binaries, backend/cloud/accounts, DAW editing, deployment/publish/push without authorization.  
Baseline or acceptance: rendered `folders` playground, local primary references, accepted PRD/tickets, and required gate manifest. Greenfield artifact comparison is `not-assessed` until the first runnable slice.  
Stop condition: accepted scope implemented; no blocker/P1; every applicable gate honest; final batch and adversarial autopsy complete; no bounded high-value action with a credible proof path remains.

## Gate manifest

| Gate                      | Applicability | Safe proof surface                                                           | Current evidence                                                              | State                         |
| ------------------------- | ------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------- |
| Scope                     | required      | source/diff/task audit                                                       | durable plan, Wayfinder, research note                                        | passed for planning           |
| Acceptance/baseline       | required      | like-for-like screenshots and PRD                                            | three rendered `folders` captures; approved ready-for-agent PRD               | passed for specification      |
| Source provenance         | required      | local paths and official specs                                               | cited research note                                                           | passed for planning           |
| Creative direction search | required      | three same-viewport artifacts                                                | three SVG/PNG directions + direction cards                                    | passed                        |
| Signature/subtraction     | required      | direction/kill records                                                       | direct signal overlays; remove hero/dashboard/fake signal                     | passed for direction          |
| Blind audience read       | required      | brief-hidden reviewer record                                                 | `.scratch/design/waveform-component/blind-read.md`                            | passed with accepted repair   |
| Independent judgment      | required      | fresh delegated raw-artifact review                                          | independent direction read changed control labeling/primary route             | passed for planning           |
| Package/public seam       | required      | external consumer build and runtime                                          | packed tarball + declarations + SSR import pass for tracer                    | passed for tracer             |
| Regression/runtime        | required      | focused tests and browser paths                                              | 44 unit/component + 6 Chrome E2E pass                                         | passed through microphone     |
| Hostile/boundary input    | required      | fixtures for invalid config, stale async, decode/permission/renderer failure | invalid/empty/stale decode/corrupt/permission/device-end covered              | partial: renderer pending     |
| User states               | required      | rendered real states                                                         | static, recorded, and microphone states/recovery covered                      | partial                       |
| Viewport/platform         | required      | 1440, 390, 320, ultrawide captures                                           | 1440 and 390 rendered; zero relevant overflow                                 | partial                       |
| Accessibility             | required      | keyboard/pointer/focus/reduced-motion checks                                 | semantic Canvas, labeled controls, focus and reduced-motion base              | partial                       |
| Performance/lifecycle     | required      | traces, active-resource audit, long-data scenario                            | owned/borrowed mic cycles and million-sample bounded peaks pass               | partial: traced load pending  |
| Export                    | required      | isolated compile/runtime fixture                                             | contract only                                                                 | blocked by implementation     |
| Adversarial autopsy       | required      | fresh final artifact inspection                                              | not yet applicable                                                            | blocked by implementation     |

## Valid loop ledger

|   N | Source finding                                          | Artifact/proof delta                                                                                | Verdict | Next                  |
| --: | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------- | --------------------- |
|   1 | Target is reference-only and not a Git repo             | Durable scope, phases, acceptance, and error memory created                                         | better  | baseline              |
|   2 | `folders` architecture/stack/tracker inspected          | Reusable pattern and package gap fixed in plan                                                      | better  | visual baseline       |
|   3 | Desktop/narrow/Single runtime inspected                 | Three rendered baseline captures establish layout behavior                                          | better  | OBS inventory         |
|   4 | Both OBS source trees audited                           | Full control/DSP/VFX taxonomy and defects separated from desired behavior                           | better  | license boundary      |
|   5 | GPL v2/v3 and MIT licenses inspected                    | Clean-room boundary and no-source-copy decision recorded                                            | better  | ElevenLabs            |
|   6 | ElevenLabs audio modules audited                        | Useful lifecycle/compound/headless patterns retained; monolith/accessibility/perf defects rejected  | better  | platform facts        |
|   7 | W3C/WHATWG/React sources inspected                      | Canvas/DOM, microphone-state, analyser, and cleanup constraints fixed                               | better  | public seams          |
|   8 | Three interface alternatives compared                   | Headless session + adapters selected; smart monolith rejected                                       | better  | visual direction      |
|   9 | Three incompatible visual artifacts rendered            | Signal Workbench selected; matrix/patchbay not blended                                              | better  | independent read      |
|  10 | Blind review and verification frontier resolved         | Primary route/control-label repair accepted; Wayfinder closed with full proof contract              | better  | ask for seam approval |
|  11 | Approved PRD/issues made the frontier executable        | 23 self-contained AFK tickets published; durable goal created                                       | better  | tracer scaffold       |
|  12 | Greenfield package needed a real public boundary        | Library build, public exports, playground alias, SSR-safe import, and packed consumer added         | better  | pure contracts        |
|  13 | Signed data and DPR behavior needed independent proof   | Static validation, deterministic demo, pure geometry, absolute Canvas transform, and 19 tests added | better  | browser path          |
|  14 | Browser runner lacked only its video helper             | Official Playwright ffmpeg installed; 2/2 Chrome E2E paths now pass                                 | better  | rendered inspection   |
|  15 | Min/max-only Canvas output read as dotted               | Continuous midpoint path added without removing extrema; final rendered evidence is clean           | better  | session lifecycle     |
|  16 | Source growth needed one lifecycle authority            | Generic session, immutable snapshots, statuses, errors, epochs, and React store binding added       | better  | race proof            |
|  17 | Late async connect could outlive replacement            | Abort/epoch guards ignore stale callbacks and dispose late handles exactly once                     | better  | ownership proof       |
|  18 | Host and package resources need different teardown      | Borrowed stream/node adapters detach without stop/disconnect; owned tracks stop once                | better  | package proof         |
|  19 | Same-version tarball cache hid new declarations         | Consumer fixture cleans verified local artifacts and installs fresh without manifest cache          | better  | browser path          |
|  20 | Rapid source-style changes could expose stale UI        | Three rapid transitions end at epoch 9, `DEMO / READY`, correct frame, and clean console            | better  | recorded source       |
|  21 | Long decoded PCM could duplicate unbounded display data | Bounded min/max pyramid and compact signed display frame added; million-sample fixture passes       | better  | decode lifecycle      |
|  22 | Decode and playback own independent resources           | Recorded source owns context, element, URL, listeners, transport store, and stale cleanup           | better  | interaction           |
|  23 | Scrubbing needed one input contract across modalities   | Controlled player adds played layers and Arrow/Page/Home/End/Space plus pointer/touch range         | better  | recovery              |
|  24 | Corrupt media could leave the artifact blank            | Structured alert and replacement proven with real Chrome decode failure and recovery                | better  | rendered pressure     |
|  25 | Recorded transport added 48 px desktop scroll           | Fixed viewport shell and internal sizing restore zero document overflow                             | better  | microphone lifecycle  |
|  26 | Permission must never be an import or mount side effect | Inert owned microphone factory plus explicit Connect-driven session attachment added               | better  | live analysis         |
|  27 | Browser capture exposes more than ready/error           | Requesting/live/muted/silent/ended/denied/unavailable/error stores and recovery copy added          | better  | device loss           |
|  28 | Device end initially stopped animation but leaked graph | Terminal release now removes listeners and closes analyser, node, context, and owned tracks once    | better  | browser cycles        |
|  29 | Media hardware is not deterministic test infrastructure | Controllable Chrome mocks prove permission, mute/end, denial, two reconnect cycles, and exact counts | better  | rendered pressure     |
|  30 | Localized native file text overlapped the source panel  | Full-surface accessible input now uses stable custom Local audio / Choose file presentation         | better  | spectrum analysis     |

## Loop 10 verdict

`ask`

Material implementation risks are now sharp and actionable, but `to-prd` explicitly requires the user to confirm the highest public seams and behaviors before publication. The next move is one bounded approval, not more research or target mutation.

## Post-loop-10 resume

The user approved the public seams on 2026-07-16. Verdict: `continue`. The PRD is published and the next mandatory checkpoint is the `to-issues` review of granularity, blocking edges, split/merge choices, and AFK classification before tracker publication and durable-goal creation.

## Issue-publication checkpoint

The user approved the 23-ticket graph, dependency edges, slice boundaries, and AFK classification on 2026-07-16. All tickets were published with 001 ready and 002–023 blocked. The mission can now enter durable goal mode and execute the vertical frontier.

## Loop 15 verdict

`continue`

Ticket 001 is implemented, verified, and committed. Its package boundary, typed static frame, deterministic Canvas path, external consumer, Signal Workbench tracer, and browser proof are credible. The next highest-value bounded move is ticket 002: establish session/source ownership and stale-work lifecycle before recorded/live adapters multiply cleanup risk.

## Tracer pressure record

- Strongest observed defect: min/max bins rendered only as short vertical strokes, causing a dotted silhouette at 2048 samples in the 1025 px stage.
- User harm: the primary artifact looked less precise than the approved continuous signal direction.
- Root cause: extrema preserved density but had no cross-bin continuity path.
- Repair: retain vertical extrema and add one continuous midpoint path per channel.
- Closing proof: focused renderer/component tests, clean 1440×960 browser metrics/console, and inspected `desktop-final.png`.
- Unresolved severity: closed.

## Loop 20 verdict

`continue`

Ticket 002 is implemented, verified, and committed. The frontier now branches into recorded audio (003), microphone lifecycle (004), and spectrum analysis (005). Recorded audio is next because it exercises decode, transport, long-data peaks, and user-controlled seeking while reusing the now-proven epoch/ownership boundary.

## Session pressure record

- Strongest observed defect: the packed external consumer kept a same-version tarball installation and falsely reported missing new public exports.
- User harm: release proof could validate stale declarations instead of the current package.
- Root cause: Bun's fixture lock/install cache outlived the overwritten local tarball despite `--force`.
- Repair: a path-guarded cleanup removes only the fixture's `node_modules`, lock, and tarball, then installs the new tarball with `--no-cache`.
- Closing proof: the fresh pack includes session declarations; the fixture imports both session and convenience APIs; full verification passes.
- Unresolved severity: closed.

## Loop 25 verdict

`continue`

Ticket 003 is implemented, verified, and committed. Microphone lifecycle 004 is next because it extends the same ownership/epoch/state model to permission and device-loss behavior before spectrum analysis consumes live frames.

## Recorded-audio pressure record

- Strongest observed defect: adding the recorded transport increased the 1440×960 document height by 48 px.
- User harm: the stable desktop workbench contract regressed and controls/artifact could shift under playback.
- Root cause: the root grid had only `min-height`, allowing the recorded player's transport row to grow the document instead of fitting the artifact area.
- Repair: desktop uses a fixed `100dvh` shell with hidden root overflow; mobile explicitly returns to auto height and visible document flow.
- Closing proof: recorded WAV metrics show zero document overflow on desktop, zero horizontal overflow at 390 px, and clean console.
- Unresolved severity: closed.

## Loop 30 verdict

`continue`

Ticket 004 is implemented, verified, and committed. Spectrum analysis 005 is next because it establishes the frequency-domain DSP and capability metadata needed by later dynamics, renderers, and VFX slices.

## Microphone pressure record

- Strongest observed defect: the first device-ended path canceled animation but retained the analyser graph, audio context, listeners, and owned tracks until a later manual disconnect.
- User harm: device loss could leave capture resources alive and repeated failures could drift above the promised lifecycle baseline.
- Root cause: track state and source disposal were modeled separately without a shared idempotent resource-release primitive.
- Repair: device end and detach now share one best-effort, exactly-once release path; terminal frames cannot race back to ready. Browser mocks additionally count two full track/context cycles.
- Closing proof: five microphone unit tests, 44/44 full package tests, 6/6 Chrome E2E, fresh packed consumer, and inspected `desktop-final.png` with zero overflow/console errors.
- Unresolved severity: closed.

## Pressure record

Strongest current objection: the proposed package can become so broad that “super customizable” turns into a huge shallow config object and a playground parameter dump.  
Location/harm: public seam and inspector structure; consumers would face incompatible controls and users would lose the primary path.  
Source cause: combining waveform, spectrum, meter, VFX, source lifecycle, playback, and editor semantics without capability-scoped schemas.  
Required fix: discriminated mode/renderer capability contracts, conditional inspector groups, convenience interfaces for common paths, and the direct Play → adjust on signal → Copy code route.  
Closing proof: type-level invalid-combination tests, capability UI E2E, external-consumer fixture, and hidden-brief task read.  
Unresolved severity: P1 reduced to P2 after PRD acceptance; implementation evidence now controls closure.
