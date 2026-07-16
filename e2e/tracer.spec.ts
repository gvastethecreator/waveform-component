import { expect, test } from "@playwright/test";

test("renders and controls the public Canvas waveform path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Signal Workbench" })).toBeVisible();
  await expect(page.getByRole("img", { name: /deterministic waveform preview/ })).toBeVisible();
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
