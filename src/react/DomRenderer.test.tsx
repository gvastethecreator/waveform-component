import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { analyzeMeter } from "../analysis/meter";
import { createSpectrumFrame } from "../analysis/spectrum";
import { createDemoWaveform } from "../core/staticFrame";
import { Meter } from "./Meter";
import { Spectrum } from "./Spectrum";
import { Waveform } from "./Waveform";

const spectrum = createSpectrumFrame(new Float32Array(64).fill(-24), {
  fftSize: 128,
  maximumDecibels: 0,
  minimumDecibels: -100,
  sampleRate: 48_000,
});

describe("React DOM/CSS renderer integration", () => {
  it("switches the existing Spectrum interface across DOM, Canvas, and SVG", () => {
    const { rerender } = render(
      <Spectrum
        ariaLabel="Switchable bars"
        config={{ geometry: "bars", renderer: "dom" }}
        data={spectrum}
      />,
    );
    const dom = screen.getByRole("img", { name: /Switchable bars.*64 ordered bins/ });
    expect(dom.tagName).toBe("DIV");
    expect(dom).toHaveAttribute("data-renderer", "dom");
    expect(dom).toHaveAttribute("data-dom-render-status", "ready");

    rerender(
      <Spectrum
        ariaLabel="Switchable bars"
        config={{ geometry: "bars", renderer: "canvas2d" }}
        data={spectrum}
      />,
    );
    expect(screen.getByRole("img", { name: /Switchable bars/ }).tagName).toBe("CANVAS");

    rerender(
      <Spectrum
        ariaLabel="Switchable bars"
        config={{ geometry: "bars", renderer: "svg" }}
        data={spectrum}
      />,
    );
    expect(screen.getByRole("img", { name: /Switchable bars/ }).tagName).toBe("svg");
  });

  it("keeps actual DOM shape count equal to the published bounded count", () => {
    const meter = analyzeMeter([
      new Float32Array([0.2, -0.8, 0.4]),
      new Float32Array([0.1, -0.5, 0.3]),
    ]);
    const { container } = render(
      <Meter
        ariaLabel="Box meter"
        config={{ mode: "stepped-meter", renderer: "dom", stepGap: 3, stepWidth: 8 }}
        data={meter}
      />,
    );
    const image = screen.getByRole("img", { name: /Box meter.*RMS display/ });
    const count = Number(image.getAttribute("data-dom-node-count"));
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(1024);
    expect(container.querySelectorAll("[data-dom-node]")).toHaveLength(count);
    expect(container.querySelectorAll("[data-dom-role='step']").length).toBeGreaterThan(0);
  });

  it("surfaces unsupported curves and time-domain modes as recoverable alerts", () => {
    const { rerender } = render(
      <Spectrum ariaLabel="Unsupported curve" config={{ renderer: "dom" }} data={spectrum} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "DOM/CSS does not support curve spectrum geometry",
    );
    expect(screen.getByRole("img", { name: /Unsupported curve/ })).toHaveAttribute(
      "data-dom-render-status",
      "unsupported",
    );

    rerender(
      <Waveform
        ariaLabel="Unsupported waveform"
        config={{ renderer: "dom" }}
        data={createDemoWaveform({ sampleCount: 32 })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("does not support waveform mode");
    expect(screen.getByRole("img", { name: /Unsupported waveform/ })).toHaveAttribute(
      "data-dom-node-count",
      "0",
    );
  });

  it("renders supported CSS bars during SSR without browser globals", () => {
    const html = renderToString(
      <Spectrum
        ariaLabel="Server CSS bars"
        config={{ geometry: "bars", renderer: "dom" }}
        data={spectrum}
      />,
    );
    expect(html).toContain('data-renderer="dom"');
    expect(html).toContain('data-dom-render-status="ready"');
    expect(html).toContain("Server CSS bars");
    expect(html).not.toContain("NaN");
  });
});
