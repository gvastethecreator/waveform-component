import { describe, expect, it, vi } from "vitest";
import { createWaveformSession } from "./WaveformSession";
import {
  createAudioBufferWaveformSource,
  createAudioNodeWaveformSource,
  createDemoWaveformSource,
  createMediaStreamWaveformSource,
} from "./sources";

class TrackStub extends EventTarget {
  enabled = true;
  muted = false;
  readyState: MediaStreamTrackState = "live";
  stop = vi.fn(() => {
    this.readyState = "ended";
  });
}

describe("source adapters", () => {
  it("publishes deterministic demo and copied AudioBuffer channels", async () => {
    const demoSession = createWaveformSession();
    await demoSession.attach(createDemoWaveformSource({ phase: 0.3, sampleCount: 64 }));
    expect(demoSession.getSnapshot()).toMatchObject({
      frame: { kind: "waveform", sampleCount: 64 },
      source: { kind: "demo", ownership: "owned" },
    });

    const left = new Float32Array([-1, 0, 1]);
    const buffer = {
      duration: 1,
      numberOfChannels: 1,
      sampleRate: 48_000,
      getChannelData: () => left,
    } as unknown as AudioBuffer;
    const bufferSession = createWaveformSession();
    await bufferSession.attach(createAudioBufferWaveformSource(buffer));
    left[0] = 0;

    expect(bufferSession.getSnapshot().frame).toMatchObject({
      kind: "waveform",
      duration: 1,
      sampleRate: 48_000,
    });
    const frame = bufferSession.getSnapshot().frame;
    expect(frame?.kind === "waveform" && frame.channels[0][0]).toBe(-1);
  });

  it("never stops borrowed tracks and stops owned tracks exactly once", async () => {
    const borrowedTrack = new TrackStub();
    const borrowedStream = {
      getAudioTracks: () => [borrowedTrack],
    } as unknown as MediaStream;
    const borrowedSession = createWaveformSession();
    await borrowedSession.attach(createMediaStreamWaveformSource(borrowedStream));
    await borrowedSession.detach();
    expect(borrowedTrack.stop).not.toHaveBeenCalled();

    const ownedTrack = new TrackStub();
    const ownedStream = { getAudioTracks: () => [ownedTrack] } as unknown as MediaStream;
    const ownedSession = createWaveformSession();
    await ownedSession.attach(createMediaStreamWaveformSource(ownedStream, { ownership: "owned" }));
    await ownedSession.detach();
    await ownedSession.dispose();
    expect(ownedTrack.stop).toHaveBeenCalledTimes(1);
  });

  it("tracks mute and ended state without disconnecting a borrowed audio graph", async () => {
    const track = new TrackStub();
    const stream = { getAudioTracks: () => [track] } as unknown as MediaStream;
    const session = createWaveformSession();
    await session.attach(createMediaStreamWaveformSource(stream));
    expect(session.getSnapshot().status).toMatchObject({ state: "ready" });

    track.muted = true;
    track.dispatchEvent(new Event("mute"));
    expect(session.getSnapshot().status).toMatchObject({ state: "muted" });

    track.readyState = "ended";
    track.dispatchEvent(new Event("ended"));
    expect(session.getSnapshot().status).toMatchObject({ state: "ended" });

    const disconnect = vi.fn();
    const node = { disconnect } as unknown as AudioNode;
    const nodeSession = createWaveformSession();
    await nodeSession.attach(createAudioNodeWaveformSource(node));
    await nodeSession.detach();
    expect(disconnect).not.toHaveBeenCalled();
    expect(track.stop).not.toHaveBeenCalled();
  });
});
