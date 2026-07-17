import { MAX_VFX_BANDS } from "../analysis/bands";
import type { BandEnergyFrame } from "../types";
import type { BandUniformMetrics } from "../vfx/shared";
import { resolveVfxTime } from "../vfx/shared";
import type { VfxSurfaceConfig } from "../vfx/schema";
import { WEBGL2_RENDERER_CAPABILITIES } from "./capabilities";
import { WEBGL2_FULLSCREEN_VERTEX_SHADER } from "./webgl2BandVfxShader";
import { resolveWebglDrawingBufferSize, type WebglDrawingBufferSize } from "./webgl2Sizing";

export type WebglRendererState =
  | "context-lost"
  | "destroyed"
  | "error"
  | "initializing"
  | "ready"
  | "restoring"
  | "unavailable";

export type WebglRendererErrorCode =
  | "WEBGL2_BUFFER_CREATE"
  | "WEBGL2_CONTEXT_LOST"
  | "WEBGL2_CONTEXT_RESTORE"
  | "WEBGL2_PROGRAM_CREATE"
  | "WEBGL2_PROGRAM_LINK"
  | "WEBGL2_SHADER_COMPILE"
  | "WEBGL2_SHADER_CREATE"
  | "WEBGL2_UNAVAILABLE"
  | "WEBGL2_UNIFORM_MISSING"
  | "WEBGL2_VERTEX_ARRAY_CREATE";

export interface WebglRendererStatus {
  readonly code?: WebglRendererErrorCode;
  readonly generation: number;
  readonly message: string;
  readonly recoverable: boolean;
  readonly state: WebglRendererState;
}

export interface WebglRendererDiagnostics {
  readonly activeBuffers: number;
  readonly activePrograms: number;
  readonly activeVertexArrays: number;
  readonly buffersCreated: number;
  readonly buffersDeleted: number;
  readonly drawCalls: number;
  readonly generation: number;
  readonly programsCreated: number;
  readonly programsDeleted: number;
  readonly resourcesInvalidated: number;
  readonly vertexArraysCreated: number;
  readonly vertexArraysDeleted: number;
}

export interface WebglBandVfxRenderOptions {
  readonly reducedMotion?: boolean;
  readonly timeSeconds?: number;
}

export interface WebglBandVfxRendererOptions {
  readonly contextAttributes?: WebGLContextAttributes;
  readonly fragmentShaderSource?: string;
  readonly vertexShaderSource?: string;
}

export interface WebglBandVfxDefinition<
  Config extends VfxSurfaceConfig,
  ConfigInput extends object,
  UniformState extends BandUniformMetrics,
> {
  readonly createUniformState: (
    frame: BandEnergyFrame,
    config: ConfigInput | Config,
  ) => UniformState;
  readonly effectId: Config["mode"];
  readonly fragmentShaderSource: string;
  readonly label: string;
  readonly resolveConfig: (config: ConfigInput | Config) => Config;
  readonly uniformNames: readonly string[];
  readonly uploadUniforms: (
    gl: WebGL2RenderingContext,
    uniforms: Readonly<Record<string, WebGLUniformLocation>>,
    state: UniformState,
  ) => void;
}

export interface WebglBandVfxRenderer<Config extends VfxSurfaceConfig, ConfigInput extends object> {
  readonly capabilities: typeof WEBGL2_RENDERER_CAPABILITIES;
  readonly effectId: Config["mode"];
  readonly id: "webgl2";
  destroy(): void;
  getDiagnostics(): WebglRendererDiagnostics;
  getStatus(): WebglRendererStatus;
  render(
    frame: BandEnergyFrame,
    config?: ConfigInput | Config,
    options?: WebglBandVfxRenderOptions,
  ): boolean;
  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    config?: ConfigInput | Config,
  ): WebglDrawingBufferSize;
  subscribe(listener: () => void): () => void;
}

export class WebglRendererError extends Error {
  readonly code: WebglRendererErrorCode;

  constructor(code: WebglRendererErrorCode, message: string) {
    super(message);
    this.name = "WebglRendererError";
    this.code = code;
  }
}

interface WebglResources {
  readonly buffer: WebGLBuffer;
  readonly program: WebGLProgram;
  readonly uniforms: Readonly<Record<string, WebGLUniformLocation>>;
  readonly vertexArray: WebGLVertexArrayObject;
}

const COMMON_UNIFORM_NAMES = Object.freeze([
  "u_resolution",
  "u_time",
  "u_band_count",
  "u_bands[0]",
  "u_energy",
  "u_peak",
  "u_centroid",
] as const);

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = Object.freeze({
  alpha: false,
  antialias: false,
  depth: false,
  desynchronized: true,
  failIfMajorPerformanceCaveat: false,
  powerPreference: "high-performance",
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  stencil: false,
});

export function createWebglBandVfxRenderer<
  Config extends VfxSurfaceConfig,
  ConfigInput extends object,
  UniformState extends BandUniformMetrics,
>(
  canvas: HTMLCanvasElement,
  definition: WebglBandVfxDefinition<Config, ConfigInput, UniformState>,
  options: WebglBandVfxRendererOptions = {},
): WebglBandVfxRenderer<Config, ConfigInput> {
  return new BandVfxRenderer(canvas, definition, options);
}

class BandVfxRenderer<
  Config extends VfxSurfaceConfig,
  ConfigInput extends object,
  UniformState extends BandUniformMetrics,
> implements WebglBandVfxRenderer<Config, ConfigInput> {
  readonly capabilities = WEBGL2_RENDERER_CAPABILITIES;
  readonly effectId: Config["mode"];
  readonly id = "webgl2" as const;
  private readonly bandBuffer = new Float32Array(MAX_VFX_BANDS);
  private readonly canvas: HTMLCanvasElement;
  private readonly definition: WebglBandVfxDefinition<Config, ConfigInput, UniformState>;
  private readonly listeners = new Set<() => void>();
  private readonly options: WebglBandVfxRendererOptions;
  private destroyed = false;
  private gl: WebGL2RenderingContext | null = null;
  private resources: WebglResources | null = null;
  private status: WebglRendererStatus = status("initializing", "Initializing WebGL2.", false, 0);
  private diagnostics = mutableDiagnostics();

  constructor(
    canvas: HTMLCanvasElement,
    definition: WebglBandVfxDefinition<Config, ConfigInput, UniformState>,
    options: WebglBandVfxRendererOptions,
  ) {
    this.canvas = canvas;
    this.definition = definition;
    this.effectId = definition.effectId;
    this.options = options;
    canvas.addEventListener("webglcontextcreationerror", this.onContextCreationError);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.initialize();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): WebglRendererStatus {
    return this.status;
  }

  getDiagnostics(): WebglRendererDiagnostics {
    return Object.freeze({ ...this.diagnostics });
  }

  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    input: ConfigInput | Config = {} as ConfigInput,
  ): WebglDrawingBufferSize {
    const config = this.definition.resolveConfig(input);
    const size = resolveWebglDrawingBufferSize(
      cssWidth,
      cssHeight,
      devicePixelRatio,
      config.quality,
    );
    if (this.canvas.width !== size.bufferWidth) this.canvas.width = size.bufferWidth;
    if (this.canvas.height !== size.bufferHeight) this.canvas.height = size.bufferHeight;
    if (this.gl && this.resources && this.status.state === "ready")
      this.gl.viewport(0, 0, size.bufferWidth, size.bufferHeight);
    return size;
  }

  render(
    frame: BandEnergyFrame,
    input: ConfigInput | Config = {} as ConfigInput,
    options: WebglBandVfxRenderOptions = {},
  ): boolean {
    if (this.destroyed || this.status.state !== "ready" || !this.gl || !this.resources)
      return false;
    const gl = this.gl;
    const { program, uniforms, vertexArray } = this.resources;
    const values = this.definition.createUniformState(frame, input);
    this.bandBuffer.fill(0);
    values.bands.forEach((energy, index) => {
      if (index < this.bandBuffer.length) this.bandBuffer[index] = energy;
    });
    gl.useProgram(program);
    gl.bindVertexArray(vertexArray);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(uniforms.u_resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(
      uniforms.u_time,
      resolveVfxTime(options.timeSeconds ?? 0, options.reducedMotion === true),
    );
    gl.uniform1f(uniforms.u_band_count, values.bandCount);
    gl.uniform1fv(uniforms["u_bands[0]"], this.bandBuffer);
    gl.uniform1f(uniforms.u_energy, values.energy);
    gl.uniform1f(uniforms.u_peak, values.peak);
    gl.uniform1f(uniforms.u_centroid, values.centroid);
    this.definition.uploadUniforms(gl, uniforms, values);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    this.diagnostics.drawCalls += 1;
    return true;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.canvas.removeEventListener("webglcontextcreationerror", this.onContextCreationError);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.releaseResources();
    this.gl = null;
    this.setStatus(
      status("destroyed", "WebGL2 renderer destroyed.", false, this.diagnostics.generation),
    );
    this.listeners.clear();
  }

  private initialize() {
    try {
      const context = this.canvas.getContext("webgl2", {
        ...CONTEXT_ATTRIBUTES,
        ...this.options.contextAttributes,
      });
      if (!context) {
        this.setStatus(
          status(
            "unavailable",
            "WebGL2 is unavailable. Use a supported browser/GPU or choose another renderer.",
            false,
            0,
            "WEBGL2_UNAVAILABLE",
          ),
        );
        return;
      }
      this.gl = context;
      this.rebuildResources();
    } catch (error) {
      this.setError(error, "WebGL2 initialization failed.");
    }
  }

  private rebuildResources() {
    const gl = this.gl;
    if (!gl) throw new WebglRendererError("WEBGL2_UNAVAILABLE", "WebGL2 context is absent.");
    this.releaseResources();
    this.resources = createResources(gl, this.definition, this.options, this.diagnostics);
    this.diagnostics.generation += 1;
    this.setStatus(
      status("ready", `WebGL2 ${this.definition.label} ready.`, true, this.diagnostics.generation),
    );
  }

  private releaseResources() {
    const gl = this.gl;
    const resources = this.resources;
    this.resources = null;
    if (!gl || !resources || gl.isContextLost()) {
      this.diagnostics.activeBuffers = 0;
      this.diagnostics.activePrograms = 0;
      this.diagnostics.activeVertexArrays = 0;
      return;
    }
    gl.deleteVertexArray(resources.vertexArray);
    gl.deleteBuffer(resources.buffer);
    gl.deleteProgram(resources.program);
    this.diagnostics.vertexArraysDeleted += 1;
    this.diagnostics.buffersDeleted += 1;
    this.diagnostics.programsDeleted += 1;
    this.diagnostics.activeBuffers = 0;
    this.diagnostics.activePrograms = 0;
    this.diagnostics.activeVertexArrays = 0;
  }

  private readonly onContextCreationError = (event: Event) => {
    if (this.destroyed || this.gl) return;
    const message =
      "statusMessage" in event && typeof event.statusMessage === "string" && event.statusMessage
        ? event.statusMessage
        : "The browser could not create a WebGL2 drawing buffer.";
    this.setStatus(status("unavailable", message, false, 0, "WEBGL2_UNAVAILABLE"));
  };

  private readonly onContextLost = (event: Event) => {
    if (this.destroyed) return;
    event.preventDefault();
    this.resources = null;
    this.diagnostics.activeBuffers = 0;
    this.diagnostics.activePrograms = 0;
    this.diagnostics.activeVertexArrays = 0;
    this.diagnostics.resourcesInvalidated += 1;
    this.setStatus(
      status(
        "context-lost",
        "WebGL2 context lost. Rendering paused while the browser restores GPU resources.",
        true,
        this.diagnostics.generation,
        "WEBGL2_CONTEXT_LOST",
      ),
    );
  };

  private readonly onContextRestored = () => {
    if (this.destroyed || !this.gl) return;
    this.setStatus(
      status(
        "restoring",
        "WebGL2 context restored. Rebuilding GPU resources.",
        true,
        this.diagnostics.generation,
        "WEBGL2_CONTEXT_RESTORE",
      ),
    );
    try {
      this.rebuildResources();
    } catch (error) {
      this.setError(error, "WebGL2 resource restoration failed.");
    }
  };

  private setError(error: unknown, fallback: string) {
    const code = error instanceof WebglRendererError ? error.code : "WEBGL2_CONTEXT_RESTORE";
    const message = error instanceof Error ? error.message : fallback;
    this.setStatus(status("error", message, false, this.diagnostics.generation, code));
  }

  private setStatus(next: WebglRendererStatus) {
    this.status = next;
    this.listeners.forEach((listener) => listener());
  }
}

function createResources<
  Config extends VfxSurfaceConfig,
  ConfigInput extends object,
  UniformState extends BandUniformMetrics,
>(
  gl: WebGL2RenderingContext,
  definition: WebglBandVfxDefinition<Config, ConfigInput, UniformState>,
  options: WebglBandVfxRendererOptions,
  diagnostics: MutableWebglRendererDiagnostics,
): WebglResources {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    options.vertexShaderSource ?? WEBGL2_FULLSCREEN_VERTEX_SHADER,
    definition.label,
  );
  let fragmentShader: WebGLShader | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let vertexArray: WebGLVertexArrayObject | null = null;
  try {
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      options.fragmentShaderSource ?? definition.fragmentShaderSource,
      definition.label,
    );
    program = gl.createProgram();
    if (!program)
      throw new WebglRendererError("WEBGL2_PROGRAM_CREATE", "WebGL2 program creation failed.");
    diagnostics.programsCreated += 1;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new WebglRendererError(
        "WEBGL2_PROGRAM_LINK",
        `${definition.label} program link failed: ${gl.getProgramInfoLog(program) || "No linker log."}`,
      );
    buffer = gl.createBuffer();
    if (!buffer)
      throw new WebglRendererError("WEBGL2_BUFFER_CREATE", "WebGL2 vertex buffer creation failed.");
    diagnostics.buffersCreated += 1;
    vertexArray = gl.createVertexArray();
    if (!vertexArray)
      throw new WebglRendererError(
        "WEBGL2_VERTEX_ARRAY_CREATE",
        "WebGL2 vertex array creation failed.",
      );
    diagnostics.vertexArraysCreated += 1;
    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    const names = [...COMMON_UNIFORM_NAMES, ...definition.uniformNames];
    if (new Set(names).size !== names.length)
      throw new WebglRendererError(
        "WEBGL2_UNIFORM_MISSING",
        `${definition.label} declares duplicate required uniforms.`,
      );
    const uniforms = Object.fromEntries(
      names.map((name) => {
        const location = gl.getUniformLocation(program!, name);
        if (location === null)
          throw new WebglRendererError(
            "WEBGL2_UNIFORM_MISSING",
            `${definition.label} shader is missing required uniform ${name}.`,
          );
        return [name, location];
      }),
    ) as Record<string, WebGLUniformLocation>;
    diagnostics.activePrograms = 1;
    diagnostics.activeBuffers = 1;
    diagnostics.activeVertexArrays = 1;
    return Object.freeze({
      buffer,
      program,
      uniforms: Object.freeze(uniforms),
      vertexArray,
    });
  } catch (error) {
    if (vertexArray) {
      gl.deleteVertexArray(vertexArray);
      diagnostics.vertexArraysDeleted += 1;
    }
    if (buffer) {
      gl.deleteBuffer(buffer);
      diagnostics.buffersDeleted += 1;
    }
    if (program) {
      gl.deleteProgram(program);
      diagnostics.programsDeleted += 1;
    }
    throw error;
  } finally {
    gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
  }
}

function compileShader(
  gl: WebGL2RenderingContext,
  kind: number,
  source: string,
  label: string,
): WebGLShader {
  const shader = gl.createShader(kind);
  if (!shader)
    throw new WebglRendererError("WEBGL2_SHADER_CREATE", "WebGL2 shader creation failed.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  const log = gl.getShaderInfoLog(shader) || "No compiler log.";
  gl.deleteShader(shader);
  throw new WebglRendererError(
    "WEBGL2_SHADER_COMPILE",
    `${label} shader compilation failed: ${log}`,
  );
}

export function setWebglColor(
  gl: WebGL2RenderingContext,
  location: WebGLUniformLocation,
  color: readonly [number, number, number, number],
) {
  gl.uniform4f(location, color[0], color[1], color[2], color[3]);
}

function status(
  state: WebglRendererState,
  message: string,
  recoverable: boolean,
  generation: number,
  code?: WebglRendererErrorCode,
): WebglRendererStatus {
  return Object.freeze({ code, generation, message, recoverable, state });
}

interface MutableWebglRendererDiagnostics {
  activeBuffers: number;
  activePrograms: number;
  activeVertexArrays: number;
  buffersCreated: number;
  buffersDeleted: number;
  drawCalls: number;
  generation: number;
  programsCreated: number;
  programsDeleted: number;
  resourcesInvalidated: number;
  vertexArraysCreated: number;
  vertexArraysDeleted: number;
}

function mutableDiagnostics(): MutableWebglRendererDiagnostics {
  return {
    activeBuffers: 0,
    activePrograms: 0,
    activeVertexArrays: 0,
    buffersCreated: 0,
    buffersDeleted: 0,
    drawCalls: 0,
    generation: 0,
    programsCreated: 0,
    programsDeleted: 0,
    resourcesInvalidated: 0,
    vertexArraysCreated: 0,
    vertexArraysDeleted: 0,
  };
}
