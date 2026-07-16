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
  await expect(
    page.getByText("Rendering engine").locator("..").getByText("Canvas 2D"),
  ).toBeVisible();

  const amplitude = page.getByRole("slider", { name: /Amplitude/ });
  await amplitude.fill("1.2");
  await expect(page.getByText("1.20×")).toBeVisible();

  await page.getByRole("button", { name: /Transient/ }).click();
  await expect(page.getByRole("heading", { name: "Transient waveform" })).toBeVisible();

  await page.getByRole("button", { name: "Focus" }).click();
  await expect(page.getByRole("button", { name: "Focus" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "Signal studies" })).toBeHidden();
});

test("preserves stereo identity across layouts, envelope placement, and orientation", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const stage = page.locator(".signal-stage");
  const waveform = page.getByRole("img", { name: /Broadcast deterministic waveform preview/ });
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
  const envelope = page.getByRole("img", { name: /Broadcast magnitude envelope preview/ });
  await expect(envelope).toHaveAttribute("data-time-domain-mode", "envelope");
  await page.getByRole("combobox", { name: /Amplitude placement/ }).selectOption("mirrored");
  await page.getByRole("combobox", { name: /Orientation/ }).selectOption("vertical");
  await page.getByRole("combobox", { name: /Sizing/ }).selectOption("fixed");
  await page.getByRole("slider", { name: "Component width" }).fill("480");
  await expect(page.getByText("VERTICAL · FIXED")).toBeVisible();
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

test("renders ordered spectrum controls through the public Canvas path", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Spectrum" }).click();

  await expect(page.getByRole("heading", { name: "Broadcast spectrum" })).toBeVisible();
  const spectrum = page.getByRole("img", { name: /Broadcast ordered spectrum preview/ });
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
  await page.getByRole("slider", { name: "Low cutoff" }).fill("1000");
  await page.getByRole("slider", { name: "High cutoff" }).fill("12000");
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
  const meter = page.getByRole("img", { name: /Broadcast rms meter preview.*RMS display/i });
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
  await page.getByRole("button", { name: "Transient" }).click();
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
  const spectrum = page.getByRole("img", { name: /Broadcast ordered spectrum preview/ });
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
  await page.getByRole("slider", { name: "Middle threshold" }).fill("-48");
  await page.getByRole("slider", { name: "Crest threshold" }).fill("-18");
  await expect(page.getByLabel("Middle color")).toBeEnabled();
  await expect(page.getByLabel("Accent color")).toBeDisabled();
  const range = await stage.screenshot();
  expect(pulse.equals(range)).toBe(false);
  await expect(spectrum).toHaveAttribute("data-spectrum-color-mode", "range");
  await expect(page.getByText(/PROCESSED · VISUAL ONLY · RADIAL\/RANGE/)).toBeVisible();

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

  const spectrum = page.getByRole("img", { name: /Broadcast ordered spectrum preview/ });
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
  await expect(page.getByText("PROCESSED · VISUAL ONLY")).toBeVisible();
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
