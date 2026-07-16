import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createSpectrumFrame } from "../analysis/spectrum";
import { Spectrum } from "./Spectrum";

describe("Spectrum", () => {
  it("exposes ordered-bin and sample-rate semantics", () => {
    const frame = createSpectrumFrame(new Float32Array(16).fill(-40), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 48_000,
    });
    render(<Spectrum ariaLabel="Voice spectrum" data={frame} />);
    expect(
      screen.getByRole("img", {
        name: "Voice spectrum. 16 ordered bins, 48000 Hz sample rate.",
      }),
    ).toHaveAttribute("data-spectrum-state", "ready");
  });
});
