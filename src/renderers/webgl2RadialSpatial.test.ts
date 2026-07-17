import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { createWebglRadialSpikesRenderer } from "./webgl2RadialSpikes";
import { createWebglTunnelWavesRenderer } from "./webgl2TunnelWaves";
import { createWebglVortexRingsRenderer } from "./webgl2VortexRings";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.16, highFrequency: 200, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.58, highFrequency: 2_000, id: "mid", lowFrequency: 200 }),
    Object.freeze({ energy: 0.94, highFrequency: 20_000, id: "high", lowFrequency: 2_000 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("WebGL2 Radial Spikes adapter", () => {
  it("uploads bounded angular geometry and ordered energy in one draw", () => {
    const fake = fakeWebgl();
    const renderer = createWebglRadialSpikesRenderer(canvasWithContext(fake.gl));
    expect(renderer.effectId).toBe("radial-spikes");
    expect(
      renderer.render(
        frame,
        {
          arcDegrees: 245,
          baseRadius: 0.44,
          energyReactivity: 1.6,
          glowStrength: 1.8,
          rotationDegrees: -35,
          spikeCount: 9_000,
          spikeHeight: 0.9,
          spikeWidth: 0.37,
        },
        { timeSeconds: 3.25 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(3.25);
    expect(uniformValue(fake.calls.uniform1f, "u_spike_count")).toBe(128);
    expect(uniformValue(fake.calls.uniform1f, "u_base_radius")).toBe(0.44);
    expect(uniformValue(fake.calls.uniform1f, "u_spike_height")).toBeCloseTo(0.48);
    expect(uniformValue(fake.calls.uniform1f, "u_spike_width")).toBe(0.37);
    expect(uniformValue(fake.calls.uniform1f, "u_arc_degrees")).toBe(245);
    expect(uniformValue(fake.calls.uniform1f, "u_rotation_degrees")).toBe(-35);
    expect(fake.calls.uniform1fv.mock.calls.at(-1)?.[1]).toEqual(
      Float32Array.from([0.16, 0.58, 0.94, ...Array.from({ length: 13 }, () => 0)]),
    );
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });
});

describe("WebGL2 Tunnel Waves adapter", () => {
  it("uploads perspective, direction, density, response, and all color roles", () => {
    const fake = fakeWebgl();
    const renderer = createWebglTunnelWavesRenderer(canvasWithContext(fake.gl));
    expect(renderer.effectId).toBe("tunnel-waves");
    expect(
      renderer.render(
        frame,
        {
          energyReactivity: 1.35,
          glowStrength: 1.5,
          ringDensity: 10_000,
          tunnelDepth: 0.82,
          tunnelSpeed: -0.65,
        },
        { reducedMotion: true, timeSeconds: 99 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(0);
    expect(uniformValue(fake.calls.uniform1f, "u_ring_density")).toBe(48);
    expect(uniformValue(fake.calls.uniform1f, "u_tunnel_speed")).toBe(-0.65);
    expect(uniformValue(fake.calls.uniform1f, "u_tunnel_depth")).toBe(0.82);
    expect(uniformValue(fake.calls.uniform1f, "u_energy_reactivity")).toBe(1.35);
    expect(uniformValue(fake.calls.uniform1f, "u_glow_strength")).toBe(1.5);
    expect(fake.calls.uniform4f).toHaveBeenCalledTimes(4);
    renderer.destroy();
  });
});

describe("WebGL2 Vortex Rings adapter", () => {
  it("uploads a bounded spiral and rebuilds every owned resource after context loss", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglVortexRingsRenderer(canvas);
    expect(renderer.effectId).toBe("vortex-rings");
    expect(
      renderer.render(frame, {
        energyReactivity: 1.7,
        glowStrength: 2.1,
        ringDensity: 8_000,
        spinSpeed: -0.7,
        twistAmount: 3.2,
        vortexRadius: 0.88,
      }),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_twist_amount")).toBe(3.2);
    expect(uniformValue(fake.calls.uniform1f, "u_spin_speed")).toBe(-0.7);
    expect(uniformValue(fake.calls.uniform1f, "u_ring_density")).toBe(48);
    expect(uniformValue(fake.calls.uniform1f, "u_vortex_radius")).toBe(0.88);
    const lost = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.getStatus().state).toBe("context-lost");
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(renderer.getStatus()).toMatchObject({ generation: 2, state: "ready" });
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
