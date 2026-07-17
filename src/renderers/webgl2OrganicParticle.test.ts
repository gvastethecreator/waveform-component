import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { MAX_VFX_SEED } from "../vfx/liquidBlobs";
import { VFX_TIME_PERIOD_SECONDS } from "../vfx/shared";
import { createWebglLiquidBlobsRenderer } from "./webgl2LiquidBlobs";
import { createWebglStarfieldBurstRenderer } from "./webgl2StarfieldBurst";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.92, highFrequency: 180, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.38, highFrequency: 2_000, id: "mid", lowFrequency: 180 }),
    Object.freeze({ energy: 0.74, highFrequency: 20_000, id: "high", lowFrequency: 2_000 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("WebGL2 organic and particle adapters", () => {
  it("uploads bounded Liquid Blobs controls and wraps a hostile absolute frame", () => {
    const fake = fakeWebgl();
    const renderer = createWebglLiquidBlobsRenderer(canvasWithContext(fake.gl));
    expect(
      renderer.render(
        frame,
        {
          blobCount: 9_000,
          blobSize: 0.31,
          driftSpeed: -0.7,
          glowStrength: 1.8,
          lowFrequencyReactivity: 1.65,
          seed: 99_999,
          threshold: 0.72,
        },
        { timeSeconds: VFX_TIME_PERIOD_SECONDS * 100 + 2.75 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(2.75);
    expect(uniformValue(fake.calls.uniform1f, "u_blob_count")).toBe(24);
    expect(uniformValue(fake.calls.uniform1f, "u_seed")).toBe(MAX_VFX_SEED);
    expect(uniformValue(fake.calls.uniform1f, "u_low_energy")).toBeGreaterThan(0);
    expect(fake.calls.uniform4f).toHaveBeenCalledTimes(4);
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });

  it("uploads Starfield Burst ceilings, transient metrics, and deterministic reduced time", () => {
    const fake = fakeWebgl();
    const renderer = createWebglStarfieldBurstRenderer(canvasWithContext(fake.gl));
    expect(
      renderer.render(
        frame,
        {
          burstSpeed: 1.4,
          seed: 97,
          starCount: 9_000,
          starSize: 3.2,
          trailLength: 0.48,
          transientReactivity: 2.1,
        },
        { reducedMotion: true, timeSeconds: 99_999 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(0);
    expect(uniformValue(fake.calls.uniform1f, "u_star_count")).toBe(256);
    expect(uniformValue(fake.calls.uniform1f, "u_seed")).toBe(97);
    expect(uniformValue(fake.calls.uniform1f, "u_high_energy")).toBeGreaterThan(0);
    expect(uniformValue(fake.calls.uniform1f, "u_transient")).toBeGreaterThan(0);
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });

  it("recreates one resource tuple after real lifecycle events and tears down idempotently", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglStarfieldBurstRenderer(canvas);
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(renderer.getStatus().state).toBe("context-lost");
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(renderer.getStatus()).toMatchObject({ generation: 2, state: "ready" });
    renderer.destroy();
    renderer.destroy();
    expect(renderer.getDiagnostics()).toMatchObject({
      activeBuffers: 0,
      activePrograms: 0,
      activeVertexArrays: 0,
      resourcesInvalidated: 1,
    });
  });
});

function uniformValue(mock: ReturnType<typeof vi.fn>, name: string): number | undefined {
  for (let index = mock.mock.calls.length - 1; index >= 0; index -= 1) {
    const call = mock.mock.calls[index] as unknown[];
    if ((call[0] as { name?: string } | undefined)?.name === name)
      return call[1] as number | undefined;
  }
  return undefined;
}

function canvasWithContext(gl: WebGL2RenderingContext): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockImplementation((kind) => (kind === "webgl2" ? gl : null));
  return canvas;
}

function fakeWebgl() {
  const calls = {
    drawArrays: vi.fn(),
    uniform1f: vi.fn(),
    uniform1fv: vi.fn(),
    uniform2f: vi.fn(),
    uniform4f: vi.fn(),
  };
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
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteVertexArray: vi.fn(),
    disable: vi.fn(),
    drawArrays: calls.drawArrays,
    enableVertexAttribArray: vi.fn(),
    getProgramInfoLog: vi.fn(() => ""),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ""),
    getShaderParameter: vi.fn(() => true),
    getUniformLocation: vi.fn((_program: unknown, name: string) => ({ name })),
    isContextLost: vi.fn(() => false),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    uniform1f: calls.uniform1f,
    uniform1fv: calls.uniform1fv,
    uniform2f: calls.uniform2f,
    uniform4f: calls.uniform4f,
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: vi.fn(),
  } as unknown as WebGL2RenderingContext;
  return { calls, gl };
}
