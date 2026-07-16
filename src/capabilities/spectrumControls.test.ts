import { describe, expect, it } from "vitest";
import { getSpectrumControlAvailability, SPECTRUM_CONTROL_DEFINITIONS } from "./spectrumControls";

describe("spectrum control capabilities", () => {
  it("publishes complete typed metadata with unique ids", () => {
    const ids = SPECTRUM_CONTROL_DEFINITIONS.map((control) => control.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SPECTRUM_CONTROL_DEFINITIONS.every((control) => control.description.length > 12)).toBe(
      true,
    );
    expect(
      SPECTRUM_CONTROL_DEFINITIONS.find((control) => control.id === "lowFrequency"),
    ).toMatchObject({ unit: "Hz", valueType: "number" });
  });

  it("explains controls that cannot affect the selected capability", () => {
    const context = {
      allowLargeFft: false,
      colorMode: "line",
      geometry: "curve",
      layout: "rectangular",
      window: "hann",
    } as const;
    expect(getSpectrumControlAvailability("powerOfSineExponent", context)).toMatchObject({
      enabled: false,
      reason: expect.stringContaining("Power-of-Sine"),
    });
    expect(getSpectrumControlAvailability("barGap", context)).toMatchObject({
      enabled: false,
      reason: expect.stringContaining("bars"),
    });
    expect(getSpectrumControlAvailability("barGap", { ...context, geometry: "bars" })).toEqual({
      enabled: true,
    });
    expect(getSpectrumControlAvailability("lineWidth", { ...context, geometry: "bars" })).toEqual({
      enabled: true,
    });
    expect(
      getSpectrumControlAvailability("lineWidth", {
        ...context,
        colorMode: "solid",
        geometry: "bars",
      }),
    ).toMatchObject({ enabled: false });
    expect(getSpectrumControlAvailability("radialArc", context)).toMatchObject({
      enabled: false,
      reason: expect.stringContaining("radial"),
    });
    expect(getSpectrumControlAvailability("radialArc", { ...context, layout: "radial" })).toEqual({
      enabled: true,
    });
    expect(getSpectrumControlAvailability("accentColor", context)).toMatchObject({
      enabled: false,
      reason: expect.stringContaining("Peak pulse"),
    });
    expect(
      getSpectrumControlAvailability("accentColor", { ...context, colorMode: "pulse" }),
    ).toEqual({ enabled: true });
  });
});
