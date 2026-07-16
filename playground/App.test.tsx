import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Signal Workbench tracer", () => {
  it("separates visual mode from rendering engine and updates real controls", () => {
    render(<App />);

    expect(screen.getByRole("group", { name: "Visual mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Waveform" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Rendering engine").nextElementSibling).toHaveTextContent("Canvas 2D");

    const amplitude = screen.getByRole("slider", { name: "Amplitude" });
    fireEvent.change(amplitude, { target: { value: "1.2" } });
    expect(screen.getByText("1.20×")).toBeInTheDocument();
  });

  it("applies spectrum capabilities to the real artifact and controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Spectrum" }));
    expect(screen.getByRole("heading", { name: "Broadcast spectrum" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Broadcast ordered spectrum preview/ })).toHaveAttribute(
      "data-spectrum-state",
      "ready",
    );

    const exponent = screen.getByRole("slider", { name: "Sine exponent" });
    expect(exponent).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: /Window/ }), "power-of-sine");
    expect(exponent).toBeEnabled();

    await user.selectOptions(screen.getByRole("combobox", { name: /Geometry/ }), "bars");
    expect(screen.getByRole("slider", { name: "Line width" })).toBeEnabled();
    expect(screen.getByRole("slider", { name: "Bar width" })).toBeEnabled();
    await user.selectOptions(screen.getByRole("combobox", { name: /Color mode/ }), "solid");
    expect(screen.getByRole("slider", { name: "Line width" })).toBeDisabled();

    fireEvent.change(screen.getByRole("slider", { name: "Low cutoff" }), {
      target: { value: "1000" },
    });
    expect(screen.getAllByText("1.0 kHz").length).toBeGreaterThanOrEqual(1);
  });

  it("gates radial geometry and the complete color grammar by capability", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Spectrum" }));
    expect(screen.getByRole("slider", { name: "Arc" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /Pulse mapping/ })).toBeDisabled();

    await user.selectOptions(screen.getByRole("combobox", { name: /^Layout/ }), "radial");
    expect(screen.getByRole("slider", { name: "Arc" })).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: /Invert radius/ })).toBeEnabled();
    expect(screen.getByRole("slider", { name: "Corner radius" })).toBeDisabled();
    expect(screen.getByText("RADIAL · LINE")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /Color mode/ }), "gradient");
    expect(screen.getByRole("slider", { name: "Color ratio" })).toBeEnabled();
    expect(screen.getByLabelText("Crest color")).toBeEnabled();
    expect(screen.getByLabelText("Accent color")).toBeDisabled();

    await user.selectOptions(screen.getByRole("combobox", { name: /Color mode/ }), "pulse");
    expect(screen.getByRole("combobox", { name: /Pulse mapping/ })).toBeEnabled();
    expect(screen.getByLabelText("Accent color")).toBeEnabled();
    fireEvent.change(screen.getByRole("slider", { name: "Accent alpha" }), {
      target: { value: "0.5" },
    });
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("exposes honest dynamics, filtering, and source-policy capabilities", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Spectrum" }));
    expect(screen.getByRole("combobox", { name: /Smoothing/ })).toBeDisabled();
    expect(screen.getAllByText(/deterministic demo has no cadence/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("slider", { name: "Visual sync offset" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /Normalization/ }));
    expect(screen.getByRole("slider", { name: "Normalization target" })).toBeEnabled();
    fireEvent.change(screen.getByRole("slider", { name: "Maximum gain" }), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Gaussian radius" }), {
      target: { value: "2" },
    });

    expect(screen.getByText("+6 dB")).toBeInTheDocument();
    expect(screen.getByText("2.00 bins")).toBeInTheDocument();
    expect(screen.getByText(/PEAK .* dBFS/)).toBeInTheDocument();
    expect(screen.getByText(/PROCESSED · VISUAL ONLY/)).toBeInTheDocument();
  });

  it("keeps RMS, peak, continuous, and stepped meters as distinct public modes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Meter" }));
    expect(screen.getByRole("heading", { name: "Broadcast meter" })).toBeInTheDocument();
    const meter = screen.getByRole("img", { name: /Broadcast rms meter preview.*RMS display/i });
    expect(meter).toHaveAttribute("data-meter-mode", "meter");
    expect(meter).toHaveAttribute("data-meter-measurement", "rms");
    expect(screen.getByRole("slider", { name: "Step width" })).toBeDisabled();
    expect(screen.getByText(/hard ceiling 16,384/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /Meter preset/ }), "fast-peak");
    expect(screen.getByRole("img", { name: /PEAK display/i })).toHaveAttribute(
      "data-meter-measurement",
      "peak",
    );
    expect(screen.getByRole("checkbox", { name: /Fast meter peaks/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Stepped meter" }));
    expect(screen.getByRole("img", { name: /stepped-meter preview/i })).toHaveAttribute(
      "data-meter-mode",
      "stepped-meter",
    );
    expect(screen.getByRole("slider", { name: "Step width" })).toBeEnabled();
  });

  it("gates radial meter geometry and bounded-history presentation controls", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Meter" }));

    expect(screen.getByRole("slider", { name: "Meter arc" })).toBeDisabled();
    await user.selectOptions(screen.getByRole("combobox", { name: /Meter layout/ }), "radial");
    expect(screen.getByRole("slider", { name: "Meter arc" })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: /Meter orientation/ })).toBeDisabled();
    expect(screen.getByRole("img", { name: /RMS display/i })).toHaveAttribute(
      "data-meter-layout",
      "radial",
    );

    await user.click(screen.getByRole("checkbox", { name: /Show meter history/ }));
    expect(screen.getByRole("slider", { name: "History opacity" })).toBeDisabled();
    fireEvent.change(screen.getByRole("slider", { name: "History duration" }), {
      target: { value: "1000" },
    });
    expect(screen.getByText(/Capacity 21 frames/i)).toBeInTheDocument();
  });

  it("loads a deterministic preset and restores public defaults", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Transient/ }));
    expect(screen.getByRole("heading", { name: "Transient waveform" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("heading", { name: "Broadcast waveform" })).toBeInTheDocument();
    expect(screen.getByText("0.86×")).toBeInTheDocument();
  });

  it("preserves channel meaning across waveform and envelope layouts", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(
      await screen.findByRole("img", {
        name: /Broadcast deterministic waveform preview.*2 source channels/,
      }),
    ).toHaveAttribute("data-time-domain-mode", "waveform");
    expect(screen.getByText("2 CH · STACKED")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: /Channel layout/ }), "overlay");
    expect(screen.getByText("2 CH · OVERLAY")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Channel spacing" })).toBeDisabled();

    await user.selectOptions(screen.getByRole("combobox", { name: /Channel mode/ }), "mono");
    expect(screen.getByText("1 CH · STACKED")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Envelope" }));
    expect(screen.getByRole("heading", { name: "Broadcast envelope" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Broadcast magnitude envelope preview/ }),
    ).toHaveAttribute("data-time-domain-mode", "envelope");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Amplitude placement/ }),
      "mirrored",
    );
    await user.selectOptions(screen.getByRole("combobox", { name: /Orientation/ }), "vertical");
    await user.selectOptions(screen.getByRole("combobox", { name: /Sizing/ }), "fixed");
    expect(screen.getByRole("slider", { name: "Component width" })).toBeEnabled();
    expect(screen.getByText("VERTICAL · FIXED")).toBeInTheDocument();
    const amplitudeScale = container.querySelector(".signal-scale");
    expect(amplitudeScale).toHaveAttribute("data-orientation", "vertical");
    expect(
      [...(amplitudeScale?.querySelectorAll("span") ?? [])].map((label) => label.textContent),
    ).toEqual(["1.0", "0.0", "1.0"]);
  });

  it("surfaces the shared session lifecycle and owned demo source", async () => {
    render(<App />);

    expect(await screen.findByText("DEMO / READY")).toBeInTheDocument();
    expect(screen.getByText("owned")).toBeInTheDocument();
    expect(screen.getByText(/Epoch \d+/)).toBeInTheDocument();
  });
});
