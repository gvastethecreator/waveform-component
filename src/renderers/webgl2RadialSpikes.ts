import {
  createRadialSpikesUniformState,
  resolveRadialSpikesConfig,
  type RadialSpikesConfig,
  type RadialSpikesConfigInput,
  type RadialSpikesUniformState,
} from "../vfx/radialSpikes";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { RADIAL_SPIKES_FRAGMENT_SHADER } from "./webgl2RadialSpikesShader";

export type WebglRadialSpikesRenderOptions = WebglBandVfxRenderOptions;
export type WebglRadialSpikesRenderer = WebglBandVfxRenderer<
  RadialSpikesConfig,
  RadialSpikesConfigInput
>;
export type WebglRadialSpikesRendererOptions = WebglBandVfxRendererOptions;

const RADIAL_SPIKES_DEFINITION: WebglBandVfxDefinition<
  RadialSpikesConfig,
  RadialSpikesConfigInput,
  RadialSpikesUniformState
> = Object.freeze({
  createUniformState: createRadialSpikesUniformState,
  effectId: "radial-spikes",
  fragmentShaderSource: RADIAL_SPIKES_FRAGMENT_SHADER,
  label: "Radial Spikes",
  resolveConfig: resolveRadialSpikesConfig,
  uniformNames: Object.freeze([
    "u_spike_count",
    "u_base_radius",
    "u_spike_height",
    "u_spike_width",
    "u_arc_degrees",
    "u_rotation_degrees",
    "u_energy_reactivity",
    "u_glow_strength",
    "u_background_color",
    "u_base_color",
    "u_tip_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: RadialSpikesUniformState,
  ) {
    gl.uniform1f(uniforms.u_spike_count, values.spikeCount);
    gl.uniform1f(uniforms.u_base_radius, values.baseRadius);
    gl.uniform1f(uniforms.u_spike_height, values.spikeHeight);
    gl.uniform1f(uniforms.u_spike_width, values.spikeWidth);
    gl.uniform1f(uniforms.u_arc_degrees, values.arcDegrees);
    gl.uniform1f(uniforms.u_rotation_degrees, values.rotationDegrees);
    gl.uniform1f(uniforms.u_energy_reactivity, values.energyReactivity);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_base_color, values.baseColor);
    setWebglColor(gl, uniforms.u_tip_color, values.tipColor);
  },
});

export function createWebglRadialSpikesRenderer(
  canvas: HTMLCanvasElement,
  options: WebglRadialSpikesRendererOptions = {},
): WebglRadialSpikesRenderer {
  return createWebglBandVfxRenderer(canvas, RADIAL_SPIKES_DEFINITION, options);
}
