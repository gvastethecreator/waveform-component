import { describe, expect, it, vi } from "vitest";
import { createStaticWaveformSource } from "../session/sources";
import { createWaveformSession } from "../session/WaveformSession";
import type { WaveformFrame } from "../types";
import { createRecordedAudioSource, type RecordedAudioEnvironment } from "./RecordedAudioSource";

class FakeAudioElement extends EventTarget {
  buffered = { length: 1, end: () => this.duration } as unknown as TimeRanges;
  currentTime = 0;
  duration = 12;
  ended = false;
  error: MediaError | null = null;
  preload = "";
  src = "";
  load = vi.fn();
  pause = vi.fn(() => this.dispatchEvent(new Event("pause")));
  play = vi.fn(async () => {
    this.dispatchEvent(new Event("play"));
  });
  removeAttribute = vi.fn((name: string) => {
    if (name === "src") this.src = "";
  });
}

function audioBuffer(samples = new Float32Array([-1, -0.5, 0, 0.5, 1]), duration = 12) {
  return {
    duration,
    numberOfChannels: 1,
    sampleRate: 48_000,
    getChannelData: () => samples,
  } as unknown as AudioBuffer;
}

function fakeEnvironment(
  decode: (data: ArrayBuffer) => Promise<AudioBuffer> = async () => audioBuffer(),
) {
  const audio = new FakeAudioElement();
  const close = vi.fn(async () => {});
  const createObjectURL = vi.fn(() => "blob:local-audio");
  const revokeObjectURL = vi.fn();
  const fetchArrayBuffer = vi.fn(async () => new ArrayBuffer(8));
  const environment: RecordedAudioEnvironment = {
    createAudioContext: () => ({ close, decodeAudioData: decode }) as never,
    createAudioElement: () => audio as unknown as HTMLAudioElement,
    createObjectURL,
    fetchArrayBuffer,
    revokeObjectURL,
  };
  return { audio, close, createObjectURL, environment, fetchArrayBuffer, revokeObjectURL };
}

describe("RecordedAudioSource", () => {
  it("decodes a local Blob without upload and publishes bounded signed peaks", async () => {
    const fixture = fakeEnvironment();
    const source = createRecordedAudioSource(new Blob([new Uint8Array([1, 2, 3])]), {
      environment: fixture.environment,
      maxBasePeaks: 32,
      name: "voice.wav",
    });
    const session = createWaveformSession<WaveformFrame>();
    await session.attach(source);

    expect(fixture.fetchArrayBuffer).not.toHaveBeenCalled();
    expect(fixture.createObjectURL).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot()).toMatchObject({
      frame: { kind: "waveform", state: "ready", duration: 12, sampleRate: 48_000 },
      status: { state: "ready" },
    });
    expect(source.getPeakPyramid()?.levels[0].peakCount).toBeLessThanOrEqual(32);
    expect(source.getTransportSnapshot()).toMatchObject({
      currentTime: 0,
      duration: 12,
      name: "voice.wav",
      state: "ready",
    });

    await source.play();
    source.seek(7.5);
    fixture.audio.dispatchEvent(new Event("timeupdate"));
    expect(source.getTransportSnapshot()).toMatchObject({ currentTime: 7.5, state: "playing" });
    source.pause();
    expect(source.getTransportSnapshot().state).toBe("paused");

    await session.detach();
    expect(fixture.revokeObjectURL).toHaveBeenCalledWith("blob:local-audio");
    expect(fixture.close).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale delayed decode and releases its owned resources", async () => {
    let resolveDecode: ((buffer: AudioBuffer) => void) | undefined;
    let markDecodeStarted: (() => void) | undefined;
    const decodeStarted = new Promise<void>((resolve) => {
      markDecodeStarted = resolve;
    });
    const fixture = fakeEnvironment(
      () =>
        new Promise((resolve) => {
          resolveDecode = resolve;
          markDecodeStarted?.();
        }),
    );
    const source = createRecordedAudioSource(new ArrayBuffer(8), {
      environment: fixture.environment,
    });
    const session = createWaveformSession<WaveformFrame>();
    const staleAttach = session.attach(source);
    await decodeStarted;
    await session.attach(createStaticWaveformSource([-1, 1], { id: "replacement" }));
    resolveDecode?.(audioBuffer());
    await staleAttach;

    expect(session.getSnapshot().source?.id).toBe("replacement");
    expect(fixture.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(fixture.close).toHaveBeenCalledTimes(1);
  });

  it("surfaces corrupt and zero-duration inputs as explicit recoverable states", async () => {
    const corruptFixture = fakeEnvironment(async () => {
      throw new DOMException("Unsupported stream", "EncodingError");
    });
    const corruptSource = createRecordedAudioSource(new ArrayBuffer(2), {
      environment: corruptFixture.environment,
    });
    const corruptSession = createWaveformSession<WaveformFrame>();
    await corruptSession.attach(corruptSource);
    expect(corruptSession.getSnapshot().status).toMatchObject({
      state: "error",
      error: { code: "AUDIO_DECODE_FAILED", message: "Unsupported stream", recoverable: true },
    });
    expect(corruptSource.getTransportSnapshot()).toMatchObject({ state: "error" });

    const emptyFixture = fakeEnvironment(async () => audioBuffer(new Float32Array(), 0));
    const emptySource = createRecordedAudioSource(new ArrayBuffer(0), {
      environment: emptyFixture.environment,
    });
    const emptySession = createWaveformSession<WaveformFrame>();
    await emptySession.attach(emptySource);
    expect(emptySession.getSnapshot().frame).toMatchObject({ state: "empty", sampleCount: 0 });
    expect(emptySource.getTransportSnapshot()).toMatchObject({ duration: 0, state: "ready" });
  });
});
