import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { createWebglPulseRingRenderer } from "./webgl2PulseRing";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.25, highFrequency: 200, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.75, highFrequency: 2_000, id: "mid", lowFrequency: 200 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("WebGL2 Pulse Ring adapter", () => {
  it("surfaces unavailable context instead of leaving a blank canvas", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    const renderer = createWebglPulseRingRenderer(canvas);
    expect(renderer.getStatus()).toMatchObject({
      code: "WEBGL2_UNAVAILABLE",
      recoverable: false,
      state: "unavailable",
    });
    expect(renderer.render(frame)).toBe(false);
    renderer.destroy();
    expect(renderer.getStatus().state).toBe("destroyed");
  });

  it("reports shader compile and program link logs with partial cleanup", () => {
    const compileFailure = fakeWebgl({ compile: false });
    const compileCanvas = canvasWithContext(compileFailure.gl);
    const compileRenderer = createWebglPulseRingRenderer(compileCanvas);
    expect(compileRenderer.getStatus()).toMatchObject({
      code: "WEBGL2_SHADER_COMPILE",
      state: "error",
    });
    expect(compileRenderer.getStatus().message).toContain("test compiler log");
    expect(compileFailure.calls.deleteShader).toHaveBeenCalledTimes(1);

    const linkFailure = fakeWebgl({ link: false });
    const linkRenderer = createWebglPulseRingRenderer(canvasWithContext(linkFailure.gl));
    expect(linkRenderer.getStatus()).toMatchObject({
      code: "WEBGL2_PROGRAM_LINK",
      state: "error",
    });
    expect(linkRenderer.getStatus().message).toContain("test linker log");
    expect(linkFailure.calls.deleteProgram).toHaveBeenCalledTimes(1);
    expect(linkFailure.calls.deleteShader).toHaveBeenCalledTimes(2);
  });

  it("maps resize, deterministic time, band values, colors, and draw state", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglPulseRingRenderer(canvas);
    expect(renderer.getStatus()).toMatchObject({ generation: 1, state: "ready" });
    const size = renderer.resize(800, 400, 3, { quality: "balanced" });
    expect(size).toMatchObject({ bufferHeight: 600, bufferWidth: 1200 });
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(600);
    expect(fake.calls.viewport).toHaveBeenLastCalledWith(0, 0, 1200, 600);

    expect(
      renderer.render(
        frame,
        {
          bandReactivity: 1.5,
          glowStrength: 1.25,
          primaryColor: "#ff0000",
          rotationSpeed: -0.2,
          thickness: 0.08,
        },
        { timeSeconds: 4.5 },
      ),
    ).toBe(true);
    expect(fake.calls.uniform2f).toHaveBeenCalledWith(expect.anything(), 1200, 600);
    expect(fake.calls.uniform1fv.mock.calls.at(-1)?.[1]).toEqual(
      Float32Array.from([0.25, 0.75, ...Array.from({ length: 14 }, () => 0)]),
    );
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(4.5);
    expect(uniformValue(fake.calls.uniform1f, "u_band_count")).toBe(2);
    expect(uniformValue(fake.calls.uniform1f, "u_band_reactivity")).toBe(1.5);
    expect(uniformValue(fake.calls.uniform1f, "u_glow_strength")).toBe(1.25);
    expect(uniformValue(fake.calls.uniform1f, "u_rotation_speed")).toBe(-0.2);
    expect(uniformValue(fake.calls.uniform1f, "u_thickness")).toBe(0.08);
    expect(fake.calls.uniform4f).toHaveBeenCalledWith(expect.anything(), 1, 0, 0, 1);
    expect(fake.calls.drawArrays).toHaveBeenCalledWith(fake.gl.TRIANGLES, 0, 3);
    expect(renderer.getDiagnostics()).toMatchObject({
      activeBuffers: 1,
      activePrograms: 1,
      activeVertexArrays: 1,
      drawCalls: 1,
    });

    renderer.render(frame, {}, { reducedMotion: true, timeSeconds: 99 });
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(0);
  });

  it("invalidates on real event semantics, rebuilds on restoration, and destroys once", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglPulseRingRenderer(canvas);
    const states: string[] = [];
    renderer.subscribe(() => states.push(renderer.getStatus().state));

    const lost = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.getStatus()).toMatchObject({
      code: "WEBGL2_CONTEXT_LOST",
      generation: 1,
      recoverable: true,
      state: "context-lost",
    });
    expect(renderer.getDiagnostics()).toMatchObject({
      activeBuffers: 0,
      activePrograms: 0,
      activeVertexArrays: 0,
      resourcesInvalidated: 1,
    });
    expect(renderer.render(frame)).toBe(false);

    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(states).toEqual(["context-lost", "restoring", "ready"]);
    expect(renderer.getStatus()).toMatchObject({ generation: 2, state: "ready" });
    expect(renderer.getDiagnostics()).toMatchObject({
      activeBuffers: 1,
      activePrograms: 1,
      activeVertexArrays: 1,
      buffersCreated: 2,
      programsCreated: 2,
      vertexArraysCreated: 2,
    });

    renderer.destroy();
    renderer.destroy();
    expect(renderer.getDiagnostics()).toMatchObject({
      activeBuffers: 0,
      activePrograms: 0,
      activeVertexArrays: 0,
      buffersDeleted: 1,
      programsDeleted: 1,
      vertexArraysDeleted: 1,
    });
    expect(states.at(-1)).toBe("destroyed");
    expect(renderer.render(frame)).toBe(false);
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(renderer.getStatus().state).toBe("destroyed");
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

function fakeWebgl(options: { compile?: boolean; link?: boolean } = {}) {
  const locations = new Map<string, { name: string }>();
  const calls = {
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteVertexArray: vi.fn(),
    drawArrays: vi.fn(),
    uniform1f: vi.fn(),
    uniform1fv: vi.fn(),
    uniform2f: vi.fn(),
    uniform4f: vi.fn(),
    viewport: vi.fn(),
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
    deleteBuffer: calls.deleteBuffer,
    deleteProgram: calls.deleteProgram,
    deleteShader: calls.deleteShader,
    deleteVertexArray: calls.deleteVertexArray,
    disable: vi.fn(),
    drawArrays: calls.drawArrays,
    enableVertexAttribArray: vi.fn(),
    getProgramInfoLog: vi.fn(() => "test linker log"),
    getProgramParameter: vi.fn(() => options.link ?? true),
    getShaderInfoLog: vi.fn(() => "test compiler log"),
    getShaderParameter: vi.fn(() => options.compile ?? true),
    getUniformLocation: vi.fn((_program: unknown, name: string) => {
      const location = { name };
      locations.set(name, location);
      return location;
    }),
    isContextLost: vi.fn(() => false),
    linkProgram: vi.fn(),
    shaderSource: vi.fn(),
    uniform1f: calls.uniform1f,
    uniform1fv: calls.uniform1fv,
    uniform2f: calls.uniform2f,
    uniform4f: calls.uniform4f,
    useProgram: vi.fn(),
    vertexAttribPointer: vi.fn(),
    viewport: calls.viewport,
  } as unknown as WebGL2RenderingContext;
  return { calls, gl, locations };
}
