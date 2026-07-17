import {
  createLiquidBlobsUniformState,
  resolveLiquidBlobsConfig,
  type LiquidBlobsConfig,
  type LiquidBlobsConfigInput,
  type LiquidBlobsUniformState,
} from "../vfx/liquidBlobs";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { LIQUID_BLOBS_FRAGMENT_SHADER } from "./webgl2LiquidBlobsShader";

export type WebglLiquidBlobsRenderOptions = WebglBandVfxRenderOptions;
export type WebglLiquidBlobsRenderer = WebglBandVfxRenderer<
  LiquidBlobsConfig,
  LiquidBlobsConfigInput
>;
export type WebglLiquidBlobsRendererOptions = WebglBandVfxRendererOptions;

const LIQUID_BLOBS_DEFINITION: WebglBandVfxDefinition<
  LiquidBlobsConfig,
  LiquidBlobsConfigInput,
  LiquidBlobsUniformState
> = Object.freeze({
  createUniformState: createLiquidBlobsUniformState,
  effectId: "liquid-blobs",
  fragmentShaderSource: LIQUID_BLOBS_FRAGMENT_SHADER,
  label: "Liquid Blobs",
  resolveConfig: resolveLiquidBlobsConfig,
  uniformNames: Object.freeze([
    "u_blob_count",
    "u_blob_size",
    "u_drift_speed",
    "u_glow_strength",
    "u_threshold",
    "u_low_energy",
    "u_low_frequency_reactivity",
    "u_seed",
    "u_background_color",
    "u_base_color",
    "u_blob_color",
    "u_peak_flash_color",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: LiquidBlobsUniformState,
  ) {
    gl.uniform1f(uniforms.u_blob_count, values.blobCount);
    gl.uniform1f(uniforms.u_blob_size, values.blobSize);
    gl.uniform1f(uniforms.u_drift_speed, values.driftSpeed);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    gl.uniform1f(uniforms.u_threshold, values.threshold);
    gl.uniform1f(uniforms.u_low_energy, values.lowEnergy);
    gl.uniform1f(uniforms.u_low_frequency_reactivity, values.lowFrequencyReactivity);
    gl.uniform1f(uniforms.u_seed, values.seed);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_base_color, values.baseColor);
    setWebglColor(gl, uniforms.u_blob_color, values.blobColor);
    setWebglColor(gl, uniforms.u_peak_flash_color, values.peakFlashColor);
  },
});

export function createWebglLiquidBlobsRenderer(
  canvas: HTMLCanvasElement,
  options: WebglLiquidBlobsRendererOptions = {},
): WebglLiquidBlobsRenderer {
  return createWebglBandVfxRenderer(canvas, LIQUID_BLOBS_DEFINITION, options);
}
