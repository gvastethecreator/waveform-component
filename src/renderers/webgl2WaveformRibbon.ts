import {
  createWaveformRibbonUniformState,
  resolveWaveformRibbonConfig,
  type WaveformRibbonConfig,
  type WaveformRibbonConfigInput,
  type WaveformRibbonUniformState,
} from "../vfx/waveformRibbon";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { WAVEFORM_RIBBON_FRAGMENT_SHADER } from "./webgl2WaveformRibbonShader";

export type WebglWaveformRibbonRenderOptions = WebglBandVfxRenderOptions;
export type WebglWaveformRibbonRenderer = WebglBandVfxRenderer<
  WaveformRibbonConfig,
  WaveformRibbonConfigInput
>;
export type WebglWaveformRibbonRendererOptions = WebglBandVfxRendererOptions;

const WAVEFORM_RIBBON_DEFINITION: WebglBandVfxDefinition<
  WaveformRibbonConfig,
  WaveformRibbonConfigInput,
  WaveformRibbonUniformState
> = Object.freeze({
  createUniformState: createWaveformRibbonUniformState,
  effectId: "waveform-ribbon",
  fragmentShaderSource: WAVEFORM_RIBBON_FRAGMENT_SHADER,
  label: "Waveform Ribbon",
  resolveConfig: resolveWaveformRibbonConfig,
  uniformNames: Object.freeze([
    "u_wave_height",
    "u_flow_speed",
    "u_ribbon_thickness",
    "u_glow_strength",
    "u_reflection_strength",
    "u_energy_reactivity",
    "u_background_color",
    "u_left_color",
    "u_right_color",
    "u_peak_flash_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: WaveformRibbonUniformState,
  ) {
    gl.uniform1f(uniforms.u_wave_height, values.waveHeight);
    gl.uniform1f(uniforms.u_flow_speed, values.flowSpeed);
    gl.uniform1f(uniforms.u_ribbon_thickness, values.ribbonThickness);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    gl.uniform1f(uniforms.u_reflection_strength, values.reflectionStrength);
    gl.uniform1f(uniforms.u_energy_reactivity, values.energyReactivity);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_left_color, values.leftColor);
    setWebglColor(gl, uniforms.u_right_color, values.rightColor);
    setWebglColor(gl, uniforms.u_peak_flash_color, values.peakFlashColor);
  },
});

export function createWebglWaveformRibbonRenderer(
  canvas: HTMLCanvasElement,
  options: WebglWaveformRibbonRendererOptions = {},
): WebglWaveformRibbonRenderer {
  return createWebglBandVfxRenderer(canvas, WAVEFORM_RIBBON_DEFINITION, options);
}
