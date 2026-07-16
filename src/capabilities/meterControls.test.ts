import { describe, expect, it } from "vitest";
import {
  getMeterControlAvailability,
  METER_CONTROL_DEFINITIONS,
  type MeterCapabilityContext,
} from "./meterControls";

const rectangular: MeterCapabilityContext = {
  channelCount: 2,
  colorMode: "gradient",
  layout: "rectangular",
  mode: "meter",
  roundedCaps: true,
  showHistory: true,
};

describe("meter control capabilities", () => {
  it("gates stepped and radial-only controls with actionable reasons", () => {
    expect(getMeterControlAvailability("stepWidth", rectangular)).toMatchObject({
      enabled: false,
      reason: expect.stringContaining("stepped-meter"),
    });
    expect(getMeterControlAvailability("radialArc", rectangular)).toMatchObject({
      enabled: false,
      reason: expect.stringContaining("radial"),
    });
    expect(
      getMeterControlAvailability("stepWidth", { ...rectangular, mode: "stepped-meter" }),
    ).toEqual({ enabled: true });
  });

  it("gates channel, history, orientation, and color controls by real context", () => {
    expect(
      getMeterControlAvailability("channelGap", { ...rectangular, channelCount: 1 }).enabled,
    ).toBe(false);
    expect(
      getMeterControlAvailability("historyOpacity", { ...rectangular, showHistory: false }).enabled,
    ).toBe(false);
    expect(
      getMeterControlAvailability("orientation", { ...rectangular, layout: "radial" }).enabled,
    ).toBe(false);
    expect(
      getMeterControlAvailability("middleThreshold", {
        ...rectangular,
        colorMode: "solid",
      }).enabled,
    ).toBe(false);
  });

  it("declares a named label and description for every control", () => {
    expect(METER_CONTROL_DEFINITIONS).toHaveLength(11);
    expect(
      METER_CONTROL_DEFINITIONS.every(
        (definition) => definition.label.length > 0 && definition.description.length > 0,
      ),
    ).toBe(true);
  });
});
