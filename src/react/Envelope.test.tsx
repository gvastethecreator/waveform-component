import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Envelope } from "./Envelope";

describe("Envelope", () => {
  it("renders a semantic magnitude frame with fixed or responsive sizing", () => {
    const { container } = render(
      <Envelope ariaLabel="Voice magnitude" data={[0, 0.5, 1]} height={120} width={320} />,
    );

    expect(
      screen.getByRole("img", {
        name: "Voice magnitude. 1 source channel, 3 samples.",
      }),
    ).toHaveAttribute("data-time-domain-mode", "envelope");
    expect(container.firstElementChild).toHaveStyle({ height: "120px", width: "320px" });
  });

  it("surfaces incompatible layout feedback instead of leaving a blank canvas", async () => {
    render(
      <Envelope ariaLabel="Invalid envelope" config={{ channelLayout: "overlay" }} data={[0, 1]} />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("MULTI_CHANNEL_LAYOUT_REQUIRED");
    expect(screen.getByRole("img")).toHaveAttribute(
      "data-render-error",
      "MULTI_CHANNEL_LAYOUT_REQUIRED",
    );
  });
});
