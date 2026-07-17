import {
  createStarfieldBurstUniformState,
  resolveStarfieldBurstConfig,
  type StarfieldBurstConfig,
  type StarfieldBurstConfigInput,
  type StarfieldBurstUniformState,
} from "../vfx/starfieldBurst";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { STARFIELD_BURST_FRAGMENT_SHADER } from "./webgl2StarfieldBurstShader";

export type WebglStarfieldBurstRenderOptions = WebglBandVfxRenderOptions;
export type WebglStarfieldBurstRenderer = WebglBandVfxRenderer<
  StarfieldBurstConfig,
  StarfieldBurstConfigInput
>;
export type WebglStarfieldBurstRendererOptions = WebglBandVfxRendererOptions;

const STARFIELD_BURST_DEFINITION: WebglBandVfxDefinition<
  StarfieldBurstConfig,
  StarfieldBurstConfigInput,
  StarfieldBurstUniformState
> = Object.freeze({
  createUniformState: createStarfieldBurstUniformState,
  effectId: "starfield-burst",
  fragmentShaderSource: STARFIELD_BURST_FRAGMENT_SHADER,
  label: "Starfield Burst",
  resolveConfig: resolveStarfieldBurstConfig,
  uniformNames: Object.freeze([
    "u_star_count",
    "u_burst_speed",
    "u_star_size",
    "u_trail_length",
    "u_transient_reactivity",
    "u_high_energy",
    "u_transient",
    "u_seed",
    "u_background_color",
    "u_core_color",
    "u_edge_color",
    "u_treble_flash_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: StarfieldBurstUniformState,
  ) {
    gl.uniform1f(uniforms.u_star_count, values.starCount);
    gl.uniform1f(uniforms.u_burst_speed, values.burstSpeed);
    gl.uniform1f(uniforms.u_star_size, values.starSize);
    gl.uniform1f(uniforms.u_trail_length, values.trailLength);
    gl.uniform1f(uniforms.u_transient_reactivity, values.transientReactivity);
    gl.uniform1f(uniforms.u_high_energy, values.highEnergy);
    gl.uniform1f(uniforms.u_transient, values.transient);
    gl.uniform1f(uniforms.u_seed, values.seed);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_core_color, values.coreColor);
    setWebglColor(gl, uniforms.u_edge_color, values.edgeColor);
    setWebglColor(gl, uniforms.u_treble_flash_color, values.trebleFlashColor);
  },
});

export function createWebglStarfieldBurstRenderer(
  canvas: HTMLCanvasElement,
  options: WebglStarfieldBurstRendererOptions = {},
): WebglStarfieldBurstRenderer {
  return createWebglBandVfxRenderer(canvas, STARFIELD_BURST_DEFINITION, options);
}
