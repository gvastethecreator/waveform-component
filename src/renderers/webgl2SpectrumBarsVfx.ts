import {
  createSpectrumBarsVfxUniformState,
  resolveSpectrumBarsVfxConfig,
  type SpectrumBarsVfxConfig,
  type SpectrumBarsVfxConfigInput,
  type SpectrumBarsVfxUniformState,
} from "../vfx/spectrumBarsVfx";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { SPECTRUM_BARS_VFX_FRAGMENT_SHADER } from "./webgl2SpectrumBarsVfxShader";

export type WebglSpectrumBarsVfxRenderOptions = WebglBandVfxRenderOptions;
export type WebglSpectrumBarsVfxRenderer = WebglBandVfxRenderer<
  SpectrumBarsVfxConfig,
  SpectrumBarsVfxConfigInput
>;
export type WebglSpectrumBarsVfxRendererOptions = WebglBandVfxRendererOptions;

const SPECTRUM_BARS_VFX_DEFINITION: WebglBandVfxDefinition<
  SpectrumBarsVfxConfig,
  SpectrumBarsVfxConfigInput,
  SpectrumBarsVfxUniformState
> = Object.freeze({
  createUniformState: createSpectrumBarsVfxUniformState,
  effectId: "spectrum-bars",
  fragmentShaderSource: SPECTRUM_BARS_VFX_FRAGMENT_SHADER,
  label: "Spectrum Bars",
  resolveConfig: resolveSpectrumBarsVfxConfig,
  uniformNames: Object.freeze([
    "u_bar_count",
    "u_height_reactivity",
    "u_gap_size",
    "u_vertical_position",
    "u_random_speed",
    "u_glow_strength",
    "u_background_color",
    "u_gradient_color_1",
    "u_gradient_color_2",
    "u_gradient_color_3",
    "u_gradient_color_4",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: SpectrumBarsVfxUniformState,
  ) {
    gl.uniform1f(uniforms.u_bar_count, values.barCount);
    gl.uniform1f(uniforms.u_height_reactivity, values.heightReactivity);
    gl.uniform1f(uniforms.u_gap_size, values.gapSize);
    gl.uniform1f(uniforms.u_vertical_position, values.verticalPosition);
    gl.uniform1f(uniforms.u_random_speed, values.randomSpeed);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_gradient_color_1, values.gradientColor1);
    setWebglColor(gl, uniforms.u_gradient_color_2, values.gradientColor2);
    setWebglColor(gl, uniforms.u_gradient_color_3, values.gradientColor3);
    setWebglColor(gl, uniforms.u_gradient_color_4, values.gradientColor4);
  },
});

export function createWebglSpectrumBarsVfxRenderer(
  canvas: HTMLCanvasElement,
  options: WebglSpectrumBarsVfxRendererOptions = {},
): WebglSpectrumBarsVfxRenderer {
  return createWebglBandVfxRenderer(canvas, SPECTRUM_BARS_VFX_DEFINITION, options);
}
