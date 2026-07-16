import { describe, expect, it, vi } from "vitest";
import { createStaticWaveformSource } from "../session/sources";
import { createWaveformSession } from "../session/WaveformSession";
import type { WaveformFrame } from "../types";
import {
  createLiveMediaStreamSource,
  createMicrophoneSource,
  type MicrophoneEnvironment,
} from "./MicrophoneSource";

class MicrophoneTrack extends EventTarget {
  enabled = true;
  muted = false;
  readyState: MediaStreamTrackState = "live";
  stop = vi.fn(() => {
    this.readyState = "ended";
  });
}

function streamWith(track: MicrophoneTrack) {
  return {
    getAudioTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream;
}

function liveFixture(stream: MediaStream, samples = new Float32Array([0.2, -0.1, 0.05, -0.2])) {
  let frameCallback: FrameRequestCallback | undefined;
  const analyser = {
    fftSize: samples.length,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatTimeDomainData: vi.fn((output: Float32Array) => output.set(samples)),
  } as unknown as AnalyserNode;
  const sourceNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as MediaStreamAudioSourceNode;
  const close = vi.fn(async () => {});
  const environment: MicrophoneEnvironment = {
    cancelFrame: vi.fn(),
    createAudioContext: () => ({
      sampleRate: 48_000,
      close,
      createAnalyser: () => analyser,
      createMediaStreamSource: () => sourceNode,
      resume: vi.fn(async () => {}),
    }),
    getUserMedia: vi.fn(async () => stream),
    requestFrame: vi.fn((callback) => {
      frameCallback = callback;
      return 17;
    }),
  };
  return { analyser, close, environment, getFrame: () => frameCallback, samples, sourceNode };
}

describe("MicrophoneSource", () => {
  it("does not request permission until explicitly attached", async () => {
    const track = new MicrophoneTrack();
    const fixture = liveFixture(streamWith(track));
    const source = createMicrophoneSource({ environment: fixture.environment });
    expect(fixture.environment.getUserMedia).not.toHaveBeenCalled();

    const session = createWaveformSession<WaveformFrame>();
    await session.attach(source);
    expect(fixture.environment.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(source.getMicrophoneSnapshot().state).toBe("live");
  });

  it("publishes live and persistent silent frames through one analyser lifecycle", async () => {
    const track = new MicrophoneTrack();
    const fixture = liveFixture(streamWith(track));
    const source = createMicrophoneSource({
      analyserSize: 32,
      environment: fixture.environment,
      silenceFrames: 2,
    });
    const session = createWaveformSession<WaveformFrame>();
    await session.attach(source);

    fixture.getFrame()?.(0);
    expect(session.getSnapshot()).toMatchObject({
      frame: { kind: "waveform", sampleRate: 48_000, state: "ready" },
      status: { state: "ready" },
    });

    fixture.samples.fill(0);
    fixture.getFrame()?.(16);
    fixture.getFrame()?.(32);
    expect(source.getMicrophoneSnapshot().state).toBe("silent");
    expect(session.getSnapshot().status).toMatchObject({ state: "silent" });
  });

  it("announces mute immediately and releases analysis resources when the device ends", async () => {
    const track = new MicrophoneTrack();
    const fixture = liveFixture(streamWith(track));
    const source = createMicrophoneSource({ environment: fixture.environment });
    const session = createWaveformSession<WaveformFrame>();
    await session.attach(source);

    track.muted = true;
    track.dispatchEvent(new Event("mute"));
    expect(source.getMicrophoneSnapshot().state).toBe("muted");
    expect(session.getSnapshot().status).toMatchObject({ state: "muted" });

    track.muted = false;
    track.dispatchEvent(new Event("unmute"));
    expect(source.getMicrophoneSnapshot().state).toBe("live");
    expect(session.getSnapshot().status).toMatchObject({ state: "ready" });

    track.readyState = "ended";
    track.dispatchEvent(new Event("ended"));
    expect(source.getMicrophoneSnapshot().state).toBe("ended");
    expect(session.getSnapshot().status).toMatchObject({ state: "ended" });
    await vi.waitFor(() => expect(fixture.close).toHaveBeenCalledTimes(1));
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(fixture.environment.cancelFrame).toHaveBeenCalledTimes(1);
    expect(fixture.sourceNode.disconnect).toHaveBeenCalledTimes(1);
    expect(fixture.analyser.disconnect).toHaveBeenCalledTimes(1);

    await session.detach();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(fixture.close).toHaveBeenCalledTimes(1);
  });

  it("maps denial and stale permission results to safe recoverable outcomes", async () => {
    const deniedEnvironment = liveFixture(streamWith(new MicrophoneTrack())).environment;
    deniedEnvironment.getUserMedia = vi.fn(async () => {
      throw new DOMException("blocked", "NotAllowedError");
    });
    const denied = createMicrophoneSource({ environment: deniedEnvironment });
    const deniedSession = createWaveformSession<WaveformFrame>();
    await deniedSession.attach(denied);
    expect(denied.getMicrophoneSnapshot()).toMatchObject({ state: "denied" });
    expect(deniedSession.getSnapshot().status).toMatchObject({
      state: "error",
      error: { code: "MICROPHONE_DENIED", recoverable: true },
    });

    const lateTrack = new MicrophoneTrack();
    let resolvePermission: ((stream: MediaStream) => void) | undefined;
    let markRequested: (() => void) | undefined;
    const requested = new Promise<void>((resolve) => {
      markRequested = resolve;
    });
    const lateFixture = liveFixture(streamWith(lateTrack));
    lateFixture.environment.getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          resolvePermission = resolve;
          markRequested?.();
        }),
    );
    const session = createWaveformSession<WaveformFrame>();
    const pending = session.attach(
      createMicrophoneSource({ environment: lateFixture.environment }),
    );
    await requested;
    await session.attach(createStaticWaveformSource([-1, 1], { id: "replacement" }));
    resolvePermission?.(streamWith(lateTrack));
    await pending;
    expect(session.getSnapshot().source?.id).toBe("replacement");
    expect(lateTrack.stop).toHaveBeenCalledTimes(1);
  });

  it("releases owned resources and leaves borrowed tracks running", async () => {
    const ownedTrack = new MicrophoneTrack();
    const ownedFixture = liveFixture(streamWith(ownedTrack));
    const ownedSession = createWaveformSession<WaveformFrame>();
    await ownedSession.attach(createMicrophoneSource({ environment: ownedFixture.environment }));
    await ownedSession.detach();
    expect(ownedTrack.stop).toHaveBeenCalledTimes(1);
    expect(ownedFixture.close).toHaveBeenCalledTimes(1);
    expect(ownedFixture.sourceNode.disconnect).toHaveBeenCalledTimes(1);
    expect(ownedFixture.analyser.disconnect).toHaveBeenCalledTimes(1);

    const borrowedTrack = new MicrophoneTrack();
    const borrowedFixture = liveFixture(streamWith(borrowedTrack));
    const borrowedSession = createWaveformSession<WaveformFrame>();
    const borrowedSource = createLiveMediaStreamSource(streamWith(borrowedTrack), {
      environment: borrowedFixture.environment,
    });
    await borrowedSession.attach(borrowedSource);
    await borrowedSession.detach();
    expect(borrowedTrack.stop).not.toHaveBeenCalled();
    expect(borrowedFixture.close).toHaveBeenCalledTimes(1);

    borrowedTrack.muted = true;
    borrowedTrack.dispatchEvent(new Event("mute"));
    expect(borrowedSource.getMicrophoneSnapshot().state).toBe("idle");
  });
});
