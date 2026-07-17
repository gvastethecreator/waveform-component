import { describe, expect, it, vi } from "vitest";
import type { BandEnergyFrame } from "../types";
import { createWebglRoundedWobbleBarsRenderer } from "./webgl2RoundedWobbleBars";
import { createWebglSpectrumBarsVfxRenderer } from "./webgl2SpectrumBarsVfx";
import { createWebglWaveformRibbonRenderer } from "./webgl2WaveformRibbon";

const frame: BandEnergyFrame = Object.freeze({
  bands: Object.freeze([
    Object.freeze({ energy: 0.2, highFrequency: 200, id: "low", lowFrequency: 20 }),
    Object.freeze({ energy: 0.65, highFrequency: 2_000, id: "mid", lowFrequency: 200 }),
    Object.freeze({ energy: 1, highFrequency: 20_000, id: "high", lowFrequency: 2_000 }),
  ]),
  kind: "bands",
  state: "ready",
});

describe("WebGL2 Waveform Ribbon adapter", () => {
  it("uploads reflection, geometry, ordered energy, time, and color in one draw", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglWaveformRibbonRenderer(canvas);
    expect(renderer.effectId).toBe("waveform-ribbon");
    expect(renderer.getStatus()).toMatchObject({ generation: 1, state: "ready" });
    expect(
      fake.calls.shaderSource.mock.calls.some((call) =>
        String(call[1]).includes("u_reflection_strength"),
      ),
    ).toBe(true);
    expect(
      renderer.render(
        frame,
        {
          energyReactivity: 1.6,
          flowSpeed: -0.7,
          glowStrength: 2,
          reflectionStrength: 0.75,
          ribbonThickness: 0.18,
          waveHeight: 0.3,
        },
        { timeSeconds: 3.5 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(3.5);
    expect(uniformValue(fake.calls.uniform1f, "u_wave_height")).toBe(0.3);
    expect(uniformValue(fake.calls.uniform1f, "u_flow_speed")).toBe(-0.7);
    expect(uniformValue(fake.calls.uniform1f, "u_ribbon_thickness")).toBe(0.18);
    expect(uniformValue(fake.calls.uniform1f, "u_glow_strength")).toBe(2);
    expect(uniformValue(fake.calls.uniform1f, "u_reflection_strength")).toBe(0.75);
    expect(uniformValue(fake.calls.uniform1f, "u_energy_reactivity")).toBe(1.6);
    expect(fake.calls.uniform1fv.mock.calls.at(-1)?.[1]).toEqual(
      Float32Array.from([0.2, 0.65, 1, ...Array.from({ length: 13 }, () => 0)]),
    );
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });
});

describe("WebGL2 Rounded Wobble Bars adapter", () => {
  it("bounds density and uploads a real boolean mirror uniform", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglRoundedWobbleBarsRenderer(canvas);
    expect(renderer.effectId).toBe("rounded-wobble-bars");
    expect(
      renderer.render(
        frame,
        {
          barCount: 8_000,
          barGap: 0.4,
          energyReactivity: 1.3,
          glowIntensity: 1.7,
          mirrorVertically: false,
          wobbleIntensity: 0.8,
        },
        { reducedMotion: true, timeSeconds: 99 },
      ),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_time")).toBe(0);
    expect(uniformValue(fake.calls.uniform1f, "u_bar_count")).toBe(64);
    expect(uniformValue(fake.calls.uniform1f, "u_bar_gap")).toBe(0.4);
    expect(uniformValue(fake.calls.uniform1f, "u_mirror_vertically")).toBe(0);
    expect(uniformValue(fake.calls.uniform1f, "u_wobble_intensity")).toBe(0.8);
    expect(fake.calls.drawArrays).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });
});

describe("WebGL2 Spectrum Bars VFX adapter", () => {
  it("bounds 96 procedural bars and recovers all owned resources", () => {
    const fake = fakeWebgl();
    const canvas = canvasWithContext(fake.gl);
    const renderer = createWebglSpectrumBarsVfxRenderer(canvas);
    expect(renderer.effectId).toBe("spectrum-bars");
    expect(
      renderer.render(frame, {
        barCount: 1_000,
        gapSize: 0.3,
        glowStrength: 1.8,
        heightReactivity: 1.5,
        randomSpeed: 0.65,
        verticalPosition: 0.42,
      }),
    ).toBe(true);
    expect(uniformValue(fake.calls.uniform1f, "u_bar_count")).toBe(96);
    expect(uniformValue(fake.calls.uniform1f, "u_gap_size")).toBe(0.3);
    expect(uniformValue(fake.calls.uniform1f, "u_height_reactivity")).toBe(1.5);
    expect(uniformValue(fake.calls.uniform1f, "u_vertical_position")).toBe(0.42);
    expect(uniformValue(fake.calls.uniform1f, "u_random_speed")).toBe(0.65);
    const lost = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.getStatus().state).toBe("context-lost");
    expect(renderer.render(frame)).toBe(false);
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
