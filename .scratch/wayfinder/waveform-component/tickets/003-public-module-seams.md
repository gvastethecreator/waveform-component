# Public module seams

Type: research  
Status: resolved  
Blocked by: Control and license boundary

## Question

Where should interfaces live so the component is deep for common callers, extensible for advanced callers, testable at public seams, and not coupled to React rerenders at analysis frame rate?

## Answer

Select the headless-session design:

- source adapters own static peaks, decoded media, microphone, deterministic demo, and externally owned stream/node attachment;
- the analysis module publishes a typed frame containing signed waveform, envelope, ordered spectrum, meter/bands, and optional distributed energy;
- renderer adapters consume the same frame/config: Canvas 2D, SVG, DOM/CSS, WebGL2, and a custom renderer interface;
- a headless session owns state, cleanup, subscriptions, capability status, and configuration updates without pushing raw frames through React state;
- convenience React interfaces cover visual display, controlled scrubber, live input, and player composition;
- the playground owns presets, source pickers, overview/focus, diagnostics, and code export outside the package config.

Rejected: one smart component because source, playback, DSP, rendering, and interaction form an untestable product matrix. Retained as lower-level escape hatches: pure DSP/peak utilities and hooks for consumers that intentionally assemble their own session.

Evidence: public-seam comparison in `docs/research/2026-07-16-waveform-component-foundations.md`.
