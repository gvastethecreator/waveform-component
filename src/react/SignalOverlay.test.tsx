import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignalOverlay, type SignalOverlayHandle } from "./SignalOverlay";

function handle(overrides: Partial<SignalOverlayHandle> = {}): SignalOverlayHandle {
  return {
    id: "playhead",
    kind: "playhead",
    label: "Playhead",
    maximum: 1,
    minimum: 0,
    onChange: vi.fn(),
    step: 0.1,
    value: 0.5,
    ...overrides,
  };
}

describe("SignalOverlay", () => {
  it("exposes controlled seek and handle sliders with orientation-aware keyboard input", () => {
    const seekChange = vi.fn();
    const handleChange = vi.fn();
    render(
      <SignalOverlay
        direction="rtl"
        handles={[handle({ onChange: handleChange })]}
        seek={{ label: "Seek signal", onChange: seekChange, step: 0.1, value: 0.5 }}
      />,
    );
    fireEvent.keyDown(screen.getByRole("slider", { name: "Seek signal" }), {
      key: "ArrowRight",
    });
    expect(seekChange).toHaveBeenCalledWith(0.4, { commit: true, source: "keyboard" });
    fireEvent.keyDown(screen.getByRole("slider", { name: "Playhead" }), {
      key: "ArrowLeft",
    });
    expect(handleChange).toHaveBeenCalledWith(0.6, { commit: true, source: "keyboard" });
    expect(screen.getByRole("slider", { name: "Playhead" })).toHaveAttribute(
      "data-overlay-position",
      "0.5",
    );
  });

  it("maps pointer drag through component bounds and commits explicitly", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const { container } = render(
      <SignalOverlay seek={{ label: "Seek signal", onChange, onCommit, value: 0.2 }} />,
    );
    const root = container.firstElementChild as HTMLDivElement;
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      bottom: 120,
      height: 100,
      left: 10,
      right: 210,
      toJSON: () => ({}),
      top: 20,
      width: 200,
      x: 10,
      y: 20,
    });
    const seek = screen.getByRole("slider", { name: "Seek signal" });
    fireEvent.pointerDown(seek, { button: 0, clientX: 60, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(seek, { button: 0, clientX: 160, clientY: 50, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(0.75, { commit: true, source: "pointer" });
    expect(onCommit).toHaveBeenCalledWith(0.75, { commit: true, source: "pointer" });
  });

  it("restores controlled state when a touch pointer is canceled", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SignalOverlay seek={{ label: "Seek signal", onChange, value: 0.2 }} />,
    );
    const root = container.firstElementChild as HTMLDivElement;
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      bottom: 120,
      height: 100,
      left: 10,
      right: 210,
      toJSON: () => ({}),
      top: 20,
      width: 200,
      x: 10,
      y: 20,
    });
    const seek = screen.getByRole("slider", { name: "Seek signal" });
    fireEvent.pointerDown(seek, {
      button: 0,
      clientX: 160,
      clientY: 50,
      pointerId: 7,
      pointerType: "touch",
    });
    expect(onChange).toHaveBeenLastCalledWith(0.75, {
      commit: false,
      source: "pointer",
    });
    fireEvent.pointerCancel(seek, { pointerId: 7, pointerType: "touch" });
    expect(onChange).toHaveBeenLastCalledWith(0.2, {
      commit: false,
      source: "pointer",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Seek signal adjustment canceled; previous value restored.",
    );
  });

  it("separates the visual domain from allowed values and uses physical keyboard steps", () => {
    const onChange = vi.fn();
    render(
      <SignalOverlay
        handles={[
          handle({
            domainMaximum: 24_000,
            domainMinimum: 20,
            id: "low-cutoff",
            kind: "low-cutoff",
            label: "Low cutoff",
            maximum: 5_000,
            minimum: 20,
            onChange,
            scale: "log",
            step: 10,
            value: 1_000,
          }),
        ]}
      />,
    );
    const cutoff = screen.getByRole("slider", { name: "Low cutoff" });
    expect(Number(cutoff.getAttribute("data-overlay-position"))).toBeCloseTo(
      Math.log(1_000 / 20) / Math.log(24_000 / 20),
      8,
    );
    fireEvent.keyDown(cutoff, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(1_010, {
      commit: true,
      source: "keyboard",
    });
  });

  it("draws a component-owned focus indicator for every semantic control", () => {
    render(
      <SignalOverlay
        handles={[handle()]}
        seek={{ label: "Seek signal", onChange: vi.fn(), value: 0.2 }}
      />,
    );
    const seek = screen.getByRole("slider", { name: "Seek signal" });
    fireEvent.focus(seek);
    expect(seek.style.outline).toContain("Highlight");
    const playhead = screen.getByRole("slider", { name: "Playhead" });
    fireEvent.focus(playhead);
    expect(playhead.style.outline).toContain("Highlight");
    expect(playhead.style.outlineOffset).toBe("-4px");
  });

  it("keeps boundary marker and handle hit targets inside a clipped signal surface", () => {
    render(
      <SignalOverlay
        handles={[
          handle({ id: "minimum", label: "Minimum handle", value: 0 }),
          handle({ id: "maximum", label: "Maximum handle", value: 1 }),
        ]}
        markers={[
          { id: "start", label: "Start marker", position: 0 },
          { id: "end", label: "End marker", position: 1 },
        ]}
      />,
    );
    for (const [name, left, transform] of [
      ["Minimum handle", "0%", "translateX(0%)"],
      ["Maximum handle", "100%", "translateX(-100%)"],
    ]) {
      const control = screen.getByRole("slider", { name });
      expect(control.style.left).toBe(left);
      expect(control.style.transform).toBe(transform);
    }
    for (const [name, left, transform] of [
      ["Start marker", "0%", "translateX(0%)"],
      ["End marker", "100%", "translateX(-100%)"],
    ]) {
      const control = screen.getByRole("button", { name });
      expect(control.style.left).toBe(left);
      expect(control.style.transform).toBe(transform);
    }
  });

  it("formats logical hover inspection and clears host state on leave and unmount", () => {
    const onHoverChange = vi.fn();
    const { container, unmount } = render(
      <SignalOverlay
        formatHoverValue={(value) => `${Math.round(-60 + value * 60)} dBFS`}
        hoverLabel="Level"
        hoverReversed
        onHoverChange={onHoverChange}
        orientation="vertical"
      />,
    );
    const root = container.firstElementChild as HTMLDivElement;
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      bottom: 120,
      height: 100,
      left: 10,
      right: 210,
      toJSON: () => ({}),
      top: 20,
      width: 200,
      x: 10,
      y: 20,
    });
    fireEvent.pointerMove(root, { clientX: 60, clientY: 45 });
    expect(onHoverChange).toHaveBeenLastCalledWith(0.75);
    expect(screen.getByText("LEVEL -15 dBFS")).toBeInTheDocument();
    fireEvent.pointerLeave(root);
    expect(onHoverChange).toHaveBeenLastCalledWith(null);
    unmount();
    expect(onHoverChange).toHaveBeenLastCalledWith(null);
  });

  it("keeps regions and markers independently operable and announced", () => {
    const activateRegion = vi.fn();
    const activateMarker = vi.fn();
    render(
      <SignalOverlay
        markers={[
          {
            description: "Transient at 40 percent",
            id: "transient",
            label: "Transient marker",
            onActivate: activateMarker,
            position: 0.4,
          },
        ]}
        regions={[
          {
            active: true,
            end: 0.7,
            id: "loop-a",
            kind: "loop",
            label: "Chorus loop",
            onActivate: activateRegion,
            start: 0.3,
          },
        ]}
      />,
    );
    const region = screen.getByRole("button", { name: "Chorus loop" });
    const marker = screen.getByRole("button", { name: "Transient marker" });
    expect(region).toHaveAttribute("data-overlay-lane", "0");
    expect(marker).toHaveAttribute("data-overlay-lane", "1");
    expect(region.style.top).toBe("8px");
    expect(marker.style.top).toBe("36px");
    expect(region).toHaveAccessibleDescription("Range 30% to 70%. Selected.");
    expect(marker).toHaveAccessibleDescription("Transient at 40 percent. Position 40%.");
    fireEvent.click(region);
    fireEvent.click(marker);
    expect(activateRegion).toHaveBeenCalledWith("loop-a");
    expect(activateMarker).toHaveBeenCalledWith("transient");
    expect(screen.getByRole("status")).toHaveTextContent("Transient marker activated.");
  });

  it("assigns separate lanes to overlapping markers and handles", () => {
    render(
      <SignalOverlay
        handles={[
          handle({ id: "selection-start", kind: "selection-start", label: "Selection start" }),
          handle({ id: "loop-start", kind: "loop-start", label: "Loop start", value: 0.51 }),
        ]}
        markers={[
          { id: "one", label: "Marker one", position: 0.5 },
          { id: "two", label: "Marker two", position: 0.51 },
        ]}
      />,
    );
    const markerLanes = ["Marker one", "Marker two"].map((name) =>
      screen.getByRole("button", { name }).getAttribute("data-overlay-lane"),
    );
    const handleLanes = ["Selection start", "Loop start"].map((name) =>
      screen.getByRole("slider", { name }).getAttribute("data-overlay-lane"),
    );
    expect(new Set([...markerLanes, ...handleLanes])).toHaveProperty("size", 4);
  });
});
