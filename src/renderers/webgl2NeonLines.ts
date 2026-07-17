import {
  createNeonLinesUniformState,
  resolveNeonLinesConfig,
  type NeonLinesConfig,
  type NeonLinesConfigInput,
  type NeonLinesUniformState,
} from "../vfx/neonLines";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { NEON_LINES_FRAGMENT_SHADER } from "./webgl2NeonLinesShader";

export type WebglNeonLinesRenderOptions = WebglBandVfxRenderOptions;
export type WebglNeonLinesRenderer = WebglBandVfxRenderer<NeonLinesConfig, NeonLinesConfigInput>;
export type WebglNeonLinesRendererOptions = WebglBandVfxRendererOptions;

const NEON_LINES_DEFINITION: WebglBandVfxDefinition<
  NeonLinesConfig,
  NeonLinesConfigInput,
  NeonLinesUniformState
> = Object.freeze({
  createUniformState: createNeonLinesUniformState,
  effectId: "neon-lines",
  fragmentShaderSource: NEON_LINES_FRAGMENT_SHADER,
  label: "Neon Lines",
  resolveConfig: resolveNeonLinesConfig,
  uniformNames: Object.freeze([
    "u_line_count",
    "u_wave_height",
    "u_flow_speed",
    "u_line_thickness",
    "u_glow_size",
    "u_energy_reactivity",
    "u_background_color",
    "u_left_color",
    "u_right_color",
    "u_burst_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: NeonLinesUniformState,
  ) {
    gl.uniform1f(uniforms.u_line_count, values.lineCount);
    gl.uniform1f(uniforms.u_wave_height, values.waveHeight);
    gl.uniform1f(uniforms.u_flow_speed, values.flowSpeed);
    gl.uniform1f(uniforms.u_line_thickness, values.lineThickness);
    gl.uniform1f(uniforms.u_glow_size, values.glowSize);
    gl.uniform1f(uniforms.u_energy_reactivity, values.energyReactivity);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_left_color, values.leftColor);
    setWebglColor(gl, uniforms.u_right_color, values.rightColor);
    setWebglColor(gl, uniforms.u_burst_color, values.burstColor);
  },
});

export function createWebglNeonLinesRenderer(
  canvas: HTMLCanvasElement,
  options: WebglNeonLinesRendererOptions = {},
): WebglNeonLinesRenderer {
  return createWebglBandVfxRenderer(canvas, NEON_LINES_DEFINITION, options);
}
