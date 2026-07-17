import {
  createVortexRingsUniformState,
  resolveVortexRingsConfig,
  type VortexRingsConfig,
  type VortexRingsConfigInput,
  type VortexRingsUniformState,
} from "../vfx/vortexRings";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { VORTEX_RINGS_FRAGMENT_SHADER } from "./webgl2VortexRingsShader";

export type WebglVortexRingsRenderOptions = WebglBandVfxRenderOptions;
export type WebglVortexRingsRenderer = WebglBandVfxRenderer<
  VortexRingsConfig,
  VortexRingsConfigInput
>;
export type WebglVortexRingsRendererOptions = WebglBandVfxRendererOptions;

const VORTEX_RINGS_DEFINITION: WebglBandVfxDefinition<
  VortexRingsConfig,
  VortexRingsConfigInput,
  VortexRingsUniformState
> = Object.freeze({
  createUniformState: createVortexRingsUniformState,
  effectId: "vortex-rings",
  fragmentShaderSource: VORTEX_RINGS_FRAGMENT_SHADER,
  label: "Vortex Rings",
  resolveConfig: resolveVortexRingsConfig,
  uniformNames: Object.freeze([
    "u_twist_amount",
    "u_spin_speed",
    "u_ring_density",
    "u_vortex_radius",
    "u_energy_reactivity",
    "u_glow_strength",
    "u_background_color",
    "u_primary_color",
    "u_secondary_color",
    "u_accent_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: VortexRingsUniformState,
  ) {
    gl.uniform1f(uniforms.u_twist_amount, values.twistAmount);
    gl.uniform1f(uniforms.u_spin_speed, values.spinSpeed);
    gl.uniform1f(uniforms.u_ring_density, values.ringDensity);
    gl.uniform1f(uniforms.u_vortex_radius, values.vortexRadius);
    gl.uniform1f(uniforms.u_energy_reactivity, values.energyReactivity);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_primary_color, values.primaryColor);
    setWebglColor(gl, uniforms.u_secondary_color, values.secondaryColor);
    setWebglColor(gl, uniforms.u_accent_color, values.accentColor);
  },
});

export function createWebglVortexRingsRenderer(
  canvas: HTMLCanvasElement,
  options: WebglVortexRingsRendererOptions = {},
): WebglVortexRingsRenderer {
  return createWebglBandVfxRenderer(canvas, VORTEX_RINGS_DEFINITION, options);
}
