# Baseline inheritance

Type: research  
Status: resolved  
Blocked by: None

## Question

Which `folders` product, stack, structure, playground, and verification decisions should this greenfield project inherit, and which gaps must change because this is a distributable audio component rather than a private folder SPA?

## Answer

Inherit Bun 1.3.14, React 19.2, TypeScript 7 strict mode, Vite 8, Tailwind 4, Tabler icons, oxlint/oxfmt, Vitest/Testing Library, Playwright, deterministic fixtures, and static Pages-compatible deployment configuration.

Inherit the deeper pattern: one typed config/default/reducer contract; capability/preset/palette catalogs; shared data/geometry independent of adapters; overview/focus modes; a compact right Controls/Code inspector; conditional controls; deterministic reset; selected-adapter standalone export; reduced motion; responsive structural reorder; unit/component/E2E evidence.

Do not inherit the private-SPA limitation or domain-specific animation dependencies. Add a library build, public exports/types/styles contract, external-consumer smoke test, audio lifecycle/error states, and real renderer/source adapters.

Evidence: `docs/research/2026-07-16-waveform-component-foundations.md` and `.scratch/evidence/baseline-folders/`.
