import type { AnalysisFrame } from "../types";
import type {
  WaveformSession,
  WaveformSessionError,
  WaveformSessionSnapshot,
  WaveformSource,
  WaveformSourceContext,
  WaveformSourceDescriptor,
  WaveformSourceHandle,
  WaveformSourceState,
} from "./types";

const IDLE_STATUS = Object.freeze({ state: "idle" } as const);
const DISPOSED_STATUS = Object.freeze({ state: "disposed" } as const);

export function createWaveformSession<
  Frame extends AnalysisFrame = AnalysisFrame,
>(): WaveformSession<Frame> {
  return new DefaultWaveformSession<Frame>();
}

class DefaultWaveformSession<Frame extends AnalysisFrame> implements WaveformSession<Frame> {
  readonly #listeners = new Set<() => void>();
  #abortController: AbortController | null = null;
  #activeHandle: WaveformSourceHandle | null = null;
  #disposed = false;
  #epoch = 0;
  #snapshot: WaveformSessionSnapshot<Frame> = Object.freeze({
    epoch: 0,
    frame: null,
    source: null,
    status: IDLE_STATUS,
  });

  getSnapshot = (): WaveformSessionSnapshot<Frame> => this.#snapshot;

  subscribe = (listener: () => void): (() => void) => {
    if (this.#disposed) return () => {};
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  async attach(source: WaveformSource<Frame>): Promise<void> {
    this.#assertActive();
    const epoch = this.#beginTransition();
    const previousSource = this.#snapshot.source;
    const previousHandle = this.#takeActiveHandle();
    try {
      await disposeHandle(previousHandle);
    } catch (cause) {
      if (this.#isCurrent(epoch)) {
        this.#commit({
          epoch,
          frame: null,
          source: previousSource,
          status: {
            error: {
              cause,
              code: "SOURCE_DISPOSE_FAILED",
              message:
                cause instanceof Error ? cause.message : "The previous source could not dispose.",
              recoverable: true,
              sourceKind: previousSource?.kind,
            },
            state: "error",
          },
        });
      }
      return;
    }
    if (!this.#isCurrent(epoch)) return;

    const abortController = new AbortController();
    this.#abortController = abortController;
    this.#commit({
      epoch,
      frame: null,
      source: descriptorOf(source),
      status: { sourceKind: source.kind, state: "connecting" },
    });

    const context = this.#createContext(source, epoch, abortController.signal);
    try {
      const connectedHandle = toOnceHandle(await source.connect(context));
      if (!this.#isCurrent(epoch) || abortController.signal.aborted) {
        await disposeHandle(connectedHandle);
        return;
      }
      this.#activeHandle = connectedHandle;
      if (this.#snapshot.status.state === "connecting") {
        this.#setSourceState(
          source,
          epoch,
          this.#snapshot.frame ? frameState(this.#snapshot.frame) : "empty",
        );
      }
    } catch (cause) {
      if (!this.#isCurrent(epoch) || abortController.signal.aborted) return;
      this.#setError(source, epoch, normalizeSourceError(cause, source.kind));
    }
  }

  async detach(): Promise<void> {
    if (this.#disposed) return;
    const epoch = this.#beginTransition();
    const handle = this.#takeActiveHandle();
    this.#commit({ epoch, frame: null, source: null, status: IDLE_STATUS });
    await disposeHandle(handle);
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#epoch += 1;
    this.#abortController?.abort();
    this.#abortController = null;
    const handle = this.#takeActiveHandle();
    this.#commit({ epoch: this.#epoch, frame: null, source: null, status: DISPOSED_STATUS });
    this.#listeners.clear();
    await disposeHandle(handle);
  }

  #assertActive(): void {
    if (this.#disposed) throw new Error("Cannot attach a source to a disposed WaveformSession.");
  }

  #beginTransition(): number {
    this.#epoch += 1;
    this.#abortController?.abort();
    this.#abortController = null;
    return this.#epoch;
  }

  #commit(snapshot: WaveformSessionSnapshot<Frame>): void {
    this.#snapshot = Object.freeze(snapshot);
    for (const listener of this.#listeners) listener();
  }

  #createContext(
    source: WaveformSource<Frame>,
    epoch: number,
    signal: AbortSignal,
  ): WaveformSourceContext<Frame> {
    return Object.freeze({
      epoch,
      signal,
      fail: (error: WaveformSessionError) => this.#setError(source, epoch, error),
      publish: (frame: Frame) => {
        if (!this.#isCurrent(epoch) || signal.aborted) return;
        this.#commit({
          epoch,
          frame,
          source: descriptorOf(source),
          status: { sourceKind: source.kind, state: frameState(frame) },
        });
      },
      setState: (state: WaveformSourceState) => this.#setSourceState(source, epoch, state),
    });
  }

  #isCurrent(epoch: number): boolean {
    return !this.#disposed && epoch === this.#epoch;
  }

  #setError(source: WaveformSource<Frame>, epoch: number, error: WaveformSessionError): void {
    if (!this.#isCurrent(epoch)) return;
    this.#commit({
      epoch,
      frame: this.#snapshot.frame,
      source: descriptorOf(source),
      status: {
        error: Object.freeze({ ...error, sourceKind: error.sourceKind ?? source.kind }),
        state: "error",
      },
    });
  }

  #setSourceState(source: WaveformSource<Frame>, epoch: number, state: WaveformSourceState): void {
    if (!this.#isCurrent(epoch)) return;
    this.#commit({
      epoch,
      frame: this.#snapshot.frame,
      source: descriptorOf(source),
      status: { sourceKind: source.kind, state },
    });
  }

  #takeActiveHandle(): WaveformSourceHandle | null {
    const handle = this.#activeHandle;
    this.#activeHandle = null;
    return handle;
  }
}

function descriptorOf(source: WaveformSource): WaveformSourceDescriptor {
  return Object.freeze({ id: source.id, kind: source.kind, ownership: source.ownership });
}

function frameState(frame: AnalysisFrame): "empty" | "ready" {
  return frame.state;
}

function normalizeSourceError(cause: unknown, sourceKind: string): WaveformSessionError {
  if (isSessionError(cause)) return cause;
  return {
    cause,
    code: "SOURCE_CONNECT_FAILED",
    message: cause instanceof Error ? cause.message : "The waveform source could not connect.",
    recoverable: true,
    sourceKind,
  };
}

function isSessionError(value: unknown): value is WaveformSessionError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "string" &&
    "message" in value &&
    typeof value.message === "string" &&
    "recoverable" in value &&
    typeof value.recoverable === "boolean"
  );
}

function toOnceHandle(handle: WaveformSourceHandle | void): WaveformSourceHandle | null {
  if (!handle) return null;
  let disposed = false;
  return {
    async dispose() {
      if (disposed) return;
      disposed = true;
      await handle.dispose();
    },
  };
}

async function disposeHandle(handle: WaveformSourceHandle | null): Promise<void> {
  await handle?.dispose();
}
