# Maintenance changelog

## 2026-08-12

- Revisited the prior Bun → pnpm migration and upgraded all direct dependencies
  to current releases, including React, Vite, Tailwind, Vitest, jsdom,
  Testing Library matchers, OXC tools, Playwright, and tsx.
- Replaced the nested `@playwright/test` E2E import with direct `playwright/test`
  and added `playwright` as a direct dev dependency. This fixes the duplicate
  Playwright module identity observed under pnpm/Node 26 and restores the full
  24-test Chromium suite.
- Added `deps:check`, `audit`, and `verify` scripts and refreshed `.vscode/tasks.json`
  with concise emoji labels.
- Added `.prettierignore` so generated codemap and scratch/evidence artifacts do
  not fail source formatting checks; product source remains fully checked.
- Refreshed README and added dependency, quality, and maintenance docs with
  upstream changelog links.
- Preserved existing dirty work, design assets, `.scratch` evidence, and the
  prior codemap ownership boundary; regenerated the map after the final change.

## Follow-up

- Measure and implement lazy loading for optional VFX/playground code to reduce
  the initial bundle while preserving the public package contract.
- Repeat Chromium/WebGL2 evidence on representative non-Chromium GPU drivers
  before calling the package release-ready for every target environment.
