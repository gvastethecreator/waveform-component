# 022 — Harden accessibility, responsive states, and recovery end to end

Status: blocked

Type: AFK  
Blocked by: 019–021  
User stories: 15, 48–49, 56–65, 70, 89–101, 104–110

## Outcome

The complete package and playground survive hostile states, keyboard-only use, reduced motion, zoom, high contrast, forced colors, narrow and ultrawide layouts, graphics/source failures, and stressed copy without hidden or bitmap-only feedback.

## Work

1. Exercise empty, loading, requesting, denied, ended, decode failure, unsupported renderer, context loss, copy failure, stale async, and cleanup states.
2. Complete focus order, visible focus, names/values/status messages, semantic alternatives, and full keyboard flows.
3. Verify reduced motion, zoom, high contrast, forced colors, 320/390/desktop/ultrawide layout, long labels, dense controls, and DPR2 details.
4. Capture comparable desktop/narrow screenshots and detail crops against the approved direction and baseline.
5. Commission a fresh blind review and adversarial autopsy; fix or explicitly disposition every P0/P1/P2 finding.

## Acceptance

- No user state is blank, silent, clipped, bitmap-only, or reachable only with a pointer.
- No target viewport has document-level horizontal overflow or unreachable controls.
- Reduced motion preserves state and removes nonessential motion/flashing.
- Fresh-review findings are linked to fixes or evidence-backed dispositions.
- Browser, component, accessibility, and visual evidence is stored with the project.
