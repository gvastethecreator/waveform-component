import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { createWebglEqualizerGridRenderer } from "./webgl2EqualizerGrid";
import { createWebglNeonLinesRenderer } from "./webgl2NeonLines";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({
      energy: 0.2,
      highFrequency: 200,
      id: "low",
      lowFrequency: 20,
    }),
    Object.freeze({
      energy: 0.65,
      highFrequency: 2_000,
      id: "mid",
      lowFrequency: 200,
    }),
    Object.freeze({
      energy: 1,
      highFrequency: 20_000,
      id: "high",
      lowFrequency: 2_000,
    }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("WebGL2 Neon Lines adapter", () => {
  it("uploads bounded line, energy, time, and color uniforms into one draw", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglNeonLinesRenderer(canvas);
    expect(renderer.effectId).toBe("neon-lines");
    expect(renderer.getStatus()).toMatchObject({
      generation: 1,
      state: "ready",
    });
    expect(
      fake.calls.shaderSource.mock.calls.some((call) => String(call[1]).includes("MAX_LINES = 12")),
    ).toBe(true);

    renderer.resize(960, 320, 2, { quality: "low" });
    expect(canvas).toMatchObject({ height: 320, width: 960 });
    expect(
      renderer.render(
        frame,
        {
          burstColor: "#ffffff",
          energyReactivity: 1.4,
          flowSpeed: -0.5,
          glowSize: 2,
          leftColor: "#ff0000",
          lineCount: 999,
          lineThickness: 0.02,
          rightColor: "#00ff00",
          waveHeight: 0.3,
        },
        { timeSeconds: 2.5 },
      ),
    ).toBe(true);

    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(2.5);
    expect(uniformValue(fake.calls.uniform1f, "u_line_count")).toBe(12);
    expect(uniformValue(fake.calls.uniform1f, "u_wave_height")).toBe(0.3);
    expect(uniformValue(fake.calls.uniform1f, "u_flow_speed")).toBe(-0.5);
    expect(uniformValue(fake.calls.uniform1f, "u_line_thickness")).toBe(0.02);
    expect(uniformValue(fake.calls.uniform1f, "u_glow_size")).toBe(2);
    expect(uniformValue(fake.calls.uniform1f, "u_energy_reactivity")).toBe(1.4);
    expect(fake.calls.uniform1fv.mock.calls.at(-1)?.[1]).toEqual(
      Float32Array.from([0.2, 0.65, 1, ...Array.from({ length: 13 }, () => 0)]),
    );
    expect(fake.calls.uniform4f).toHaveBeenCalledWith(expect.anything(), 1, 0, 0, 1);
    expect(fake.calls.uniform4f).toHaveBeenCalledWith(expect.anything(), 0, 1, 0, 1);
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });
});

describe("WebGL2 Equalizer Grid adapter", () => {
  it("uploads independently bounded grid axes and deterministic reduced-motion state", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglEqualizerGridRenderer(canvas);
    expect(renderer.effectId).toBe("equalizer-grid");
    expect(renderer.getStatus().state).toBe("ready");

    expect(
      renderer.render(
        frame,
        {
          cellGap: 0.2,
          cellReactivity: 1.7,
          gradientColor1: "#ff0000",
          gradientColor2: "#00ff00",
          gradientColor3: "#0000ff",
          gradientColor4: "#ffffff",
          gridColumns: 100,
          gridRows: -5,
          randomSpeed: 0.9,
        },
        { reducedMotion: true, timeSeconds: 99 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(0);
    expect(uniformValue(fake.calls.uniform1f, "u_grid_columns")).toBe(48);
    expect(uniformValue(fake.calls.uniform1f, "u_grid_rows")).toBe(2);
    expect(uniformValue(fake.calls.uniform1f, "u_cell_gap")).toBe(0.2);
    expect(uniformValue(fake.calls.uniform1f, "u_cell_reactivity")).toBe(1.7);
    expect(uniformValue(fake.calls.uniform1f, "u_random_speed")).toBe(0.9);
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);

    const lost = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.getStatus().state).toBe("context-lost");
    expect(renderer.render(frame)).toBe(false);
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(renderer.getStatus()).toMatchObject({
      generation: 2,
      state: "ready",
    });
    renderer.destroy();
    expect(renderer.getDiagnostics()).toMatchObject({
      activeBuffers: 0,
      activePrograms: 0,
      activeVertexArrays: 0,
      resourcesInvalidated: 1,
    });
  });

  it("surfaces unavailable WebGL2 without attempting a draw", () => {
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getContext").mockReturnValue(null);
    const renderer = createWebglEqualizerGridRenderer(canvas);
    expect(renderer.getStatus()).toMatchObject({
      code: "WEBGL2_UNAVAILABLE",
      recoverable: false,
      state: "unavailable",
    });
    expect(renderer.render(frame)).toBe(false);
    renderer.destroy();
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
    shaderSource: vi.fn(),
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
    shaderSource: calls.shaderSource,
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
