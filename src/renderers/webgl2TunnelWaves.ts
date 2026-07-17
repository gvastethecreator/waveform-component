import {
  createTunnelWavesUniformState,
  resolveTunnelWavesConfig,
  type TunnelWavesConfig,
  type TunnelWavesConfigInput,
  type TunnelWavesUniformState,
} from "../vfx/tunnelWaves";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { TUNNEL_WAVES_FRAGMENT_SHADER } from "./webgl2TunnelWavesShader";

export type WebglTunnelWavesRenderOptions = WebglBandVfxRenderOptions;
export type WebglTunnelWavesRenderer = WebglBandVfxRenderer<
  TunnelWavesConfig,
  TunnelWavesConfigInput
>;
export type WebglTunnelWavesRendererOptions = WebglBandVfxRendererOptions;

const TUNNEL_WAVES_DEFINITION: WebglBandVfxDefinition<
  TunnelWavesConfig,
  TunnelWavesConfigInput,
  TunnelWavesUniformState
> = Object.freeze({
  createUniformState: createTunnelWavesUniformState,
  effectId: "tunnel-waves",
  fragmentShaderSource: TUNNEL_WAVES_FRAGMENT_SHADER,
  label: "Tunnel Waves",
  resolveConfig: resolveTunnelWavesConfig,
  uniformNames: Object.freeze([
    "u_ring_density",
    "u_tunnel_speed",
    "u_tunnel_depth",
    "u_energy_reactivity",
    "u_glow_strength",
    "u_background_color",
    "u_center_color",
    "u_mid_color",
    "u_outer_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: TunnelWavesUniformState,
  ) {
    gl.uniform1f(uniforms.u_ring_density, values.ringDensity);
    gl.uniform1f(uniforms.u_tunnel_speed, values.tunnelSpeed);
    gl.uniform1f(uniforms.u_tunnel_depth, values.tunnelDepth);
    gl.uniform1f(uniforms.u_energy_reactivity, values.energyReactivity);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_center_color, values.centerColor);
    setWebglColor(gl, uniforms.u_mid_color, values.midColor);
    setWebglColor(gl, uniforms.u_outer_color, values.outerColor);
  },
});

export function createWebglTunnelWavesRenderer(
  canvas: HTMLCanvasElement,
  options: WebglTunnelWavesRendererOptions = {},
): WebglTunnelWavesRenderer {
  return createWebglBandVfxRenderer(canvas, TUNNEL_WAVES_DEFINITION, options);
}
