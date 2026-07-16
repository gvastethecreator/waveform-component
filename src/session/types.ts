import type { AnalysisFrame } from "../types";

export type SourceOwnership = "borrowed" | "owned";

export type WaveformSourceState = "empty" | "ended" | "muted" | "ready" | "silent";

export interface WaveformSessionError {
  readonly cause?: unknown;
  readonly code: string;
  readonly message: string;
  readonly recoverable: boolean;
  readonly sourceKind?: string;
}

export type WaveformSessionStatus =
  | { readonly state: "idle" }
  | { readonly sourceKind: string; readonly state: "connecting" }
  | { readonly sourceKind: string; readonly state: WaveformSourceState }
  | { readonly error: WaveformSessionError; readonly state: "error" }
  | { readonly state: "disposed" };

export interface WaveformSourceDescriptor {
  readonly id: string;
  readonly kind: string;
  readonly ownership: SourceOwnership;
}

export interface WaveformSessionSnapshot<Frame extends AnalysisFrame = AnalysisFrame> {
  readonly epoch: number;
  readonly frame: Frame | null;
  readonly source: WaveformSourceDescriptor | null;
  readonly status: WaveformSessionStatus;
}

export interface WaveformSourceContext<Frame extends AnalysisFrame = AnalysisFrame> {
  readonly epoch: number;
  readonly signal: AbortSignal;
  fail(error: WaveformSessionError): void;
  publish(frame: Frame): void;
  setState(state: WaveformSourceState): void;
}

export interface WaveformSourceHandle {
  dispose(): Promise<void> | void;
}

export interface WaveformSource<
  Frame extends AnalysisFrame = AnalysisFrame,
> extends WaveformSourceDescriptor {
  connect(
    context: WaveformSourceContext<Frame>,
  ): Promise<WaveformSourceHandle | void> | WaveformSourceHandle | void;
}

export interface WaveformSession<Frame extends AnalysisFrame = AnalysisFrame> {
  attach(source: WaveformSource<Frame>): Promise<void>;
  detach(): Promise<void>;
  dispose(): Promise<void>;
  getSnapshot(): WaveformSessionSnapshot<Frame>;
  subscribe(listener: () => void): () => void;
}
