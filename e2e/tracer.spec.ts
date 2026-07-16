import { expect, test } from "@playwright/test";
import { Buffer } from "node:buffer";

test("renders and controls the public Canvas waveform path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Signal Workbench" })).toBeVisible();
  await expect(page.getByRole("img", { name: /deterministic waveform preview/ })).toBeVisible();
  await expect(page.getByLabel("Signal status")).toContainText("DEMO / READY");
  await expect(page.getByText("owned")).toBeVisible();
  await expect(page.getByText("Visual mode").locator("..").getByText("Waveform")).toBeVisible();
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

test("keeps the narrow workbench reachable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("complementary", { name: "Waveform controls" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByRole("button", { name: "Copy code" })).toBeVisible();
});

test("loads, plays, and keyboard-scrubs a local WAV without upload", async ({ page }) => {
  await page.goto("/");
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
  await page.goto("/");
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
