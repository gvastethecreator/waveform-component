import { createStaticWaveformFrame } from "../core/staticFrame";
import type { WaveformFrame } from "../types";
import type {
  SourceOwnership,
  WaveformSessionError,
  WaveformSource,
  WaveformSourceContext,
  WaveformSourceHandle,
} from "../session/types";

export type MicrophoneState =
  | "idle"
  | "requesting"
  | "live"
  | "muted"
  | "silent"
  | "ended"
  | "denied"
  | "unavailable"
  | "error";

export interface MicrophoneSnapshot {
  readonly error?: WaveformSessionError;
  readonly state: MicrophoneState;
}

export interface LiveAudioContext {
  readonly sampleRate: number;
  close(): Promise<void>;
  createAnalyser(): AnalyserNode;
  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode;
  resume(): Promise<void>;
}

export interface MicrophoneEnvironment {
  cancelFrame(handle: number): void;
  createAudioContext(): LiveAudioContext;
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  requestFrame(callback: FrameRequestCallback): number;
}

export interface MicrophoneSourceOptions {
  readonly analyserSize?: number;
  readonly environment?: MicrophoneEnvironment;
  readonly id?: string;
  readonly silenceFrames?: number;
  readonly silenceThreshold?: number;
}

export interface MicrophoneSource extends WaveformSource<WaveformFrame> {
  getMicrophoneSnapshot(): MicrophoneSnapshot;
  subscribeMicrophone(listener: () => void): () => void;
}

export function createMicrophoneSource(options: MicrophoneSourceOptions = {}): MicrophoneSource {
  return new LiveStreamSource(null, "owned", options);
}

export function createLiveMediaStreamSource(
  stream: MediaStream,
  options: MicrophoneSourceOptions & { readonly ownership?: SourceOwnership } = {},
): MicrophoneSource {
  return new LiveStreamSource(stream, options.ownership ?? "borrowed", options);
}

class LiveStreamSource implements MicrophoneSource {
  readonly id: string;
  readonly kind = "microphone";
  readonly ownership: SourceOwnership;
  readonly #environment: MicrophoneEnvironment;
  readonly #listeners = new Set<() => void>();
  readonly #providedStream: MediaStream | null;
  readonly #analyserSize: number;
  readonly #silenceFrames: number;
  readonly #silenceThreshold: number;
  #snapshot: MicrophoneSnapshot = Object.freeze({ state: "idle" });

  constructor(
    stream: MediaStream | null,
    ownership: SourceOwnership,
    options: MicrophoneSourceOptions,
  ) {
    this.id = options.id ?? (stream ? "live-stream" : "microphone");
    this.ownership = ownership;
    this.#providedStream = stream;
    this.#environment = options.environment ?? browserMicrophoneEnvironment();
    this.#analyserSize = powerOfTwo(options.analyserSize ?? 2048);
    this.#silenceFrames = Math.max(1, Math.round(options.silenceFrames ?? 30));
    this.#silenceThreshold = Math.max(0, options.silenceThreshold ?? 0.001);
  }

  getMicrophoneSnapshot = () => this.#snapshot;
  subscribeMicrophone = (listener: () => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  async connect(
    context: WaveformSourceContext<WaveformFrame>,
  ): Promise<WaveformSourceHandle | void> {
    this.#commit("requesting");
    let stream: MediaStream | null = null;
    let audioContext: LiveAudioContext | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let frameHandle: number | null = null;
    const trackBindings: Array<{ track: MediaStreamTrack; listener: EventListener }> = [];
    let disposed = false;
    let terminal = false;
    let resourcesReleased = false;
    const releaseResources = async () => {
      if (resourcesReleased) return;
      resourcesReleased = true;
      let releaseError: unknown;
      const release = (operation: () => void) => {
        try {
          operation();
        } catch (cause) {
          releaseError ??= cause;
        }
      };
      if (frameHandle !== null) this.#environment.cancelFrame(frameHandle);
      frameHandle = null;
      for (const { track, listener } of trackBindings) {
        release(() => track.removeEventListener("ended", listener));
        release(() => track.removeEventListener("mute", listener));
        release(() => track.removeEventListener("unmute", listener));
      }
      release(() => analyser?.disconnect());
      release(() => sourceNode?.disconnect());
      if (audioContext) {
        try {
          await audioContext.close();
        } catch (cause) {
          releaseError ??= cause;
        }
      }
      if (stream && this.ownership === "owned")
        for (const track of stream.getTracks()) release(() => track.stop());
      if (releaseError) throw releaseError;
    };
    const cleanup = async () => {
      if (disposed) return;
      disposed = true;
      await releaseResources();
      this.#commit("idle");
    };

    try {
      stream = this.#providedStream ?? (await this.#environment.getUserMedia({ audio: true }));
      if (context.signal.aborted) {
        await cleanup();
        return;
      }
      const tracks = stream.getAudioTracks();
      if (tracks.length === 0)
        throw microphoneError(
          "MICROPHONE_UNAVAILABLE",
          "No audio input track is available.",
          "unavailable",
        );
      audioContext = this.#environment.createAudioContext();
      await audioContext.resume();
      sourceNode = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = this.#analyserSize;
      sourceNode.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let silentFrames = 0;
      const updateTrackState = () => {
        if (tracks.every((track) => track.readyState === "ended")) {
          terminal = true;
          this.#commit("ended");
          context.setState("ended");
          void releaseResources().catch((cause) => {
            context.fail(
              microphoneError(
                "MICROPHONE_RELEASE_FAILED",
                cause instanceof Error
                  ? cause.message
                  : "Microphone resources could not be released.",
                "error",
                cause,
              ),
            );
          });
        } else if (tracks.every((track) => track.muted || !track.enabled)) {
          this.#commit("muted");
          context.setState("muted");
        } else {
          this.#commit("live");
          context.setState("ready");
        }
      };
      for (const track of tracks) {
        const listener = () => updateTrackState();
        track.addEventListener("ended", listener);
        track.addEventListener("mute", listener);
        track.addEventListener("unmute", listener);
        trackBindings.push({ track, listener });
      }
      const draw = () => {
        if (disposed || terminal || context.signal.aborted || !analyser) return;
        analyser.getFloatTimeDomainData(samples);
        let peak = 0;
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
        silentFrames = peak <= this.#silenceThreshold ? silentFrames + 1 : 0;
        const muted = tracks.every((track) => track.muted || !track.enabled);
        if (!muted && tracks.some((track) => track.readyState !== "ended")) {
          const state = silentFrames >= this.#silenceFrames ? "silent" : "live";
          this.#commit(state);
          context.publish(
            createStaticWaveformFrame(samples, { sampleRate: audioContext!.sampleRate }),
          );
          context.setState(state === "live" ? "ready" : "silent");
        }
        frameHandle = this.#environment.requestFrame(draw);
      };
      this.#commit("live");
      context.setState("ready");
      frameHandle = this.#environment.requestFrame(draw);
      return { dispose: cleanup };
    } catch (cause) {
      await cleanup();
      const error = normalizeMicrophoneError(cause);
      this.#commit(
        error.code === "MICROPHONE_DENIED"
          ? "denied"
          : error.code === "MICROPHONE_UNAVAILABLE"
            ? "unavailable"
            : "error",
        error,
      );
      context.fail(error);
    }
  }

  #commit(state: MicrophoneState, error?: WaveformSessionError) {
    this.#snapshot = Object.freeze({ state, ...(error ? { error } : {}) });
    for (const listener of this.#listeners) listener();
  }
}

function browserMicrophoneEnvironment(): MicrophoneEnvironment {
  return {
    cancelFrame: (handle) => cancelAnimationFrame(handle),
    createAudioContext: () => new AudioContext(),
    getUserMedia: (constraints) => {
      if (!navigator.mediaDevices?.getUserMedia)
        return Promise.reject(
          microphoneError(
            "MICROPHONE_UNAVAILABLE",
            "Microphone capture is unavailable.",
            "unavailable",
          ),
        );
      return navigator.mediaDevices.getUserMedia(constraints);
    },
    requestFrame: (callback) => requestAnimationFrame(callback),
  };
}

function normalizeMicrophoneError(cause: unknown): WaveformSessionError {
  if (isMicrophoneError(cause)) return cause;
  const name =
    typeof cause === "object" && cause !== null && "name" in cause ? String(cause.name) : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return microphoneError(
      "MICROPHONE_DENIED",
      "Microphone permission was denied. Allow access and try again.",
      "denied",
      cause,
    );
  if (name === "NotFoundError" || name === "NotReadableError")
    return microphoneError(
      "MICROPHONE_UNAVAILABLE",
      "No usable microphone is available. Check the device and try again.",
      "unavailable",
      cause,
    );
  const message =
    typeof cause === "object" && cause !== null && "message" in cause
      ? String(cause.message)
      : "Microphone capture failed.";
  return microphoneError("MICROPHONE_FAILED", message, "error", cause);
}

type MicrophoneTaggedError = WaveformSessionError & { readonly microphoneState: MicrophoneState };
function microphoneError(
  code: string,
  message: string,
  microphoneState: MicrophoneState,
  cause?: unknown,
): MicrophoneTaggedError {
  return Object.freeze({
    code,
    message,
    recoverable: true,
    sourceKind: "microphone",
    microphoneState,
    ...(cause ? { cause } : {}),
  });
}
function isMicrophoneError(value: unknown): value is MicrophoneTaggedError {
  return (
    typeof value === "object" && value !== null && "microphoneState" in value && "code" in value
  );
}
function powerOfTwo(value: number): number {
  const bounded = Math.min(32768, Math.max(32, Number.isFinite(value) ? value : 2048));
  return 2 ** Math.round(Math.log2(bounded));
}
