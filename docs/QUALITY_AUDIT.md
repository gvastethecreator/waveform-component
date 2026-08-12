# Quality audit

Updated 2026-08-12.

## Passed gates

- Package manager/runtime contract is explicit: pnpm 11.20.0 + Node.js 22+;
  no Bun executable, script, or lockfile remains.
- `pnpm install --frozen-lockfile` succeeds and esbuild build approval is
  explicit in `pnpm-workspace.yaml`.
- `pnpm outdated` is empty and the high-severity audit reports no known issues.
- TypeScript, oxlint, and oxfmt pass. Generated maps and scratch evidence are
  excluded from formatting through `.prettierignore`, while remaining source is
  still checked.
- Vitest: 60 files, 262 tests passed.
- Production library and playground builds pass; SSR import and fresh external
  consumer tarball typecheck pass.
- Chromium E2E: 24/24 pass, covering Canvas/SVG/DOM, responsive/forced-colors/
  reduced-motion behavior, recorded audio, microphone recovery, and all eleven
  WebGL2 VFX families including context loss and cleanup.
- Codemap is regenerated and validated; stale state and unknown edges are
  documented with the final map.

## Residuals

- Vite reports a large playground chunk (~560 kB minified). The next measured
  performance slice is lazy-loading optional VFX controls/renderers without
  changing the public package entry point.
- Browser proof uses installed Chromium. WebGL2 behavior is covered in that
  environment; other GPU/driver combinations remain compatibility testing.
- Audio input, microphone permissions, and media playback are user-action and
  device dependent. The tests cover recoverable states, not every OS driver.
- Scratch evidence and design references are intentionally retained as durable
  project history; no dead source was removed without a proven ownership seam.
