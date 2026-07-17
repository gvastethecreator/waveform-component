import { act, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { LiquidBlobs } from "./LiquidBlobs";
import { StarfieldBurst } from "./StarfieldBurst";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.78, highFrequency: 240, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.43, highFrequency: 2_400, id: "mid", lowFrequency: 240 }),
    Object.freeze({ energy: 0.9, highFrequency: 20_000, id: "high", lowFrequency: 2_400 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("organic and particle React surfaces", () => {
  it("renders distinct semantic fallbacks when WebGL2 is unavailable", async () => {
    const { container } = render(
      <>
        <LiquidBlobs ariaLabel="Unavailable liquid" data={frame} />
        <StarfieldBurst ariaLabel="Unavailable stars" data={frame} />
      </>,
    );
    await waitFor(() =>
      expect(container.querySelectorAll("[data-webgl-state='unavailable']")).toHaveLength(2),
    );
    expect(
      screen.getByRole("img", { name: /Unavailable liquid.*3 energy bands/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Unavailable stars.*3 energy bands/ }),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-liquid-blobs-state='ready']")).toHaveAttribute(
      "data-vfx-mode",
      "liquid-blobs",
    );
    expect(container.querySelector("[data-starfield-burst-state='ready']")).toHaveAttribute(
      "data-vfx-mode",
      "starfield-burst",
    );
  });

  it("is SSR-safe and preserves deterministic seed markup", () => {
    const liquid = renderToString(<LiquidBlobs config={{ seed: 41 }} data={frame} />);
    const stars = renderToString(<StarfieldBurst config={{ seed: 71 }} data={frame} />);
    expect(liquid).toContain('data-webgl-canvas="liquid-blobs"');
    expect(stars).toContain('data-webgl-canvas="starfield-burst"');
    expect(liquid).toContain("Initializing WebGL2");
    expect(stars).toContain("Initializing WebGL2");
  });

  it("pauses the active RAF while offscreen and resumes without rebuilding resources", async () => {
    const fake = fakeWebgl();
    const contextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((kind) => (kind === "webgl2" ? fake.gl : null));
    const originalMatchMedia = window.matchMedia;
    const OriginalResizeObserver = window.ResizeObserver;
    const OriginalIntersectionObserver = window.IntersectionObserver;
    const intersections: Array<{
      callback: IntersectionObserverCallback;
      target?: Element;
    }> = [];
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      }),
    });
    window.ResizeObserver = class {
      disconnect() {}
      observe() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    window.IntersectionObserver = class {
      readonly root = null;
      readonly rootMargin = "64px";
      readonly thresholds = [0];
      private readonly record: (typeof intersections)[number];
      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback };
        intersections.push(this.record);
      }
      disconnect() {}
      observe(target: Element) {
        this.record.target = target;
      }
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      unobserve() {}
    } as unknown as typeof IntersectionObserver;
    let nextFrame = 0;
    const requestFrame = vi.fn(() => ++nextFrame);
    const cancelFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestFrame);
    vi.stubGlobal("cancelAnimationFrame", cancelFrame);

    try {
      const { container, unmount } = render(<LiquidBlobs data={frame} />);
      const surface = await waitFor(() => {
        const candidate = container.querySelector("[data-webgl-state='ready']");
        expect(candidate).toHaveAttribute("data-webgl-animation", "running");
        return candidate as HTMLElement;
      });
      expect(intersections).toHaveLength(1);
      act(() => intersections[0].callback([entry(intersections[0].target!, false)], {} as never));
      await waitFor(() => expect(surface).toHaveAttribute("data-webgl-animation", "paused"));
      expect(surface).toHaveAttribute("data-webgl-visible", "false");
      expect(cancelFrame).toHaveBeenCalled();
      const generation = surface.dataset.webglGeneration;
      act(() => intersections[0].callback([entry(intersections[0].target!, true)], {} as never));
      await waitFor(() => expect(surface).toHaveAttribute("data-webgl-animation", "running"));
      expect(surface.dataset.webglGeneration).toBe(generation);
      expect(requestFrame.mock.calls.length).toBeGreaterThan(1);
      unmount();
      expect(fake.deleteProgram).toHaveBeenCalledTimes(1);
    } finally {
      contextSpy.mockRestore();
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
      window.ResizeObserver = OriginalResizeObserver;
      window.IntersectionObserver = OriginalIntersectionObserver;
      vi.unstubAllGlobals();
    }
  });
});

function entry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return {
    boundingClientRect: target.getBoundingClientRect(),
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: target.getBoundingClientRect(),
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  };
}

function fakeWebgl() {
  const deleteProgram = vi.fn();
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
    deleteBuffer: vi.fn(),
    deleteProgram,
    deleteShader: vi.fn(),
    deleteVertexArray: vi.fn(),
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
  return { deleteProgram, gl };
}
