# 020 — Export standalone code for the selected renderer and state

Status: blocked

Type: AFK  
Blocked by: 011–019  
User stories: 85, 92–98, 105, 108–112

## Outcome

The Code panel reflects current supported state and produces adapter-specific standalone React examples containing only required package exports and helpers, with honest clipboard feedback and isolated compile/runtime proof.

## Work

1. Define one serializer from validated public config/source example to deterministic code output.
2. Include only the selected renderer/effect and required helpers; exclude playground internals and unrelated backends.
3. Remove project-local paths, undefined placeholders, remote demo assets, and hidden assumptions.
4. Add copy success, permission/failure, manual-selection fallback, and semantic announcements.
5. Compile and run generated samples in the isolated external-consumer fixture.

## Acceptance

- Generated code matches the current supported configuration after every relevant edit/reset/preset.
- Every supported renderer/effect example compiles outside the playground.
- Output has no project-local import or remote demo dependency.
- Unsupported state is explained before copy rather than silently omitted.
- Clipboard success/failure/recovery behavior is keyboard- and screen-reader-accessible.
