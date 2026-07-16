import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { createSpectrumFrame } from "../analysis/spectrum";
import { createDemoWaveform } from "../core/staticFrame";
import { Meter } from "./Meter";
import { Spectrum } from "./Spectrum";
import { Waveform } from "./Waveform";

describe("React SVG renderer integration", () => {
  it("switches the existing Waveform interface without changing its frame or semantics", () => {
    const data = createDemoWaveform({ sampleCount: 128 });
    const { rerender } = render(
      <Waveform ariaLabel="Switchable signal" config={{ renderer: "svg" }} data={data} />,
    );
    const svg = screen.getByRole("img", { name: /Switchable signal.*128 samples/ });
    expect(svg.tagName).toBe("svg");
    expect(svg).toHaveAttribute("data-renderer", "svg");

    rerender(
      <Waveform ariaLabel="Switchable signal" config={{ renderer: "canvas2d" }} data={data} />,
    );
    const canvas = screen.getByRole("img", { name: /Switchable signal.*128 samples/ });
    expect(canvas.tagName).toBe("CANVAS");

    rerender(<Waveform ariaLabel="Switchable signal" config={{ renderer: "svg" }} data={data} />);
    expect(screen.getByRole("img", { name: /Switchable signal.*128 samples/ }).tagName).toBe("svg");
  });

  it("keeps gradient IDs unique across colocated SVG instances", () => {
    const spectrum = createSpectrumFrame(new Float32Array(16).fill(-24), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 48_000,
    });
    const { container } = render(
      <>
        <Spectrum config={{ colorMode: "gradient", renderer: "svg" }} data={spectrum} />
        <Spectrum config={{ colorMode: "gradient", renderer: "svg" }} data={spectrum} />
      </>,
    );
    const ids = [...container.querySelectorAll("linearGradient, radialGradient")].map(
      (gradient) => gradient.id,
    );
    const references = [...container.querySelectorAll("[fill^='url']")].map((node) =>
      node.getAttribute("fill"),
    );

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(ids.length);
    expect(references).toEqual(expect.arrayContaining(ids.map((id) => `url(#${id})`)));
  });

  it("renders spectrum and meter through SVG and surfaces invalid config as a recoverable alert", () => {
    const spectrum = createSpectrumFrame(new Float32Array(16).fill(-18), {
      fftSize: 32,
      maximumDecibels: 0,
      minimumDecibels: -100,
      sampleRate: 48_000,
    });
    const meter = analyzeMeter(new Float32Array([0.2, -0.7, 0.4]));
    const { rerender } = render(
      <Spectrum ariaLabel="Vector spectrum" config={{ renderer: "svg" }} data={spectrum} />,
    );
    expect(screen.getByRole("img", { name: /Vector spectrum.*16 ordered bins/ })).toHaveAttribute(
      "data-svg-render-status",
      "ready",
    );

    rerender(<Meter ariaLabel="Vector meter" config={{ renderer: "svg" }} data={meter} />);
    expect(screen.getByRole("img", { name: /Vector meter.*RMS display/ })).toHaveAttribute(
      "data-svg-render-status",
      "ready",
    );

    rerender(
      <Waveform
        ariaLabel="Invalid vector waveform"
        config={{ channelLayout: "overlay", channelMode: "mono", renderer: "svg" }}
        data={createDemoWaveform({ sampleCount: 32 })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("MULTI_CHANNEL_LAYOUT_REQUIRED");
    expect(screen.getByRole("img", { name: /Invalid vector waveform/ })).toHaveAttribute(
      "data-svg-render-status",
      "unsupported",
    );
  });

  it("renders a useful SVG image during SSR without browser globals", () => {
    const html = renderToString(
      <Waveform
        ariaLabel="Server vector waveform"
        config={{ renderer: "svg" }}
        data={createDemoWaveform({ sampleCount: 64 })}
      />,
    );
    expect(html).toContain("<svg");
    expect(html).toContain("Server vector waveform");
    expect(html).toContain('data-svg-render-status="ready"');
    expect(html).not.toContain("NaN");
  });
});
