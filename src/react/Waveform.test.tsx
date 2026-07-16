import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Waveform } from "./Waveform";

describe("Waveform", () => {
  it("exposes a semantic summary for a signed static frame", () => {
    render(<Waveform ariaLabel="Voice sample" data={[-1, 0, 1]} />);

    const canvas = screen.getByRole("img", {
      name: "Voice sample. 1 source channel, 3 samples.",
    });
    expect(canvas).toHaveAttribute("data-waveform-state", "ready");
    expect(canvas).toHaveAttribute("data-time-domain-mode", "waveform");
  });

  it("reports empty data explicitly", () => {
    render(<Waveform ariaLabel="Empty sample" data={[]} />);

    expect(screen.getByRole("img")).toHaveAttribute("data-waveform-state", "empty");
  });
});
