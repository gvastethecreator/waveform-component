import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Signal Workbench tracer", () => {
  it("separates visual mode from rendering engine and updates real controls", () => {
    render(<App />);

    expect(screen.getByText("Visual mode").nextElementSibling).toHaveTextContent("Waveform");
    expect(screen.getByText("Rendering engine").nextElementSibling).toHaveTextContent("Canvas 2D");

    const amplitude = screen.getByRole("slider", { name: "Amplitude" });
    fireEvent.change(amplitude, { target: { value: "1.2" } });
    expect(screen.getByText("1.20×")).toBeInTheDocument();
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
