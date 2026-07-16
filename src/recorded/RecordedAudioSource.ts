import {
  createWaveformFrameFromPeakLevel,
  extractWaveformPeakPyramid,
} from "../core/waveformPeaks";
import type { WaveformFrame, WaveformPeakPyramid } from "../types";
import type {
  WaveformSessionError,
  WaveformSource,
  WaveformSourceContext,
  WaveformSourceHandle,
} from "../session/types";

export type RecordedAudioInput = ArrayBuffer | Blob | URL | string;

export type RecordedAudioState =
  | "disposed"
  | "ended"
  | "error"
  | "idle"
  | "loading"
  | "paused"
  | "playing"
  | "ready";

export interface RecordedAudioSnapshot {
  readonly buffered: number;
  readonly currentTime: number;
  readonly duration: number;
  readonly error?: WaveformSessionError;
  readonly name: string;
  readonly state: RecordedAudioState;
}

export interface RecordedAudioEnvironment {
  createAudioContext(): Pick<AudioContext, "close" | "decodeAudioData">;
  createAudioElement(): HTMLAudioElement;
  createObjectURL(blob: Blob): string;
  fetchArrayBuffer(url: string, signal: AbortSignal): Promise<ArrayBuffer>;
  revokeObjectURL(url: string): void;
}

export interface RecordedAudioSourceOptions {
  readonly environment?: RecordedAudioEnvironment;
  readonly id?: string;
  readonly maxBasePeaks?: number;
  readonly name?: string;
}

export interface RecordedAudioSource extends WaveformSource<WaveformFrame> {
  getPeakPyramid(): WaveformPeakPyramid | null;
  getTransportSnapshot(): RecordedAudioSnapshot;
  pause(): void;
  play(): Promise<void>;
  seek(time: number): void;
  subscribeTransport(listener: () => void): () => void;
}

export function createRecordedAudioSource(
  input: RecordedAudioInput,
  options: RecordedAudioSourceOptions = {},
): RecordedAudioSource {
  return new DefaultRecordedAudioSource(input, options);
}

class DefaultRecordedAudioSource implements RecordedAudioSource {
  readonly id: string;
  readonly kind = "recorded-audio";
  readonly ownership = "owned" as const;
  readonly #environment: RecordedAudioEnvironment;
  readonly #input: RecordedAudioInput;
  readonly #listeners = new Set<() => void>();
  readonly #maxBasePeaks: number;
  #audioContext: Pick<AudioContext, "close" | "decodeAudioData"> | null = null;
  #audioElement: HTMLAudioElement | null = null;
  #objectUrl: string | null = null;
  #peaks: WaveformPeakPyramid | null = null;
  #removeMediaListeners: (() => void) | null = null;
  #sourceContext: WaveformSourceContext<WaveformFrame> | null = null;
  #snapshot: RecordedAudioSnapshot;

  constructor(input: RecordedAudioInput, options: RecordedAudioSourceOptions) {
    this.id = options.id ?? "recorded-audio";
    this.#input = input;
    this.#environment = options.environment ?? createBrowserRecordedAudioEnvironment();
    this.#maxBasePeaks = options.maxBasePeaks ?? 65_536;
    this.#snapshot = Object.freeze({
      buffered: 0,
      currentTime: 0,
      duration: 0,
      name: options.name ?? inputName(input),
      state: "idle",
    });
  }

  getPeakPyramid = (): WaveformPeakPyramid | null => this.#peaks;

  getTransportSnapshot = (): RecordedAudioSnapshot => this.#snapshot;

  subscribeTransport = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  async connect(
    context: WaveformSourceContext<WaveformFrame>,
  ): Promise<WaveformSourceHandle | void> {
    await this.#cleanup(false);
    this.#sourceContext = context;
    this.#commit({ buffered: 0, currentTime: 0, duration: 0, state: "loading" });

    try {
      const resolved = await resolveRecordedInput(this.#input, context.signal, this.#environment);
      if (context.signal.aborted) {
        resolved.revoke?.();
        return;
      }
      this.#objectUrl = resolved.objectUrl;
      this.#audioContext = this.#environment.createAudioContext();
      this.#audioElement = this.#environment.createAudioElement();
      this.#audioElement.preload = "metadata";
      this.#audioElement.src = resolved.mediaUrl;
      this.#attachMediaListeners(this.#audioElement);
      this.#audioElement.load();

      const decoded = await this.#audioContext.decodeAudioData(resolved.data.slice(0));
      if (context.signal.aborted) {
        await this.#cleanup(false);
        return;
      }

      const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) =>
        decoded.getChannelData(index),
      );
      this.#peaks = extractWaveformPeakPyramid(channels, { maxBasePeaks: this.#maxBasePeaks });
      const frame = createWaveformFrameFromPeakLevel(this.#peaks.levels[0], {
        duration: decoded.duration,
        sampleRate: decoded.sampleRate,
      });
      context.publish(frame);
      this.#commit({
        buffered: mediaBufferedFraction(this.#audioElement),
        currentTime: 0,
        duration: finiteNonNegative(decoded.duration),
        state: "ready",
      });
      return onceHandle(() => this.#cleanup(false));
    } catch (cause) {
      if (context.signal.aborted) {
        await this.#cleanup(false);
        return;
      }
      const error = recordedError(cause);
      await this.#cleanup(false);
      this.#commit({ error, state: "error" });
      context.fail(error);
    }
  }

  async play(): Promise<void> {
    const audio = this.#audioElement;
    if (!audio) {
      const error = recordedError(new Error("Recorded audio is not ready."), "AUDIO_NOT_READY");
      this.#commit({ error, state: "error" });
      this.#sourceContext?.fail(error);
      return;
    }
    try {
      await audio.play();
      this.#commit({ state: "playing" });
    } catch (cause) {
      const error = recordedError(cause, "AUDIO_PLAYBACK_BLOCKED");
      this.#commit({ error, state: "error" });
      this.#sourceContext?.fail(error);
    }
  }

  pause(): void {
    this.#audioElement?.pause();
    if (this.#snapshot.state !== "ended") this.#commit({ state: "paused" });
  }

  seek(time: number): void {
    const duration = this.#snapshot.duration;
    const nextTime = Math.min(duration, Math.max(0, Number.isFinite(time) ? time : 0));
    if (this.#audioElement) this.#audioElement.currentTime = nextTime;
    this.#commit({
      currentTime: nextTime,
      state: nextTime >= duration && duration > 0 ? "ended" : this.#snapshot.state,
    });
  }

  #attachMediaListeners(audio: HTMLAudioElement): void {
    const updateTime = () =>
      this.#commit({
        buffered: mediaBufferedFraction(audio),
        currentTime: finiteNonNegative(audio.currentTime),
        duration: finiteNonNegative(audio.duration || this.#snapshot.duration),
      });
    const onPlay = () => this.#commit({ state: "playing" });
    const onPause = () => {
      if (!audio.ended) this.#commit({ state: "paused" });
    };
    const onEnded = () => this.#commit({ currentTime: this.#snapshot.duration, state: "ended" });
    const onError = () => {
      const error = recordedError(
        new Error(audio.error?.message || "The media element reported a playback error."),
        "AUDIO_MEDIA_ERROR",
      );
      this.#commit({ error, state: "error" });
      this.#sourceContext?.fail(error);
    };
    const bindings: readonly [string, EventListener][] = [
      ["durationchange", updateTime],
      ["progress", updateTime],
      ["timeupdate", updateTime],
      ["play", onPlay],
      ["pause", onPause],
      ["ended", onEnded],
      ["error", onError],
    ];
    for (const [event, listener] of bindings) audio.addEventListener(event, listener);
    this.#removeMediaListeners = () => {
      for (const [event, listener] of bindings) audio.removeEventListener(event, listener);
    };
  }

  #commit(patch: Partial<RecordedAudioSnapshot>): void {
    this.#snapshot = Object.freeze({ ...this.#snapshot, ...patch });
    for (const listener of this.#listeners) listener();
  }

  async #cleanup(terminal: boolean): Promise<void> {
    this.#removeMediaListeners?.();
    this.#removeMediaListeners = null;
    if (this.#audioElement) {
      this.#audioElement.pause();
      this.#audioElement.removeAttribute("src");
      this.#audioElement.load();
    }
    this.#audioElement = null;
    if (this.#objectUrl) this.#environment.revokeObjectURL(this.#objectUrl);
    this.#objectUrl = null;
    await this.#audioContext?.close();
    this.#audioContext = null;
    this.#sourceContext = null;
    this.#peaks = null;
    this.#commit({ state: terminal ? "disposed" : "idle" });
  }
}

function createBrowserRecordedAudioEnvironment(): RecordedAudioEnvironment {
  return {
    createAudioContext() {
      if (typeof AudioContext === "undefined") {
        throw new Error("Web Audio decoding is unavailable in this environment.");
      }
      return new AudioContext();
    },
    createAudioElement() {
      if (typeof document === "undefined") {
        throw new Error("Media playback is unavailable outside a browser document.");
      }
      return document.createElement("audio");
    },
    createObjectURL(blob) {
      return URL.createObjectURL(blob);
    },
    async fetchArrayBuffer(url, signal) {
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Audio request failed with status ${response.status}.`);
      return response.arrayBuffer();
    },
    revokeObjectURL(url) {
      URL.revokeObjectURL(url);
    },
  };
}

async function resolveRecordedInput(
  input: RecordedAudioInput,
  signal: AbortSignal,
  environment: RecordedAudioEnvironment,
): Promise<{
  readonly data: ArrayBuffer;
  readonly mediaUrl: string;
  readonly objectUrl: string | null;
  readonly revoke?: () => void;
}> {
  if (typeof input === "string" || input instanceof URL) {
    const mediaUrl = input.toString();
    return {
      data: await environment.fetchArrayBuffer(mediaUrl, signal),
      mediaUrl,
      objectUrl: null,
    };
  }
  const blob = input instanceof ArrayBuffer ? new Blob([input]) : input;
  const data = input instanceof ArrayBuffer ? input.slice(0) : await input.arrayBuffer();
  const objectUrl = environment.createObjectURL(blob);
  return {
    data,
    mediaUrl: objectUrl,
    objectUrl,
    revoke: () => environment.revokeObjectURL(objectUrl),
  };
}

function inputName(input: RecordedAudioInput): string {
  if (typeof input === "string") return input.split("/").at(-1) || "Remote audio";
  if (input instanceof URL) return input.pathname.split("/").at(-1) || "Remote audio";
  if ("name" in input && typeof input.name === "string") return input.name;
  return input instanceof ArrayBuffer ? "Audio data" : "Local audio";
}

function recordedError(cause: unknown, code = "AUDIO_DECODE_FAILED"): WaveformSessionError {
  return Object.freeze({
    cause,
    code,
    message: errorMessage(cause, "The audio could not be decoded."),
    recoverable: true,
    sourceKind: "recorded-audio",
  });
}

function errorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof Error) return cause.message;
  if (
    typeof cause === "object" &&
    cause !== null &&
    "message" in cause &&
    typeof cause.message === "string"
  ) {
    return cause.message;
  }
  return fallback;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function mediaBufferedFraction(audio: HTMLAudioElement): number {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0 || audio.buffered.length === 0)
    return 0;
  return Math.min(1, Math.max(0, audio.buffered.end(audio.buffered.length - 1) / audio.duration));
}

function onceHandle(dispose: () => Promise<void>): WaveformSourceHandle {
  let disposed = false;
  return {
    async dispose() {
      if (disposed) return;
      disposed = true;
      await dispose();
    },
  };
}
