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

export type TimeDomainFrame = WaveformFrame | EnvelopeFrame;

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
export type SpectrumLayout = "radial" | "rectangular";
export type SpectrumColorMode = "gradient" | "line" | "pulse" | "range" | "solid";
export type SpectrumPulseMode = "peak-frequency" | "peak-magnitude";
export type CoreRendererId = "canvas2d" | "svg";

export interface CanvasColorRole {
  readonly alpha: number;
  readonly color: string;
}

export interface CanvasColorRoles {
  readonly accent: CanvasColorRole;
  readonly base: CanvasColorRole;
  readonly crest: CanvasColorRole;
  readonly middle: CanvasColorRole;
}

export type SpectrumColorRole = CanvasColorRole;
export type SpectrumColorRoles = CanvasColorRoles;

export interface SpectrumAnalysisConfig {
  readonly allowLargeFft: boolean;
  readonly fftSize: number;
  readonly maximumDecibels: number;
  readonly minimumDecibels: number;
  readonly powerOfSineExponent: number;
  readonly window: SpectrumWindow;
}

export interface CanvasSpectrumConfig {
  readonly renderer: CoreRendererId;
  readonly mode: "spectrum";
  readonly backgroundColor: string;
  readonly barGap: number;
  readonly barWidth: number;
  readonly color: string;
  readonly colorMode: SpectrumColorMode;
  readonly colorRoles: SpectrumColorRoles;
  readonly cornerRadius: number;
  readonly crestDecibels: number;
  readonly frequencyScale: SpectrumFrequencyScale;
  readonly geometry: SpectrumGeometry;
  readonly gradientRatio: number;
  readonly gridColor: string;
  readonly highFrequency: number;
  readonly interpolation: SpectrumInterpolation;
  readonly lineWidth: number;
  readonly layout: SpectrumLayout;
  readonly lowFrequency: number;
  readonly maximumDecibels: number;
  readonly minimumDecibels: number;
  readonly padding: number;
  readonly pulseMode: SpectrumPulseMode;
  readonly radialArc: number;
  readonly radialDeadzone: number;
  readonly radialInvert: boolean;
  readonly radialRotation: number;
  readonly middleDecibels: number;
  readonly roundedCaps: boolean;
  readonly showGrid: boolean;
}

export interface CanvasSpectrumConfigInput extends Omit<
  Partial<CanvasSpectrumConfig>,
  "colorRoles" | "renderer"
> {
  readonly renderer?: CoreRendererId;
  readonly colorRoles?: Partial<{
    readonly [Role in keyof SpectrumColorRoles]: Partial<SpectrumColorRole>;
  }>;
}

export type CanvasVisualizationConfig =
  | CanvasWaveformConfig
  | CanvasSpectrumConfig
  | CanvasMeterConfig;

export interface MeterChannel {
  readonly linearPeak: number;
  readonly linearRms: number;
  readonly peakDbfs: number;
  readonly rmsDbfs: number;
  readonly sourceChannelIndex: number;
}

export interface MeterFrame {
  readonly kind: "meter";
  readonly state: "empty" | "ready";
  readonly channels: readonly MeterChannel[];
  readonly maximumDecibels: number;
  readonly minimumDecibels: number;
  readonly referenceAmplitude: 1;
  readonly sampleCount: number;
  readonly sampleRate: number;
}

export interface MeterHistoryPoint {
  readonly frame: MeterFrame;
  readonly timestampMs: number;
}

export type MeterMeasurement = "peak" | "rms";
export type MeterGeometry = "meter" | "stepped-meter";
export type MeterColorMode = "gradient" | "range" | "solid";

export interface CanvasMeterConfig {
  readonly renderer: CoreRendererId;
  readonly mode: MeterGeometry;
  readonly backgroundColor: string;
  readonly barWidth: number;
  readonly channelGap: number;
  readonly colorMode: MeterColorMode;
  readonly colorRoles: CanvasColorRoles;
  readonly cornerRadius: number;
  readonly crestDecibels: number;
  readonly historyOpacity: number;
  readonly layout: SpectrumLayout;
  readonly maximumDecibels: number;
  readonly measurement: MeterMeasurement;
  readonly middleDecibels: number;
  readonly minimumDecibels: number;
  readonly minimumSize: number;
  readonly orientation: WaveformOrientation;
  readonly padding: number;
  readonly peakThresholdDb: number;
  readonly radialArc: number;
  readonly radialDeadzone: number;
  readonly radialInvert: boolean;
  readonly radialRotation: number;
  readonly reactThresholdDb: number;
  readonly roundedCaps: boolean;
  readonly showHistory: boolean;
  readonly stepGap: number;
  readonly stepWidth: number;
  readonly trackColor: string;
}

export interface CanvasMeterConfigInput extends Omit<
  Partial<CanvasMeterConfig>,
  "colorRoles" | "renderer"
> {
  readonly renderer?: CoreRendererId;
  readonly colorRoles?: Partial<{
    readonly [Role in keyof CanvasColorRoles]: Partial<CanvasColorRole>;
  }>;
}

export interface MeterRect {
  readonly channelIndex: number;
  readonly decibels: number;
  readonly height: number;
  readonly level: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface MeterSegment extends MeterRect {
  readonly active: boolean;
  readonly segmentIndex: number;
}

export interface MeterArc {
  readonly channelIndex: number;
  readonly decibels: number;
  readonly endAngle: number;
  readonly level: number;
  readonly radius: number;
  readonly startAngle: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface MeterArcSegment extends MeterArc {
  readonly active: boolean;
  readonly segmentIndex: number;
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

export type WaveformChannelMode = "mono" | "single" | "source" | "stereo";
export type WaveformChannelLayout = "overlay" | "split" | "stacked";
export type WaveformOrientation = "horizontal" | "vertical";
export type WaveformAmplitudePlacement = "centered" | "negative-only" | "positive-only";
export type EnvelopeAmplitudePlacement = "baseline" | "mirrored";

interface CanvasTimeDomainBaseConfig {
  readonly renderer: CoreRendererId;
  readonly amplitude: number;
  readonly backgroundColor: string;
  readonly centerLineColor: string;
  readonly channelColors: readonly string[];
  readonly channelGap: number;
  readonly channelLayout: WaveformChannelLayout;
  readonly color: string;
  readonly lineWidth: number;
  readonly orientation: WaveformOrientation;
  readonly padding: number;
  readonly playbackProgress: number;
  readonly playedColor: string;
  readonly showCenterLine: boolean;
}

export interface CanvasWaveformConfigInput extends Partial<
  Omit<CanvasTimeDomainBaseConfig, "renderer">
> {
  readonly amplitudePlacement?: EnvelopeAmplitudePlacement | WaveformAmplitudePlacement;
  readonly channelIndex?: number;
  readonly channelMode?: WaveformChannelMode;
  readonly mode?: "envelope" | "waveform";
  readonly renderer?: CoreRendererId;
}

export type WaveformConfigInput = CanvasWaveformConfigInput;
export type SpectrumConfigInput = CanvasSpectrumConfigInput;
export type MeterConfigInput = CanvasMeterConfigInput;
export type CoreVisualizationConfigInput =
  | WaveformConfigInput
  | SpectrumConfigInput
  | MeterConfigInput;

export interface CanvasWaveformModeConfig extends CanvasTimeDomainBaseConfig {
  readonly amplitudePlacement: WaveformAmplitudePlacement;
  readonly mode: "waveform";
}

export interface CanvasEnvelopeModeConfig extends CanvasTimeDomainBaseConfig {
  readonly amplitudePlacement: EnvelopeAmplitudePlacement;
  readonly mode: "envelope";
}

export type WaveformChannelSelection =
  | { readonly channelMode: "mono"; readonly channelIndex?: never }
  | { readonly channelMode: "single"; readonly channelIndex: number }
  | { readonly channelMode: "source"; readonly channelIndex?: never }
  | { readonly channelMode: "stereo"; readonly channelIndex?: never };

export type CanvasWaveformConfig = (CanvasEnvelopeModeConfig | CanvasWaveformModeConfig) &
  WaveformChannelSelection;

export type WaveformConfig = CanvasWaveformConfig;
export type SpectrumConfig = CanvasSpectrumConfig;
export type MeterConfig = CanvasMeterConfig;
export type CoreVisualizationConfig = CanvasVisualizationConfig;

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
  readonly sourceChannelIndex: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly progress: number;
  readonly x1: number;
  readonly x2: number;
  readonly y1: number;
  readonly y2: number;
}

export interface SpectrumPoint {
  readonly decibels: number;
  readonly frequency: number;
  readonly level: number;
  readonly x: number;
  readonly y: number;
}

export interface SpectrumBar extends SpectrumPoint {
  readonly height: number;
  readonly width: number;
}

export interface SpectrumRadialPoint extends SpectrumPoint {
  readonly angle: number;
  readonly baselineRadius: number;
  readonly baseX: number;
  readonly baseY: number;
  readonly centerX: number;
  readonly centerY: number;
  readonly radius: number;
}

export interface SpectrumRadialBar extends SpectrumRadialPoint {
  readonly width: number;
  readonly x1: number;
  readonly x2: number;
  readonly y1: number;
  readonly y2: number;
}

export class WaveformInputError extends TypeError {
  readonly code: "EMPTY_CHANNEL_SET" | "INVALID_SAMPLE";

  constructor(code: WaveformInputError["code"], message: string) {
    super(message);
    this.name = "WaveformInputError";
    this.code = code;
  }
}
