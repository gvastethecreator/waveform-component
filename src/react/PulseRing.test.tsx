import { render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { PulseRing } from "./PulseRing";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.2, highFrequency: 200, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.8, highFrequency: 2_000, id: "high", lowFrequency: 200 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("Pulse Ring React surface", () => {
  it("renders a semantic static fallback when WebGL2 is unavailable", async () => {
    const { container } = render(<PulseRing ariaLabel="Unavailable ring" data={frame} />);
    await waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute("data-webgl-state", "unavailable"),
    );
    expect(
      screen.getByRole("img", { name: /Unavailable ring.*2 energy bands/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("WEBGL2_UNAVAILABLE");
    expect(screen.getByRole("status")).toHaveTextContent("choose another renderer");
    expect(container.querySelector("[data-webgl-fallback='unavailable']")).toBeInTheDocument();
  });

  it("stays SSR-safe and names initialization instead of touching browser globals", () => {
    const html = renderToString(<PulseRing ariaLabel="Server ring" data={frame} />);
    expect(html).toContain('data-renderer="webgl2"');
    expect(html).toContain('data-webgl-state="initializing"');
    expect(html).toContain("Server ring. 2 energy bands.");
    expect(html).toContain("Initializing WebGL2");
  });

  it("draws one reduced-motion frame and releases observer plus GPU resources", async () => {
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
    const disconnect = vi.fn();
    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class {
      disconnect = disconnect;
      observe() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    const requestFrame = vi.fn(() => 1);
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    try {
      const { container, rerender, unmount } = render(
        <PulseRing ariaLabel="Static ring" data={frame} config={{ thickness: 0.05 }} />,
      );
      await waitFor(() =>
        expect(container.firstElementChild).toHaveAttribute("data-webgl-state", "ready"),
      );
      await waitFor(() =>
        expect(container.querySelector("canvas")).toHaveAttribute("data-webgl-draw-calls", "1"),
      );
      expect(container.firstElementChild).toHaveAttribute("data-webgl-animation", "static");
      expect(container.firstElementChild).toHaveAttribute("data-webgl-resources", "1/1/1");
      expect(requestFrame).not.toHaveBeenCalled();

      rerender(<PulseRing ariaLabel="Static ring" data={frame} config={{ thickness: 0.1 }} />);
      await waitFor(() =>
        expect(Number(container.querySelector("canvas")?.dataset.webglDrawCalls)).toBeGreaterThan(
          1,
        ),
      );
      unmount();
      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(fake.deleteBuffer).toHaveBeenCalledTimes(1);
      expect(fake.deleteProgram).toHaveBeenCalledTimes(1);
      expect(fake.deleteVertexArray).toHaveBeenCalledTimes(1);
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
