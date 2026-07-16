import { describe, expect, it, vi } from "vitest";
import {
  colorWithAlpha,
  mixSpectrumColors,
  resolveCssVariableColor,
  spectrumPulseAmount,
  spectrumRangeRole,
} from "./spectrumColor";

describe("spectrum color grammar", () => {
  it("maps ordered dB thresholds to base, middle, and crest roles", () => {
    const config = { crestDecibels: -12, middleDecibels: -36 };
    expect(spectrumRangeRole(-80, config)).toBe("base");
    expect(spectrumRangeRole(-36, config)).toBe("middle");
    expect(spectrumRangeRole(-12, config)).toBe("crest");
  });

  it("derives pulse from peak magnitude or peak frequency without leaving 0..1", () => {
    const points = [
      { decibels: -80, frequency: 100, level: 0.2, x: 0, y: 0 },
      { decibels: -20, frequency: 1000, level: 0.8, x: 1, y: 0 },
      { decibels: -40, frequency: 5000, level: 0.6, x: 2, y: 0 },
    ];
    const base = { gradientRatio: 1, maximumDecibels: 0, minimumDecibels: -100 } as const;
    expect(spectrumPulseAmount(points, { ...base, pulseMode: "peak-magnitude" })).toBeCloseTo(0.8);
    expect(spectrumPulseAmount(points, { ...base, pulseMode: "peak-frequency" })).toBeCloseTo(0.5);
    expect(
      spectrumPulseAmount(points, {
        ...base,
        gradientRatio: 4,
        pulseMode: "peak-magnitude",
      }),
    ).toBe(1);
  });

  it("preserves alpha while mixing typed colors and CSS-variable fallbacks", () => {
    expect(colorWithAlpha("#ff000080", 0.5)).toBe("rgba(255, 0, 0, 0.251)");
    expect(mixSpectrumColors("rgba(0, 0, 0, 0)", "#ffffff", 0.5)).toBe("rgba(128, 128, 128, 0.5)");
    expect(resolveCssVariableColor("var(--missing, #123456)")).toBe("#123456");

    const element = document.createElement("div");
    const style = vi.spyOn(window, "getComputedStyle").mockReturnValue({
      getPropertyValue: () => " #abcdef ",
    } as unknown as CSSStyleDeclaration);
    expect(resolveCssVariableColor("var(--signal-base, #123456)", element)).toBe("#abcdef");
    style.mockRestore();
  });
});
