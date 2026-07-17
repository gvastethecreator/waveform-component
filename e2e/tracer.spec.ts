import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";

test("renders and controls the public Canvas waveform path", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Signal Workbench" })).toBeVisible();
  await expect(page.getByRole("img", { name: /deterministic waveform preview/ })).toBeVisible();
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");
  await expect(page.getByText("owned")).toBeVisible();
  await expect(page.getByRole("button", { name: "Waveform" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("combobox", { name: /Rendering engine/ })).toHaveValue("canvas2d");

  const amplitude = page.getByRole("slider", { name: /Amplitude/ });
  await amplitude.fill("1.2");
  await expect(page.getByText("1.20×")).toBeVisible();

  await page.getByRole("button", { name: /^Transient preset thumbnail\./ }).click();
  await expect(page.getByRole("heading", { name: "Transient waveform" })).toBeVisible();

  await page.getByRole("button", { name: "Focus" }).click();
  await expect(page.getByRole("button", { name: "Focus" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Signal studies" })).toBeHidden();
});

test("preserves stereo identity across layouts, envelope placement, and orientation", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });

  const stage = page.locator(".signal-stage");
  const waveform = page.getByRole("img", {
    name: /Broadcast deterministic waveform preview/,
  });
  await expect(waveform).toHaveAttribute("data-time-domain-mode", "waveform");
  await expect(page.getByText("2 CH · STACKED")).toBeVisible();
  const stacked = await stage.screenshot();

  await page.getByRole("combobox", { name: /Channel layout/ }).selectOption("overlay");
  await expect(page.getByText("2 CH · OVERLAY")).toBeVisible();
  await expect(page.getByRole("slider", { name: "Channel spacing" })).toBeDisabled();
  const overlay = await stage.screenshot();
  expect(stacked.equals(overlay)).toBe(false);

  await page.getByRole("combobox", { name: /Channel mode/ }).selectOption("mono");
  await expect(page.getByText("1 CH · STACKED")).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: /Channel layout/ }).locator('option[value="overlay"]'),
  ).toHaveAttribute("disabled", "");
  await page.getByRole("combobox", { name: /Channel mode/ }).selectOption("stereo");
  await page.getByRole("combobox", { name: /Channel layout/ }).selectOption("split");

  await page.getByRole("button", { name: "Envelope" }).click();
  const envelope = page.getByRole("img", {
    name: /Broadcast magnitude envelope preview/,
  });
  await expect(envelope).toHaveAttribute("data-time-domain-mode", "envelope");
  await page.getByRole("combobox", { name: /Amplitude placement/ }).selectOption("mirrored");
  await page.getByRole("combobox", { name: /Orientation/ }).selectOption("vertical");
  await page.getByRole("combobox", { name: /Sizing/ }).selectOption("fixed");
  await page.getByRole("slider", { name: "Component width" }).fill("480");
  await expect(page.getByText(/CANVAS 2D · VERTICAL · FIXED/)).toBeVisible();
  await expect(envelope).not.toHaveAttribute("data-render-error");
  const verticalEnvelope = await stage.screenshot();
  expect(overlay.equals(verticalEnvelope)).toBe(false);

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
});

test("keeps the narrow workbench reachable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("complementary", { name: "Waveform controls" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("operates seek, regions, markers, and direct handles through semantic overlays", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  const evidence = process.env.CAPTURE_OVERLAY_EVIDENCE
    ? ".scratch/evidence/010-accessible-overlays"
    : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });

  const overlay = page.getByRole("group", {
    name: "waveform semantic interaction overlay",
  });
  const seek = page.getByRole("slider", {
    name: "Seek deterministic signal",
    exact: true,
  });
  const playheadInspector = page.getByRole("slider", {
    name: "Overlay playhead",
    exact: true,
  });
  await expect(overlay).toHaveAttribute("data-overlay-orientation", "horizontal");
  await expect(seek).toHaveAttribute("aria-valuenow", "0.32");

  await seek.focus();
  await seek.press("ArrowRight");
  await expect(seek).toHaveAttribute("aria-valuenow", "0.33");
  await expect(playheadInspector).toHaveValue("0.33");
  await expect(page.getByText("Seek committed at 33%")).toBeVisible();

  const loopRegion = page.getByRole("button", {
    name: "Playback loop region",
    exact: true,
  });
  await loopRegion.click();
  await expect(loopRegion).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Transient marker", exact: true }).click();
  await expect(page.getByText("Transient marker activated", { exact: true })).toBeVisible();

  const loopCue = page.getByRole("button", {
    name: "Loop cue marker",
    exact: true,
  });
  const loopStart = page.getByRole("slider", {
    name: "Loop start handle",
    exact: true,
  });
  expect(await loopCue.getAttribute("data-overlay-lane")).not.toBe(
    await loopStart.getAttribute("data-overlay-lane"),
  );
  await loopStart.focus();
  await expect(loopStart).toBeFocused();
  expect(await loopStart.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe(
    "solid",
  );
  if (evidence)
    await page.locator(".signal-stage").screenshot({ path: `${evidence}/desktop-time-focus.png` });

  const stage = page.locator(".signal-stage");
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) return;
  const y = bounds.y + bounds.height * 0.82;
  await page.mouse.move(bounds.x + bounds.width * 0.9, y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.1, y, { steps: 4 });
  await page.mouse.up();
  const pointerValue = Number(await seek.getAttribute("aria-valuenow"));
  expect(pointerValue).toBeGreaterThanOrEqual(0.08);
  expect(pointerValue).toBeLessThanOrEqual(0.12);
  await expect(page.locator('[data-overlay-part="hover"]')).toHaveText(/TIME (?:9\.\d|10)%/);

  await page.getByRole("combobox", { name: /Overlay direction/ }).selectOption("rtl");
  await seek.focus();
  const beforeRtl = Number(await seek.getAttribute("aria-valuenow"));
  await seek.press("ArrowRight");
  await expect(seek).toHaveAttribute("aria-valuenow", (beforeRtl - 0.01).toFixed(2));

  await page.getByRole("button", { name: "Spectrum" }).click();
  const lowCutoffHandle = page.getByRole("slider", {
    name: "Low cutoff handle",
    exact: true,
  });
  await lowCutoffHandle.focus();
  await lowCutoffHandle.press("ArrowRight");
  await expect(lowCutoffHandle).toHaveAttribute("aria-valuenow", "30");
  await expect(page.getByRole("slider", { name: "Low cutoff", exact: true })).toHaveValue("30");
  const spectrumOverlayDirection = await page
    .getByRole("group", { name: "spectrum semantic interaction overlay" })
    .getAttribute("data-overlay-direction");
  expect(spectrumOverlayDirection).toBe("ltr");
  if (evidence)
    await page
      .locator(".signal-stage")
      .screenshot({ path: `${evidence}/rtl-spectrum-handles.png` });

  await page.getByRole("combobox", { name: /^Layout/ }).selectOption("radial");
  await expect(
    page.getByRole("group", { name: "spectrum semantic interaction overlay" }),
  ).toHaveCount(0);
  await expect(page.getByText("Unavailable · radial")).toBeVisible();
  const radialOverlayCount = await page
    .getByRole("group", { name: "spectrum semantic interaction overlay" })
    .count();

  await page.getByRole("button", { name: "Meter", exact: true }).click();
  const reactHandle = page.getByRole("slider", {
    name: "React threshold handle",
    exact: true,
  });
  await expect(reactHandle).toHaveAttribute("aria-orientation", "horizontal");
  const meterHorizontalPosition = Number(await reactHandle.getAttribute("data-overlay-position"));
  await page.getByRole("combobox", { name: /Meter orientation/ }).selectOption("vertical");
  await expect(reactHandle).toHaveAttribute("aria-orientation", "vertical");
  const meterVerticalPosition = Number(await reactHandle.getAttribute("data-overlay-position"));
  expect(meterVerticalPosition).toBeCloseTo(1 - meterHorizontalPosition, 8);
  const reactBefore = Number(await reactHandle.getAttribute("aria-valuenow"));
  await reactHandle.focus();
  await reactHandle.press("ArrowUp");
  await expect(reactHandle).toHaveAttribute("aria-valuenow", String(reactBefore + 1));
  await expect(page.getByRole("slider", { name: "React level", exact: true })).toHaveValue(
    String(reactBefore + 1),
  );
  expect(Number(await reactHandle.getAttribute("data-overlay-position"))).toBeLessThan(
    meterVerticalPosition,
  );
  if (evidence)
    await page
      .locator(".signal-stage")
      .screenshot({ path: `${evidence}/vertical-meter-handles.png` });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(browserErrors).toEqual([]);
  if (evidence)
    await writeFile(
      `${evidence}/browser-report.json`,
      `${JSON.stringify(
        {
          consoleErrors: browserErrors,
          horizontalOverflow: overflow,
          pointerSeekValue: pointerValue,
          radialOverlayCount,
          rtl: await page.getByRole("combobox", { name: /Overlay direction/ }).inputValue(),
          spectrumOverlayDirection,
        },
        null,
        2,
      )}\n`,
    );
});

test("keeps vertical overlays focused and bounded under forced colors and reduced motion", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  const evidence = process.env.CAPTURE_OVERLAY_EVIDENCE
    ? ".scratch/evidence/010-accessible-overlays"
    : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: /Overlay direction/ }).selectOption("rtl");
  await page.getByRole("combobox", { name: /Orientation/ }).selectOption("vertical");

  const overlay = page.getByRole("group", {
    name: "waveform semantic interaction overlay",
  });
  const seek = page.getByRole("slider", {
    name: "Seek deterministic signal",
    exact: true,
  });
  await expect(overlay).toHaveAttribute("data-overlay-direction", "rtl");
  await expect(overlay).toHaveAttribute("data-overlay-orientation", "vertical");
  await expect(seek).toHaveAttribute("aria-orientation", "vertical");
  await seek.focus();
  await seek.press("ArrowDown");
  await expect(seek).toHaveAttribute("aria-valuenow", "0.33");
  expect(await seek.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  if (evidence)
    await page.locator(".signal-stage").screenshot({
      path: `${evidence}/narrow-vertical-forced-colors.png`,
    });

  const devtools = await page.context().newCDPSession(page);
  await devtools.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  await expect(seek).toBeVisible();
  await expect(seek).toBeFocused();
  const pageScale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
  expect(pageScale).toBe(2);
  const zoomOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(zoomOverflow).toBeLessThanOrEqual(0);
  expect(browserErrors).toEqual([]);
  if (evidence) {
    await page.locator(".signal-stage").screenshot({
      path: `${evidence}/zoom-200-vertical-forced-colors.png`,
    });
    await writeFile(
      `${evidence}/forced-colors-report.json`,
      `${JSON.stringify(
        {
          consoleErrors: browserErrors,
          forcedColors: await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
          horizontalOverflow: overflow,
          orientation: await overlay.getAttribute("data-overlay-orientation"),
          reducedMotion: await page.evaluate(
            () => matchMedia("(prefers-reduced-motion: reduce)").matches,
          ),
          seekOutlineStyle: await seek.evaluate(
            (element) => getComputedStyle(element).outlineStyle,
          ),
          pageScale,
          zoomHorizontalOverflow: zoomOverflow,
        },
        null,
        2,
      )}\n`,
    );
  }
});

test("loads, plays, and keyboard-scrubs a local WAV without upload", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Load local audio").setInputFiles({
    name: "local-tone.wav",
    mimeType: "audio/wav",
    buffer: createWavFixture(),
  });

  await expect(page.getByLabel("Signal status")).toContainText("RECORDED-AUDIO / READY");
  await expect(
    page.getByText("Decoded and played locally. The file never leaves this browser."),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "local-tone.wav player" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Spectrum" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Meter", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Stepped meter" })).toBeDisabled();
  await expect(page.getByText(/bounded peaks, not raw PCM/)).toBeVisible();

  const seek = page.getByRole("slider", { name: "Seek local-tone.wav" });
  await seek.focus();
  await seek.press("End");
  await expect(seek).toHaveValue("1");
  await seek.press("Home");
  await expect(seek).toHaveValue("0");
  await seek.press("ArrowRight");
  await expect(seek).toHaveValue("1");
  await seek.press("Space");
  await expect(page.getByRole("button", { name: "Pause local-tone.wav" })).toBeVisible();
});

test("explains a corrupt local file and recovers with a replacement", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const input = page.getByLabel("Load local audio");
  await input.setInputFiles({
    name: "corrupt-audio.wav",
    mimeType: "audio/wav",
    buffer: Buffer.from("not a wave file"),
  });

  await expect(page.getByLabel("Signal status")).toContainText("RECORDED-AUDIO / ERROR");
  await expect(page.getByRole("alert")).toContainText("Try another local audio file");

  await input.setInputFiles({
    name: "replacement.wav",
    mimeType: "audio/wav",
    buffer: createWavFixture(),
  });
  await expect(page.getByLabel("Signal status")).toContainText("RECORDED-AUDIO / READY");
  await expect(page.getByRole("region", { name: "replacement.wav player" })).toBeVisible();
});

test("switches Canvas and SVG through one frame/config/session contract", async ({ page }) => {
  test.setTimeout(120_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  await installRendererObserverProbe(page);

  const evidence = process.env.CAPTURE_SVG_EVIDENCE ? ".scratch/evidence/011-svg-renderer" : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");

  const stage = page.locator(".signal-stage");
  const engine = page.getByRole("combobox", { name: /Rendering engine/ });
  const observerBaseline = await rendererObserverStat(page, "active");
  expect(observerBaseline).toBeGreaterThan(0);
  const epoch = await page.getByText(/Epoch \d+/).textContent();
  await page.getByRole("slider", { name: "Overlay playhead", exact: true }).fill("0.63");
  const canvasWaveform = await stage.screenshot();
  if (evidence) await stage.screenshot({ path: `${evidence}/canvas-waveform.png` });

  await engine.selectOption("svg");
  await expect(stage).toHaveAttribute("data-renderer", "svg");
  const svgWaveform = page.getByRole("img", {
    name: /Broadcast deterministic waveform preview.*2 source channels/,
  });
  await expect(svgWaveform).toHaveAttribute("data-renderer", "svg");
  await expect(svgWaveform).toHaveAttribute("data-svg-render-status", "ready");
  await expect(page.getByRole("slider", { name: "Playhead handle" })).toHaveAttribute(
    "aria-valuenow",
    "0.63",
  );
  await expect(page.getByText(epoch ?? "Epoch 1")).toBeVisible();
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  const vectorWaveform = await stage.screenshot();
  expect(canvasWaveform.equals(vectorWaveform)).toBe(false);
  if (evidence) await stage.screenshot({ path: `${evidence}/svg-waveform.png` });

  await page.getByRole("button", { name: "Spectrum" }).click();
  await page.getByRole("combobox", { name: /^Layout/ }).selectOption("radial");
  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("gradient");
  const svgSpectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  await expect(svgSpectrum).toHaveAttribute("data-svg-render-status", "ready");
  await expect(page.getByText(/SVG samples spectrum geometry to 512 points/)).toBeVisible();
  const firstGradientId = await svgSpectrum.locator("radialGradient").getAttribute("id");
  expect(firstGradientId).toBeTruthy();
  await page.getByRole("slider", { name: "Rotation" }).fill("315");
  await expect(svgSpectrum.locator("radialGradient")).toHaveAttribute("id", firstGradientId ?? "");
  const svgIntegrity = await svgSpectrum.evaluate((svg) => {
    const ids = [...svg.querySelectorAll("[id]")].map((node) => node.id);
    const references = [...svg.querySelectorAll("[fill^='url'], [stroke^='url']")]
      .flatMap((node) => [node.getAttribute("fill"), node.getAttribute("stroke")])
      .filter((value): value is string => Boolean(value?.startsWith("url(#")))
      .map((value) => value.slice(5, -1));
    return {
      ids,
      nodeCount: Number(svg.getAttribute("data-svg-node-count")),
      references,
    };
  });
  expect(new Set(svgIntegrity.ids).size).toBe(svgIntegrity.ids.length);
  expect(svgIntegrity.references.every((reference) => svgIntegrity.ids.includes(reference))).toBe(
    true,
  );
  expect(svgIntegrity.nodeCount).toBeLessThanOrEqual(4096);
  if (evidence) await stage.screenshot({ path: `${evidence}/svg-spectrum-radial.png` });

  await page.getByRole("button", { name: "Stepped meter" }).click();
  await page.getByRole("combobox", { name: /Meter layout/ }).selectOption("radial");
  const svgMeter = page.getByRole("img", {
    name: /stepped-meter preview.*RMS display/i,
  });
  await expect(svgMeter).toHaveAttribute("data-svg-render-status", "ready");
  expect(Number(await svgMeter.getAttribute("data-svg-node-count"))).toBeLessThanOrEqual(4096);
  if (evidence) await stage.screenshot({ path: `${evidence}/svg-meter-radial.png` });

  await engine.selectOption("canvas2d");
  await expect(
    page.getByRole("img", { name: /stepped-meter preview.*RMS display/i }),
  ).toHaveJSProperty("tagName", "CANVAS");
  await expect(page.getByText(epoch ?? "Epoch 1")).toBeVisible();
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);

  await page.getByLabel("Load local audio").setInputFiles({
    buffer: createWavFixture(),
    mimeType: "audio/wav",
    name: "renderer-state.wav",
  });
  await expect(page.getByLabel("Signal status")).toContainText("RECORDED-AUDIO / READY");
  const seek = page.getByRole("slider", { name: "Seek renderer-state.wav" });
  await seek.fill("0.4");
  await expect(seek).toHaveValue("0.4");
  await engine.selectOption("svg");
  await expect(page.getByRole("region", { name: "renderer-state.wav player" })).toBeVisible();
  await expect(seek).toHaveValue("0.4");
  await expect(
    page.getByRole("img", {
      name: /renderer-state.wav local waveform preview/,
    }),
  ).toHaveAttribute("data-renderer", "svg");
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  expect(browserErrors).toEqual([]);

  if (evidence) {
    await stage.screenshot({ path: `${evidence}/svg-recorded-state.png` });
    await writeFile(
      `${evidence}/browser-report.json`,
      `${JSON.stringify(
        {
          browserErrors,
          observerBaseline,
          observerStats: await page.evaluate(() => Reflect.get(window, "__rendererObserverStats")),
          svgIntegrity,
        },
        null,
        2,
      )}\n`,
    );
  }
});

test("keeps SVG responsive, theme-aware, reduced-motion static, and forced-color legible", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  const evidence = process.env.CAPTURE_SVG_EVIDENCE ? ".scratch/evidence/011-svg-renderer" : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");
  await page.getByRole("combobox", { name: /Rendering engine/ }).selectOption("svg");

  const stage = page.locator(".signal-stage");
  const waveform = page.getByRole("img", {
    name: /Broadcast deterministic waveform preview/,
  });
  await expect(waveform).toHaveAttribute("data-svg-render-status", "ready");
  const seek = page.getByRole("slider", {
    name: "Seek deterministic signal",
    exact: true,
  });
  await seek.focus();
  await seek.press("ArrowRight");
  await expect(seek).toHaveAttribute("aria-valuenow", "0.33");

  await page.getByRole("button", { name: "Spectrum" }).click();
  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("gradient");
  const spectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  const firstViewBox = await spectrum.getAttribute("viewBox");
  const themedBefore = await stage.screenshot();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--waveform-color-base", "#ff2f92");
    document.documentElement.style.setProperty("--waveform-color-crest", "#35ff79");
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const themedAfter = await stage.screenshot();
  expect(themedBefore.equals(themedAfter)).toBe(false);
  if (evidence) await stage.screenshot({ path: `${evidence}/svg-narrow-theme.png` });

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await expect
    .poll(() =>
      spectrum.evaluate((svg) =>
        [...svg.querySelectorAll("rect")].some((node) => node.getAttribute("fill") === "Canvas"),
      ),
    )
    .toBe(true);
  expect(
    await spectrum.evaluate(
      (svg) => svg.querySelectorAll("animate, animateMotion, animateTransform").length,
    ),
  ).toBe(0);
  await page.setViewportSize({ width: 320, height: 780 });
  await expect.poll(() => spectrum.getAttribute("viewBox")).not.toBe(firstViewBox);
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/svg-narrow-forced-colors.png`,
    });
  expect(browserErrors).toEqual([]);
});

test("drives Pulse Ring controls and recovers WebGL2 resources after real context loss", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  await installRendererObserverProbe(page);
  await installWebglResourceProbe(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const evidence = process.env.CAPTURE_WEBGL_EVIDENCE
    ? ".scratch/evidence/013-webgl-pulse-ring"
    : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");

  const stage = page.locator(".signal-stage");
  const engine = page.getByRole("combobox", { name: /Rendering engine/ });
  const observerBaseline = await rendererObserverStat(page, "active");
  const rafBaseline = await webglProbeStat(page, "activeRafs");
  const epoch = await page.getByText(/Epoch \d+/).textContent();

  await engine.selectOption("webgl2");
  await expect(stage).toHaveAttribute("data-renderer", "webgl2");
  await expect(
    page.getByText("Canvas 2D fallback · WebGL2 is scoped to clean-room VFX modes"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Waveform" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Pulse Ring" })).toBeEnabled();
  await expect(page.getByText(epoch ?? "Epoch 1")).toBeVisible();

  await page.getByRole("button", { name: "Pulse Ring" }).click();
  const pulseRing = page.locator('.primary-waveform[data-renderer="webgl2"]');
  const canvas = pulseRing.locator('canvas[data-webgl-canvas="pulse-ring"]');
  await expect(pulseRing).toHaveAttribute("data-webgl-state", "ready");
  await expect(pulseRing).toHaveAttribute("data-webgl-generation", "1");
  await expect(pulseRing).toHaveAttribute("data-webgl-resources", "1/1/1");
  await expect(pulseRing).toHaveAttribute("data-webgl-animation", "static");
  await expect(pulseRing).toHaveAttribute("data-pulse-ring-state", "ready");
  await expect(canvas).toHaveCSS("opacity", "1");
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(1);
  await expect.poll(() => webglProbeStat(page, "activeTextures")).toBe(0);
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  expect(await webglProbeStat(page, "activeRafs")).toBe(rafBaseline);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/webgl2-pulse-ring-static.png`,
    });

  const assertControlChangesPixels = async (name: string, action: () => Promise<void>) => {
    const before = await stage.screenshot();
    const drawCalls = Number(await canvas.getAttribute("data-webgl-draw-calls"));
    await action();
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-webgl-draw-calls")))
      .toBeGreaterThan(drawCalls);
    const after = await stage.screenshot();
    expect(after.equals(before), `${name} must change the rendered Pulse Ring`).toBe(false);
  };

  await assertControlChangesPixels("Ring thickness", () =>
    page.getByRole("slider", { name: "Ring thickness" }).fill("0.11"),
  );
  await assertControlChangesPixels("Glow strength", () =>
    page.getByRole("slider", { name: "Glow strength" }).fill("1.65"),
  );
  await assertControlChangesPixels("Rotation speed", () =>
    page.getByRole("slider", { name: "Rotation speed" }).fill("-0.72"),
  );
  await assertControlChangesPixels("Band reactivity", () =>
    page.getByRole("slider", { name: "Band reactivity" }).fill("1.8"),
  );
  for (const [name, value] of [
    ["Primary color", "#ff214f"],
    ["Secondary color", "#24ffa8"],
    ["Tertiary color", "#8e6cff"],
    ["Sweep flash color", "#ffffff"],
  ] as const)
    await assertControlChangesPixels(name, () =>
      page.getByLabel(name, { exact: true }).fill(value),
    );

  const balancedWidth = Number(await pulseRing.getAttribute("data-webgl-buffer-width"));
  await page.getByRole("combobox", { name: /GPU quality/ }).selectOption("low");
  await expect
    .poll(async () => Number(await pulseRing.getAttribute("data-webgl-buffer-width")))
    .toBeLessThan(balancedWidth);
  const lowWidth = Number(await pulseRing.getAttribute("data-webgl-buffer-width"));
  await page.getByRole("combobox", { name: /GPU quality/ }).selectOption("high");
  await expect
    .poll(async () => Number(await pulseRing.getAttribute("data-webgl-buffer-width")))
    .toBeGreaterThan(lowWidth);
  if (evidence) await stage.screenshot({ path: `${evidence}/webgl2-controls.png` });

  const lossExtensionAvailable = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext("webgl2");
    const extension = context?.getExtension("WEBGL_lose_context") ?? null;
    if (extension) {
      Reflect.set(window, "__pulseRingLossExtension", extension);
      extension.loseContext();
    }
    return Boolean(extension);
  });
  expect(lossExtensionAvailable).toBe(true);
  await expect(pulseRing).toHaveAttribute("data-webgl-state", "context-lost");
  await expect(pulseRing).toHaveAttribute("data-webgl-resources", "0/0/0");
  await expect(pulseRing.locator('[data-webgl-fallback="context-lost"]')).toBeVisible();
  await expect(pulseRing.getByRole("status")).toContainText("WEBGL2_CONTEXT_LOST");
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(0);
  if (evidence) await stage.screenshot({ path: `${evidence}/webgl2-context-lost.png` });

  await page.evaluate(() => Reflect.get(window, "__pulseRingLossExtension").restoreContext());
  await expect(pulseRing).toHaveAttribute("data-webgl-state", "ready");
  await expect(pulseRing).toHaveAttribute("data-webgl-generation", "2");
  await expect(pulseRing).toHaveAttribute("data-webgl-resources", "1/1/1");
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(1);
  if (evidence) await stage.screenshot({ path: `${evidence}/webgl2-recovered.png` });

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(pulseRing).toHaveAttribute("data-webgl-animation", "running");
  await expect.poll(() => webglProbeStat(page, "activeRafs")).toBeGreaterThan(rafBaseline);
  await engine.selectOption("canvas2d");
  await expect(pulseRing).toHaveCount(0);
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeBuffers")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeVertexArrays")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeTextures")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeRafs")).toBe(rafBaseline);
  await page.getByRole("button", { name: "Waveform" }).click();
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  await expect(page.getByText(epoch ?? "Epoch 1")).toBeVisible();

  const invalidConfig = await page.evaluate(async () => {
    const modulePath = "/src/vfx/pulseRing.ts";
    const api = (await import(/* @vite-ignore */ modulePath)) as {
      resolvePulseRingConfig(input: Record<string, unknown>): {
        bandReactivity: number;
        glowStrength: number;
        quality: string;
        rotationSpeed: number;
        thickness: number;
      };
    };
    return api.resolvePulseRingConfig({
      bandReactivity: Number.POSITIVE_INFINITY,
      glowStrength: -20,
      quality: "unbounded",
      rotationSpeed: 99,
      thickness: Number.NaN,
    });
  });
  expect(invalidConfig).toMatchObject({
    bandReactivity: 1,
    glowStrength: 0,
    quality: "balanced",
    rotationSpeed: 1,
    thickness: 0.055,
  });

  await page.getByLabel("Load local audio").setInputFiles({
    buffer: createWavFixture(),
    mimeType: "audio/wav",
    name: "webgl2-recorded-state.wav",
  });
  const recordedSeek = page.getByRole("slider", {
    name: "Seek webgl2-recorded-state.wav",
  });
  await expect(recordedSeek).toBeVisible();
  await recordedSeek.fill("0.4");
  await engine.selectOption("webgl2");
  await expect(
    page.getByRole("region", { name: "webgl2-recorded-state.wav player" }),
  ).toBeVisible();
  await expect(recordedSeek).toHaveValue("0.4");
  await expect(
    page.getByRole("img", {
      name: /webgl2-recorded-state.wav local waveform preview/,
    }),
  ).toHaveJSProperty("tagName", "CANVAS");
  await expect(
    page.getByText("Canvas 2D fallback · WebGL2 is scoped to clean-room VFX modes"),
  ).toBeVisible();
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/webgl2-recorded-canvas-fallback.png`,
    });
  expect(browserErrors).toEqual([]);

  if (evidence)
    await writeFile(
      `${evidence}/browser-report.json`,
      `${JSON.stringify(
        {
          browserErrors,
          observerBaseline,
          observerStats: await page.evaluate(() => Reflect.get(window, "__rendererObserverStats")),
          resourceStats: await page.evaluate(() => Reflect.get(window, "__webglResourceStats")),
        },
        null,
        2,
      )}\n`,
    );
});

test("keeps Pulse Ring bounded and static in a narrow reduced-motion viewport", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: /Rendering engine/ }).selectOption("webgl2");
  await page.getByRole("button", { name: "Pulse Ring" }).click();

  const pulseRing = page.locator('.primary-waveform[data-renderer="webgl2"]');
  const canvas = pulseRing.locator('canvas[data-webgl-canvas="pulse-ring"]');
  await expect(pulseRing).toHaveAttribute("data-webgl-state", "ready");
  await expect(pulseRing).toHaveAttribute("data-webgl-animation", "static");
  const drawCalls = Number(await canvas.getAttribute("data-webgl-draw-calls"));
  await page.waitForTimeout(250);
  expect(Number(await canvas.getAttribute("data-webgl-draw-calls"))).toBe(drawCalls);
  const buffer = await pulseRing.evaluate((node) => ({
    height: Number(node.getAttribute("data-webgl-buffer-height")),
    width: Number(node.getAttribute("data-webgl-buffer-width")),
  }));
  expect(buffer.height).toBeLessThanOrEqual(4096);
  expect(buffer.width).toBeLessThanOrEqual(4096);
  expect(buffer.height * buffer.width).toBeLessThanOrEqual(4_194_304);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(browserErrors).toEqual([]);

  if (process.env.CAPTURE_WEBGL_EVIDENCE) {
    const evidence = ".scratch/evidence/013-webgl-pulse-ring";
    await mkdir(evidence, { recursive: true });
    await page.locator(".signal-stage").screenshot({
      path: `${evidence}/webgl2-narrow-forced-colors.png`,
    });
  }
});

test("shows a visible Pulse Ring fallback when WebGL2 is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value(this: HTMLCanvasElement, type: string, ...attributes: unknown[]) {
        if (type === "webgl2") return null;
        return Reflect.apply(nativeGetContext, this, [type, ...attributes]);
      },
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: /Rendering engine/ }).selectOption("webgl2");
  await page.getByRole("button", { name: "Pulse Ring" }).click();

  const pulseRing = page.locator('.primary-waveform[data-renderer="webgl2"]');
  await expect(pulseRing).toHaveAttribute("data-webgl-state", "unavailable");
  await expect(pulseRing.locator('[data-webgl-fallback="unavailable"]')).toBeVisible();
  await expect(pulseRing.getByRole("status")).toContainText("WEBGL2_UNAVAILABLE");
  await expect(pulseRing).toHaveAttribute("data-webgl-resources", "0/0/0");

  if (process.env.CAPTURE_WEBGL_EVIDENCE) {
    const evidence = ".scratch/evidence/013-webgl-pulse-ring";
    await mkdir(evidence, { recursive: true });
    await page.locator(".signal-stage").screenshot({ path: `${evidence}/webgl2-unavailable.png` });
  }
});

test("proves Neon Lines and Equalizer Grid controls, presets, lifecycle, and GPU bounds", async ({
  page,
}) => {
  test.setTimeout(240_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  await installRendererObserverProbe(page);
  await installWebglResourceProbe(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 2,
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });

  const evidence = process.env.CAPTURE_WEBGL_EVIDENCE
    ? ".scratch/evidence/014-neon-grid-vfx"
    : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");

  const stage = page.locator(".signal-stage");
  const engine = page.getByRole("combobox", { name: /Rendering engine/ });
  const observerBaseline = await rendererObserverStat(page, "active");
  const rafBaseline = await webglProbeStat(page, "activeRafs");
  await engine.selectOption("webgl2");
  await page.getByRole("button", { name: "Neon Lines" }).click();

  const neon = page.locator('.primary-waveform[data-vfx-mode="neon-lines"]');
  const neonCanvas = neon.locator('canvas[data-webgl-canvas="neon-lines"]');
  await expect(neon).toHaveAttribute("data-webgl-state", "ready");
  await expect(neon).toHaveAttribute("data-webgl-resources", "1/1/1");
  await expect(neon).toHaveAttribute("data-webgl-animation", "static");
  await expect(neon).toHaveAttribute("data-neon-lines-state", "ready");
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(1);
  await expect.poll(() => webglProbeStat(page, "activeTextures")).toBe(0);
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  expect(await webglProbeStat(page, "activeRafs")).toBe(rafBaseline);
  if (evidence) await stage.screenshot({ path: `${evidence}/neon-lines-default.png` });

  const assertPixelsChange = async (
    surfaceName: string,
    canvas: typeof neonCanvas,
    controlName: string,
    action: () => Promise<void>,
  ) => {
    const before = await stage.screenshot();
    const drawCalls = Number(await canvas.getAttribute("data-webgl-draw-calls"));
    await action();
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-webgl-draw-calls")))
      .toBeGreaterThan(drawCalls);
    const after = await stage.screenshot();
    expect(after.equals(before), `${controlName} must change ${surfaceName} pixels`).toBe(false);
  };

  for (const [name, value] of [
    ["Line count", "11"],
    ["Wave height", "0.34"],
    ["Flow speed", "-1.25"],
    ["Line thickness", "0.026"],
    ["Glow size", "2.45"],
    ["Energy reactivity", "1.85"],
  ] as const)
    await assertPixelsChange("Neon Lines", neonCanvas, name, () =>
      page.getByRole("slider", { name }).fill(value),
    );
  for (const [name, value] of [
    ["Background color", "#12051f"],
    ["Left color", "#ff315f"],
    ["Right color", "#36ffb1"],
    ["Burst color", "#ffffff"],
  ] as const)
    await assertPixelsChange("Neon Lines", neonCanvas, name, () =>
      page.getByLabel(name, { exact: true }).fill(value),
    );

  const balancedWidth = Number(await neon.getAttribute("data-webgl-buffer-width"));
  await page.getByRole("combobox", { name: /GPU quality/ }).selectOption("low");
  await expect
    .poll(async () => Number(await neon.getAttribute("data-webgl-buffer-width")))
    .toBeLessThan(balancedWidth);
  const lowWidth = Number(await neon.getAttribute("data-webgl-buffer-width"));
  await page.getByRole("combobox", { name: /GPU quality/ }).selectOption("high");
  await expect
    .poll(async () => Number(await neon.getAttribute("data-webgl-buffer-width")))
    .toBeGreaterThan(lowWidth);

  await page.getByRole("combobox", { name: /^Motion/ }).selectOption("full");
  await expect(neon).toHaveAttribute("data-webgl-animation", "running");
  await expect.poll(() => webglProbeStat(page, "activeRafs")).toBeGreaterThan(rafBaseline);
  await page.getByRole("combobox", { name: /^Motion/ }).selectOption("reduced");
  await expect(neon).toHaveAttribute("data-webgl-animation", "static");
  await expect.poll(() => webglProbeStat(page, "activeRafs")).toBe(rafBaseline);

  const energyFixture = page.getByRole("combobox", { name: /Energy fixture/ });
  await energyFixture.selectOption("zero");
  const zeroNeon = await stage.screenshot();
  await energyFixture.selectOption("overload");
  const overloadNeon = await stage.screenshot();
  expect(overloadNeon.equals(zeroNeon), "zero and clipped overload Neon Lines must differ").toBe(
    false,
  );
  if (evidence) {
    await stage.screenshot({ path: `${evidence}/neon-lines-overload.png` });
    await energyFixture.selectOption("zero");
    await stage.screenshot({ path: `${evidence}/neon-lines-zero.png` });
    await energyFixture.selectOption("overload");
  }

  const neonPreset = page.getByRole("combobox", { name: /VFX preset/ });
  await neonPreset.selectOption("ember");
  await expect(page.getByRole("slider", { name: "Line count" })).toHaveValue("6");
  const emberBefore = await stage.screenshot();
  await page.getByRole("slider", { name: "Line count" }).fill("12");
  await expect(neonPreset).toHaveValue("custom");
  await neonPreset.selectOption("ember");
  const emberAfter = await stage.screenshot();
  expect(
    emberAfter.equals(emberBefore),
    "reloading a Neon Lines preset must reproduce pixels",
  ).toBe(true);
  if (evidence) await stage.screenshot({ path: `${evidence}/neon-lines-ember-preset.png` });

  await page.getByRole("button", { name: "Equalizer Grid" }).click();
  await expect(neon).toHaveCount(0);
  const grid = page.locator('.primary-waveform[data-vfx-mode="equalizer-grid"]');
  const gridCanvas = grid.locator('canvas[data-webgl-canvas="equalizer-grid"]');
  await expect(grid).toHaveAttribute("data-webgl-state", "ready");
  await expect(grid).toHaveAttribute("data-webgl-resources", "1/1/1");
  await expect(grid).toHaveAttribute("data-webgl-animation", "static");
  await expect(grid).toHaveAttribute("data-equalizer-grid-state", "ready");
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(1);
  await expect.poll(() => webglProbeStat(page, "activeTextures")).toBe(0);
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  if (evidence) await stage.screenshot({ path: `${evidence}/equalizer-grid-default.png` });

  for (const [name, value] of [
    ["Grid columns", "17"],
    ["Grid rows", "7"],
    ["Cell gap", "0.31"],
    ["Cell reactivity", "0.45"],
    ["Shimmer speed", "1.7"],
  ] as const)
    await assertPixelsChange("Equalizer Grid", gridCanvas, name, () =>
      page.getByRole("slider", { name }).fill(value),
    );
  for (const [name, value] of [
    ["Background color", "#160202"],
    ["Gradient color 1", "#ff312e"],
    ["Gradient color 2", "#ffb52e"],
    ["Gradient color 3", "#56ff9f"],
    ["Gradient color 4", "#ffffff"],
  ] as const)
    await assertPixelsChange("Equalizer Grid", gridCanvas, name, () =>
      page.getByLabel(name, { exact: true }).fill(value),
    );

  await energyFixture.selectOption("zero");
  const zeroGrid = await stage.screenshot();
  await energyFixture.selectOption("overload");
  const overloadGrid = await stage.screenshot();
  expect(
    overloadGrid.equals(zeroGrid),
    "zero and clipped overload Equalizer Grid must differ",
  ).toBe(false);
  if (evidence) {
    await stage.screenshot({ path: `${evidence}/equalizer-grid-overload.png` });
    await energyFixture.selectOption("zero");
    await stage.screenshot({ path: `${evidence}/equalizer-grid-zero.png` });
    await energyFixture.selectOption("overload");
  }

  const gridPreset = page.getByRole("combobox", { name: /VFX preset/ });
  await gridPreset.selectOption("ember-matrix");
  await expect(page.getByRole("slider", { name: "Grid columns" })).toHaveValue("18");
  const gridPresetBefore = await stage.screenshot();
  await page.getByRole("slider", { name: "Cell gap" }).fill("0.4");
  await expect(gridPreset).toHaveValue("custom");
  await gridPreset.selectOption("ember-matrix");
  const gridPresetAfter = await stage.screenshot();
  expect(
    gridPresetAfter.equals(gridPresetBefore),
    "reloading an Equalizer Grid preset must reproduce pixels",
  ).toBe(true);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/equalizer-grid-ember-preset.png`,
    });

  const lossExtensionAvailable = await gridCanvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext("webgl2");
    const extension = context?.getExtension("WEBGL_lose_context") ?? null;
    if (extension) {
      Reflect.set(window, "__neonGridLossExtension", extension);
      extension.loseContext();
    }
    return Boolean(extension);
  });
  expect(lossExtensionAvailable).toBe(true);
  await expect(grid).toHaveAttribute("data-webgl-state", "context-lost");
  await expect(grid).toHaveAttribute("data-webgl-resources", "0/0/0");
  await expect(grid.locator('[data-webgl-fallback="context-lost"]')).toBeVisible();
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(0);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/equalizer-grid-context-lost.png`,
    });
  await page.evaluate(() => Reflect.get(window, "__neonGridLossExtension").restoreContext());
  await expect(grid).toHaveAttribute("data-webgl-state", "ready");
  await expect(grid).toHaveAttribute("data-webgl-generation", "2");
  await expect(grid).toHaveAttribute("data-webgl-resources", "1/1/1");
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(1);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/equalizer-grid-recovered.png`,
    });

  await page.setViewportSize({ width: 390, height: 844 });
  const boundedBuffer = await grid.evaluate((node) => ({
    height: Number(node.getAttribute("data-webgl-buffer-height")),
    width: Number(node.getAttribute("data-webgl-buffer-width")),
  }));
  expect(boundedBuffer.height).toBeLessThanOrEqual(4096);
  expect(boundedBuffer.width).toBeLessThanOrEqual(4096);
  expect(boundedBuffer.height * boundedBuffer.width).toBeLessThanOrEqual(4_194_304);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(0);

  await engine.selectOption("canvas2d");
  await expect(grid).toHaveCount(0);
  await expect.poll(() => webglProbeStat(page, "activePrograms")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeBuffers")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeVertexArrays")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeTextures")).toBe(0);
  await expect.poll(() => webglProbeStat(page, "activeRafs")).toBe(rafBaseline);
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline - 1);
  await page.getByRole("button", { name: "Waveform" }).click();
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  expect(browserErrors).toEqual([]);

  if (evidence)
    await writeFile(
      `${evidence}/browser-report.json`,
      `${JSON.stringify(
        {
          browserErrors,
          observerBaseline,
          observerStats: await page.evaluate(() => Reflect.get(window, "__rendererObserverStats")),
          resourceStats: await page.evaluate(() => Reflect.get(window, "__webglResourceStats")),
        },
        null,
        2,
      )}\n`,
    );
});

test("switches DOM/CSS through bounded bars and meters with explicit capability recovery", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  await installRendererObserverProbe(page);
  const evidence = process.env.CAPTURE_DOM_EVIDENCE ? ".scratch/evidence/012-dom-renderer" : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");

  const stage = page.locator(".signal-stage");
  const engine = page.getByRole("combobox", { name: /Rendering engine/ });
  const observerBaseline = await rendererObserverStat(page, "active");
  const epoch = await page.getByText(/Epoch \d+/).textContent();
  await page.getByRole("slider", { name: "Overlay playhead", exact: true }).fill("0.63");
  await engine.selectOption("dom");
  await expect(stage).toHaveAttribute("data-renderer", "dom");
  await expect(page.getByRole("alert")).toContainText("DOM/CSS does not support waveform mode");
  await expect(page.getByRole("button", { name: "Waveform" })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Semantic overlays" })).toBeDisabled();

  await page.getByRole("button", { name: "Spectrum" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "DOM/CSS does not support curve spectrum geometry",
  );
  const geometry = page.getByRole("combobox", { name: /^Geometry/ });
  const layout = page.getByRole("combobox", { name: /^Layout/ });
  await expect(geometry.locator('option[value="curve"]')).toHaveAttribute("disabled", "");
  await expect(layout.locator('option[value="radial"]')).toHaveAttribute("disabled", "");
  await geometry.selectOption("bars");

  const domSpectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  await expect(domSpectrum).toHaveAttribute("data-dom-render-status", "ready");
  const spectrumIntegrity = await domSpectrum.evaluate((surface) => ({
    animationCount: surface.getAnimations({ subtree: true }).length,
    declaredNodeCount: Number(surface.getAttribute("data-dom-node-count")),
    renderedNodeCount: surface.querySelectorAll("[data-dom-node]").length,
    roles: [...surface.querySelectorAll("[data-dom-role]")].map((node) =>
      node.getAttribute("data-dom-role"),
    ),
  }));
  expect(spectrumIntegrity.declaredNodeCount).toBe(spectrumIntegrity.renderedNodeCount);
  expect(spectrumIntegrity.declaredNodeCount).toBeLessThanOrEqual(1024);
  expect(spectrumIntegrity.roles).toContain("spectrum-bar");
  expect(spectrumIntegrity.animationCount).toBe(0);
  await expect(page.locator("#renderer-support-note")).toContainText(
    "DOM/CSS samples spectrum geometry to 256 points",
  );
  const firstBar = domSpectrum.locator('[data-dom-role="spectrum-bar"]').first();
  const colorBefore = await firstBar.evaluate(
    (element) => getComputedStyle(element).borderTopColor,
  );
  await stage.evaluate((element) =>
    (element as HTMLElement).style.setProperty("--waveform-color-base", "#ff205e"),
  );
  await expect
    .poll(() => firstBar.evaluate((element) => getComputedStyle(element).borderTopColor))
    .not.toBe(colorBefore);
  const cutoff = page.getByRole("slider", {
    name: "Low cutoff handle",
    exact: true,
  });
  const cutoffBefore = Number(await cutoff.getAttribute("aria-valuenow"));
  await cutoff.focus();
  await cutoff.press("ArrowRight");
  await expect
    .poll(async () => Number(await cutoff.getAttribute("aria-valuenow")))
    .toBeGreaterThan(cutoffBefore);
  if (evidence) await stage.screenshot({ path: `${evidence}/dom-spectrum-bars.png` });

  await page.getByRole("button", { name: "Stepped meter" }).click();
  const meterLayout = page.getByRole("combobox", { name: /Meter layout/ });
  await expect(meterLayout.locator('option[value="radial"]')).toHaveAttribute("disabled", "");
  const domMeter = page.getByRole("img", {
    name: /stepped-meter preview.*RMS display/i,
  });
  await expect(domMeter).toHaveAttribute("data-dom-render-status", "ready");
  await page.getByRole("slider", { name: "Step width", exact: true }).fill("1");
  await page.getByRole("slider", { name: "Step gap", exact: true }).fill("0");
  await expect(page.getByRole("alert")).toContainText("DOM/CSS node budget exceeded");
  if (evidence) await stage.screenshot({ path: `${evidence}/dom-node-budget.png` });
  await page.getByRole("slider", { name: "Step width", exact: true }).fill("8");
  await page.getByRole("slider", { name: "Step gap", exact: true }).fill("3");
  await expect(domMeter).toHaveAttribute("data-dom-render-status", "ready");
  const meterNodeCount = Number(await domMeter.getAttribute("data-dom-node-count"));
  expect(meterNodeCount).toBeGreaterThan(0);
  expect(meterNodeCount).toBeLessThanOrEqual(1024);
  expect(await domMeter.locator("[data-dom-node]").count()).toBe(meterNodeCount);
  if (evidence) await stage.screenshot({ path: `${evidence}/dom-stepped-meter.png` });

  await engine.selectOption("svg");
  await expect(
    page.getByRole("img", { name: /stepped-meter preview.*RMS display/i }),
  ).toHaveAttribute("data-renderer", "svg");
  await engine.selectOption("canvas2d");
  await expect(
    page.getByRole("img", { name: /stepped-meter preview.*RMS display/i }),
  ).toHaveJSProperty("tagName", "CANVAS");
  await expect(page.getByText(epoch ?? "Epoch 1")).toBeVisible();
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);

  await page.getByLabel("Load local audio").setInputFiles({
    buffer: createWavFixture(),
    mimeType: "audio/wav",
    name: "dom-renderer-state.wav",
  });
  await expect(page.getByLabel("Signal status")).toContainText("RECORDED-AUDIO / READY");
  const recordedSeek = page.getByRole("slider", {
    name: "Seek dom-renderer-state.wav",
  });
  await recordedSeek.fill("0.4");
  await engine.selectOption("dom");
  await expect(page.getByRole("region", { name: "dom-renderer-state.wav player" })).toBeVisible();
  await expect(recordedSeek).toHaveValue("0.4");
  await expect(
    page.getByRole("img", {
      name: /dom-renderer-state.wav local waveform preview/,
    }),
  ).toHaveAttribute("data-dom-render-status", "unsupported");
  await expect.poll(() => rendererObserverStat(page, "active")).toBe(observerBaseline);
  if (evidence) await stage.screenshot({ path: `${evidence}/dom-recorded-state.png` });
  await engine.selectOption("canvas2d");
  expect(browserErrors).toEqual([]);

  if (evidence)
    await writeFile(
      `${evidence}/browser-report.json`,
      `${JSON.stringify(
        {
          browserErrors,
          meterNodeCount,
          observerBaseline,
          observerStats: await page.evaluate(() => Reflect.get(window, "__rendererObserverStats")),
          spectrumIntegrity,
        },
        null,
        2,
      )}\n`,
    );
});

test("keeps DOM/CSS boxes responsive, zoom-safe, reduced-motion static, and forced-color legible", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  const evidence = process.env.CAPTURE_DOM_EVIDENCE ? ".scratch/evidence/012-dom-renderer" : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { timeout: 60_000, waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Spectrum" }).click();
  await page.getByRole("combobox", { name: /^Geometry/ }).selectOption("bars");
  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("gradient");
  await page.getByRole("combobox", { name: /Rendering engine/ }).selectOption("dom");

  const stage = page.locator(".signal-stage");
  const spectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  await expect(spectrum).toHaveAttribute("data-dom-render-status", "ready");
  const themedBefore = await stage.screenshot();
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--waveform-color-base", "#ff2f92");
    document.documentElement.style.setProperty("--waveform-color-crest", "#35ff79");
  });
  const themedAfter = await stage.screenshot();
  expect(themedBefore.equals(themedAfter)).toBe(false);
  if (evidence) await stage.screenshot({ path: `${evidence}/dom-narrow-theme.png` });

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  const firstBar = spectrum.locator('[data-dom-role="spectrum-bar"]').first();
  await expect
    .poll(() => firstBar.evaluate((element) => element.getAttribute("style")?.toLowerCase()))
    .toContain("canvastext");
  expect(await spectrum.evaluate((surface) => getComputedStyle(surface).forcedColorAdjust)).toBe(
    "none",
  );
  expect(await firstBar.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toBe(
    "none",
  );
  expect(
    await spectrum.evaluate((surface) => surface.getAnimations({ subtree: true }).length),
  ).toBe(0);
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/dom-narrow-forced-colors.png`,
    });

  const devtools = await page.context().newCDPSession(page);
  await devtools.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  const pageScale = await page.evaluate(() => window.visualViewport?.scale ?? 1);
  expect(pageScale).toBe(2);
  const zoomOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(zoomOverflow).toBeLessThanOrEqual(0);
  if (evidence)
    await stage.screenshot({
      path: `${evidence}/dom-narrow-forced-colors-zoom.png`,
    });
  expect(browserErrors).toEqual([]);
});

test("renders ordered spectrum controls through the public Canvas path", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Spectrum" }).click();

  await expect(page.getByRole("heading", { name: "Broadcast spectrum" })).toBeVisible();
  const spectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  await expect(spectrum).toHaveAttribute("data-spectrum-state", "ready");
  const curve = await spectrum.screenshot();

  const largeFft = page.getByRole("checkbox", { name: /Allow high-cost FFT/ });
  const fft = page.getByRole("combobox", { name: /FFT size/ });
  await expect(fft.locator('option[value="65536"]')).toHaveAttribute("disabled", "");
  await largeFft.check();
  await fft.selectOption("65536");
  await expect(page.getByText(/65,536 FFT/)).toBeVisible();
  await largeFft.uncheck();
  await expect(page.getByText(/32,768 FFT/)).toBeVisible();

  const exponent = page.getByRole("slider", { name: "Sine exponent" });
  await expect(exponent).toBeDisabled();
  await page.getByRole("combobox", { name: /Window/ }).selectOption("power-of-sine");
  await expect(exponent).toBeEnabled();
  await exponent.fill("3");

  await page.getByRole("combobox", { name: /Geometry/ }).selectOption("bars");
  await expect(page.getByRole("slider", { name: "Line width" })).toBeEnabled();
  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("solid");
  await expect(page.getByRole("slider", { name: "Line width" })).toBeDisabled();
  await page.getByRole("slider", { name: "Bar gap" }).fill("5");
  await page.getByRole("slider", { name: "Low cutoff", exact: true }).fill("1000");
  await page.getByRole("slider", { name: "High cutoff", exact: true }).fill("12000");
  await page.getByRole("combobox", { name: /Frequency scale/ }).selectOption("linear");
  await expect(page.getByText("LINEAR Hz")).toBeVisible();
  const bars = await spectrum.screenshot();
  expect(curve.equals(bars)).toBe(false);
});

test("renders trustworthy continuous, stepped, and radial meters with bounded history", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  const evidence = process.env.CAPTURE_METER_EVIDENCE
    ? ".scratch/evidence/009-meters-history"
    : null;
  if (evidence) await mkdir(evidence, { recursive: true });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Meter", exact: true }).click();

  const stage = page.locator(".signal-stage");
  const meter = page.getByRole("img", {
    name: /Broadcast rms meter preview.*RMS display/i,
  });
  await expect(meter).toHaveAttribute("data-meter-mode", "meter");
  await expect(meter).toHaveAttribute("data-meter-measurement", "rms");
  await expect(page.getByText(/hard ceiling 16,384/i)).toBeVisible();
  const rms = await stage.screenshot();
  if (evidence) await stage.screenshot({ path: `${evidence}/continuous-rms.png` });

  await page.getByRole("combobox", { name: /Meter preset/ }).selectOption("fast-peak");
  await expect(page.getByRole("img", { name: /PEAK display/i })).toHaveAttribute(
    "data-meter-measurement",
    "peak",
  );
  const peak = await stage.screenshot();
  if (evidence) await stage.screenshot({ path: `${evidence}/continuous-peak.png` });
  expect(rms.equals(peak)).toBe(false);

  await page.getByRole("button", { name: "Stepped meter" }).click();
  await expect(page.getByRole("slider", { name: "Step width" })).toBeEnabled();
  await page.getByRole("slider", { name: "Step width" }).fill("12");
  await page.getByRole("slider", { name: "Step gap" }).fill("5");
  const stepped = await stage.screenshot();
  if (evidence) await stage.screenshot({ path: `${evidence}/stepped-peak.png` });
  expect(peak.equals(stepped)).toBe(false);

  await page.getByRole("combobox", { name: /Meter layout/ }).selectOption("radial");
  await expect(page.getByRole("combobox", { name: /Meter orientation/ })).toBeDisabled();
  await page.getByRole("slider", { name: "Meter deadzone" }).fill("24");
  await page.getByRole("slider", { name: "Meter arc" }).fill("260");
  await page.getByRole("slider", { name: "Meter rotation" }).fill("300");
  await page.getByRole("checkbox", { name: /Invert meter arc/ }).check();
  await expect(stage).toHaveAttribute("data-meter-layout", "radial");
  const radial = await stage.screenshot();
  if (evidence) await stage.screenshot({ path: `${evidence}/radial-stepped.png` });
  expect(stepped.equals(radial)).toBe(false);

  await page.getByRole("slider", { name: "History duration" }).fill("1000");
  await page.getByRole("slider", { name: "History interval" }).fill("25");
  await expect(page.getByText(/Capacity 41 frames/i)).toBeVisible();
  await page.getByRole("button", { name: /^Transient preset thumbnail\./ }).click();
  await expect(page.getByRole("heading", { name: "Transient stepped-meter" })).toBeVisible();
  await expect(page.getByText(/HISTORY/)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  expect(browserErrors).toEqual([]);

  if (evidence) {
    await page.setViewportSize({ width: 390, height: 844 });
    const narrowOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    await stage.screenshot({ path: `${evidence}/narrow-radial.png` });
    await page.emulateMedia({ forcedColors: "active" });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await stage.screenshot({ path: `${evidence}/forced-colors-radial.png` });
    await writeFile(
      `${evidence}/browser-report.json`,
      `${JSON.stringify(
        {
          consoleErrors: browserErrors,
          forcedColors: await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
          horizontalOverflow: overflow,
          meterLayout: await stage.getAttribute("data-meter-layout"),
          meterMode: await stage.getAttribute("data-meter-mode"),
          narrowHorizontalOverflow: narrowOverflow,
        },
        null,
        2,
      )}\n`,
    );
  }
});

test("renders radial geometry and every reactive color role through Canvas", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Spectrum" }).click();

  const stage = page.locator(".signal-stage");
  const spectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  const rectangular = await stage.screenshot();
  await expect(page.getByRole("slider", { name: "Arc" })).toBeDisabled();

  await page.getByRole("combobox", { name: /Geometry/ }).selectOption("bars");
  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("solid");
  await page.getByRole("slider", { name: "Corner radius" }).fill("0");
  const squareBars = await stage.screenshot();
  await page.getByRole("slider", { name: "Corner radius" }).fill("16");
  const roundedBars = await stage.screenshot();
  expect(squareBars.equals(roundedBars)).toBe(false);

  await page.getByRole("combobox", { name: /Layout/ }).selectOption("radial");
  await page.getByRole("slider", { name: "Deadzone" }).fill("30");
  await page.getByRole("slider", { name: "Arc" }).fill("300");
  await page.getByRole("slider", { name: "Rotation" }).fill("320");
  await page.getByRole("checkbox", { name: /Invert radius/ }).check();
  await expect(stage).toHaveAttribute("data-spectrum-layout", "radial");
  await expect(spectrum).toHaveAttribute("data-spectrum-layout", "radial");
  await expect(page.getByRole("slider", { name: "Corner radius" })).toBeDisabled();
  const roundCaps = await stage.screenshot();
  await page.getByRole("checkbox", { name: /Rounded caps/ }).uncheck();
  const flatCaps = await stage.screenshot();
  expect(roundCaps.equals(flatCaps)).toBe(false);
  await page.getByRole("checkbox", { name: /Rounded caps/ }).check();

  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("gradient");
  await page.getByRole("slider", { name: "Color ratio" }).fill("2");
  await page.getByRole("slider", { name: "Crest alpha" }).fill("0.72");
  await expect(stage).toHaveAttribute("data-spectrum-color-mode", "gradient");
  const gradient = await stage.screenshot();
  expect(rectangular.equals(gradient)).toBe(false);

  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("pulse");
  await page.getByRole("combobox", { name: /Pulse mapping/ }).selectOption("peak-frequency");
  await page.getByRole("slider", { name: "Accent alpha" }).fill("0.5");
  const pulse = await stage.screenshot();
  expect(gradient.equals(pulse)).toBe(false);

  await page.getByRole("combobox", { name: /Color mode/ }).selectOption("range");
  await page.getByRole("slider", { name: "Middle threshold", exact: true }).fill("-48");
  await page.getByRole("slider", { name: "Crest threshold", exact: true }).fill("-18");
  await expect(page.getByLabel("Middle color")).toBeEnabled();
  await expect(page.getByLabel("Accent color")).toBeDisabled();
  const range = await stage.screenshot();
  expect(pulse.equals(range)).toBe(false);
  await expect(spectrum).toHaveAttribute("data-spectrum-color-mode", "range");
  await expect(page.getByText(/PROCESSED · CANVAS 2D · RADIAL\/RANGE/)).toBeVisible();

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(0);
});

test("applies spectrum normalization and filtering through the public dynamics stage", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Spectrum" }).click();

  const spectrum = page.getByRole("img", {
    name: /Broadcast ordered spectrum preview/,
  });
  const before = await spectrum.screenshot();
  await expect(page.getByRole("combobox", { name: /Smoothing/ })).toBeDisabled();
  await expect(page.getByRole("slider", { name: "Visual sync offset" })).toBeDisabled();

  await page.getByRole("checkbox", { name: /Normalization/ }).check();
  await page.getByRole("slider", { name: "Normalization target" }).fill("-8");
  await page.getByRole("slider", { name: "Maximum gain" }).fill("6");
  await page.getByRole("slider", { name: "Gaussian radius" }).fill("2");
  await page.getByRole("slider", { name: "High-frequency slope" }).fill("8");
  await page.getByRole("slider", { name: "Roll-off bandwidth" }).fill("2000");
  await page.getByRole("slider", { name: "Roll-off attenuation" }).fill("18");

  await expect(page.getByText(/PEAK .* dBFS/)).toBeVisible();
  await expect(page.getByText(/PROCESSED · CANVAS 2D/)).toBeVisible();
  const after = await spectrum.screenshot();
  expect(before.equals(after)).toBe(false);
});

test("connects microphone only on action and releases every owned cycle", async ({ page }) => {
  await installMicrophoneMock(page, "live");
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect.poll(() => microphoneStat(page, "requests")).toBe(0);
  await page.getByRole("button", { name: "Connect microphone" }).click();
  await expect(page.getByRole("status", { name: "Microphone status" })).toContainText(
    "Microphone · live",
  );
  await expect(page.getByLabel("Signal status")).toContainText("MICROPHONE / READY");
  await expect(page.getByRole("img", { name: "Live microphone waveform preview" })).toBeVisible();
  await expect(page.getByText("Live microphone", { exact: true })).toBeVisible();
  await expect.poll(() => microphoneStat(page, "requests")).toBe(1);
  await page.getByRole("button", { name: "Spectrum" }).click();
  await expect(
    page.getByRole("img", { name: /Live microphone ordered spectrum preview/ }),
  ).toHaveAttribute("data-spectrum-state", "ready");
  await expect(page.getByRole("checkbox", { name: /Allow high-cost FFT/ })).toBeDisabled();
  await expect(page.getByRole("combobox", { name: /Smoothing/ })).toBeEnabled();
  await page.getByRole("combobox", { name: /Smoothing/ }).selectOption("time-variant-ema");
  await expect(page.getByRole("slider", { name: "Attack" })).toBeEnabled();
  await expect(page.getByRole("slider", { name: "Visual sync offset" })).toBeEnabled();
  await page.getByRole("slider", { name: "Visual sync offset" }).fill("-100");
  await expect(page.getByText(/cannot provide future audio frames/i)).toBeVisible();

  await page.evaluate(() => {
    const mock = Reflect.get(window, "__waveformMicMock");
    mock.track.muted = true;
    mock.track.dispatchEvent(new Event("mute"));
  });
  await expect(page.getByRole("status", { name: "Microphone status" })).toContainText(
    "Microphone · muted",
  );
  await expect(page.getByLabel("Signal status")).toContainText("MICROPHONE / MUTED");
  await expect(page.locator(".signal-stage")).toHaveAttribute("data-dynamics-policy", "held-muted");
  await page.getByRole("checkbox", { name: /Process muted input/ }).check();
  await expect(page.locator(".signal-stage")).toHaveAttribute("data-dynamics-policy", "processed");

  await page.evaluate(() => {
    const mock = Reflect.get(window, "__waveformMicMock");
    mock.track.muted = false;
    mock.track.dispatchEvent(new Event("unmute"));
  });
  await expect(page.getByRole("status", { name: "Microphone status" })).toContainText(
    "Microphone · live",
  );

  await page.evaluate(() => {
    const mock = Reflect.get(window, "__waveformMicMock");
    mock.track.readyState = "ended";
    mock.track.dispatchEvent(new Event("ended"));
  });
  await expect(page.getByRole("status", { name: "Microphone status" })).toContainText(
    "Microphone · ended",
  );
  await expect(page.getByLabel("Signal status")).toContainText("MICROPHONE / ENDED");
  await expect(page.getByText(/Check the device, then disconnect and reconnect/)).toBeVisible();
  await expect.poll(() => microphoneStat(page, "closes")).toBe(1);
  await expect.poll(() => microphoneStat(page, "stops")).toBe(1);

  await page.getByRole("button", { name: "Disconnect microphone" }).click();
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");
  await page.getByRole("button", { name: "Connect microphone" }).click();
  await expect(page.getByRole("status", { name: "Microphone status" })).toContainText(
    "Microphone · live",
  );
  await page.getByRole("button", { name: "Disconnect microphone" }).click();
  await expect.poll(() => microphoneStat(page, "requests")).toBe(2);
  await expect.poll(() => microphoneStat(page, "closes")).toBe(2);
  await expect.poll(() => microphoneStat(page, "stops")).toBe(2);
});

test("explains denied microphone permission and remains recoverable", async ({ page }) => {
  await installMicrophoneMock(page, "denied");
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect.poll(() => microphoneStat(page, "requests")).toBe(0);
  await page.getByRole("button", { name: "Connect microphone" }).click();
  await expect(page.getByRole("status", { name: "Microphone status" })).toContainText(
    "Microphone · denied",
  );
  await expect(page.getByLabel("Signal status")).toContainText("MICROPHONE / ERROR");
  await expect(
    page.getByText(/Allow microphone access in the browser, then reconnect/),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Live microphone waveform preview" })).toBeVisible();

  await page.getByRole("button", { name: "Disconnect microphone" }).click();
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");
  await expect(page.getByRole("button", { name: "Connect microphone" })).toBeVisible();
});

async function installMicrophoneMock(page: Page, mode: "denied" | "live") {
  await page.addInitScript((initialMode) => {
    const mock = {
      closes: 0,
      mode: initialMode,
      requests: 0,
      stops: 0,
      track: null as FakeTrack | null,
    };

    class FakeTrack extends EventTarget {
      enabled = true;
      muted = false;
      readyState: MediaStreamTrackState = "live";

      stop() {
        if (this.readyState !== "ended") this.readyState = "ended";
        mock.stops += 1;
      }
    }

    class FakeAudioContext {
      readonly sampleRate = 48_000;
      readonly state = "running";

      async close() {
        mock.closes += 1;
      }

      createAnalyser() {
        return {
          disconnect() {},
          fftSize: 2048,
          getFloatTimeDomainData(output: Float32Array) {
            for (let index = 0; index < output.length; index += 1)
              output[index] = Math.sin(index * 0.14) * 0.35;
          },
        };
      }

      createMediaStreamSource() {
        return { connect() {}, disconnect() {} };
      }

      async resume() {}
    }

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          mock.requests += 1;
          if (mock.mode === "denied") throw new DOMException("blocked", "NotAllowedError");
          const track = new FakeTrack();
          mock.track = track;
          return {
            getAudioTracks: () => [track],
            getTracks: () => [track],
          };
        },
      },
    });
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: FakeAudioContext,
    });
    Reflect.set(window, "__waveformMicMock", mock);
  }, mode);
}

async function microphoneStat(page: Page, key: "closes" | "requests" | "stops") {
  return page.evaluate((property) => Reflect.get(window, "__waveformMicMock")[property], key);
}

async function installRendererObserverProbe(page: Page) {
  await page.addInitScript(() => {
    const NativeResizeObserver = window.ResizeObserver;
    const stats = { active: 0, created: 0, disconnected: 0 };
    class CountingResizeObserver extends NativeResizeObserver {
      private released = false;

      constructor(callback: ResizeObserverCallback) {
        super(callback);
        stats.active += 1;
        stats.created += 1;
      }

      override disconnect() {
        if (!this.released) {
          this.released = true;
          stats.active -= 1;
          stats.disconnected += 1;
        }
        super.disconnect();
      }
    }
    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      value: CountingResizeObserver,
    });
    Reflect.set(window, "__rendererObserverStats", stats);
  });
}

async function rendererObserverStat(page: Page, key: "active" | "created" | "disconnected") {
  return page.evaluate((property) => Reflect.get(window, "__rendererObserverStats")[property], key);
}

async function installWebglResourceProbe(page: Page) {
  await page.addInitScript(() => {
    const stats = {
      activeBuffers: 0,
      activePrograms: 0,
      activeRafs: 0,
      activeTextures: 0,
      activeVertexArrays: 0,
      buffersCreated: 0,
      buffersDeleted: 0,
      contextLosses: 0,
      programsCreated: 0,
      programsDeleted: 0,
      texturesCreated: 0,
      texturesDeleted: 0,
      vertexArraysCreated: 0,
      vertexArraysDeleted: 0,
    };
    const programs = new Set<WebGLProgram>();
    const buffers = new Set<WebGLBuffer>();
    const textures = new Set<WebGLTexture>();
    const vertexArrays = new Set<WebGLVertexArrayObject>();
    const rafs = new Set<number>();
    const sync = () => {
      stats.activePrograms = programs.size;
      stats.activeBuffers = buffers.size;
      stats.activeTextures = textures.size;
      stats.activeVertexArrays = vertexArrays.size;
      stats.activeRafs = rafs.size;
    };

    if (typeof WebGL2RenderingContext !== "undefined") {
      const prototype = WebGL2RenderingContext.prototype;
      const nativeCreateProgram = prototype.createProgram;
      const nativeDeleteProgram = prototype.deleteProgram;
      const nativeCreateBuffer = prototype.createBuffer;
      const nativeDeleteBuffer = prototype.deleteBuffer;
      const nativeCreateVertexArray = prototype.createVertexArray;
      const nativeDeleteVertexArray = prototype.deleteVertexArray;
      const nativeCreateTexture = prototype.createTexture;
      const nativeDeleteTexture = prototype.deleteTexture;
      Object.defineProperty(prototype, "createProgram", {
        configurable: true,
        value(this: WebGL2RenderingContext) {
          const resource = nativeCreateProgram.call(this);
          if (resource) {
            programs.add(resource);
            stats.programsCreated += 1;
            sync();
          }
          return resource;
        },
      });
      Object.defineProperty(prototype, "deleteProgram", {
        configurable: true,
        value(this: WebGL2RenderingContext, resource: WebGLProgram | null) {
          if (resource && programs.delete(resource)) stats.programsDeleted += 1;
          sync();
          return nativeDeleteProgram.call(this, resource);
        },
      });
      Object.defineProperty(prototype, "createBuffer", {
        configurable: true,
        value(this: WebGL2RenderingContext) {
          const resource = nativeCreateBuffer.call(this);
          if (resource) {
            buffers.add(resource);
            stats.buffersCreated += 1;
            sync();
          }
          return resource;
        },
      });
      Object.defineProperty(prototype, "deleteBuffer", {
        configurable: true,
        value(this: WebGL2RenderingContext, resource: WebGLBuffer | null) {
          if (resource && buffers.delete(resource)) stats.buffersDeleted += 1;
          sync();
          return nativeDeleteBuffer.call(this, resource);
        },
      });
      Object.defineProperty(prototype, "createTexture", {
        configurable: true,
        value(this: WebGL2RenderingContext) {
          const resource = nativeCreateTexture.call(this);
          if (resource) {
            textures.add(resource);
            stats.texturesCreated += 1;
            sync();
          }
          return resource;
        },
      });
      Object.defineProperty(prototype, "deleteTexture", {
        configurable: true,
        value(this: WebGL2RenderingContext, resource: WebGLTexture | null) {
          if (resource && textures.delete(resource)) stats.texturesDeleted += 1;
          sync();
          return nativeDeleteTexture.call(this, resource);
        },
      });
      Object.defineProperty(prototype, "createVertexArray", {
        configurable: true,
        value(this: WebGL2RenderingContext) {
          const resource = nativeCreateVertexArray.call(this);
          if (resource) {
            vertexArrays.add(resource);
            stats.vertexArraysCreated += 1;
            sync();
          }
          return resource;
        },
      });
      Object.defineProperty(prototype, "deleteVertexArray", {
        configurable: true,
        value(this: WebGL2RenderingContext, resource: WebGLVertexArrayObject | null) {
          if (resource && vertexArrays.delete(resource)) stats.vertexArraysDeleted += 1;
          sync();
          return nativeDeleteVertexArray.call(this, resource);
        },
      });
    }

    document.addEventListener(
      "webglcontextlost",
      () => {
        stats.contextLosses += 1;
        programs.clear();
        buffers.clear();
        textures.clear();
        vertexArrays.clear();
        sync();
      },
      true,
    );

    const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
    const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value(callback: FrameRequestCallback) {
        let handle = 0;
        handle = nativeRequestAnimationFrame((timestamp) => {
          rafs.delete(handle);
          sync();
          callback(timestamp);
        });
        rafs.add(handle);
        sync();
        return handle;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value(handle: number) {
        rafs.delete(handle);
        sync();
        nativeCancelAnimationFrame(handle);
      },
    });
    sync();
    Reflect.set(window, "__webglResourceStats", stats);
  });
}

async function webglProbeStat(
  page: Page,
  key:
    | "activeBuffers"
    | "activePrograms"
    | "activeRafs"
    | "activeTextures"
    | "activeVertexArrays"
    | "contextLosses",
) {
  return page.evaluate((property) => Reflect.get(window, "__webglResourceStats")[property], key);
}

function createWavFixture(): Buffer {
  const sampleRate = 8_000;
  const sampleCount = sampleRate;
  const bytesPerSample = 2;
  const dataLength = sampleCount * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  for (let index = 0; index < sampleCount; index += 1) {
    const value = Math.sin((index / sampleRate) * Math.PI * 2 * 220) * 0.7;
    buffer.writeInt16LE(Math.round(value * 0x7fff), 44 + index * bytesPerSample);
  }
  return buffer;
}
