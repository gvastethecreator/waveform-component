export type WaveformChannelInput = readonly number[] | Float32Array;

export type StaticWaveformInput = WaveformChannelInput | readonly WaveformChannelInput[];

export interface WaveformFrame {
  readonly kind: "waveform";
  readonly state: "empty" | "ready";
  readonly channels: readonly Float32Array[];
  readonly sampleCount: number;
  readonly sampleRate?: number;
  readonly duration?: number;
}

export interface CanvasWaveformConfig {
  readonly renderer: "canvas2d";
  readonly mode: "waveform";
  readonly amplitude: number;
  readonly backgroundColor: string;
  readonly centerLineColor: string;
  readonly channelGap: number;
  readonly color: string;
  readonly lineWidth: number;
  readonly padding: number;
  readonly showCenterLine: boolean;
}

export interface WaveformViewport {
  readonly width: number;
  readonly height: number;
}

export interface WaveformColumn {
  readonly channelIndex: number;
  readonly centerY: number;
  readonly x: number;
  readonly yMax: number;
  readonly yMin: number;
}

export class WaveformInputError extends TypeError {
  readonly code: "EMPTY_CHANNEL_SET" | "INVALID_SAMPLE";

  constructor(code: WaveformInputError["code"], message: string) {
    super(message);
    this.name = "WaveformInputError";
    this.code = code;
  }
}
