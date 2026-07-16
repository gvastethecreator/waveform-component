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

export interface EnvelopeFrame {
  readonly kind: "envelope";
  readonly state: "empty" | "ready";
  readonly channels: readonly Float32Array[];
  readonly sampleCount: number;
  readonly sampleRate?: number;
  readonly duration?: number;
}

export interface SpectrumFrame {
  readonly kind: "spectrum";
  readonly state: "empty" | "ready";
  readonly bins: Float32Array;
  readonly fftSize: number;
  readonly sampleRate: number;
  readonly minimumDecibels: number;
  readonly maximumDecibels: number;
}

export type SpectrumWindow =
  | "none"
  | "hann"
  | "hamming"
  | "blackman"
  | "blackman-harris"
  | "power-of-sine";

export type SpectrumFrequencyScale = "linear" | "log";
export type SpectrumInterpolation = "nearest" | "lanczos" | "catmull-rom";
export type SpectrumGeometry = "curve" | "bars";

export interface SpectrumAnalysisConfig {
  readonly allowLargeFft: boolean;
  readonly fftSize: number;
  readonly maximumDecibels: number;
  readonly minimumDecibels: number;
  readonly powerOfSineExponent: number;
  readonly window: SpectrumWindow;
}

export interface CanvasSpectrumConfig {
  readonly renderer: "canvas2d";
  readonly mode: "spectrum";
  readonly backgroundColor: string;
  readonly barGap: number;
  readonly barWidth: number;
  readonly color: string;
  readonly frequencyScale: SpectrumFrequencyScale;
  readonly geometry: SpectrumGeometry;
  readonly gridColor: string;
  readonly highFrequency: number;
  readonly interpolation: SpectrumInterpolation;
  readonly lineWidth: number;
  readonly lowFrequency: number;
  readonly maximumDecibels: number;
  readonly minimumDecibels: number;
  readonly padding: number;
  readonly showGrid: boolean;
}

export type CanvasVisualizationConfig = CanvasWaveformConfig | CanvasSpectrumConfig;

export interface MeterChannel {
  readonly peak: number;
  readonly rms: number;
}

export interface MeterFrame {
  readonly kind: "meter";
  readonly state: "empty" | "ready";
  readonly channels: readonly MeterChannel[];
}

export interface EnergyBand {
  readonly energy: number;
  readonly highFrequency: number;
  readonly id: string;
  readonly lowFrequency: number;
}

export interface BandEnergyFrame {
  readonly kind: "bands";
  readonly state: "empty" | "ready";
  readonly bands: readonly EnergyBand[];
}

export type AnalysisFrame =
  | WaveformFrame
  | EnvelopeFrame
  | SpectrumFrame
  | MeterFrame
  | BandEnergyFrame;

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
  readonly playbackProgress: number;
  readonly playedColor: string;
  readonly showCenterLine: boolean;
}

export interface WaveformPeakChannel {
  readonly maximums: Float32Array;
  readonly minimums: Float32Array;
}

export interface WaveformPeakLevel {
  readonly channels: readonly WaveformPeakChannel[];
  readonly peakCount: number;
  readonly samplesPerPeak: number;
}

export interface WaveformPeakPyramid {
  readonly levels: readonly WaveformPeakLevel[];
  readonly originalSampleCount: number;
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

export interface SpectrumPoint {
  readonly decibels: number;
  readonly frequency: number;
  readonly x: number;
  readonly y: number;
}

export interface SpectrumBar extends SpectrumPoint {
  readonly height: number;
  readonly width: number;
}

export class WaveformInputError extends TypeError {
  readonly code: "EMPTY_CHANNEL_SET" | "INVALID_SAMPLE";

  constructor(code: WaveformInputError["code"], message: string) {
    super(message);
    this.name = "WaveformInputError";
    this.code = code;
  }
}
