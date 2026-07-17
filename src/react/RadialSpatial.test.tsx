import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { RadialSpikes } from "./RadialSpikes";
import { TunnelWaves } from "./TunnelWaves";
import { VortexRings } from "./VortexRings";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.2, highFrequency: 200, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.8, highFrequency: 2_000, id: "high", lowFrequency: 200 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("radial spatial React surfaces", () => {
  it("renders distinct semantic fallbacks when WebGL2 is unavailable", async () => {
    const { container } = render(
      <>
        <RadialSpikes ariaLabel="Unavailable spikes" data={frame} />
        <TunnelWaves ariaLabel="Unavailable tunnel" data={frame} />
        <VortexRings ariaLabel="Unavailable vortex" data={frame} />
      </>,
    );
    await waitFor(() =>
      expect(container.querySelectorAll("[data-webgl-state='unavailable']")).toHaveLength(3),
    );
    expect(
      screen.getByRole("img", { name: /Unavailable spikes.*2 energy bands/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Unavailable tunnel.*2 energy bands/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Unavailable vortex.*2 energy bands/ }),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-radial-spikes-state='ready']")).toHaveAttribute(
      "data-vfx-mode",
      "radial-spikes",
    );
    expect(container.querySelector("[data-tunnel-waves-state='ready']")).toHaveAttribute(
      "data-vfx-mode",
      "tunnel-waves",
    );
    expect(container.querySelector("[data-vortex-rings-state='ready']")).toHaveAttribute(
      "data-vfx-mode",
      "vortex-rings",
    );
  });

  it("is SSR-safe and names every initializing GPU contract", () => {
    const spikes = renderToString(<RadialSpikes ariaLabel="Server spikes" data={frame} />);
    const tunnel = renderToString(<TunnelWaves ariaLabel="Server tunnel" data={frame} />);
    const vortex = renderToString(<VortexRings ariaLabel="Server vortex" data={frame} />);
    expect(spikes).toContain('data-webgl-canvas="radial-spikes"');
    expect(tunnel).toContain('data-webgl-canvas="tunnel-waves"');
    expect(vortex).toContain('data-webgl-canvas="vortex-rings"');
    expect([spikes, tunnel, vortex].every((markup) => markup.includes("Initializing WebGL2"))).toBe(
      true,
    );
  });

  it("draws one reduced-motion frame and tears down all three surfaces", async () => {
    const fake = fakeWebgl();
    const contextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((kind) => (kind === "webgl2" ? fake.gl : null));
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      }),
    });
    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      disconnect() {}
      observe() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    const requestFrame = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    try {
      const { container, unmount } = render(
        <>
          <RadialSpikes data={frame} />
          <TunnelWaves data={frame} />
          <VortexRings data={frame} />
        </>,
      );
      await waitFor(() =>
        expect(container.querySelectorAll("[data-webgl-state='ready']")).toHaveLength(3),
      );
      await waitFor(() => {
        const canvases = [...container.querySelectorAll("canvas")];
        expect(canvases).toHaveLength(3);
        canvases.forEach((canvas) => expect(canvas.dataset.webglDrawCalls).toBe("1"));
      });
      expect(requestFrame).not.toHaveBeenCalled();
      unmount();
      expect(fake.deleteBuffer).toHaveBeenCalledTimes(3);
      expect(fake.deleteProgram).toHaveBeenCalledTimes(3);
      expect(fake.deleteVertexArray).toHaveBeenCalledTimes(3);
    } finally {
      contextSpy.mockRestore();
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
      window.ResizeObserver = OriginalResizeObserver;
      vi.unstubAllGlobals();
    }
  });
});

function fakeWebgl() {
  const deleteBuffer = vi.fn();
  const deleteProgram = vi.fn();
  const deleteVertexArray = vi.fn();
  const gl = {
    ARRAY_BUFFER: 0x8892,
    COMPILE_STATUS: 0x8b81,
    CULL_FACE: 0x0b44,
    DEPTH_TEST: 0x0b71,
    FLOAT: 0x1406,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: 0x8b82,
    STATIC_DRAW: 0x88e4,
    TRIANGLES: 0x0004,
    VERTEX_SHADER: 0x8b31,
    attachShader: vi.fn(),
    bindBuffer: vi.fn(),
    bindVertexArray: vi.fn(),
    bufferData: vi.fn(),
    compileShader: vi.fn(),
    createBuffer: vi.fn(() => ({ kind: "buffer" })),
    createProgram: vi.fn(() => ({ kind: "program" })),
    createShader: vi.fn(() => ({ kind: "shader" })),
    createVertexArray: vi.fn(() => ({ kind: "vertex-array" })),
    deleteBuffer,
    deleteProgram,
    deleteShader: vi.fn(),
    deleteVertexArray,
    disable: vi.fn(),
    drawArrays: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    getProgramInfoLog: vi.fn(() => ""),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ""),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_program: unknown, name: string) => ({ name })),
    isContextLost: vi.fn(() => false),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    uniform1f: vi.fn(),
    uniform1fv: vi.fn(),
    uniform2f: vi.fn(),
    uniform4f: vi.fn(),
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  } as unknown as WebGL2RenderingContext;
  return { deleteBuffer, deleteProgram, deleteVertexArray, gl };
}
