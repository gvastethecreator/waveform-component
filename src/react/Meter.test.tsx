import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { Meter } from "./Meter";

describe("Meter", () => {
  it("renders an inspectable canvas with explicit RMS and peak dBFS semantics", () => {
    const data = analyzeMeter(new Float32Array([1, 0, 0, 0]));
    render(<Meter config={{ measurement: "rms", mode: "stepped-meter" }} data={data} />);
    const canvas = screen.getByRole("img", { name: /RMS display/i });
    expect(canvas).toHaveAttribute("data-meter-measurement", "rms");
    expect(canvas).toHaveAttribute("data-meter-mode", "stepped-meter");
    expect(canvas).toHaveAccessibleName(/RMS -6\.0 dBFS, peak 0\.0 dBFS/i);
    expect(canvas).toHaveAccessibleName(/referenced to amplitude 1/i);
  });

  it("announces an empty meter without stale channel values", () => {
    const data = analyzeMeter(new Float32Array());
    render(<Meter ariaLabel="Input meter" data={data} />);
    expect(screen.getByRole("img")).toHaveAccessibleName("Input meter. Empty RMS meter.");
  });
});
