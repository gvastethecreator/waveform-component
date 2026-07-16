# Playground direction

Type: task  
Status: resolved  
Blocked by: Public module seams

## Question

Which of three materially different playground structures best makes the waveform artifact dominant, supports the full control/state model, preserves `folders`' strongest interaction grammar, and remains viable at desktop and narrow viewports?

## Answer

Select **Signal Workbench**: a no-scroll desktop inspector workbench with a dominant signal stage, compact transport/scope header, overview/focus modes, preset strip, and 320 px right Controls/Code inspector. On narrow screens, controls remain first with bounded internal scroll and the stage follows structurally.

Signature: direct overlays make cutoff frequencies, thresholds, playhead, selection/loop region, and channel scope both measurement and control on the artifact they change.

Subtraction: no hero preamble, dashboard-card grid, random fake signal, patch cords, or ambient effects unrelated to the audio. The real signal stage owns the first viewport.

Independent blind read selected this direction and exposed one material mismatch: visual mode and rendering engine looked like a single selector, while the primary route competed with presets and panel controls. The accepted repair is two explicitly labeled rows plus a dominant Play → adjust on the signal → Copy code route.

The Matrix remains a bounded Overview mode only when it compares the same data/config across engines. The Patchbay is out of scope for the first release.

Candidate artifacts:

- `.scratch/design/waveform-component/direction-a-signal-workbench.png`
- `.scratch/design/waveform-component/direction-b-engine-matrix.png`
- `.scratch/design/waveform-component/direction-c-modulation-patchbay.png`

Intended comparison record: `.scratch/design/waveform-component/direction-cards.json`.

Blind read: `.scratch/design/waveform-component/blind-read.md`.
