import {
  createPulseRingUniformState,
  resolvePulseRingConfig,
  type PulseRingConfig,
  type PulseRingConfigInput,
  type PulseRingUniformState,
} from "../vfx/pulseRing";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { PULSE_RING_FRAGMENT_SHADER } from "./webgl2PulseRingShader";

export { WebglRendererError } from "./webgl2BandVfx";
export type {
  WebglRendererDiagnostics,
  WebglRendererErrorCode,
  WebglRendererState,
  WebglRendererStatus,
} from "./webgl2BandVfx";

export type WebglPulseRingRenderOptions = WebglBandVfxRenderOptions;
export type WebglPulseRingRenderer = WebglBandVfxRenderer<PulseRingConfig, PulseRingConfigInput>;
export type WebglPulseRingRendererOptions = WebglBandVfxRendererOptions;

const PULSE_RING_UNIFORM_NAMES = Object.freeze([
  "u_thickness",
  "u_glow_strength",
  "u_rotation_speed",
  "u_band_reactivity",
  "u_background_color",
  "u_primary_color",
  "u_secondary_color",
  "u_tertiary_color",
  "u_sweep_color",
] as const);

const PULSE_RING_DEFINITION: WebglBandVfxDefinition<
  PulseRingConfig,
  PulseRingConfigInput,
  PulseRingUniformState
> = Object.freeze({
  createUniformState: createPulseRingUniformState,
  effectId: "pulse-ring",
  fragmentShaderSource: PULSE_RING_FRAGMENT_SHADER,
  label: "Pulse Ring",
  resolveConfig: resolvePulseRingConfig,
  uniformNames: PULSE_RING_UNIFORM_NAMES,
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: PulseRingUniformState,
  ) {
    gl.uniform1f(uniforms.u_thickness, values.thickness);
    gl.uniform1f(uniforms.u_glow_strength, values.glowStrength);
    gl.uniform1f(uniforms.u_rotation_speed, values.rotationSpeed);
    gl.uniform1f(uniforms.u_band_reactivity, values.bandReactivity);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_primary_color, values.primaryColor);
    setWebglColor(gl, uniforms.u_secondary_color, values.secondaryColor);
    setWebglColor(gl, uniforms.u_tertiary_color, values.tertiaryColor);
    setWebglColor(gl, uniforms.u_sweep_color, values.sweepColor);
  },
});

export function createWebglPulseRingRenderer(
  canvas: HTMLCanvasElement,
  options: WebglPulseRingRendererOptions = {},
): WebglPulseRingRenderer {
  return createWebglBandVfxRenderer(canvas, PULSE_RING_DEFINITION, options);
}
