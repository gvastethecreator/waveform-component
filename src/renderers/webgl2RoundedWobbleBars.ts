import {
  createRoundedWobbleBarsUniformState,
  resolveRoundedWobbleBarsConfig,
  type RoundedWobbleBarsConfig,
  type RoundedWobbleBarsConfigInput,
  type RoundedWobbleBarsUniformState,
} from "../vfx/roundedWobbleBars";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { ROUNDED_WOBBLE_BARS_FRAGMENT_SHADER } from "./webgl2RoundedWobbleBarsShader";

export type WebglRoundedWobbleBarsRenderOptions = WebglBandVfxRenderOptions;
export type WebglRoundedWobbleBarsRenderer = WebglBandVfxRenderer<
  RoundedWobbleBarsConfig,
  RoundedWobbleBarsConfigInput
>;
export type WebglRoundedWobbleBarsRendererOptions = WebglBandVfxRendererOptions;

const ROUNDED_WOBBLE_BARS_DEFINITION: WebglBandVfxDefinition<
  RoundedWobbleBarsConfig,
  RoundedWobbleBarsConfigInput,
  RoundedWobbleBarsUniformState
> = Object.freeze({
  createUniformState: createRoundedWobbleBarsUniformState,
  effectId: "rounded-wobble-bars",
  fragmentShaderSource: ROUNDED_WOBBLE_BARS_FRAGMENT_SHADER,
  label: "Rounded Wobble Bars",
  resolveConfig: resolveRoundedWobbleBarsConfig,
  uniformNames: Object.freeze([
    "u_bar_count",
    "u_wobble_intensity",
    "u_mirror_vertically",
    "u_bar_gap",
    "u_glow_intensity",
    "u_energy_reactivity",
    "u_background_color",
    "u_left_color",
    "u_right_color",
    "u_burst_flash_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: RoundedWobbleBarsUniformState,
  ) {
    gl.uniform1f(uniforms.u_bar_count, values.barCount);
    gl.uniform1f(uniforms.u_wobble_intensity, values.wobbleIntensity);
    gl.uniform1f(uniforms.u_mirror_vertically, values.mirrorVertically ? 1 : 0);
    gl.uniform1f(uniforms.u_bar_gap, values.barGap);
    gl.uniform1f(uniforms.u_glow_intensity, values.glowIntensity);
    gl.uniform1f(uniforms.u_energy_reactivity, values.energyReactivity);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_left_color, values.leftColor);
    setWebglColor(gl, uniforms.u_right_color, values.rightColor);
    setWebglColor(gl, uniforms.u_burst_flash_color, values.burstFlashColor);
  },
});

export function createWebglRoundedWobbleBarsRenderer(
  canvas: HTMLCanvasElement,
  options: WebglRoundedWobbleBarsRendererOptions = {},
): WebglRoundedWobbleBarsRenderer {
  return createWebglBandVfxRenderer(canvas, ROUNDED_WOBBLE_BARS_DEFINITION, options);
}
