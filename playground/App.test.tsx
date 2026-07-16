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
    expect(screen.getByRole("slider", { name: "Line width" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "Bar width" })).toBeEnabled();

    fireEvent.change(screen.getByRole("slider", { name: "Low cutoff" }), {
      target: { value: "1000" },
    });
    expect(screen.getAllByText("1.0 kHz").length).toBeGreaterThanOrEqual(1);
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

  it("loads a deterministic preset and restores public defaults", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Transient/ }));
    expect(screen.getByRole("heading", { name: "Transient waveform" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("heading", { name: "Broadcast waveform" })).toBeInTheDocument();
    expect(screen.getByText("0.86×")).toBeInTheDocument();
  });

  it("surfaces the shared session lifecycle and owned demo source", async () => {
    render(<App />);

    expect(await screen.findByText("DEMO / READY")).toBeInTheDocument();
    expect(screen.getByText("owned")).toBeInTheDocument();
    expect(screen.getByText(/Epoch \d+/)).toBeInTheDocument();
  });
});
