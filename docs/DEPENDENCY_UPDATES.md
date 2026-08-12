# Dependency updates

Updated 2026-08-12. The package is pnpm-native (`pnpm@11.20.0`) and uses
Node.js/browser runtime APIs; no Bun runtime remains in scripts or product code.

## Current direct dependencies

| Package                               |         Version | Important upgrade value                                                                                                                        | Changelog / migration                                                                                                                                 |
| ------------------------------------- | --------------: | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                  |          19.2.8 | Current React 19 patch line for the playground and library peer contract.                                                                      | [React changelog](https://github.com/facebook/react/blob/main/CHANGELOG.md)                                                                           |
| `playwright`                          |          1.62.1 | Direct CLI/runtime dependency keeps the test runner and imported `playwright/test` module on one physical package instance under pnpm/Node 26. | [Playwright releases](https://github.com/microsoft/playwright/releases)                                                                               |
| `vite`                                |           8.2.1 | Current Rolldown-based library/playground build.                                                                                               | [Vite releases](https://github.com/vitejs/vite/releases)                                                                                              |
| `@vitejs/plugin-react`                |           6.0.5 | Matches the Vite 8 React transform.                                                                                                            | [Plugin changelog](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/CHANGELOG.md)                                          |
| `tailwindcss`, `@tailwindcss/vite`    |           4.3.3 | Local CSS build stays deterministic and CDN-free.                                                                                              | [Tailwind changelog](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md), [upgrade guide](https://tailwindcss.com/docs/upgrade-guide) |
| `vitest`, `@vitest/coverage-istanbul` |          4.1.10 | Current test runner and coverage adapter for the 60-file suite.                                                                                | [Vitest releases](https://github.com/vitest-dev/vitest/releases)                                                                                      |
| `jsdom`                               |          30.0.1 | Current DOM test environment; the suite remains green after the major update.                                                                  | [jsdom releases](https://github.com/jsdom/jsdom/releases)                                                                                             |
| `@testing-library/jest-dom`           |           7.0.1 | Current DOM matcher package; setup import remains compatible.                                                                                  | [jest-dom releases](https://github.com/testing-library/jest-dom/releases)                                                                             |
| `oxlint`, `oxfmt`                     | 1.78.0 / 0.63.0 | Current static and formatting tools. Formatting ignores generated codemap/evidence via `.prettierignore`.                                      | [oxlint releases](https://github.com/oxc-project/oxc/releases)                                                                                        |
| `tsx`                                 |         4.23.12 | Node TypeScript runner for cleanup scripts.                                                                                                    | [tsx releases](https://github.com/privatenumber/tsx/releases)                                                                                         |

`pnpm update --latest` was run and `pnpm outdated` is now empty. The lockfile
allows only the required `esbuild` build script. The old Bun lockfile and Bun
commands were removed in the existing migration; the external consumer uses a
pnpm lockfile and pnpm install.

## Compatibility note

The E2E suite now imports `playwright/test` and declares `playwright` directly.
This avoids the duplicate module identity that Node 26 + pnpm can create when a
CLI loads the root `playwright` package while specs load a nested
`@playwright/test` package. It is a runtime correctness fix, not a downgrade.

## Validation

- Frozen install: pass.
- `pnpm outdated`: empty.
- `pnpm audit --audit-level high`: no known vulnerabilities.
- Typecheck, lint, format check, 60 Vitest files/262 tests, library/playground
  build, SSR import, external consumer typecheck, and 24 Chromium E2E tests pass.
