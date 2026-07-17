import {
  createEqualizerGridUniformState,
  resolveEqualizerGridConfig,
  type EqualizerGridConfig,
  type EqualizerGridConfigInput,
  type EqualizerGridUniformState,
} from "../vfx/equalizerGrid";
import {
  createWebglBandVfxRenderer,
  setWebglColor,
  type WebglBandVfxDefinition,
  type WebglBandVfxRenderer,
  type WebglBandVfxRendererOptions,
  type WebglBandVfxRenderOptions,
} from "./webgl2BandVfx";
import { EQUALIZER_GRID_FRAGMENT_SHADER } from "./webgl2EqualizerGridShader";

export type WebglEqualizerGridRenderOptions = WebglBandVfxRenderOptions;
export type WebglEqualizerGridRenderer = WebglBandVfxRenderer<
  EqualizerGridConfig,
  EqualizerGridConfigInput
>;
export type WebglEqualizerGridRendererOptions = WebglBandVfxRendererOptions;

const EQUALIZER_GRID_DEFINITION: WebglBandVfxDefinition<
  EqualizerGridConfig,
  EqualizerGridConfigInput,
  EqualizerGridUniformState
> = Object.freeze({
  createUniformState: createEqualizerGridUniformState,
  effectId: "equalizer-grid",
  fragmentShaderSource: EQUALIZER_GRID_FRAGMENT_SHADER,
  label: "Equalizer Grid",
  resolveConfig: resolveEqualizerGridConfig,
  uniformNames: Object.freeze([
    "u_grid_columns",
    "u_grid_rows",
    "u_cell_gap",
    "u_cell_reactivity",
    "u_random_speed",
    "u_background_color",
    "u_gradient_color_1",
    "u_gradient_color_2",
    "u_gradient_color_3",
    "u_gradient_color_4",
  ]),
  uploadUniforms(
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    values: EqualizerGridUniformState,
  ) {
    gl.uniform1f(uniforms.u_grid_columns, values.gridColumns);
    gl.uniform1f(uniforms.u_grid_rows, values.gridRows);
    gl.uniform1f(uniforms.u_cell_gap, values.cellGap);
    gl.uniform1f(uniforms.u_cell_reactivity, values.cellReactivity);
    gl.uniform1f(uniforms.u_random_speed, values.randomSpeed);
    setWebglColor(gl, uniforms.u_background_color, values.backgroundColor);
    setWebglColor(gl, uniforms.u_gradient_color_1, values.gradientColor1);
    setWebglColor(gl, uniforms.u_gradient_color_2, values.gradientColor2);
    setWebglColor(gl, uniforms.u_gradient_color_3, values.gradientColor3);
    setWebglColor(gl, uniforms.u_gradient_color_4, values.gradientColor4);
  },
});

export function createWebglEqualizerGridRenderer(
  canvas: HTMLCanvasElement,
  options: WebglEqualizerGridRendererOptions = {},
): WebglEqualizerGridRenderer {
  return createWebglBandVfxRenderer(canvas, EQUALIZER_GRID_DEFINITION, options);
}
