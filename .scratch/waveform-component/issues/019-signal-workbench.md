# 019 — Finish the Signal Workbench overview, focus mode, and inspector

Status: blocked

Type: AFK  
Blocked by: 003–018  
User stories: 18–20, 49, 84–94, 99–101, 109–110

## Outcome

The selected artifact-dominant Signal Workbench makes the primary Play → adjust on signal → Copy code route obvious while exposing the full system through curated Overview and large Focus modes without becoming a parameter dump.

## Work

1. Implement source/transport strip, artifact stage, separate Visual Mode and Rendering Engine rows, conditional inspector, and capability explanations.
2. Add a curated Overview gallery and Focus mode backed by the same public package/session/config contracts.
3. Group and expand only controls relevant to the active source, data mode, geometry, renderer, and effect.
4. Implement deterministic reset/preset behavior and retain direct signal handles.
5. Match the selected direction, accepted blind-read repair, density, responsive ordering, and baseline product intent.

## Acceptance

- Desktop main content fits without document scrolling at the target viewport.
- Mobile places controls before the stage with bounded internal scroll and no horizontal overflow.
- Ultrawide grows the artifact without producing an unreadably wide inspector.
- Visual Mode and Rendering Engine cannot be mistaken for one selector.
- Every Overview card opens the corresponding real Focus state; no fake preview signal or dead control exists.
